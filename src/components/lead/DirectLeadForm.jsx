"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../../lib/customSupabaseClient";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import {
  Loader2, Send, Plus, X,
  Trees, Sun, Square, Waves, ArrowUpDown, Package, Car, Shield, Eye,
  Building, ArrowUp
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Constantes + helpers                                                */
/* ------------------------------------------------------------------ */

const STG_GEO = "stg_geo";
const TIMELINE_OPTIONS = ["Tout de suite", "< de 3 mois", "3 à 6 mois", "+ de 6 mois"];

const FEATURE_DEFS = [
  { key: "has_garden", label: "Jardin", Icon: Trees },
  { key: "has_terrace", label: "Terrasse", Icon: Sun },
  { key: "has_balcony", label: "Balcon", Icon: Square },
  { key: "has_pool", label: "Piscine", Icon: Waves },
  { key: "has_elevator", label: "Ascenseur", Icon: ArrowUpDown },
  { key: "has_cellar", label: "Cave", Icon: Package },
  { key: "has_parking", label: "Parking", Icon: Car },
  { key: "has_caretaker", label: "Gardien", Icon: Shield },
  { key: "has_clear_view", label: "Vue dégagée", Icon: Eye },
];

const parseInteger = (value) => {
  if (value === "" || value == null) return null;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
};

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

/* ------------------------------------------------------------------ */
/* Outils accessibilité clavier pour les listes                        */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/* Autocomplete Ville (via stg_geo, priorité UID/norm)                 */
/* ------------------------------------------------------------------ */
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

function CityAutocomplete({
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

/* ------------------------------------------------------------------ */
/* Autocomplete Quartier dépendant de la ville (avec UID)              */
/* ------------------------------------------------------------------ */
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

function NeighborhoodAutocomplete({
  label = "Quartier (optionnel)",
  value,
  valueUid,
  onChange,
  onChangeUid,
  cityMeta,
  dropdownZ = 90,
}) {
  const hasCity = !!(cityMeta && (cityMeta.city || cityMeta.ville_uid));
  const [q, setQ] = useState(value || "");
  const { items, open, setOpen } = useNeighborhoodsByCity({
    ville_uid: cityMeta?.ville_uid || null,
    city: cityMeta?.city || "",
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
        placeholder={hasCity ? "Commencez à taper…" : "Choisissez d’abord une ville"}
        disabled={!hasCity}
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
      {!hasCity && (
        <p className="text-xs text-gray-500 mt-1">Choisissez une ville pour sélectionner un quartier.</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ligne Ville + Quartier                                              */
/* ------------------------------------------------------------------ */
function LocationRow({ index, value, onChange, onRemove, required }) {
  const cityMeta = { city: value.city, ville_uid: value.ville_uid };
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
      <div className="md:col-span-3">
        <CityAutocomplete
          label={`Ville ${index + 1}`}
          value={value.city || ""}
          onChange={(v) => onChange({ ...value, city: v, ville_uid: null })}
          onSelect={({ city, ville_uid }) =>
            onChange({ ...value, city, ville_uid })
          }
          placeholder="Ville (ex. Paris)"
          required={required}
        />
      </div>
      <div className="md:col-span-2">
        <NeighborhoodAutocomplete
          cityMeta={cityMeta}
          value={value.quartier || ""}
          valueUid={value.quartier_uid || null}
          onChange={(quartier) => onChange({ ...value, quartier })}
          onChangeUid={(quartier_uid) => onChange({ ...value, quartier_uid })}
          label="Quartier (optionnel)"
        />
      </div>
      <div className="flex justify-end">
        <Button type="button" variant="ghost" onClick={onRemove} className="text-red-600 hover:text-red-700">
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Formulaire principal   → INSERT public.direct_leads                 */
/* ------------------------------------------------------------------ */

const DirectLeadForm = ({ professionnelId, onCreated }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [f, setF] = useState({
    intent: "buy", // buy | sell (pour l'UX)
    title: "",
    type_bien: "Appartement",
    // achat
    budget_max: "",
    surface_min: "",
    surface_max: "",
    bedrooms_min: "",
    // vente
    prix_demande: "",
    surface: "",
    // communs
    delai: "",
    description: "",
    // coordonnées
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "particulier",
    // localisations
    locations: [{ city: "", quartier: "", quartier_uid: null, ville_uid: null }],
    // critères (icônes)
    has_garden: false, has_terrace: false, has_balcony: false, has_pool: false,
    has_elevator: false, has_cellar: false, has_parking: false, has_caretaker: false,
    has_clear_view: false, is_last_floor: false,
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  // locations helpers
  const canAddLocation = useMemo(() => f.intent === "buy" && (f.locations?.length || 0) < 5, [f.locations, f.intent]);
  function updateLocationAt(i, next) { const arr = [...(f.locations || [])]; arr[i] = next; set("locations", arr); }
  function addLocation() { if (canAddLocation) set("locations", [...(f.locations || []), { city: "", quartier: "", quartier_uid: null, ville_uid: null }]); }
  function removeLocation(i) { const arr = [...(f.locations || [])]; arr.splice(i, 1); set("locations", arr.length ? arr : [{ city: "", quartier: "", quartier_uid: null, ville_uid: null }]); }

  function buildInsertPayload(state) {
    const isSell = state.intent === "sell";
    const type_projet = isSell ? "vente" : "achat";

    const locs = (state.locations || []).slice(0, isSell ? 1 : 5);
    const pick = (i, k, def = null) => {
      const v = locs[i - 1]?.[k];
      const s = typeof v === "string" ? v.trim() : v; return s ? s : def;
    };

    const payload = {
      professionnel_id: professionnelId,
      email: state.email || null,
      first_name: state.first_name || null,
      last_name: state.last_name || null,
      phone: state.phone || null,
      role: state.role || null,

      // Champs projet
      type_projet,                 // "achat" | "vente"
      project_type: state.intent,  // "buy" | "sell" (utile pour l'UI)
      project_title: state.title?.toString()?.trim() || null,
      type_bien: state.type_bien || null,
      delai: state.delai || null,

      // ACHAT
      budget_max: isSell ? null : parseInteger(state.budget_max),
      surface_min: isSell ? null : parseInteger(state.surface_min),
      surface_max: isSell ? null : parseInteger(state.surface_max),
      bedrooms_min: isSell ? null : parseInteger(state.bedrooms_min),

      // VENTE
      prix_demande: isSell ? parseInteger(state.prix_demande) : null,
      // Surface (vente): colonne `surface` n'existe pas dans direct_leads → on passe via payload uniquement

      // Critères
      has_garden: !!state.has_garden,
      has_terrace: !!state.has_terrace,
      has_pool: !!state.has_pool,
      has_elevator: !!state.has_elevator,
      has_cellar: !!state.has_cellar,
      has_parking: !!state.has_parking,
      has_caretaker: !!state.has_caretaker,
      has_clear_view: !!state.has_clear_view,
      is_last_floor: !!state.is_last_floor,

      // Localisations + UIDs
      city_choice_1: pick(1, "city"),
      city_choice_2: pick(2, "city"),
      city_choice_3: pick(3, "city"),
      city_choice_4: pick(4, "city"),
      city_choice_5: pick(5, "city"),
      quartier_choice_1: pick(1, "quartier"),
      quartier_choice_2: pick(2, "quartier"),
      quartier_choice_3: pick(3, "quartier"),
      quartier_choice_4: pick(4, "quartier"),
      quartier_choice_5: pick(5, "quartier"),
      ville_uid_choice_1: pick(1, "ville_uid"),
      ville_uid_choice_2: pick(2, "ville_uid"),
      ville_uid_choice_3: pick(3, "ville_uid"),
      ville_uid_choice_4: pick(4, "ville_uid"),
      ville_uid_choice_5: pick(5, "ville_uid"),
      quartier_uid_choice_1: pick(1, "quartier_uid"),
      quartier_uid_choice_2: pick(2, "quartier_uid"),
      quartier_uid_choice_3: pick(3, "quartier_uid"),
      quartier_uid_choice_4: pick(4, "quartier_uid"),
      quartier_uid_choice_5: pick(5, "quartier_uid"),

      // payload complet pour le trigger
      payload: {
        ...state,
        // normaliser pour le trigger: dupliquer surface vente si besoin
        surface: parseInteger(state.surface),
      },
    };

    return payload;
  }

  async function submit(e) {
    e.preventDefault();
    if (loading) return;

    // validations simples
    if (!professionnelId) {
      return toast({ variant: "destructive", title: "Erreur", description: "professionnel_id manquant." });
    }
    if (!f.first_name || !f.last_name || !f.email) {
      return toast({ variant: "destructive", title: "Champs requis", description: "Merci de renseigner prénom, nom et email." });
    }

    setLoading(true);
    try {
      const payload = buildInsertPayload(f);
      const { error } = await supabase.from("direct_leads").insert([payload]);
      if (error) throw error;
      toast({ title: "Succès", description: "Votre projet a été envoyé avec succès." });
      onCreated?.(payload);
      // reset minimal
      setF((p) => ({ ...p, title: "", description: "", locations: [{ city: "", quartier: "", quartier_uid: null, ville_uid: null }] }));
    } catch (err) {
      console.error("DirectLeadForm submit error:", err);
      toast({ variant: "destructive", title: "Erreur", description: "L’envoi du projet a échoué." });
    } finally {
      setLoading(false);
    }
  }

  const isAchat = f.intent === "buy";

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Précisez votre projet</CardTitle>
        <CardDescription>Ce message sera envoyé à ce professionnel.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-6">
          {/* Titre facultatif */}
          <div>
            <Label>Titre du projet</Label>
            <Input
              placeholder="Ex. Achat T3 centre de Nantes, budget 320 000 €"
              value={f.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          {/* Onglets type de projet */}
          <Tabs value={f.intent} onValueChange={(v) => set("intent", v)} className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="buy">Achat</TabsTrigger>
              <TabsTrigger value="sell">Vente</TabsTrigger>
            </TabsList>

            {/* Commun: type de bien + délai */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="space-y-2">
                <Label>Type de bien*</Label>
                <Input value={f.type_bien} onChange={(e) => set("type_bien", e.target.value)} placeholder="Ex. Appartement, Maison…" />
              </div>
              <div className="space-y-2">
                <Label>Délai</Label>
                <select className="border rounded-md p-2 w-full" value={f.delai} onChange={(e) => set("delai", e.target.value)}>
                  <option value="">Choisir…</option>
                  {TIMELINE_OPTIONS.map((t) => (<option key={t} value={t}>{t}</option>))}
                </select>
              </div>
            </div>

            {/* -------------------- ACHAT -------------------- */}
            <TabsContent value="buy" className="space-y-6">
              {/* Localisations */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Localisation(s) souhaitée(s)*</Label>
                    <p className="text-xs text-gray-500">1 à 5 ville(s) et/ou quartier(s).</p>
                  </div>
                  <Button type="button" variant="secondary" onClick={addLocation} disabled={!canAddLocation}>
                    <Plus className="h-4 w-4 mr-2" /> Ajouter une localisation
                  </Button>
                </div>
                <div className="space-y-3">
                  {(f.locations || []).map((loc, i) => (
                    <LocationRow
                      key={i}
                      index={i}
                      value={loc}
                      onChange={(next) => updateLocationAt(i, next)}
                      onRemove={() => removeLocation(i)}
                      required={i === 0}
                    />
                  ))}
                </div>
              </div>

              {/* Critères numériques */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Budget Maximum (€)</Label><Input type="number" value={f.budget_max} onChange={(e) => set("budget_max", e.target.value)} /></div>
                <div className="space-y-2"><Label>Surface min (m²)</Label><Input type="number" value={f.surface_min} onChange={(e) => set("surface_min", e.target.value)} /></div>
                <div className="space-y-2"><Label>Surface max (m²)</Label><Input type="number" value={f.surface_max} onChange={(e) => set("surface_max", e.target.value)} /></div>
                <div className="space-y-2 md:col-span-3"><Label>Chambres min</Label><Input type="number" value={f.bedrooms_min} onChange={(e) => set("bedrooms_min", e.target.value)} /></div>
              </div>
            </TabsContent>

            {/* -------------------- VENTE -------------------- */}
            <TabsContent value="sell" className="space-y-6">
              {/* Localisation unique */}
              <div className="space-y-3">
                <Label className="font-medium">Localisation du bien *</Label>
                <LocationRow
                  index={0}
                  value={f.locations?.[0] || {}}
                  onChange={(next) => updateLocationAt(0, next)}
                  onRemove={() => { /* pas d'effacement complet */ updateLocationAt(0, { city: "", quartier: "", quartier_uid: null, ville_uid: null }); }}
                  required
                />
              </div>

              {/* Prix demandé + surface */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Prix demandé (€)</Label><Input type="number" value={f.prix_demande} onChange={(e) => set("prix_demande", e.target.value)} /></div>
                <div className="space-y-2"><Label>Surface (m²)</Label><Input type="number" value={f.surface} onChange={(e) => set("surface", e.target.value)} /></div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Icônes de critères + Dernier étage */}
          <div className="space-y-2">
            <Label>Critères complémentaires</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {FEATURE_DEFS.map(({ key, label, Icon }) => {
                const active = !!f[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => set(key, !active)}
                    className={["flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
                      active ? "bg-black text-white border-black" : "bg-white hover:bg-gray-50"].join(" ")}
                    aria-pressed={active}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm font-medium">Dernier étage</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => set("is_last_floor", true)}
                  className={["flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
                    f.is_last_floor ? "bg-black text-white border-black" : "bg-white hover:bg-gray-50"].join(" ")}
                  aria-pressed={f.is_last_floor}
                >
                  <Building className="h-4 w-4" /><ArrowUp className="h-4 w-4" /><span>Oui</span>
                </button>
                <button
                  type="button"
                  onClick={() => set("is_last_floor", false)}
                  className={["flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
                    !f.is_last_floor ? "bg-black text-white border-black" : "bg-white hover:bg-gray-50"].join(" ")}
                  aria-pressed={!f.is_last_floor}
                >
                  <Building className="h-4 w-4" /><span>Non</span>
                </button>
              </div>
            </div>
          </div>

          {/* Message libre */}
          <div>
            <Label>Votre message</Label>
            <textarea
              value={f.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Dites-en plus (étage élevé, lumineux, proche métro…)"
              rows={4}
              className="w-full border rounded-md p-2"
            />
          </div>

          {/* Coordonnées */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Prénom *</Label><Input value={f.first_name} onChange={(e) => set("first_name", e.target.value)} required /></div>
            <div className="space-y-2"><Label>Nom *</Label><Input value={f.last_name} onChange={(e) => set("last_name", e.target.value)} required /></div>
            <div className="space-y-2"><Label>Email *</Label><Input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} required /></div>
            <div className="space-y-2"><Label>Téléphone</Label><Input type="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} /></div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading} className="bg-brand-orange hover:bg-orange-600">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Envoyer mon projet
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default DirectLeadForm;