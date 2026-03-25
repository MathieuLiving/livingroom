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

function useNeighborhoodsByCity({ ville_uid, city, filter }) {
  const [items, setItems] = useState([]); // [{name, uid}]
  const [open, setOpen] = useState(false);
  const debouncedCity = useDebouncedValue(city || "", 300);
  const debouncedQ = useDebouncedValue(filter || "", 200);

  useEffect(() => {
    let cancel = false;
    async function run() {
      setItems([]);
      if (!ville_uid && !debouncedCity) return;

      try {
        let query = supabase
          .from(STG_GEO)
          .select("quartier, quartier_uid, quartier_norm")
          .not("quartier", "is", null)
          .neq("quartier", "")
          .limit(500);

        if (ville_uid) {
          query = query.eq("ville_uid", ville_uid);
        } else {
          const norm = strip(debouncedCity);
          query = query.or(`ville_norm.ilike.%${norm}%,ville.ilike.%${debouncedCity}%`);
        }

        if (debouncedQ?.length >= 1) {
          const normQ = strip(debouncedQ);
          query = query.or(`quartier_norm.ilike.%${normQ}%,quartier.ilike.%${debouncedQ}%`);
        }

        const { data, error } = await query;
        if (error) throw error;

        const uniq = new Map();
        (data || []).forEach((r) => {
          const key = r.quartier_uid || r.quartier_norm || r.quartier;
          if (r.quartier && !uniq.has(key))
            uniq.set(key, { name: r.quartier, uid: r.quartier_uid || null });
        });
        const arr = Array.from(uniq.values()).sort((a, b) => a.name.localeCompare(b.name, "fr"));

        if (!cancel) { setItems(arr); setOpen(arr.length > 0); }
      } catch {
        if (!cancel) setItems([]);
      }
    }
    run();
    return () => { cancel = true; };
  }, [ville_uid, debouncedCity, debouncedQ]);

  return { items, open, setOpen };
}

export default function NeighborhoodAutocomplete({
  label = "Quartier (optionnel)",
  value,
  valueUid,
  onChange,
  onChangeUid,
  onSelect, // Added for compatibility
  cityMeta,
  cityUid, // Added for compatibility
  dropdownZ = 90,
  disabled,
  placeholder
}) {
  // Compatibility layer for different prop names
  const effectiveCityMeta = cityMeta || { ville_uid: cityUid };
  const hasCity = !!(effectiveCityMeta && (effectiveCityMeta.city || effectiveCityMeta.ville_uid));
  
  const [q, setQ] = useState(value || "");
  const { items, open, setOpen } = useNeighborhoodsByCity({
    ville_uid: effectiveCityMeta?.ville_uid || null,
    city: effectiveCityMeta?.city || "",
    filter: q,
  });
  const wrapRef = useRef(null);
  const kb = useListKeyboard(open, items, (opt) => choose(opt));

  useEffect(() => { setQ(value || ""); }, [value]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [setOpen]);

  function choose(opt) {
    onChange?.(opt.name);
    onChangeUid?.(opt.uid || null);
    onSelect?.(opt); // For compatibility
    setQ(opt.name);
    setOpen(false);
    kb.setActiveIndex(-1);
  }

  return (
    <div className="relative" ref={wrapRef}>
      <Label>{label}</Label>
      <Input
        value={q}
        onChange={(e) => { setQ(e.target.value); onChange?.(e.target.value); onChangeUid?.(null); }}
        onFocus={() => hasCity && setOpen(true)}
        onKeyDown={kb.onKeyDown}
        placeholder={placeholder || (hasCity ? "Commencez à taper…" : "Choisissez d’abord une ville")}
        disabled={disabled || !hasCity}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
      />
      {open && hasCity && items.length > 0 && (
        <div
          className="absolute mt-1 w-full rounded-md border bg-white shadow-lg max-h-60 overflow-auto"
          role="listbox"
          style={{ zIndex: dropdownZ }}
          ref={kb.listRef}
        >
          {items.map((opt, idx) => (
            <button
              type="button"
              key={`${opt.name}-${opt.uid || idx}`}
              className={"w-full text-left px-3 py-2 hover:bg-gray-50 " + (idx === kb.activeIndex ? "bg-gray-50" : "")}
              role="option"
              aria-selected={idx === kb.activeIndex}
              data-index={idx}
              onMouseEnter={() => kb.setActiveIndex(idx)}
              onClick={() => choose(opt)}
            >
              <div className="font-medium">{opt.name}</div>
            </button>
          ))}
        </div>
      )}
      {!hasCity && !disabled && (
        <p className="text-xs text-gray-500 mt-1">Choisissez une ville pour sélectionner un quartier.</p>
      )}
    </div>
  );
}