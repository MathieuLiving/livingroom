import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/customSupabaseClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Trees,
  Sun,
  Square,
  Waves,
  ArrowUpDown,
  Package,
  Car,
  Shield,
  Eye,
  X,
  Plus,
  ArrowUp,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/contexts/SupabaseAuthContext";

/* ----------------------------- Constantes ----------------------------- */

const TABLES = {
  buy: "buying_projects_professionnel",
  sell: "selling_projects_professionnel",
};

const STG_GEO = "stg_geo";
const PROPERTY_TYPES = [
  "Appartement",
  "Maison/villa",
  "Loft",
  "Hôtel particulier",
  "Parking",
  "Autre surface",
];
const TIMELINE_OPTIONS = ["Tout de suite", "< de 3 mois", "3 à 6 mois", "+ de 6 mois"];
const DPE_OPTIONS = ["A", "B", "C", "D", "E", "F", "G"];

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
  { key: "is_last_floor", label: "Dernier étage", Icon: ArrowUp },
];

/* ----------------------------- Helpers ----------------------------- */

const toInt = (v) =>
  v === "" || v == null ? null : Number.isFinite(parseInt(v, 10)) ? parseInt(v, 10) : null;

const pickDefined = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

const strip = (s = "") =>
  s.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const toNullableString = (v) => {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
};

function normalizeNullishPayload(payload) {
  const out = { ...payload };

  const nullableKeys = [
    "agency_id",
    "city_choice_1",
    "quartier_choice_1",
    "department_choice_1",
    "region_choice_1",
    "city_choice_2",
    "quartier_choice_2",
    "department_choice_2",
    "region_choice_2",
    "city_choice_3",
    "quartier_choice_3",
    "department_choice_3",
    "region_choice_3",
    "city_choice_4",
    "quartier_choice_4",
    "department_choice_4",
    "region_choice_4",
    "city_choice_5",
    "quartier_choice_5",
    "department_choice_5",
    "region_choice_5",
    "ville_uid",
    "quartier_uid",
    "departement_uid",
    "region_uid",
    "ville_uid_choice_1",
    "quartier_uid_choice_1",
    "project_title",
    "title",
    "description",
    "delai",
    "pro_property_ad_link",
    "energy_consumption",
    "co2_emission",
  ];

  nullableKeys.forEach((key) => {
    if (key in out) out[key] = toNullableString(out[key]);
  });

  return out;
}

