import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/customSupabaseClient";
import { useToast } from "@/components/ui/use-toast";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import ProjectCard from "@/components/marketplace/ProjectCard";

/* ---------------------------------------------------------------------- */
/*  Utils : normalisation / harmonisation                                 */
/* ---------------------------------------------------------------------- */

function normalizeProjectOrigin(p = {}) {
  const candidates = [
    p.source, p.source_type, p.project_origin, p.origin, p.role,
    p.depositor_role, p.requester_role, p.account_type, p.user_role,
    typeof p.is_professional === "boolean" ? (p.is_professional ? "professionnel" : "particulier") : null,
    typeof p.isProfessional === "boolean" ? (p.isProfessional ? "professionnel" : "particulier") : null,
    typeof p.isPro === "boolean" ? (p.isPro ? "professionnel" : "particulier") : null,
  ].filter(Boolean);

  let origin = "particulier";
  for (const c of candidates) {
    const s = String(c).toLowerCase().trim();
    if (s.includes("professionnel") || s === "professional" || s === "pro") { origin = "professionnel"; break; }
    if (s.includes("particulier") || s === "individual" || s === "private") { origin = "particulier"; }
  }

  const role_label = origin === "professionnel" ? "Professionnel" : "Particulier";
  const isProBool = origin === "professionnel";

  return {
    ...p,
    project_origin: origin,
    role: origin,
    origin: role_label,
    role_label,
    is_professional: isProBool,
    isProfessional: isProBool,
    isPro: isProBool,
  };
}

function normalizeRow(row = {}) {
  // fusion avec snapshot si présent
  const base = { ...row, ...(row.project_snapshot || {}) };

  const withOrigin = normalizeProjectOrigin(base);

  // description
  withOrigin.description =
    withOrigin.description ||
    withOrigin.description_projet ||
    withOrigin.details ||
    withOrigin.commentaires ||
    withOrigin.presentation ||
    "";

  // photos
  if (!Array.isArray(withOrigin.photos)) {
    withOrigin.photos = [
      withOrigin.image_1_url,
      withOrigin.image_2_url,
      withOrigin.image_3_url,
    ].filter(Boolean);
  }

  // cast booléens
  const BOOLS = [
    "has_elevator","has_cellar","has_parking","has_caretaker","has_clear_view",
    "has_garden","has_terrace","has_balcony","has_pool","is_last_floor",
    "has_fireplace","has_air_conditioning","is_furnished","is_duplex",
    "is_ground_floor","is_penthouse","has_disabled_access","has_storeroom",
  ];
  for (const k of BOOLS) {
    const v = withOrigin[k];
    withOrigin[k] = v === true || v === "true" || v === 1 || v === "1" || v === "t";
  }

  return withOrigin;
}

const titleOf = (p) => p.titre ?? p.project_title ?? p.title ?? "Projet";

/* ---------------------------------------------------------------------- */
/*  Page : Marché Inter-Professionnels                                    */
/* ---------------------------------------------------------------------- */

