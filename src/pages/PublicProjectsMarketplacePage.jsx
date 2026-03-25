// src/pages/PublicProjectsMarketplacePage.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/customSupabaseClient";
import { useToast } from "@/components/ui/use-toast";
import SEO from "@/components/SEO";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Briefcase,
  UserPlus,
  XCircle,
  Filter,
  MapPin,
  Search,
  ListFilter,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProjectCard from "@/components/marketplace/ProjectCard";

/* ---------------------------------------------------------------------- */
/*  Constants                                                             */
/* ---------------------------------------------------------------------- */
const PAGE_SIZE = 9;
const CANONICAL_URL = "https://livingroom.immo/place-des-projets";

/* ---------------------------------------------------------------------- */
/*  Hooks utils                                                           */
/* ---------------------------------------------------------------------- */
function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/* ---------------------------------------------------------------------- */
/*  Utils : normalisation ALIGNÉE SUR LA HOME                             */
/* ---------------------------------------------------------------------- */
function normalizeProjectOrigin(p = {}) {
  const candidates = [
    p.source,
    p.source_type,
    p.project_origin,
    p.origin,
    p.role,
    p.depositor_role,
    p.requester_role,
    p.account_type,
    p.project_type_origin,
    p.user_role,
    typeof p.is_professional === "boolean"
      ? p.is_professional
        ? "professionnel"
        : "particulier"
      : null,
    typeof p.isProfessional === "boolean"
      ? p.isProfessional
        ? "professionnel"
        : "particulier"
      : null,
    typeof p.isPro === "boolean" ? (p.isPro ? "professionnel" : "particulier") : null,
  ].filter(Boolean);

  let origin = "particulier";
  for (const c of candidates) {
    const s = String(c).toLowerCase().trim();
    if (s.includes("professionnel") || s === "professional" || s === "pro") {
      origin = "professionnel";
      break;
    }
    if (s.includes("particulier") || s === "individual" || s === "private") {
      origin = "particulier";
    }
  }

  const role_label = origin === "professionnel" ? "Professionnel" : "Particulier";
  const isProBool = origin === "professionnel";

  const price_number =
    typeof p.prix_demande === "number"
      ? p.prix_demande
      : typeof p.budget_max === "number"
      ? p.budget_max
      : null;

  const created_ts = p.created_at ? new Date(p.created_at).getTime() : 0;

  return {
    ...p,
    project_origin: origin,
    role: origin,
    origin: role_label,
    role_label,
    is_professional: isProBool,
    isProfessional: isProBool,
    isPro: isProBool,
    price_number,
    created_ts,
  };
}

function getTitle(p) {
  return p.titre ?? p.project_title ?? p.title ?? "Projet immobilier";
}

