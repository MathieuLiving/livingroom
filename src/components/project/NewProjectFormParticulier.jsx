// src/components/project/NewProjectFormParticulier.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { supabase } from "@/lib/customSupabaseClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trees, Sun, Square, Waves, ArrowUpDown, Package, Car, Shield, Eye, X, Plus, ArrowUp, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import PhotoUploader from "@/components/project/PhotoUploader";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";

// ✅ RGPD notice (dans ton arbo)
import RgpdNotice from "@/components/legal/RgpdNotice";

/* ----------------------------- Constantes ----------------------------- */

const PROPERTY_TYPES = ["Appartement", "Maison/villa", "Loft", "Hôtel particulier", "Parking", "Autre surface"];
const TIMELINE_OPTIONS = ["Tout de suite", "< de 3 mois", "3 à 6 mois", "+ de 6 mois"];
const DPE_OPTIONS = ["A", "B", "C", "D", "E", "F", "G"];
const FEATURE_DEFS = [{
  key: "has_garden",
  label: "Jardin",
  Icon: Trees
}, {
  key: "has_terrace",
  label: "Terrasse",
  Icon: Sun
}, {
  key: "has_balcony",
  label: "Balcon",
  Icon: Square
}, {
  key: "has_pool",
  label: "Piscine",
  Icon: Waves
}, {
  key: "has_elevator",
  label: "Ascenseur",
  Icon: ArrowUpDown
}, {
  key: "has_cellar",
  label: "Cave",
  Icon: Package
}, {
  key: "has_parking",
  label: "Parking",
  Icon: Car
}, {
  key: "has_caretaker",
  label: "Gardien",
  Icon: Shield
}, {
  key: "has_clear_view",
  label: "Vue dégagée",
  Icon: Eye
}, {
  key: "is_last_floor",
  label: "Dernier étage",
  Icon: ArrowUp
}];

/* ----------------------------- Helpers ----------------------------- */

// toInt robuste
const toInt = v => {
  if (v === "" || v == null) return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
};

// enlève undefined
const pickDefined = o => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

