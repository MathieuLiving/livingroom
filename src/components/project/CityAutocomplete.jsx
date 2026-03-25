import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../../../lib/customSupabaseClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STG_GEO = "stg_geo";

const strip = (s = "") =>
  s.toString().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

function useDebouncedValue(value, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

function useListKeyboard(open, items, onChoose) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef(null);

  useEffect(() => {
    if (!listRef.current || activeIndex < 0) return;
    listRef.current
      .querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const onKeyDown = (e) => {
    if (!open || !items.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex(i => Math.min(items.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex(i => Math.max(0, i - 1)); }
    else if (e.key === "Enter" && activeIndex >= 0) { e.preventDefault(); onChoose(items[activeIndex]); }
    else if (e.key === "Escape") { setActiveIndex(-1); }
  };

  return { activeIndex, setActiveIndex, listRef, onKeyDown };
}

function useCitiesSearch(q) {
  const debounced = useDebouncedValue(q, 250);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancel = false;
    async function run() {
      const term = strip(debounced || "");
      if (!term || term.length < 2) { if (!cancel) { setItems([]); setOpen(false); } return; }
      try {
        // 1) exact sur la forme normalisée
        const { data: exact, error: e1 } = await supabase
          .from(STG_GEO)
          .select("ville, ville_uid, ville_slug, departement, departement_uid, region, region_uid")
          .eq("ville_norm", term)
          .not("ville", "is", null)
          .limit(80);
        if (e1) throw e1;
        let rows = exact || [];

        // 2) fallback partiel
        if (rows.length === 0) {
          const { data: partial, error: e2 } = await supabase
            .from(STG_GEO)
            .select("ville, ville_uid, ville_slug, departement, departement_uid, region, region_uid")
            .or(`ville_norm.ilike.%${term}%,ville.ilike.%${debounced}%`)
            .not("ville", "is", null)
            .limit(80);
          if (e2) throw e2;
          rows = partial || [];
        }

        // dédoublonnage par ville_uid sinon ville+departement
        const uniq = new Map();
        rows.forEach(r => {
          const key = r.ville_uid || `${r.ville}|${r.departement}`;
          if (!uniq.has(key)) uniq.set(key, r);
        });
        const arr = Array.from(uniq.values()).sort((a, b) =>
          a.ville.localeCompare(b.ville, "fr")
        );

        if (!cancel) { setItems(arr.slice(0, 12)); setOpen(arr.length > 0); }
      } catch {
        if (!cancel) { setItems([]); setOpen(false); }
      }
    }
    run();
    return () => { cancel = true; };
  }, [debounced]);

  return { items, open, setOpen };
}

export default function CityAutocomplete({
  label = "Ville",
  value,
  onChange,
  onSelect,
  placeholder = "Ville (ex. Paris)",
  required,
  dropdownZ = 90,
}) {
  const [query, setQuery] = useState(typeof value === "string" ? value : value?.city || "");
  const { items, open, setOpen } = useCitiesSearch(query);
  const wrapRef = useRef(null);
  const kb = useListKeyboard(open, items, choose);

  useEffect(() => {
    setQuery(typeof value === "string" ? value || "" : value?.city || "");
  }, [value]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [setOpen]);

  function choose(row) {
    const city = row.ville;
    const department = row.departement || null;
    const region = row.region || null;
    onChange?.(city);
    onSelect?.({
      city,
      department,
      region,
      name: city, // for compatibility with LocationInputGroup
      uid: row.ville_uid || null, // for compatibility with LocationInputGroup
      ville_uid: row.ville_uid || null,
      ville_slug: row.ville_slug || null,
      departement_uid: row.departement_uid || null,
      region_uid: row.region_uid || null,
    });
    setQuery(city);
    setOpen(false);
    kb.setActiveIndex(-1);
  }

  return (
    <div className="relative" ref={wrapRef}>
      <Label>{label}{required ? " *" : ""}</Label>
      <Input
        value={query}
        onChange={(e) => { setQuery(e.target.value); onChange?.(e.target.value); }}
        onFocus={() => setOpen(true)}
        onKeyDown={kb.onKeyDown}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
      />
      {open && items.length > 0 && (
        <div
          className="absolute mt-1 w-full rounded-md border bg-white shadow-lg max-h-60 overflow-auto"
          role="listbox"
          style={{ zIndex: dropdownZ }}
          ref={kb.listRef}
        >
          {items.map((r, idx) => (
            <button
              type="button"
              key={r.ville_uid || `${r.ville}-${r.departement}`}
              className={"w-full text-left px-3 py-2 hover:bg-gray-50 " + (idx === kb.activeIndex ? "bg-gray-50" : "")}
              role="option"
              aria-selected={idx === kb.activeIndex}
              data-index={idx}
              onMouseEnter={() => kb.setActiveIndex(idx)}
              onClick={() => choose(r)}
            >
              <div className="font-medium">{r.ville}</div>
              <div className="text-xs text-gray-500">{(r.departement || "—")} · {(r.region || "—")}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}