function useDebouncedValue(value, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

/**
 * ✅ Enqueue notification via Edge Function `notification-enqueue`
 * - idempotent via event_key
 * - IMPORTANT: redirect_path/connection_link utilisent le SLUG (si présent), sinon l'ID.
 */
async function enqueueAdminNewProjectNotification({
  projectId,
  projectRef,
  isPro,
  subject,
  message,
  senderNameFallback,
  payload = {},
}) {
  const ref = projectRef || projectId;
  const redirect_path = `/place-des-projets/projets/${ref}`;
  const connection_link = `https://livingroom.immo${redirect_path}`;

  const event_key = `admin_new_project:${isPro ? "professionnel" : "particulier"}:${projectId}`;

  const body = {
    recipient_email: "mathieu.guerin@livingpage.fr",
    notification_type: "admin_new_project",
    is_admin_notification: true,
    is_pro: !!isPro,
    redirect_path,
    connection_link,
    subject: subject || null,
    message: message || null,
    sender_name_fallback: senderNameFallback || (isPro ? "professionnel" : "particulier"),
    event_key,
    source: "web:NewProjectFormPro",
    payload: {
      project_id: projectId,
      project_ref: ref,
      redirect_path,
      connection_link,
      ...payload,
    },
  };

  const { data, error } = await supabase.functions.invoke("notification-enqueue", { body });
  if (error) throw error;
  return data;
}

/* =======================================================================
   ✅ SANITIZE payload agence (indépendant vs agence)
   ======================================================================= */

function sanitizeAgencyFields({ payload, proRow }) {
  const cleaned = normalizeNullishPayload({ ...payload });

  if (proRow?.id) cleaned.professionnel_id = proRow.id;

  const agencyId = toNullableString(proRow?.agency_id);

  if (agencyId) {
    cleaned.agency_id = agencyId;
  } else {
    cleaned.agency_id = null;
  }

  if ("agency_role" in cleaned) {
    delete cleaned.agency_role;
  }

  return pickDefined(cleaned);
}

/* =======================================================================
   Autocomplete VILLE
   ======================================================================= */
function useCitiesSearch(q) {
  const debounced = useDebouncedValue(q, 250);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancel = false;
    async function run() {
      const term = strip(debounced || "");
      if (!term || term.length < 2) {
        if (!cancel) {
          setItems([]);
          setOpen(false);
        }
        return;
      }
      try {
        const { data, error } = await supabase
          .from(STG_GEO)
          .select("ville, ville_uid, ville_slug, departement, departement_uid, region, region_uid")
          .or(`ville_norm.ilike.%${term}%,ville.ilike.%${debounced}%`)
          .not("ville", "is", null)
          .limit(80);

        if (error) throw error;

        const uniq = new Map();
        (data || []).forEach((r) => {
          const key = r.ville_uid || `${r.ville}|${r.departement}`;
          if (!uniq.has(key)) uniq.set(key, r);
        });
        const arr = Array.from(uniq.values()).sort((a, b) => a.ville.localeCompare(b.ville, "fr"));
        if (!cancel) {
          setItems(arr.slice(0, 12));
          setOpen(true);
        }
      } catch {
        if (!cancel) {
          setItems([]);
          setOpen(false);
        }
      }
    }
    run();
    return () => {
      cancel = true;
    };
  }, [debounced]);

  return { items, open, setOpen };
}