/* ---------------------------------------------------------------------- */
/*  Page                                                                  */
/* ---------------------------------------------------------------------- */
export default function PublicProjectsMarketplacePage() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);

  // Diagnostic / debug
  const [fetchMode, setFetchMode] = useState("strict"); // strict | tolerant | failed
  const [debugHint, setDebugHint] = useState("");

  // Filtres
  const [q, setQ] = useState("");
  const [type, setType] = useState("all"); // all | achat | vente
  const [origin, setOrigin] = useState("all"); // all | professionnel | particulier
  const [typeBien, setTypeBien] = useState("all"); // all | appartement | maison | ...
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [surfaceMin, setSurfaceMin] = useState("");
  const [surfaceMax, setSurfaceMax] = useState("");
  const [sortKey, setSortKey] = useState("newest"); // newest | oldest | price_asc | price_desc

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const debouncedQ = useDebouncedValue(q, 400);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setFetchMode("strict");
    setDebugHint("");

    const baseSelect = supabase
      .from("projects_marketplace_unified_all")
      .select("*")
      .order("created_at", { ascending: false });

    try {
      // 1) Strict (ta logique actuelle)
      const strictQuery = baseSelect
        .eq("status", "active")
        .eq("visibility_public", true);

      const { data: strictData, error: strictError } = await strictQuery;
      if (strictError) throw strictError;

      if ((strictData || []).length > 0) {
        setRaw((strictData || []).map(normalizeProjectOrigin));
        setFetchMode("strict");
        return;
      }

      // 2) Tolerant fallback
      // - autorise visibility_public = true OU NULL
      // - autorise status = active OU NULL (le temps de stabiliser tes données)
      // NOTE: si la view ne contient pas visibility_public/status, ça ne plantera pas ici car on n’utilise pas eq()
      setFetchMode("tolerant");

      const tolerantQuery = supabase
        .from("projects_marketplace_unified_all")
        .select("*")
        .or("visibility_public.is.null,visibility_public.eq.true")
        .or("status.is.null,status.eq.active")
        .order("created_at", { ascending: false });

      const { data: tolerantData, error: tolerantError } = await tolerantQuery;
      if (tolerantError) throw tolerantError;

      if ((tolerantData || []).length > 0) {
        setRaw((tolerantData || []).map(normalizeProjectOrigin));
        toast({
          title: "Info",
          description:
            "Aucun projet ne correspondait aux filtres stricts (status/visibilité). Affichage en mode tolérant.",
        });
        return;
      }

      // 3) Hard fallback (dernière chance) : pas de filtres du tout
      const { data: allData, error: allError } = await baseSelect;
      if (allError) throw allError;

      setRaw((allData || []).map(normalizeProjectOrigin));
      setFetchMode("tolerant");
      setDebugHint(
        "Les filtres status/visibility_public ne matchent probablement plus tes données (valeurs différentes ou NULL)."
      );

      if ((allData || []).length === 0) {
        setFetchMode("failed");
        setDebugHint(
          "0 projet renvoyé même sans filtres → probable RLS (anon) ou view vide/brisée."
        );
      }
    } catch (e) {
      console.error("Erreur chargement des projets:", e);
      setRaw([]);
      setFetchMode("failed");
      setDebugHint(
        e?.message?.includes("permission") || e?.code === "42501"
          ? "Erreur de permission (RLS) : la view/table n’est pas lisible en public."
          : "Erreur requête : vérifie la view projects_marketplace_unified_all (colonnes, RLS, etc.)."
      );

      toast({
        title: "Erreur",
        description: e?.message || "Impossible de charger les projets.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleConnect = useCallback(
    (project) => {
      const pOrigin = project.role || "particulier";
      const pType = project.type_projet || "achat";
      const pId = project.id;
      navigate(`/place-des-projets/${pOrigin}/${pType}/${pId}/contact`);
    },
    [navigate]
  );

  const filtered = useMemo(() => {
    const txt = debouncedQ.trim().toLowerCase();

    const budgetMinValue = budgetMin ? Number(budgetMin) : null;
    const budgetMaxValue = budgetMax ? Number(budgetMax) : null;
    const surfaceMinValue = surfaceMin ? Number(surfaceMin) : null;
    const surfaceMaxValue = surfaceMax ? Number(surfaceMax) : null;

    return (raw || []).filter((p) => {
      if (txt) {
        const hay = [
          getTitle(p),
          p.city_choice_1,
          p.quartier_choice_1,
          p.city_choice_2,
          p.quartier_choice_2,
          p.city_choice_3,
          p.quartier_choice_3,
          p.city_choice_4,
          p.quartier_choice_4,
          p.city_choice_5,
          p.quartier_choice_5,
          p.city,
          p.quartier,
          p.description,
          p.description_projet,
          p.commentaires,
          p.presentation,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!hay.includes(txt)) return false;
      }

      if (type !== "all") {
        const projType = p.type_projet ?? p.type;
        if (projType !== type) return false;
      }

      if (origin !== "all" && p.project_origin !== origin) return false;

      if (typeBien !== "all") {
        const tb = String(p.type_bien || "").toLowerCase();
        if (tb !== typeBien) return false;
      }

      const price = p.price_number;
      if (budgetMinValue != null && price != null && price < budgetMinValue) return false;
      if (budgetMaxValue != null && price != null && price > budgetMaxValue) return false;

      const sMin = p.surface_min ? Number(p.surface_min) : null;
      const sMax = p.surface_max ? Number(p.surface_max) : null;
      const sVente = p.surface ? Number(p.surface) : null;

      if (surfaceMinValue != null) {
        if (p.type_projet === "achat" && sMax != null && sMax < surfaceMinValue) return false;
        if (p.type_projet === "vente" && sVente != null && sVente < surfaceMinValue) return false;
      }

      if (surfaceMaxValue != null) {
        if (p.type_projet === "achat" && sMin != null && sMin > surfaceMaxValue) return false;
        if (p.type_projet === "vente" && sVente != null && sVente > surfaceMaxValue) return false;
      }

      return true;
    });
  }, [
    raw,
    debouncedQ,
    type,
    origin,
    typeBien,
    budgetMin,
    budgetMax,
    surfaceMin,
    surfaceMax,
  ]);

  const sorted = useMemo(() => {
    const items = [...filtered];
    items.sort((a, b) => {
      switch (sortKey) {
        case "oldest":
          return (a.created_ts ?? 0) - (b.created_ts ?? 0);
        case "price_asc":
          return (a.price_number ?? Infinity) - (b.price_number ?? Infinity);
        case "price_desc":
          return (b.price_number ?? -Infinity) - (a.price_number ?? -Infinity);
        case "newest":
        default:
          return (b.created_ts ?? 0) - (a.created_ts ?? 0);
      }
    });
    return items;
  }, [filtered, sortKey]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedQ, type, origin, typeBien, budgetMin, budgetMax, surfaceMin, surfaceMax, sortKey]);

  const visibleProjects = useMemo(
    () => sorted.slice(0, visibleCount),
    [sorted, visibleCount]
  );

  const resetFilters = () => {
    setQ("");
    setType("all");
    setOrigin("all");
    setTypeBien("all");
    setBudgetMin("");
    setBudgetMax("");
    setSurfaceMin("");
    setSurfaceMax("");
    setSortKey("newest");
  };

  /* ---------------------------------------------------------------------- */
  /*  SEO : canonical + JSON-LD                                             */
  /* ---------------------------------------------------------------------- */
  const ogImage = "https://livingroom.immo/og-place-des-projets.jpg";

  const itemListJsonLd = useMemo(() => {
    const list = (visibleProjects || []).slice(0, 24).map((p, idx) => {
      const projType = p.type_projet || "achat";
      const projOrigin = p.role || p.project_origin || "particulier";
      const url = `https://livingroom.immo/place-des-projets/${projOrigin}/${projType}/${p.id}/contact`;

      const city = p.city_choice_1 || p.city || p.ville || p.localisation || "";

      return {
        "@type": "ListItem",
        position: idx + 1,
        url,
        name: getTitle(p),
        ...(city
          ? { item: { "@type": "Thing", name: `${getTitle(p)} – ${city}` } }
          : {}),
      };
    });

    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Place des projets immobiliers",
      itemListElement: list,
    };
  }, [visibleProjects]);

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO
        title="Place des projets immobiliers | LivingRoom.immo"
        description="Découvrez des projets immobiliers (achat & vente) déposés par des particuliers et des professionnels. Filtrez par ville, budget, surface et typologie, puis contactez le porteur de projet."
        url={CANONICAL_URL}
        image={ogImage}
      />

      <Helmet>
        <link rel="canonical" href={CANONICAL_URL} />
        <script type="application/ld+json">{JSON.stringify(itemListJsonLd)}</script>
      </Helmet>

      <main className="container mx-auto px-4 py-10 md:py-14 max-w-6xl">
        {/* HEADER DE PAGE */}
        <section className="mb-8 md:mb-10">
          <div className="flex flex-col gap-4 md:gap-5">
            <div className="inline-flex items-center self-start rounded-full bg-white/80 border border-slate-200 px-3 py-1 text-[11px] sm:text-xs font-medium text-slate-700 shadow-sm">
              <MapPin className="w-3.5 h-3.5 mr-2 text-brand-blue" />
              Place des projets immobiliers
            </div>

            <div className="flex flex-col gap-3 md:gap-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-brand-blue">
                La Place des Projets
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-3xl">
                Explorez les projets immobiliers déposés par des particuliers et des
                professionnels, et présentez-vous en quelques clics aux projets qui
                correspondent à votre expertise.
              </p>

              {/* Badge debug discret (utile tant que tu stabilises la BDD) */}
              <div className="text-xs text-slate-500">
                Mode de chargement :{" "}
                <span className="font-medium text-slate-700">
                  {fetchMode === "strict"
                    ? "strict"
                    : fetchMode === "tolerant"
                    ? "tolérant"
                    : "échec"}
                </span>
                {debugHint ? <span className="ml-2">• {debugHint}</span> : null}
              </div>
            </div>
          </div>
        </section>

        {/* BLOC CTA PARTICULIER / PRO */}
        <section className="mb-10">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 sm:p-6 flex flex-col h-full">
              <div className="inline-flex items-center rounded-full bg-orange-50 text-orange-700 text-[11px] sm:text-xs font-semibold px-3 py-1 mb-3">
                <span className="w-2 h-2 rounded-full bg-orange-500 mr-2" />
                Pour les particuliers
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-brand-blue mb-2">
                Déposez votre projet en toute sérénité.
              </h2>
              <p className="text-sm sm:text-base text-gray-700 mb-4 flex-1">
                Déposez gratuitement et anonymement votre projet immobilier. Les
                professionnels se présentent à vous, et vous gardez le contrôle des
                contacts.
              </p>
              <Button
                onClick={() => navigate("/preciser-projet")}
                className="bg-brand-orange hover:bg-orange-600 text-white font-semibold rounded-full w-full sm:w-auto"
              >
                <Briefcase className="mr-2 h-4 w-4" />
                Déposer mon projet
              </Button>
            </div>

            <div className="rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-sm p-5 sm:p-6 flex flex-col h-full relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/80 via-slate-900 to-orange-700/70 opacity-90" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="inline-flex items-center rounded-full bg-white/10 text-blue-100 text-[11px] sm:text-xs font-semibold px-3 py-1 mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2" />
                  Pour les professionnels de l&apos;immobilier
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">
                  Accédez à des projets qualifiés.
                </h2>
                <p className="text-sm sm:text-base text-blue-100 mb-4 flex-1">
                  Présentez-vous à des projets concrets, portés par des particuliers
                  engagés. Ciblez votre secteur, vos typologies de biens et votre
                  niveau de mandat.
                </p>
                <Button
                  onClick={() => navigate("/pro-de-limmo")}
                  className="bg-white text-brand-blue hover:bg-blue-50 font-semibold rounded-full w-full sm:w-auto"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Rejoindre le réseau
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* FILTRES */}
        <section className="mb-8">
          <div className="rounded-3xl border border-slate-200 bg-white/90 backdrop-blur-sm p-4 sm:p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                <Filter className="w-4 h-4 text-brand-blue" />
                <span>Filtrer les projets</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-slate-600 hover:text-slate-900 px-2 h-8"
              >
                <XCircle className="mr-1.5 h-4 w-4" />
                Réinitialiser
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
              <div className="col-span-1 md:col-span-2 lg:col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  Rechercher
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Titre, ville, quartier..."
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  Type de projet
                </label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les projets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="achat">Achat</SelectItem>
                    <SelectItem value="vente">Vente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  Origine
                </label>
                <Select value={origin} onValueChange={setOrigin}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les origines" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="professionnel">Professionnel</SelectItem>
                    <SelectItem value="particulier">Particulier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  Type de bien
                </label>
                <Select value={typeBien} onValueChange={setTypeBien}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les biens" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="appartement">Appartement</SelectItem>
                    <SelectItem value="maison">Maison/Villa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  Budget min (€)
                </label>
                <Input
                  inputMode="numeric"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  placeholder="ex: 300000"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  Budget max (€)
                </label>
                <Input
                  inputMode="numeric"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  placeholder="ex: 900000"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  Surface min (m²)
                </label>
                <Input
                  inputMode="numeric"
                  value={surfaceMin}
                  onChange={(e) => setSurfaceMin(e.target.value)}
                  placeholder="ex: 50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  Surface max (m²)
                </label>
                <Input
                  inputMode="numeric"
                  value={surfaceMax}
                  onChange={(e) => setSurfaceMax(e.target.value)}
                  placeholder="ex: 120"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                <ListFilter className="w-4 h-4 text-slate-400" />
                <span>
                  {sorted.length} projet{sorted.length > 1 ? "s" : ""} trouvé
                  {sorted.length > 1 ? "s" : ""} après filtrage.
                </span>
              </div>

              <div className="w-full sm:w-auto sm:min-w-[200px]">
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  Trier par
                </label>
                <Select value={sortKey} onValueChange={setSortKey}>
                  <SelectTrigger>
                    <SelectValue placeholder="Trier les projets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Plus récents</SelectItem>
                    <SelectItem value="oldest">Plus anciens</SelectItem>
                    <SelectItem value="price_asc">Prix croissants</SelectItem>
                    <SelectItem value="price_desc">Prix décroissants</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        {/* Résumé + compteur visible */}
        <section className="mb-4">
          <div className="flex flex-wrap gap-2 justify-between items-center text-xs sm:text-sm text-gray-600">
            <div>
              {visibleProjects.length} projet{visibleProjects.length > 1 ? "s" : ""} affiché
              {visibleProjects.length > 1 ? "s" : ""} sur {sorted.length} résultat
              {sorted.length > 1 ? "s" : ""}.
            </div>
          </div>
        </section>

        {/* LISTE PROJETS */}
        <section>
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-12 rounded-3xl bg-white border border-dashed border-slate-200 text-gray-600">
              <p className="text-sm sm:text-base">
                Aucun projet ne remonte.
              </p>
              <p className="text-xs sm:text-sm mt-2 text-slate-500 max-w-2xl mx-auto">
                Si tu es admin : vérifie que la view <b>projects_marketplace_unified_all</b> est accessible en public
                (RLS), et que <b>status</b> / <b>visibility_public</b> ont bien les valeurs attendues
                (ex: status="active", visibility_public=true).
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Réinitialiser les filtres
                </Button>
                <Button variant="outline" size="sm" onClick={fetchProjects}>
                  Recharger
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleProjects.map((p) => (
                  <ProjectCard key={p.id} project={p} onConnect={handleConnect} />
                ))}
              </div>

              {visibleProjects.length < sorted.length && (
                <div className="flex justify-center mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    className="rounded-full px-6"
                  >
                    Charger plus de projets
                  </Button>
                </div>
              )}
            </>
          )}
        </section>

        {/* ✅ Petit texte SEO “visible” + maillage interne */}
        <section className="mt-14">
          <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-brand-blue mb-3">
              Projets immobiliers en temps réel : achat et vente
            </h2>
            <p className="text-slate-700 leading-relaxed">
              La Place des Projets LivingRoom centralise des projets immobiliers publics (achat et vente) déposés sur la
              plateforme. Filtrez par budget, surface, type de bien et localisation pour identifier les opportunités les
              plus pertinentes, puis prenez contact en quelques clics.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => navigate("/agents-immobiliers-par-ville")}
              >
                Voir les agents par ville
              </Button>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => navigate("/particuliers")}
              >
                Déposer un projet
              </Button>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => navigate("/pro-de-limmo")}
              >
                Découvrir l’offre Pro
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}