// blacklist de clés interdites
const stripKeys = (obj, keys = []) => Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));
function stripDiacritics(s = "") {
  // ✅ plus robuste que /[̀-ͯ]/g
  return s.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
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
  const onKeyDown = e => {
    if (!open || !items.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(i => Math.min(items.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(i => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && items[activeIndex]) {
        e.preventDefault();
        onChoose(items[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setActiveIndex(-1);
    }
  };
  useEffect(() => {
    if (!listRef.current || activeIndex < 0) return;
    const el = listRef.current.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({
      block: "nearest"
    });
  }, [activeIndex]);
  return {
    activeIndex,
    setActiveIndex,
    listRef,
    onKeyDown
  };
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
    (async () => {
      const term = stripDiacritics(debounced || "");
      if (!term || term.length < 2) {
        if (!cancel) {
          setItems([]);
          setOpen(false);
        }
        return;
      }
      try {
        const {
          data,
          error
        } = await supabase.from("stg_geo").select("ville, ville_uid, ville_slug, departement, departement_uid, region, region_uid, ville_norm, departement_norm, region_norm").or(`ville_norm.ilike.%${term}%,ville.ilike.%${debounced}%`).not("ville", "is", null).limit(60);
        if (error) throw error;
        const uniq = new Map();
        (data || []).forEach(r => {
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
    })();
    return () => {
      cancel = true;
    };
  }, [debounced]);
  return {
    items,
    open,
    setOpen
  };
}
function CityAutocomplete({
  label = "Ville",
  value,
  onChange,
  onSelect,
  placeholder = "Ex : Paris",
  required,
  dropdownZ = 50
}) {
  // ✅ init robuste : value peut être string OU objet {city}
  const initialQuery = typeof value === "string" ? value : value?.city || value?.ville || "";
  const [query, setQuery] = useState(initialQuery);
  const {
    items,
    open,
    setOpen
  } = useCitiesSearch(query);
  const wrapRef = useRef(null);
  useEffect(() => {
    const next = typeof value === "string" ? value || "" : value?.city || value?.ville || "";
    setQuery(next);
  }, [value]);
  useEffect(() => {
    const onClickOutside = e => {
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
      departement_uid: row.departement_uid || null,
      region_uid: row.region_uid || null
    });
    setQuery(city);
    setOpen(false);
    kb.setActiveIndex(-1);
  }
  const kb = useListKeyboard(open, items, choose);
  return <div className="relative" ref={wrapRef}>
      <Label>
        {label}
        {required ? " *" : ""}
      </Label>
      <Input value={query} onChange={e => {
      setQuery(e.target.value);
      onChange?.(e.target.value);
    }} onFocus={() => items.length && setOpen(true)} onKeyDown={kb.onKeyDown} placeholder={placeholder} required={required} autoComplete="off" aria-autocomplete="list" aria-expanded={open} />
      {open && items.length > 0 && <div className="absolute mt-1 w-full rounded-md border bg-white shadow-lg max-h-60 overflow-auto" role="listbox" style={{
      zIndex: dropdownZ
    }} ref={kb.listRef}>
          {items.map((r, idx) => <button type="button" key={r.ville_uid || `${r.ville}-${r.departement}`} className={"w-full text-left px-3 py-2 hover:bg-gray-50 " + (idx === kb.activeIndex ? "bg-gray-50" : "")} role="option" aria-selected={idx === kb.activeIndex} data-index={idx} onMouseEnter={() => kb.setActiveIndex(idx)} onClick={() => choose(r)}>
              <div className="font-medium">{r.ville}</div>
              <div className="text-xs text-gray-500">
                {r.departement || "—"} · {r.region || "—"}
              </div>
            </button>)}
        </div>}
    </div>;
}

/* =======================================================================
   Autocomplete QUARTIER — avec UID
   ======================================================================= */

function useNeighborhoodsByCity({
  ville_uid,
  city
}) {
  const [items, setItems] = useState([]); // [{name, uid}]
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const debouncedCity = useDebouncedValue(city || "", 300);
  const debouncedQ = useDebouncedValue(q, 200);
  useEffect(() => {
    let cancel = false;
    (async () => {
      setItems([]);
      if (!ville_uid && !debouncedCity) return;
      try {
        let query = supabase.from("stg_geo").select("quartier, quartier_uid, quartier_slug, quartier_norm").not("quartier", "is", null).limit(400);
        if (ville_uid) {
          query = query.eq("ville_uid", ville_uid);
        } else {
          const norm = stripDiacritics(debouncedCity);
          if (!norm) return;
          query = query.or(`ville_norm.ilike.%${norm}%,ville.ilike.%${debouncedCity}%`);
        }
        if (debouncedQ?.length >= 1) {
          const normQ = stripDiacritics(debouncedQ);
          query = query.or(`quartier_norm.ilike.%${normQ}%,quartier.ilike.%${debouncedQ}%`);
        }
        const {
          data,
          error
        } = await query;
        if (error) throw error;
        const uniq = new Map();
        (data || []).forEach(r => {
          const key = r.quartier_uid || r.quartier_norm || r.quartier;
          if (r.quartier && !uniq.has(key)) {
            uniq.set(key, {
              name: r.quartier,
              uid: r.quartier_uid || null
            });
          }
        });
        const arr = Array.from(uniq.values()).sort((a, b) => a.name.localeCompare(b.name, "fr"));
        if (!cancel) {
          setItems(arr);
          setOpen(true);
        }
      } catch {
        if (!cancel) setItems([]);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [ville_uid, debouncedCity, debouncedQ]);
  return {
    items,
    open,
    setOpen,
    q,
    setQ
  };
}
function NeighborhoodAutocomplete({
  label = "Quartier (optionnel)",
  value,
  valueUid,
  // conservé pour compat (pas obligatoire ici)
  onChange,
  onChangeUid,
  cityMeta,
  dropdownZ = 50,
  required = false
}) {
  const hasCity = !!(cityMeta && (cityMeta.city || cityMeta.ville_uid));
  const {
    items,
    open,
    setOpen,
    q,
    setQ
  } = useNeighborhoodsByCity({
    ville_uid: cityMeta?.ville_uid || null,
    city: cityMeta?.city || ""
  });
  const wrapRef = useRef(null);
  useEffect(() => {
    const onClickOutside = e => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [setOpen]);
  useEffect(() => {
    if (typeof value === "string") setQ(value);
  }, [value, setQ]);
  function choose(opt) {
    onChange?.(opt.name);
    onChangeUid?.(opt.uid || null);
    setQ(opt.name);
    setOpen(false);
    kb.setActiveIndex(-1);
  }
  const kb = useListKeyboard(open, items, choose);
  return <div className="relative" ref={wrapRef}>
      <Label>
        {label}
        {required ? " *" : ""}
      </Label>
      <Input value={q} onChange={e => {
      setQ(e.target.value);
      onChange?.(e.target.value);
      onChangeUid?.(null);
    }} onFocus={() => hasCity && items.length && setOpen(true)} onKeyDown={kb.onKeyDown} placeholder={hasCity ? "Commencez à taper…" : "Choisissez d’abord une ville"} disabled={!hasCity} required={required} autoComplete="off" aria-autocomplete="list" aria-expanded={open} />
      {open && hasCity && items.length > 0 && <div className="absolute mt-1 w-full rounded-md border bg-white shadow-lg max-h-60 overflow-auto" role="listbox" style={{
      zIndex: dropdownZ
    }} ref={kb.listRef}>
          {items.map((opt, idx) => <button type="button" key={`${opt.name}-${opt.uid || idx}`} className={"w-full text-left px-3 py-2 hover:bg-gray-50 " + (idx === kb.activeIndex ? "bg-gray-50" : "")} role="option" aria-selected={idx === kb.activeIndex} data-index={idx} onMouseEnter={() => kb.setActiveIndex(idx)} onClick={() => choose(opt)}>
              <div className="font-medium">{opt.name}</div>
            </button>)}
        </div>}
    </div>;
}

/* =======================================================================
   Normalisation initial -> state
   ======================================================================= */

function normalize(obj) {
  const isBuy = obj?.type_projet === "achat" || obj?.project_type === "achat";
  const isSell = obj?.type_projet === "vente" || obj?.project_type === "vente";
  let locations = [];
  if (isBuy) {
    locations = [1, 2, 3, 4, 5].map(i => ({
      city: obj[`city_choice_${i}`] || "",
      quartier: obj[`quartier_choice_${i}`] || "",
      quartier_uid: obj[`quartier_uid_choice_${i}`] || null,
      department: obj[`department_choice_${i}`] || "",
      region: obj[`region_choice_${i}`] || "",
      departement_uid: obj.departement_uid || null,
      region_uid: obj.region_uid || null,
      ville_uid: obj[`ville_uid_choice_${i}`] || obj.ville_uid || null
    })).filter(l => l.city);
  } else if (isSell) {
    locations = [{
      city: obj.city_choice_1 || "",
      quartier: obj.quartier_choice_1 || "",
      quartier_uid: obj.quartier_uid_choice_1 || obj.quartier_uid || null,
      department: obj.department_choice_1 || "",
      region: obj.region_choice_1 || "",
      departement_uid: obj.departement_uid || null,
      region_uid: obj.region_uid || null,
      ville_uid: obj.ville_uid_choice_1 || obj.ville_uid || null
    }];
  }
  if (!locations.length) locations.push({
    city: "",
    quartier: "",
    quartier_uid: null,
    department: "",
    region: "",
    departement_uid: null,
    region_uid: null,
    ville_uid: null
  });
  const photoUrls = [obj?.image_1_url, obj?.image_2_url, obj?.image_3_url].filter(Boolean);
  return {
    project_title: obj?.project_title || obj?.title || "",
    type_projet: isSell ? "vente" : "achat",
    type_bien: obj?.type_bien || "Appartement",
    delai: obj?.delai || "",
    description: obj?.description || "",
    part_property_ad_link: obj?.part_property_ad_link || "",
    locations,
    visibility_public: obj?.visibility_public ?? true,
    budget_min: obj?.budget_min ?? "",
    budget_max: obj?.budget_max ?? "",
    surface_min: obj?.surface_min ?? "",
    surface_max: obj?.surface_max ?? "",
    bedrooms_min: obj?.bedrooms_min ?? "",
    prix_demande: obj?.prix_demande ?? "",
    surface: obj?.surface ?? "",
    bedrooms: obj?.bedrooms ?? "",
    energy_consumption: obj?.energy_consumption || "",
    co2_emission: obj?.co2_emission || "",
    photos: photoUrls,
    has_garden: !!obj?.has_garden,
    has_terrace: !!obj?.has_terrace,
    has_balcony: !!obj?.has_balcony,
    has_pool: !!obj?.has_pool,
    has_elevator: !!obj?.has_elevator,
    has_cellar: !!obj?.has_cellar,
    has_parking: !!obj?.has_parking,
    has_caretaker: !!obj?.has_caretaker,
    has_clear_view: !!obj?.has_clear_view,
    is_last_floor: !!obj?.is_last_floor
  };
}

/* =======================================================================
   Upload photos (vente)
   ======================================================================= */

async function uploadPhotosAndGetUrls(photos, userId) {
  if (!photos || photos.length === 0) return [];
  const uploadPromises = photos.map(async photo => {
    if (typeof photo === "string") return photo; // déjà une URL

    const ext = (photo?.name?.split(".").pop() || "jpg").toLowerCase();
    const fileName = `${uuidv4()}.${ext}`;
    const filePath = `${userId}/${fileName}`;
    const {
      data,
      error
    } = await supabase.storage.from("project-photos").upload(filePath, photo, {
      cacheControl: "3600",
      upsert: false,
      contentType: photo.type || "image/jpeg"
    });
    if (error) {
      console.error("Error uploading photo:", error);
      return null;
    }
    const {
      data: pub
    } = supabase.storage.from("project-photos").getPublicUrl(data.path);
    return pub?.publicUrl || null;
  });
  return (await Promise.all(uploadPromises)).filter(Boolean);
}

/* =======================================================================
   Payload DB
   ======================================================================= */

function buildSubmitPayload(state, photoUrls = []) {
  const locs = (state.locations || []).slice(0, 5);
  const pick = (i, k, def = null) => {
    const v = locs[i - 1]?.[k];
    const s = typeof v === "string" ? v.trim() : v;
    return s || def;
  };
  const baseVilleUID = pick(1, "ville_uid", null);
  const baseQuartierUID = pick(1, "quartier_uid", null);
  const baseDepartementUID = pick(1, "departement_uid", null);
  const baseRegionUID = pick(1, "region_uid", null);
  const common = {
    type_projet: state.type_projet,
    project_title: (state.project_title ?? "").toString().trim() || null,
    type_bien: state.type_bien || null,
    delai: state.delai || null,
    description: (state.description ?? "").toString().trim() || null,
    visibility_public: !!state.visibility_public,
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
    ville_uid: baseVilleUID,
    quartier_uid: baseQuartierUID,
    departement_uid: baseDepartementUID,
    region_uid: baseRegionUID
  };
  if (state.type_projet === "achat") {
    return {
      ...common,
      ville_uid_choice_1: pick(1, "ville_uid", null),
      quartier_uid_choice_1: pick(1, "quartier_uid", null),
      ville_uid_choice_2: pick(2, "ville_uid", null),
      quartier_uid_choice_2: pick(2, "quartier_uid", null),
      ville_uid_choice_3: pick(3, "ville_uid", null),
      quartier_uid_choice_3: pick(3, "quartier_uid", null),
      ville_uid_choice_4: pick(4, "ville_uid", null),
      quartier_uid_choice_4: pick(4, "quartier_uid", null),
      ville_uid_choice_5: pick(5, "ville_uid", null),
      quartier_uid_choice_5: pick(5, "quartier_uid", null),
      budget_min: toInt(state.budget_min),
      budget_max: toInt(state.budget_max),
      surface_min: toInt(state.surface_min),
      surface_max: toInt(state.surface_max),
      bedrooms_min: toInt(state.bedrooms_min)
    };
  }

  // VENTE
  return {
    ...common,
    surface: toInt(state.surface),
    bedrooms: toInt(state.bedrooms),
    prix_demande: toInt(state.prix_demande),
    part_property_ad_link: state.part_property_ad_link || null,
    energy_consumption: state.energy_consumption || null,
    co2_emission: state.co2_emission || null,
    image_1_url: photoUrls[0] || null,
    image_2_url: photoUrls[1] || null,
    image_3_url: photoUrls[2] || null
  };
}

/**
 * ✅ Enqueue notification via Edge Function `notification-enqueue`
 * Aligné avec ton code Edge (champs, normalizeConnectionLink, idempotence event_key)
 */
async function enqueueAdminNotification({
  projectId,
  senderNameFallback
}) {
  const redirect_path = `/place-des-projets/projets/${projectId}`;
  const connection_link = `https://livingroom.immo${redirect_path}`;
  const event_key = `admin_new_project:particulier:${projectId}`;
  const body = {
    recipient_email: "mathieu.guerin@livingpage.fr",
    notification_type: "admin_new_project",
    is_admin_notification: true,
    is_pro: false,
    redirect_path,
    connection_link,
    sender_name_fallback: senderNameFallback || "Nouveau projet particulier",
    event_key,
    payload: {
      project_id: projectId,
      redirect_path,
      connection_link,
      source_form: "NewProjectFormParticulier"
    }
  };
  const {
    data,
    error
  } = await supabase.functions.invoke("notification-enqueue", {
    body
  });
  if (error) throw error;
  return data;
}

/* =======================================================================
   Composant principal
   ======================================================================= */

export const NewProjectFormParticulier = ({
  initial = {},
  isEdit = false,
  projectId,
  onCreated,
  onUpdated,
  onBeforeSubmit,
  submitButtonText,
  forcedTypeProjet = null,
  hideTypeTabs = false
}) => {
  const {
    user,
    profile
  } = useAuth();
  const {
    toast
  } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [f, setF] = useState(() => {
    const base = normalize(initial);
    if (forcedTypeProjet === "achat" || forcedTypeProjet === "vente") {
      return {
        ...base,
        type_projet: forcedTypeProjet
      };
    }
    return base;
  });
  const [photos, setPhotos] = useState(f.photos || []);

  // ✅ RGPD / consentements
  const [rgpdAccepted, setRgpdAccepted] = useState(false);
  const [publicAck, setPublicAck] = useState(false); // requis seulement si publication

  // ✅ si le parent change le type forcé, on verrouille/force le state
  useEffect(() => {
    if (forcedTypeProjet === "achat" || forcedTypeProjet === "vente") {
      setF(prev => prev.type_projet === forcedTypeProjet ? prev : {
        ...prev,
        type_projet: forcedTypeProjet
      });
    }
  }, [forcedTypeProjet]);

  // ✅ si l’utilisateur décoche la publication, on réinitialise l’ack
  useEffect(() => {
    if (!f.visibility_public) setPublicAck(false);
  }, [f.visibility_public]);
  const set = (k, v) => setF(p => ({
    ...p,
    [k]: v
  }));
  const canAddLocation = useMemo(() => (f.locations?.length || 0) < 5, [f.locations]);
  function updateLocationAt(i, next) {
    const arr = [...(f.locations || [])];
    arr[i] = next;
    set("locations", arr);
  }
  function addLocation() {
    if (canAddLocation) {
      set("locations", [...(f.locations || []), {
        city: "",
        quartier: "",
        quartier_uid: null,
        department: "",
        region: "",
        departement_uid: null,
        region_uid: null,
        ville_uid: null
      }]);
    }
  }
  function removeLocation(i) {
    const arr = [...(f.locations || [])];
    arr.splice(i, 1);
    set("locations", arr.length ? arr : [{
      city: "",
      quartier: "",
      quartier_uid: null,
      department: "",
      region: "",
      departement_uid: null,
      region_uid: null,
      ville_uid: null
    }]);
  }
  function isFormRoughlyValid() {
    if (f.type_projet === "achat") {
      const hasAnyCity = (f.locations || []).some(l => (l.city || "").trim() !== "");
      return hasAnyCity;
    }
    const city = f.locations?.[0]?.city?.trim();
    return !!city;
  }
  function isRgpdOkToSubmit() {
    if (!rgpdAccepted) return false;
    if (f.visibility_public && !publicAck) return false;
    return true;
  }
  async function submit(e) {
    e?.preventDefault?.();
    if (!rgpdAccepted) {
      toast({
        variant: "destructive",
        title: "Confirmation requise",
        description: "Merci de confirmer la prise de connaissance de la Politique de confidentialité."
      });
      return;
    }
    if (f.visibility_public && !publicAck) {
      toast({
        variant: "destructive",
        title: "Publication",
        description: "Merci de confirmer que vous comprenez l’impact de la publication sur la Place des projets."
      });
      return;
    }
    if (user && profile?.role === "professionnel") {
      toast({
        variant: "destructive",
        title: "Action impossible",
        description: "Vous êtes connecté en tant que professionnel. Vous ne pouvez pas créer de projet particulier."
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const fFinal = forcedTypeProjet === "achat" || forcedTypeProjet === "vente" ? {
        ...f,
        type_projet: forcedTypeProjet
      } : f;
      if (user) {
        let photoUrls = [];
        if (fFinal.type_projet === "vente") {
          photoUrls = await uploadPhotosAndGetUrls(photos, user.id);
        }
        let payload = buildSubmitPayload(fFinal, photoUrls);
        if (typeof onBeforeSubmit === "function") {
          payload = onBeforeSubmit(payload) || payload;
        }
        let cleanedPayload = pickDefined(payload);
        cleanedPayload = stripKeys(cleanedPayload, ["visibility_showcase"]);
        const tableName = fFinal.type_projet === "achat" ? "buying_projects_particulier" : "selling_projects_particulier";
        let error;
        let createdProject = null;
        if (isEdit) {
          const {
            error: updateError
          } = await supabase.from(tableName).update(cleanedPayload).eq("id", projectId);
          error = updateError;
        } else {
          const {
            data: insertData,
            error: insertError
          } = await supabase.from(tableName).insert({
            ...cleanedPayload,
            particulier_id: user.id
          }).select("*").single();
          error = insertError;
          createdProject = insertData || null;
        }
        if (error) throw error;

        // 🔔 Notification admin : nouveau projet particulier (✅ via Edge Function `notification-enqueue`)
        if (!isEdit && createdProject?.id) {
          try {
            await enqueueAdminNotification({
              projectId: createdProject.id,
              senderNameFallback: createdProject.project_title || createdProject.title || "Nouveau projet particulier"
            });
          } catch (notifErr) {
            // Ne bloque pas la création du projet si la notif échoue
            console.error("Notification enqueue failed:", notifErr);
          }
        }
        if (isEdit) onUpdated?.();else onCreated?.(createdProject || cleanedPayload);
      } else {
        const payload = buildSubmitPayload(fFinal, []);
        onCreated?.(payload);
      }
    } catch (err) {
      console.error("Project submission error:", err);
      const message = typeof err?.message === "string" ? err.message : "Une erreur est survenue lors de la sauvegarde.";
      toast({
        variant: "destructive",
        title: "Erreur",
        description: message
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  const isSell = f.type_projet === "vente";
  const tabsLocked = forcedTypeProjet === "achat" || forcedTypeProjet === "vente";
  const showTabs = !(hideTypeTabs && tabsLocked);
  return <form id="new-project-form" onSubmit={submit} className="space-y-6 relative">
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <div className="w-full">
          <Label htmlFor="project_title">Titre du projet</Label>
          <Input id="project_title" placeholder={isSell ? "Ex. Vente T3 lumineux à Belleville" : "Ex. Achat T3 à Paris 11"} value={f.project_title} onChange={e => set("project_title", e.target.value)} className="h-11 text-lg" />
        </div>
      </div>

      <Tabs value={f.type_projet} onValueChange={v => {
      if (tabsLocked) return;
      set("type_projet", v);
    }} className="w-full">
        {showTabs && <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="achat" disabled={tabsLocked && forcedTypeProjet !== "achat"}>
              Achat
            </TabsTrigger>
            <TabsTrigger value="vente" disabled={tabsLocked && forcedTypeProjet !== "vente"}>
              Vente
            </TabsTrigger>
          </TabsList>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <Label htmlFor="type_bien">Type de bien</Label>
            <select id="type_bien" className="border rounded-md p-2 w-full" value={f.type_bien} onChange={e => set("type_bien", e.target.value)}>
              {PROPERTY_TYPES.map(t => <option key={t} value={t}>
                  {t}
                </option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="delai">Délai</Label>
            <select id="delai" className="border rounded-md p-2 w-full" value={f.delai} onChange={e => set("delai", e.target.value)}>
              <option value="">Sélectionner…</option>
              {TIMELINE_OPTIONS.map(t => <option key={t} value={t}>
                  {t}
                </option>)}
            </select>
          </div>
        </div>

        <TabsContent value="achat" className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Localisations de recherche (jusqu’à 5)</h3>
              <Button type="button" variant="secondary" onClick={addLocation} disabled={!canAddLocation}>
                <Plus className="h-4 w-4 mr-2" /> Ajouter
              </Button>
            </div>
            <div className="space-y-3">
              {(f.locations || []).map((loc, i) => <LocationRow key={i} index={i} value={loc} onChange={next => updateLocationAt(i, next)} onRemove={() => removeLocation(i)} />)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="budget_min">Budget min (€)</Label>
              <Input id="budget_min" type="number" inputMode="numeric" value={f.budget_min} onChange={e => set("budget_min", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="budget_max">Budget max (€)</Label>
              <Input id="budget_max" type="number" inputMode="numeric" value={f.budget_max} onChange={e => set("budget_max", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="surface_min">Surface min (m²)</Label>
              <Input id="surface_min" type="number" inputMode="numeric" value={f.surface_min} onChange={e => set("surface_min", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="surface_max">Surface max (m²)</Label>
              <Input id="surface_max" type="number" inputMode="numeric" value={f.surface_max} onChange={e => set("surface_max", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="bedrooms_min">Chambres min</Label>
              <Input id="bedrooms_min" type="number" inputMode="numeric" value={f.bedrooms_min} onChange={e => set("bedrooms_min", e.target.value)} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="vente" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <CityAutocomplete label="Ville" value={f.locations?.[0]?.city || ""} onChange={v => updateLocationAt(0, {
              ...f.locations[0],
              city: v,
              ville_uid: null
            })} onSelect={({
              city,
              department,
              region,
              ville_uid,
              departement_uid,
              region_uid
            }) => updateLocationAt(0, {
              ...f.locations[0],
              city,
              department,
              region,
              ville_uid,
              departement_uid,
              region_uid
            })} required />
            </div>
            <div className="md:col-span-2">
              <NeighborhoodAutocomplete cityMeta={{
              city: f.locations?.[0]?.city || "",
              ville_uid: f.locations?.[0]?.ville_uid || null
            }} value={f.locations?.[0]?.quartier || ""} valueUid={f.locations?.[0]?.quartier_uid || null} onChange={quartier => updateLocationAt(0, {
              ...f.locations[0],
              quartier
            })} onChangeUid={quartier_uid => updateLocationAt(0, {
              ...f.locations[0],
              quartier_uid
            })} label="Quartier" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="prix_demande">Valeur souhaitée (€)</Label>
              <Input id="prix_demande" type="number" inputMode="numeric" value={f.prix_demande} onChange={e => set("prix_demande", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="surface">Surface (m²)</Label>
              <Input id="surface" type="number" inputMode="numeric" value={f.surface} onChange={e => set("surface", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="bedrooms">Chambres</Label>
              <Input id="bedrooms" type="number" inputMode="numeric" value={f.bedrooms} onChange={e => set("bedrooms", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="energy_consumption">DPE (Consommation énergétique)</Label>
              <select id="energy_consumption" className="border rounded-md p-2 w-full" value={f.energy_consumption || ""} onChange={e => set("energy_consumption", e.target.value)}>
                <option value="">Non renseigné</option>
                {DPE_OPTIONS.map(t => <option key={t} value={t}>
                    {t}
                  </option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="co2_emission">GES (Émissions de gaz à effet de serre)</Label>
              <select id="co2_emission" className="border rounded-md p-2 w-full" value={f.co2_emission || ""} onChange={e => set("co2_emission", e.target.value)}>
                <option value="">Non renseigné</option>
                {DPE_OPTIONS.map(t => <option key={t} value={t}>
                    {t}
                  </option>)}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="part_property_ad_link">Lien de l'annonce (optionnel)</Label>
            <Input id="part_property_ad_link" placeholder="https://..." value={f.part_property_ad_link} onChange={e => set("part_property_ad_link", e.target.value)} />
          </div>

          <PhotoUploader photos={photos} setPhotos={setPhotos} max={3} />

          {/* ✅ RGPD : bloc photos */}
          <div className="rounded-lg border bg-white p-4 text-sm">
            <RgpdNotice variant="short" context="project-photos" />
            <div className="mt-2 text-xs text-gray-500">
              Astuce : évitez les visages, plaques d’immatriculation, documents (taxe foncière, pièce d’identité…).
              Certaines photos peuvent contenir des métadonnées (EXIF).{" "}
              <Link className="underline underline-offset-2 hover:opacity-80" to="/confidentialite">
                Politique de confidentialité
              </Link>
              .
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="space-y-2">
        <Label>Critères complémentaires</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {FEATURE_DEFS.map(({
          key,
          label,
          Icon
        }) => {
          const active = !!f[key];
          return <button key={key} type="button" onClick={() => set(key, !active)} className={["flex items-center gap-2 rounded-md border px-3 py-2 text-sm", active ? "bg-black text-white border-black" : "bg-white hover:bg-gray-50"].join(" ")} aria-pressed={active} title={label}>
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>;
        })}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Visibilité</Label>
        <div className="rounded-md border p-3 hover:bg-gray-50 space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox id="visibility_public" checked={f.visibility_public} onCheckedChange={checked => set("visibility_public", checked)} />
            <Label htmlFor="visibility_public" className="cursor-pointer">
              Publier immédiatement sur la Place des projets
            </Label>
          </div>

          {/* ✅ RGPD : ack explicite si publication */}
          {f.visibility_public && <div className="flex items-start gap-2">
              <Checkbox checked={publicAck} onCheckedChange={v => setPublicAck(!!v)} />
              <div className="text-xs text-gray-600 leading-relaxed">
                Je comprends que la publication rend certaines informations de mon projet visibles sur la Place des projets
                (mes coordonnées ne sont pas publiées).
              </div>
            </div>}

          <p className="text-xs text-gray-500">
            Vous gardez le contrôle : vous pouvez modifier/retirer la publication depuis votre espace.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="desc-extra">{isSell ? "En dire plus sur votre bien" : "En dire plus sur votre recherche"}</Label>
        <textarea id="desc-extra" className="w-full min-h-28 rounded-md border p-3" placeholder={isSell ? "Décrivez votre bien, son état, ses atouts…" : "Précisez vos critères…"} value={f.description} maxLength={2000} onChange={e => set("description", e.target.value)} />
        <p className="text-xs text-gray-500"></p>
      </div>

      {/* ✅ RGPD : consentement global (obligatoire) */}
      <div className="rounded-lg border bg-white p-4 space-y-2">
        <RgpdNotice variant="short" context="project-submit" />
        <div className="flex items-start gap-2">
          <Checkbox checked={rgpdAccepted} onCheckedChange={v => setRgpdAccepted(!!v)} />
          <div className="text-xs text-gray-600 leading-relaxed">
            J’ai pris connaissance de la{" "}
            <Link className="underline underline-offset-2 hover:opacity-80" to="/confidentialite">
              Politique de confidentialité
            </Link>{" "}
            et j’accepte le traitement de mes données pour la création/gestion de mon projet et les mises en relation.{" "}
            <Link className="underline underline-offset-2 hover:opacity-80" to="/cgu">
              CGU
            </Link>
            .
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <div className="w-full sm:w-auto">
          <Button type="submit" disabled={isSubmitting || !isFormRoughlyValid() || !isRgpdOkToSubmit()} className="w-full sm:w-auto">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? "Enregistrement…" : submitButtonText || (isEdit ? "Mettre à jour" : "Créer le projet")}
          </Button>

          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            Les informations recueillies sont nécessaires au traitement de votre demande.{" "}
            <Link className="underline underline-offset-2 hover:opacity-80" to="/confidentialite">
              Politique de confidentialité
            </Link>
            .
          </p>
        </div>
      </div>
    </form>;
};
NewProjectFormParticulier.propTypes = {
  initial: PropTypes.object,
  isEdit: PropTypes.bool,
  projectId: PropTypes.string,
  onCreated: PropTypes.func,
  onUpdated: PropTypes.func,
  onBeforeSubmit: PropTypes.func,
  submitButtonText: PropTypes.string,
  forcedTypeProjet: PropTypes.oneOf(["achat", "vente"]),
  hideTypeTabs: PropTypes.bool
};
function LocationRow({
  index,
  value,
  onChange,
  onRemove
}) {
  const cityMeta = {
    city: value.city,
    ville_uid: value.ville_uid
  };
  return <div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
      <div className="md:col-span-3">
        <CityAutocomplete label={`Ville ${index + 1}`} value={value.city || ""} onChange={v => onChange({
        ...value,
        city: v,
        ville_uid: null
      })} onSelect={({
        city,
        department,
        region,
        ville_uid,
        departement_uid,
        region_uid
      }) => onChange({
        ...value,
        city,
        department,
        region,
        ville_uid,
        departement_uid,
        region_uid
      })} placeholder="Ex : Paris" />
      </div>
      <div className="md:col-span-2">
        <NeighborhoodAutocomplete cityMeta={cityMeta} value={value.quartier} valueUid={value.quartier_uid || null} onChange={quartier => onChange({
        ...value,
        quartier
      })} onChangeUid={quartier_uid => onChange({
        ...value,
        quartier_uid
      })} label="Quartier (optionnel)" />
      </div>
      <div className="flex justify-end">
        <Button type="button" variant="ghost" onClick={onRemove} aria-label="Supprimer cette localisation" className="text-red-600 hover:text-red-700">
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>;
}
LocationRow.propTypes = {
  index: PropTypes.number.isRequired,
  value: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired
};
export default NewProjectFormParticulier;