function CityAutocomplete({
  label = "Ville",
  value,
  onChange,
  onSelect,
  placeholder = "Ex : Paris",
  required,
  dropdownZ = 50,
}) {
  const [query, setQuery] = useState(typeof value === "string" ? value : value?.city || "");
  const { items, open, setOpen } = useCitiesSearch(query);
  const wrapRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef(null);

  useEffect(() => {
    setQuery(typeof value === "string" ? value || "" : value?.city || "");
  }, [value]);

  useEffect(() => {
    if (!listRef.current || activeIndex < 0) return;
    listRef.current.querySelector(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  useEffect(() => {
    function onClickOutside(e) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    }
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
    setActiveIndex(-1);
  }

  function onKeyDown(e) {
    if (!open || !items.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      choose(items[activeIndex]);
    } else if (e.key === "Escape") {
      setActiveIndex(-1);
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={wrapRef}>
      <Label>
        {label}
        {required ? " *" : ""}
      </Label>
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange?.(e.target.value);
        }}
        onFocus={() => items.length && setOpen(true)}
        onKeyDown={onKeyDown}
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
          ref={listRef}
        >
          {items.map((r, idx) => (
            <button
              type="button"
              key={r.ville_uid || `${r.ville}-${r.departement}`}
              className={
                "w-full text-left px-3 py-2 hover:bg-gray-50 " + (idx === activeIndex ? "bg-gray-50" : "")
              }
              data-index={idx}
              role="option"
              aria-selected={idx === activeIndex}
              onMouseEnter={() => setActiveIndex(idx)}
              onClick={() => choose(r)}
            >
              <div className="font-medium">{r.ville}</div>
              <div className="text-xs text-gray-500">
                {r.departement || "—"} · {r.region || "—"}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* =======================================================================
   Autocomplete QUARTIER — avec UID
   ======================================================================= */
function QuartierAutocomplete({
  label = "Quartier (optionnel)",
  city,
  villeUid,
  value,
  onChange,
  onChangeUid,
  placeholder = "Ex : Batignolles",
}) {
  const [options, setOptions] = useState([]);
  const [query, setQuery] = useState(value || "");
  const debounced = useDebouncedValue(query, 200);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setOptions([]);
      if (!villeUid && !city) return;

      try {
        if (villeUid) {
          const { data, error } = await supabase
            .from(STG_GEO)
            .select("quartier, quartier_uid")
            .eq("ville_uid", villeUid)
            .not("quartier", "is", null)
            .neq("quartier", "")
            .limit(1000);
          if (error) throw error;

          const opts = (data || [])
            .filter((r) => r.quartier)
            .map((r) => ({ name: r.quartier, uid: r.quartier_uid || null }));

          if (!cancelled && opts.length) {
            setOptions(dedupBy(opts, (o) => `${o.uid}|${o.name}`));
            return;
          }
        }

        if (city) {
          const { data, error } = await supabase
            .from(STG_GEO)
            .select("quartier, quartier_uid, ville_norm")
            .eq("ville_norm", strip(city))
            .not("quartier", "is", null)
            .neq("quartier", "")
            .limit(1000);
          if (error) throw error;

          const opts = (data || [])
            .filter((r) => r.quartier)
            .map((r) => ({ name: r.quartier, uid: r.quartier_uid || null }));

          if (!cancelled && opts.length) {
            setOptions(dedupBy(opts, (o) => `${o.uid}|${o.name}`));
            return;
          }
        }

        if (city) {
          const { data, error } = await supabase
            .from(STG_GEO)
            .select("quartier, quartier_uid, ville")
            .ilike("ville", `%${city}%`)
            .not("quartier", "is", null)
            .neq("quartier", "")
            .limit(1000);
          if (error) throw error;

          const opts = (data || [])
            .filter((r) => r.quartier)
            .map((r) => ({ name: r.quartier, uid: r.quartier_uid || null }));

          if (!cancelled) setOptions(dedupBy(opts, (o) => `${o.uid}|${o.name}`));
        }
      } catch {
        if (!cancelled) setOptions([]);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [city, villeUid]);

  function dedupBy(arr, keyFn) {
    const m = new Map();
    for (const it of arr) {
      const k = keyFn(it);
      if (!m.has(k)) m.set(k, it);
    }
    return Array.from(m.values()).sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }

  useEffect(() => {
    function onClickOutside(e) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const filtered = useMemo(() => {
    if (!debounced) return options.slice(0, 50);
    const n = strip(debounced);
    return options.filter((o) => strip(o.name).includes(n)).slice(0, 50);
  }, [options, debounced]);

  function pick(opt) {
    onChange?.(opt.name);
    onChangeUid?.(opt.uid || null);
    setQuery(opt.name);
    setOpen(false);
  }

  const disabled = !villeUid && !city;

  return (
    <div className="relative" ref={wrapRef}>
      <Label>{label}</Label>
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange?.(e.target.value);
          onChangeUid?.(null);
        }}
        onFocus={() => !disabled && filtered.length > 0 && setOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
      />
      {!disabled && open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg max-h-60 overflow-auto">
          {filtered.map((opt, idx) => (
            <button
              key={`${opt.name}-${opt.uid || idx}`}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-gray-50"
              onClick={() => pick(opt)}
            >
              {opt.name}
            </button>
          ))}
        </div>
      )}
      {!disabled && options.length === 0 && (
        <p className="text-xs text-gray-500 mt-1">Aucun quartier répertorié pour cette ville — saisie libre.</p>
      )}
      {disabled && <p className="text-xs text-gray-500 mt-1">Choisissez une ville pour sélectionner un quartier.</p>}
    </div>
  );
}

/* =======================================================================
   LIGNE LOCALISATION (achat)
   ======================================================================= */
function LocationRow({ index, value, onChange, onRemove }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
      <div className="md:col-span-3">
        <CityAutocomplete
          label={`Ville ${index + 1}`}
          value={value.city || ""}
          onChange={(v) => onChange({ ...value, city: v, ville_uid: null })}
          onSelect={({ city, department, region, ville_uid, departement_uid, region_uid }) =>
            onChange({ ...value, city, department, region, ville_uid, departement_uid, region_uid })
          }
          placeholder="Ex : Paris"
        />
      </div>
      <div className="md:col-span-2">
        <QuartierAutocomplete
          label="Quartier (optionnel)"
          city={value.city}
          villeUid={value.ville_uid}
          value={value.quartier || ""}
          onChange={(q) => onChange({ ...value, quartier: q })}
          onChangeUid={(uid) => onChange({ ...value, quartier_uid: uid })}
          placeholder="Ex : Batignolles"
        />
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={onRemove}
          aria-label="Supprimer cette localisation"
          className="text-red-600 hover:text-red-700"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

/* =======================================================================
   Upload photos (Vente) — vers Storage
   ======================================================================= */
function PhotoUploader({ files, setFiles, max = 3 }) {
  const inputRef = useRef(null);

  const onPick = (e) => {
    const picked = Array.from(e.target.files || []).slice(0, Math.max(0, max - (files?.length || 0)));
    if (!picked.length) return;
    const imgs = picked.filter((f) => f.type.startsWith("image/"));
    setFiles([...(files || []), ...imgs].slice(0, max));
    e.target.value = "";
  };

  const removeAt = (idx) => {
    const copy = [...(files || [])];
    copy.splice(idx, 1);
    setFiles(copy);
  };

  return (
    <div className="space-y-2">
      <Label>Photos (jusqu’à {max})</Label>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2"
        >
          <ImageIcon className="w-4 h-4" />
          Ajouter des photos
        </Button>
        <input ref={inputRef} type="file" accept="image/*" multiple onChange={onPick} className="hidden" />
      </div>

      {files?.length ? (
        <div className="grid grid-cols-3 gap-3">
          {files.map((f, i) => {
            const url = URL.createObjectURL(f);
            return (
              <div key={i} className="relative rounded-md overflow-hidden border">
                <img
                  src={url}
                  alt={`photo-${i + 1}`}
                  className="w-full h-28 object-cover"
                  onLoad={() => URL.revokeObjectURL(url)}
                />
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="absolute top-1 right-1 bg-white/80 hover:bg-white rounded-full p-1"
                  aria-label="Supprimer la photo"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/* =======================================================================
   FORMULAIRE PRO
   ======================================================================= */

const NewProjectFormPro = ({ initial = {}, onCreated, onUpdated, isEdit = false, projectId = null }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [proRow, setProRow] = useState(null);

  const [f, setF] = useState({
    intent: initial.intent || (initial.type_projet === "vente" ? "sell" : "buy"),

    title: initial.title || initial.project_title || "",
    type_bien: initial.type_bien || "Appartement",
    delai: initial.delai || "",
    description: initial.description || "",

    locations:
      initial.locations || [
        {
          city: "",
          quartier: "",
          department: "",
          region: "",
          ville_uid: null,
          quartier_uid: null,
          departement_uid: null,
          region_uid: null,
        },
      ],
    budget_max: initial.budget_max ?? "",
    surface_min: initial.surface_min ?? "",
    surface_max: initial.surface_max ?? "",
    bedrooms_min: initial.bedrooms_min ?? initial.chambres_min ?? "",

    city: initial.city || initial.city_choice_1 || "",
    quartier: initial.quartier || initial.quartier_choice_1 || "",
    department: initial.department || initial.department_choice_1 || "",
    region: initial.region || initial.region_choice_1 || "",
    ville_uid: initial.ville_uid || initial.ville_uid_choice_1 || null,
    quartier_uid: initial.quartier_uid || initial.quartier_uid_choice_1 || null,
    departement_uid: initial.departement_uid || null,
    region_uid: initial.region_uid || null,

    prix_demande: initial.prix_demande ?? initial.price ?? "",
    surface: initial.surface ?? "",
    bedrooms: initial.bedrooms ?? initial.chambres ?? "",
    pro_property_ad_link: initial.pro_property_ad_link || "",

    energy_consumption: initial.energy_consumption || "",
    co2_emission: initial.co2_emission || "",

    has_garden: !!initial.has_garden,
    has_terrace: !!initial.has_terrace,
    has_balcony: !!initial.has_balcony,
    has_pool: !!initial.has_pool,
    has_elevator: !!initial.has_elevator,
    has_cellar: !!initial.has_cellar,
    has_parking: !!initial.has_parking,
    has_caretaker: !!initial.has_caretaker,
    has_clear_view: !!initial.has_clear_view,
    is_last_floor: !!initial.is_last_floor,

    visibility_showcase: initial.visibility_showcase ?? false,
    visibility_public: initial.visibility_public ?? false,
    visibility_inter_agent: initial.visibility_inter_agent ?? false,

    professionnel_id: null,
  });

  const [sellPhotos, setSellPhotos] = useState([]);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const canAddLocation = useMemo(() => (f.locations?.length || 0) < 5, [f.locations]);

  function updateLocationAt(i, next) {
    const arr = [...(f.locations || [])];
    arr[i] = next;
    set("locations", arr);
  }

  function addLocation() {
    if (!canAddLocation) return;
    set("locations", [
      ...(f.locations || []),
      {
        city: "",
        quartier: "",
        department: "",
        region: "",
        ville_uid: null,
        quartier_uid: null,
        departement_uid: null,
        region_uid: null,
      },
    ]);
  }

  function removeLocation(i) {
    const arr = [...(f.locations || [])];
    arr.splice(i, 1);
    set(
      "locations",
      arr.length
        ? arr
        : [
            {
              city: "",
              quartier: "",
              department: "",
              region: "",
              ville_uid: null,
              quartier_uid: null,
              departement_uid: null,
              region_uid: null,
            },
          ]
    );
  }

  /* --------- Récupération fiable du professionnel --------- */
  useEffect(() => {
    let cancelled = false;

    async function ensureProfessionnelRow() {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from("professionnels")
          .select("id, user_id, agency_id, agency_role")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Erreur récupération professionnel :", error);
          return;
        }

        if (!cancelled && data?.id) {
          setProRow(data);
          setF((prev) => ({ ...prev, professionnel_id: data.id }));
        }
      } catch (e) {
        console.error("Exception récupération professionnel :", e);
      }
    }

    ensureProfessionnelRow();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  /* --------- Upload vers Storage --------- */
  async function uploadSellPhotos(files, proId) {
    if (!files?.length) return [];
    const bucket = "project-photos";
    const uploads = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${proId}/${Date.now()}_${i}.${ext}`;

      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
      if (error) throw error;

      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
      uploads.push(pub?.publicUrl || null);
    }

    return uploads.filter(Boolean).slice(0, 3);
  }

  /* --------- Payloads --------- */
  function buildBuyingPayload(state) {
    const locs = (state.locations || []).slice(0, 5);
    const pick = (i, k) => {
      const v = locs[i - 1]?.[k];
      const s = typeof v === "string" ? v.trim() : v;
      return s || null;
    };

    return pickDefined({
      professionnel_id: state.professionnel_id,
      agency_id: proRow?.agency_id ?? null,
      type_projet: "achat",
      type_bien: state.type_bien || null,
      budget_max: toInt(state.budget_max),
      surface_min: toInt(state.surface_min),
      surface_max: toInt(state.surface_max),
      bedrooms_min: toInt(state.bedrooms_min),
      delai: state.delai || null,
      description: state.description?.toString()?.trim() || null,

      has_garden: !!state.has_garden,
      has_terrace: !!state.has_terrace,
      has_balcony: !!state.has_balcony,
      has_pool: !!state.has_pool,
      has_elevator: !!state.has_elevator,
      has_cellar: !!state.has_cellar,
      has_parking: !!state.has_parking,
      has_caretaker: !!state.has_caretaker,
      has_clear_view: !!state.has_clear_view,
      is_last_floor: !!state.is_last_floor,

      city_choice_1: pick(1, "city"),
      quartier_choice_1: pick(1, "quartier"),
      department_choice_1: pick(1, "department"),
      region_choice_1: pick(1, "region"),
      city_choice_2: pick(2, "city"),
      quartier_choice_2: pick(2, "quartier"),
      department_choice_2: pick(2, "department"),
      region_choice_2: pick(2, "region"),
      city_choice_3: pick(3, "city"),
      quartier_choice_3: pick(3, "quartier"),
      department_choice_3: pick(3, "department"),
      region_choice_3: pick(3, "region"),
      city_choice_4: pick(4, "city"),
      quartier_choice_4: pick(4, "quartier"),
      department_choice_4: pick(4, "department"),
      region_choice_4: pick(4, "region"),
      city_choice_5: pick(5, "city"),
      quartier_choice_5: pick(5, "quartier"),
      department_choice_5: pick(5, "department"),
      region_choice_5: pick(5, "region"),

      visibility_public: !!state.visibility_public,
      visibility_inter_agent: !!state.visibility_inter_agent,
      visibility_showcase: !!state.visibility_showcase,

      project_title: state.title?.toString()?.trim() || null,
      title: state.title?.toString()?.trim() || null,
    });
  }

  function buildSellingPayload(state, imageUrls = []) {
    return pickDefined({
      professionnel_id: state.professionnel_id,
      agency_id: proRow?.agency_id ?? null,
      status: "active",
      type_projet: "vente",

      type_bien: state.type_bien || null,
      surface: toInt(state.surface),
      bedrooms: toInt(state.bedrooms),
      delai: state.delai || null,
      description: state.description?.toString()?.trim() || null,

      city_choice_1: state.city?.toString()?.trim() || null,
      quartier_choice_1: state.quartier?.toString()?.trim() || null,
      department_choice_1: state.department?.toString()?.trim() || null,
      region_choice_1: state.region?.toString()?.trim() || null,

      ville_uid: state.ville_uid || null,
      quartier_uid: state.quartier_uid || null,
      departement_uid: state.departement_uid || null,
      region_uid: state.region_uid || null,
      ville_uid_choice_1: state.ville_uid || null,
      quartier_uid_choice_1: state.quartier_uid || null,

      has_garden: !!state.has_garden,
      has_terrace: !!state.has_terrace,
      has_balcony: !!state.has_balcony,
      has_pool: !!state.has_pool,
      has_elevator: !!state.has_elevator,
      has_cellar: !!state.has_cellar,
      has_parking: !!state.has_parking,
      has_caretaker: !!state.has_caretaker,
      has_clear_view: !!state.has_clear_view,
      is_last_floor: !!state.is_last_floor,

      prix_demande: toInt(state.prix_demande),
      price: toInt(state.prix_demande),

      pro_property_ad_link: state.pro_property_ad_link || null,
      energy_consumption: state.energy_consumption || null,
      co2_emission: state.co2_emission || null,

      visibility_public: !!state.visibility_public,
      visibility_inter_agent: !!state.visibility_inter_agent,
      visibility_showcase: !!state.visibility_showcase,

      title: state.title?.toString()?.trim() || null,
      project_title: state.title?.toString()?.trim() || null,

      image_1_url: imageUrls[0] || null,
      image_2_url: imageUrls[1] || null,
      image_3_url: imageUrls[2] || null,
    });
  }

  /* --------- Submit --------- */
  async function submit(e) {
    e?.preventDefault?.();
    if (isSubmitting) return;

    const pid = f.professionnel_id;
    if (!pid || !proRow?.id) {
      alert("Impossible de récupérer votre identifiant professionnel. Merci de vérifier votre profil.");
      return;
    }

    setIsSubmitting(true);
    document.activeElement?.blur?.();

    const isSell = f.intent === "sell";
    const table = isSell ? TABLES.sell : TABLES.buy;

    try {
      let payload;

      if (isSell) {
        const imageUrls = await uploadSellPhotos(sellPhotos, pid);
        payload = buildSellingPayload(f, imageUrls);
      } else {
        payload = buildBuyingPayload(f);
      }

      payload = sanitizeAgencyFields({ payload, proRow });
      payload = pickDefined(payload);

      if (isEdit && projectId) {
        const { error } = await supabase.from(table).update(payload).eq("id", projectId);
        if (error) throw error;
        onUpdated?.({ id: projectId, ...payload });
      } else {
        const { data, error } = await supabase.from(table).insert([payload]).select("*").single();
        if (error) throw error;

        const projectIdCreated = data?.id;
        const projectRef = data?.slug || data?.id;

        try {
          const projectTypeLabel = isSell ? "vente" : "achat";
          const userTypeLabel = "professionnel";
          const redirectPath = `/place-des-projets/projets/${projectRef}`;
          const projectUrl = `https://livingroom.immo${redirectPath}`;

          await enqueueAdminNewProjectNotification({
            projectId: projectIdCreated,
            projectRef,
            isPro: true,
            senderNameFallback: userTypeLabel,
            subject: `Nouveau projet ${projectTypeLabel} déposé par un ${userTypeLabel}`,
            message: `Bonjour,

Un nouveau projet de ${projectTypeLabel} a été déposé par un ${userTypeLabel} sur la plateforme LivingRoom.

➡ Accéder au projet : ${projectUrl}

— LivingRoom`,
            payload: {
              project_type: projectTypeLabel,
              source_form: "NewProjectFormPro",
            },
          });
        } catch (notifError) {
          console.error("Échec enqueue admin_new_project :", notifError);
        }

        onCreated?.(data || payload);
      }
    } catch (err) {
      console.error("Save failed:", err);
      alert("Erreur: " + (err?.message || "enregistrement échoué"));
    } finally {
      setIsSubmitting(false);
    }
  }

  const isSell = f.intent === "sell";
  const extraLabel = isSell ? "En dire plus sur le bien" : "En dire plus sur la recherche";

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <Label htmlFor="title">Titre du projet</Label>
        <Input
          id="title"
          placeholder={isSell ? "Ex. Vente T3 lumineux à Belleville" : "Ex. Achat T3 centre de Nantes, budget 320 000 €"}
          value={f.title}
          onChange={(e) => set("title", e.target.value)}
          className="h-11 text-lg"
        />
      </div>

      <Tabs value={f.intent} onValueChange={(v) => set("intent", v)} className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="buy">Achat</TabsTrigger>
          <TabsTrigger value="sell">Vente</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <Label htmlFor="type_bien">Type de bien</Label>
            <select
              id="type_bien"
              className="border rounded-md p-2 w-full"
              value={f.type_bien}
              onChange={(e) => set("type_bien", e.target.value)}
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="delai">Délai</Label>
            <select
              id="delai"
              className="border rounded-md p-2 w-full"
              value={f.delai}
              onChange={(e) => set("delai", e.target.value)}
            >
              <option value="">Sélectionner…</option>
              {TIMELINE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <TabsContent value="buy" className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Localisations de recherche (jusqu’à 5)</h3>
              <Button type="button" variant="secondary" onClick={addLocation} disabled={!canAddLocation}>
                <Plus className="h-4 w-4 mr-2" /> Ajouter
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
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Budget max (€)</Label>
              <Input type="number" inputMode="numeric" value={f.budget_max} onChange={(e) => set("budget_max", e.target.value)} />
            </div>
            <div>
              <Label>Surface min (m²)</Label>
              <Input type="number" inputMode="numeric" value={f.surface_min} onChange={(e) => set("surface_min", e.target.value)} />
            </div>
            <div>
              <Label>Surface max (m²)</Label>
              <Input type="number" inputMode="numeric" value={f.surface_max} onChange={(e) => set("surface_max", e.target.value)} />
            </div>
            <div>
              <Label>Chambres min</Label>
              <Input type="number" inputMode="numeric" value={f.bedrooms_min} onChange={(e) => set("bedrooms_min", e.target.value)} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sell" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <CityAutocomplete
                label="Ville"
                value={f.city}
                onChange={(v) => set("city", v)}
                onSelect={({ city, department, region, ville_uid, departement_uid, region_uid }) => {
                  set("city", city);
                  set("department", department);
                  set("region", region);
                  set("ville_uid", ville_uid || null);
                  set("departement_uid", departement_uid || null);
                  set("region_uid", region_uid || null);
                }}
                required
              />
            </div>
            <div className="md:col-span-2">
              <QuartierAutocomplete
                label="Quartier"
                city={f.city}
                villeUid={f.ville_uid}
                value={f.quartier}
                onChange={(q) => set("quartier", q)}
                onChangeUid={(uid) => set("quartier_uid", uid)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Valeur souhaitée (€)</Label>
              <Input type="number" inputMode="numeric" value={f.prix_demande} onChange={(e) => set("prix_demande", e.target.value)} />
            </div>
            <div>
              <Label>Surface (m²)</Label>
              <Input type="number" inputMode="numeric" value={f.surface} onChange={(e) => set("surface", e.target.value)} />
            </div>
            <div>
              <Label>Chambres</Label>
              <Input type="number" inputMode="numeric" value={f.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="energy_consumption">DPE (Consommation énergétique)</Label>
              <select
                id="energy_consumption"
                className="border rounded-md p-2 w-full"
                value={f.energy_consumption || ""}
                onChange={(e) => set("energy_consumption", e.target.value)}
              >
                <option value="">Non renseigné</option>
                {DPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="co2_emission">GES (Émissions de gaz à effet de serre)</Label>
              <select
                id="co2_emission"
                className="border rounded-md p-2 w-full"
                value={f.co2_emission || ""}
                onChange={(e) => set("co2_emission", e.target.value)}
              >
                <option value="">Non renseigné</option>
                {DPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="pro_property_ad_link">Lien de l'annonce (optionnel)</Label>
            <Input
              id="pro_property_ad_link"
              placeholder="https://..."
              value={f.pro_property_ad_link}
              onChange={(e) => set("pro_property_ad_link", e.target.value)}
            />
          </div>

          <PhotoUploader files={sellPhotos} setFiles={setSellPhotos} max={3} />
        </TabsContent>
      </Tabs>

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
                className={[
                  "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
                  active ? "bg-black text-white border-black" : "bg-white hover:bg-gray-50",
                ].join(" ")}
                aria-pressed={active}
                title={label}
              >
                <Icon className="h-4 h-4 w-4" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="desc-extra">{extraLabel}</Label>
        <textarea
          id="desc-extra"
          className="w-full min-h-28 rounded-md border p-3"
          placeholder={isSell ? "Décrivez le bien, son état, ses atouts…" : "Précisez vos critères, contraintes, préférences…"}
          value={f.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Diffuser le projet sur :</Label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={!!f.visibility_showcase} onChange={(e) => set("visibility_showcase", !!e.target.checked)} />
          <span>Carte de visite digitale (vitrine)</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={!!f.visibility_public} onChange={(e) => set("visibility_public", !!e.target.checked)} />
          <span>Place des Projets (publique)</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={!!f.visibility_inter_agent} onChange={(e) => set("visibility_inter_agent", !!e.target.checked)} />
          <span>Marché inter-professionnel</span>
        </label>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isSubmitting || !f.professionnel_id}>
          {isSubmitting ? (isEdit ? "Mise à jour…" : "Création…") : isEdit ? "Mettre à jour" : "Créer le projet"}
        </Button>
      </div>
    </form>
  );
};

export default NewProjectFormPro;