export default function ProfessionnelProfessionalMarketplacePage() {
  const { toast } = useToast();

  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtres / tri
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");            // all | achat | vente
  const [typeBien, setTypeBien] = useState("all");    // all | appartement | maison | ...
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [surfaceMin, setSurfaceMin] = useState("");
  const [surfaceMax, setSurfaceMax] = useState("");
  const [sortKey, setSortKey] = useState("newest");   // newest | oldest | price_asc | price_desc

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      // ✅ source de vérité: table unifiée + visibilité inter-agent
      const { data, error } = await supabase
        .from("projects_marketplace_unified_all")
        .select("*")
        .eq("visibility_inter_agent", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Normalisation + ne conserver que les projets de professionnels
      const items = (data || [])
        .map(normalizeRow)
        .filter((p) => p.project_origin === "professionnel");

      setRaw(items);
    } catch (err) {
      console.error("Erreur chargement marché inter-pro:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Impossible de charger les projets. ${err?.message ?? ""}`,
      });
      setRaw([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  /* -------------------------- Filtrage / Tri --------------------------- */

  const filtered = useMemo(() => {
    const txt = q.trim().toLowerCase();

    return (raw || []).filter((p) => {
      if (txt) {
        const hay = [
          titleOf(p),
          p.city_choice_1, p.quartier_choice_1,
          p.city, p.quartier,
          p.description, p.description_projet, p.commentaires, p.presentation,
        ].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(txt)) return false;
      }

      if (type !== "all" && (p.type_projet ?? p.type) !== type) return false;
      if (typeBien !== "all" && (p.type_bien || "").toLowerCase() !== typeBien) return false;

      const price = typeof p.prix_demande === "number"
        ? p.prix_demande
        : typeof p.budget_max === "number" ? p.budget_max : null;

      if (budgetMin && price != null && price < Number(budgetMin)) return false;
      if (budgetMax && price != null && price > Number(budgetMax)) return false;

      const sMin = Number(p.surface_min ?? 0);
      const sMax = Number(p.surface_max ?? 0);
      const sVente = Number(p.surface ?? 0);

      if (surfaceMin) {
        if ((p.type_projet === "achat" && sMax && sMax < Number(surfaceMin)) ||
            (p.type_projet === "vente" && sVente && sVente < Number(surfaceMin)))
          return false;
      }
      if (surfaceMax) {
        if ((p.type_projet === "achat" && sMin && sMin > Number(surfaceMax)) ||
            (p.type_projet === "vente" && sVente && sVente > Number(surfaceMax)))
          return false;
      }

      return true;
    });
  }, [raw, q, type, typeBien, budgetMin, budgetMax, surfaceMin, surfaceMax]);

  const sorted = useMemo(() => {
    const items = [...filtered];
    switch (sortKey) {
      case "oldest":
        items.sort(
          (a, b) =>
            new Date(a.created_at || a.updated_at || 0) -
            new Date(b.created_at || b.updated_at || 0)
        );
        break;
      case "price_asc": {
        const price = (p) =>
          typeof p.prix_demande === "number"
            ? p.prix_demande
            : typeof p.budget_max === "number"
            ? p.budget_max
            : Number.POSITIVE_INFINITY;
        items.sort((a, b) => price(a) - price(b));
        break;
      }
      case "price_desc": {
        const price = (p) =>
          typeof p.prix_demande === "number"
            ? p.prix_demande
            : typeof p.budget_max === "number"
            ? p.budget_max
            : Number.NEGATIVE_INFINITY;
        items.sort((a, b) => price(b) - price(a));
        break;
      }
      case "newest":
      default:
        items.sort(
          (a, b) =>
            new Date(b.created_at || b.updated_at || 0) -
            new Date(a.created_at || a.updated_at || 0)
        );
        break;
    }
    return items;
  }, [filtered, sortKey]);

  /* ----------------------------- Rendu ------------------------------ */

  return (
    <div className="container mx-auto px-4 py-10">
      <SEO
        title="Marché Inter-Professionnels"
        description="Découvrez les projets partagés par d'autres professionnels de l'immobilier."
      />

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-brand-blue">Marché Inter-Professionnels</h1>
        <p className="text-lg text-gray-600 mt-2 max-w-3xl mx-auto">
          Consultez les projets d'achat et de vente partagés par vos confrères et créez de nouvelles opportunités d'affaires.
        </p>
      </div>

      {/* Filtres + tri */}
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
        <div className="lg:col-span-3">
          <label className="text-xs text-gray-600">Rechercher (titre, ville, quartier…)</label>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ex: Courbevoie, duplex…" />
        </div>
        <div className="lg:col-span-2">
          <label className="text-xs text-gray-600">Type</label>
          <select className="w-full border rounded-md px-3 py-2" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">Tous</option>
            <option value="achat">Achat</option>
            <option value="vente">Vente</option>
          </select>
        </div>
        <div className="lg:col-span-2">
          <label className="text-xs text-gray-600">Type de bien</label>
          <select className="w-full border rounded-md px-3 py-2" value={typeBien} onChange={(e) => setTypeBien(e.target.value)}>
            <option value="all">Tous</option>
            <option value="appartement">Appartement</option>
            <option value="maison">Maison</option>
          </select>
        </div>
        <div className="lg:col-span-3 grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-600">Budget min (€)</label>
            <Input inputMode="numeric" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} placeholder="ex: 300000" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Budget max (€)</label>
            <Input inputMode="numeric" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} placeholder="ex: 900000" />
          </div>
        </div>
        <div className="lg:col-span-2 grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-600">Surface min (m²)</label>
            <Input inputMode="numeric" value={surfaceMin} onChange={(e) => setSurfaceMin(e.target.value)} placeholder="ex: 50" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Surface max (m²)</label>
            <Input inputMode="numeric" value={surfaceMax} onChange={(e) => setSurfaceMax(e.target.value)} placeholder="ex: 120" />
          </div>
        </div>
        <div className="lg:col-span-2">
          <label className="text-xs text-gray-600">Trier par</label>
          <select className="w-full border rounded-md px-3 py-2" value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
            <option value="newest">Plus récentes</option>
            <option value="oldest">Plus anciennes</option>
            <option value="price_asc">Prix croissants</option>
            <option value="price_desc">Prix décroissants</option>
          </select>
        </div>
      </div>

      {/* Liste des projets */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          Aucun projet ne correspond aux filtres.
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-600 mb-4">
            {sorted.length} projet{sorted.length > 1 ? "s" : ""} trouvé{sorted.length > 1 ? "s" : ""}.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sorted.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                useProjectTitle="titre"
                hideTypeText={false}
                startCollapsed={true}
                hasRequested={false}
                connectionStatus="none"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}