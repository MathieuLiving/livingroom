// src/pages/ProfessionnelShowcasePage.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/customSupabaseClient";
import SEO from "@/components/SEO";
import { Loader2, ArrowLeft, Filter } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import ProfessionnelCard from "@/components/pro/ProfessionnelCard";
import { Card } from "@/components/ui/card.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select.jsx";
import ShowcaseProjectCard from "@/components/pro/ShowcaseProjectCard";

/* ---------- Mobile detector ---------- */
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(max-width: 640px)");
    const apply = () => setIsMobile(Boolean(mq?.matches));
    apply();
    mq?.addEventListener?.("change", apply);
    return () => mq?.removeEventListener?.("change", apply);
  }, []);
  return isMobile;
};
const isFilled = v => v !== undefined && v !== null && String(v).trim() !== "";
const getQP = (search, key) => {
  try {
    return new URLSearchParams(search || "").get(key);
  } catch {
    return null;
  }
};
const isAbsoluteUrl = u => /^https?:\/\//i.test((u || "").trim());

/**
 * ✅ Origine publique "carte" (domaine neutre)
 * - mets VITE_PUBLIC_CARD_ORIGIN=https://card.livingroom.immo si tu veux piloter
 */
const PUBLIC_CARD_ORIGIN = typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_PUBLIC_CARD_ORIGIN || "https://card.livingroom.immo";

/**
 * ✅ Construit les QS externes à propager : cvd=1&entry=external&premium=1
 */
const buildExternalQs = search => {
  try {
    const sp = new URLSearchParams(search || "");
    const cvd = (sp.get("cvd") || "").trim();
    const entry = (sp.get("entry") || "").trim();
    const premium = (sp.get("premium") || "").trim();

    // On propage uniquement si on est vraiment en contexte "carte"
    if (cvd !== "1" && entry !== "external") return "";
    const out = new URLSearchParams();
    out.set("cvd", "1");
    out.set("entry", "external");
    if (premium) out.set("premium", premium);
    return out.toString();
  } catch {
    return "";
  }
};

/**
 * ✅ Merge QS externes (ajoute seulement ceux absents)
 */
const mergeQs = (absUrl, extraQs) => {
  if (!extraQs) return absUrl;
  try {
    const u = new URL(absUrl);
    const extra = new URLSearchParams(extraQs);
    extra.forEach((val, key) => {
      if (!u.searchParams.has(key)) u.searchParams.set(key, val);
    });
    return u.toString();
  } catch {
    return absUrl;
  }
};

/**
 * ✅ Absolutisation "smart" :
 * - URL absolue => retourne tel quel (+ merge qs externe)
 * - URL relative => origin + path
 *   ⚠️ si /cvd/... et contexte externe => origin = PUBLIC_CARD_ORIGIN
 */
const toAbsSmart = (raw, {
  externalQs = ""
} = {}) => {
  const v0 = (raw || "").trim();
  if (!v0) return "";

  // déjà absolue
  if (isAbsoluteUrl(v0)) return mergeQs(v0, externalQs);

  // SSR safety
  if (typeof window === "undefined") return v0;
  const path = v0.startsWith("/") ? v0 : `/${v0}`;
  const isCvdPath = path.startsWith("/cvd/");
  const origin = isCvdPath && externalQs ? PUBLIC_CARD_ORIGIN : window.location.origin;
  return mergeQs(`${origin}${path}`, externalQs);
};

// ✅ Ce qu’on considère comme “URL de carte”
const isCardUrl = u => {
  const s = (u || "").trim();
  if (!s) return false;
  return s.includes("/carte-visite-digitale/") || s.includes("/livingroom/") || s.includes("/cvd/");
};
const inferTx = p => p.type_projet || (p.prix_demande != null || p.image_1_url ? "vente" : "achat");
const normalizeProject = (p, forcedTypeProjet) => {
  const typeProjet = forcedTypeProjet || p.type_projet || inferTx(p);
  return {
    ...p,
    type_projet: typeProjet,
    transaction_type: typeProjet,
    city: p.city_choice_1 || null,
    source: "professionnel",
    role: "professionnel",
    property_ad_link: p.pro_property_ad_link || p.property_ad_link || null
  };
};
const ProfessionnelShowcasePage = () => {
  const {
    professionnelId: professionnelIdParam,
    slug
  } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    toast
  } = useToast();
  const isMobile = useIsMobile();
  const viewQP = getQP(location.search, "view");
  const entryQP = getQP(location.search, "entry");
  const cvdQP = getQP(location.search, "cvd");
  const fromQP = getQP(location.search, "from");
  const navState = location.state || {};

  // ✅ QS externes propagées (incl premium=1 si présent)
  const externalQs = useMemo(() => buildExternalQs(location.search), [location.search]);

  // ✅ FIX CRITIQUE : lire returnTo depuis l'URL (querystring) en priorité
  const returnToQP = (getQP(location.search, "returnTo") || "").trim();
  const returnTo = (returnToQP || navState.returnTo || navState.from || "").trim();
  const fromPartnersList = useMemo(() => {
    return Boolean(navState.fromPartnersList) || navState.from === "partners-list" || fromQP === "partners-list";
  }, [navState, fromQP]);
  const fromDigitalCard = useMemo(() => {
    const qpFlag = cvdQP === "1" || entryQP === "external";
    const stateFlag = Boolean(navState.fromDigitalCard);
    const hasCardReturn = isCardUrl(returnTo);
    return stateFlag || qpFlag || hasCardReturn;
  }, [cvdQP, entryQP, navState.fromDigitalCard, returnTo]);
  const [resolvedProfessionnelId, setResolvedProfessionnelId] = useState((professionnelIdParam || "").trim() || "");
  const [pro, setPro] = useState(null);
  const [loadingPro, setLoadingPro] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projects, setProjects] = useState([]);
  const [city, setCity] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const fetchPro = useCallback(async () => {
    const pid = (professionnelIdParam || "").trim();
    const s = (slug || "").trim();
    if (!pid && !s) {
      setPro(null);
      setResolvedProfessionnelId("");
      setLoadingPro(false);
      return;
    }
    setLoadingPro(true);
    try {
      let data = null;
      if (pid) {
        const r1 = await supabase.from("professionnels_public").select("*").eq("id", pid).maybeSingle();
        if (!r1.error && r1.data) {
          data = r1.data;
        } else {
          const r2 = await supabase.from("professionnels").select("*").eq("id", pid).maybeSingle();
          if (!r2.error && r2.data) data = r2.data;else if (r1.error) throw r1.error;else if (r2.error) throw r2.error;
        }
      }
      if (!data && s) {
        const r1 = await supabase.from("professionnels_public").select("*").eq("card_slug", s).maybeSingle();
        if (!r1.error && r1.data) {
          data = r1.data;
        } else {
          const r2 = await supabase.from("professionnels").select("*").eq("card_slug", s).maybeSingle();
          if (!r2.error && r2.data) data = r2.data;else if (r1.error) throw r1.error;else if (r2.error) throw r2.error;
        }
      }
      if (!data) {
        setPro(null);
        setResolvedProfessionnelId("");
        return;
      }
      setPro(data);
      setResolvedProfessionnelId((data.id || "").trim());
    } catch (err) {
      console.error("[Showcase] fetch pro error:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les informations du professionnel."
      });
      setPro(null);
      setResolvedProfessionnelId("");
    } finally {
      setLoadingPro(false);
    }
  }, [professionnelIdParam, slug, toast]);
  const fetchShowcaseProjects = useCallback(async () => {
    const pid = (resolvedProfessionnelId || "").trim();
    if (!pid) {
      setProjects([]);
      setLoadingProjects(false);
      return;
    }
    setLoadingProjects(true);
    try {
      const buyingQuery = supabase.from("buying_projects_professionnel").select(`
          id,
          professionnel_id,
          created_at,
          updated_at,
          status,
          type_projet,
          type_bien,
          budget_max,
          surface_min,
          surface_max,
          bedrooms_min,
          delai,
          description,
          project_title,
          title,
          city_choice_1,
          quartier_choice_1,
          city_choice_2,
          quartier_choice_2,
          city_choice_3,
          quartier_choice_3,
          city_choice_4,
          quartier_choice_4,
          city_choice_5,
          quartier_choice_5,
          visibility_showcase,
          visibility_public,
          visibility_inter_agent,
          energy_consumption,
          co2_emission
        `).eq("professionnel_id", pid).eq("visibility_showcase", true).eq("status", "active");
      const sellingQuery = supabase.from("selling_projects_professionnel").select(`
          id,
          professionnel_id,
          created_at,
          updated_at,
          status,
          type_projet,
          type_bien,
          surface,
          bedrooms,
          image_1_url,
          image_2_url,
          image_3_url,
          prix_demande,
          delai,
          description,
          project_title,
          title,
          city_choice_1,
          quartier_choice_1,
          pro_property_ad_link,
          visibility_showcase,
          visibility_public,
          visibility_inter_agent,
          has_garden,
          has_terrace,
          has_balcony,
          has_pool,
          has_elevator,
          has_cellar,
          has_parking,
          has_caretaker,
          has_clear_view,
          is_last_floor,
          energy_consumption,
          co2_emission
        `).eq("professionnel_id", pid).eq("visibility_showcase", true).eq("status", "active");
      const [{
        data: buyingData,
        error: buyingError
      }, {
        data: sellingData,
        error: sellingError
      }] = await Promise.all([buyingQuery, sellingQuery]);
      if (buyingError) throw buyingError;
      if (sellingError) throw sellingError;
      const combined = [...(buyingData || []).map(p => normalizeProject(p, "achat")), ...(sellingData || []).map(p => normalizeProject(p, "vente"))].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setProjects(combined);
    } catch (err) {
      console.error("[Showcase] fetch projects error:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les projets partagés."
      });
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  }, [resolvedProfessionnelId, toast]);
  useEffect(() => {
    fetchPro();
  }, [fetchPro]);
  useEffect(() => {
    fetchShowcaseProjects();
  }, [fetchShowcaseProjects]);
  const mobileListOnly = useMemo(() => isMobile && viewQP === "list-only", [isMobile, viewQP]);
  useEffect(() => {
    if (mobileListOnly) {
      const el = document.querySelector("#liste");
      if (el) el.scrollIntoView({
        behavior: "smooth"
      });
    }
  }, [mobileListOnly, loadingProjects]);
  const cityOptions = useMemo(() => Array.from(new Set((projects || []).map(p => (p.city || "").trim()).filter(Boolean))).sort(), [projects]);
  const propertyTypeOptions = useMemo(() => Array.from(new Set((projects || []).map(p => (p.type_bien || "").trim()).filter(Boolean))).sort(), [projects]);
  const filtered = useMemo(() => {
    return (projects || []).filter(p => {
      const okCity = !city || city === "all" || (p.city || "").toLowerCase() === city.toLowerCase();
      const okTx = !transactionType || transactionType === "all" || (p.transaction_type || "").toLowerCase() === transactionType.toLowerCase();
      const okType = !propertyType || propertyType === "all" || (p.type_bien || "").toLowerCase() === propertyType.toLowerCase();
      return okCity && okTx && okType;
    });
  }, [projects, city, transactionType, propertyType]);
  const resetFilters = () => {
    setCity("");
    setTransactionType("");
    setPropertyType("");
  };
  const handleBack = useCallback(async () => {
    if (fromDigitalCard) {
      // 1) Si un returnTo explicite existe et pointe vers une carte => on le respecte
      if (isCardUrl(returnTo)) {
        window.location.assign(toAbsSmart(returnTo, {
          externalQs
        }));
        return;
      }

      // 2) Sinon on reconstruit une URL carte sûre (card.livingroom.immo/cvd/:slug + qs externes)
      const pid = (resolvedProfessionnelId || professionnelIdParam || "").trim();
      if (isFilled(pid)) {
        try {
          const {
            data
          } = await supabase.from("professionnels").select("digital_card_livingroom_url, card_slug").eq("id", pid).maybeSingle();
          const direct = (data?.digital_card_livingroom_url || "").trim();
          if (isFilled(direct)) {
            window.location.assign(toAbsSmart(direct, {
              externalQs
            }));
            return;
          }
          const slug2 = (data?.card_slug || "").trim();
          if (isFilled(slug2)) {
            window.location.assign(toAbsSmart(`/cvd/${encodeURIComponent(slug2)}`, {
              externalQs
            }));
            return;
          }
        } catch (e) {
          console.warn("[Showcase] back fetch card url failed:", e);
        }
      }

      // 3) Dernier recours
      navigate(-1);
      return;
    }
    if (fromPartnersList) {
      navigate("/nos-professionnels-partenaires");
      return;
    }
    navigate(-1);
  }, [fromDigitalCard, returnTo, externalQs, resolvedProfessionnelId, professionnelIdParam, fromPartnersList, navigate]);
  const backLabel = fromDigitalCard ? "Retour à la carte" : "Retour aux professionnels";
  if (loadingPro) {
    return <div className="container mx-auto px-4 py-10 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>;
  }
  if (!pro) {
    return <div className="container mx-auto px-4 py-10">
        <Button variant="ghost" onClick={() => {
        if (fromDigitalCard) navigate(-1);else navigate("/nos-professionnels-partenaires", {
          replace: true
        });
      }} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour
        </Button>

        <div className="p-6 border rounded-lg">
          <p>Ce professionnel est introuvable.</p>
        </div>
      </div>;
  }
  const FiltersAndList = <div id="liste">
      <h2 className="text-xl md:text-2xl font-bold text-brand-blue mb-2">
        Consulter mes recherches et ventes de biens
      </h2>
      <p className="text-gray-600 mb-4">
        Filtrez par ville, type de projet (achat/vente) et type de bien.
      </p>

      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3 md:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Ville</label>
            <Select value={city} onValueChange={value => setCity(value === "all" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les villes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {cityOptions.map(v => <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Type de projet</label>
            <Select value={transactionType} onValueChange={value => setTransactionType(value === "all" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Recherche ou Vente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="achat">Recherche</SelectItem>
                <SelectItem value="vente">Vente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Type de bien</label>
            <Select value={propertyType} onValueChange={value => setPropertyType(value === "all" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {propertyTypeOptions.map(t => <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" onClick={resetFilters} className="gap-2">
            <Filter className="w-4 h-4" /> Réinitialiser
          </Button>
        </div>
      </Card>

      {loadingProjects ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {Array.from({
        length: 4
      }).map((_, i) => <Card key={i} className="p-4">
              <Skeleton className="h-48 w-full" />
            </Card>)}
        </div> : filtered.length === 0 ? <Card className="p-6 text-center text-gray-600">
          Aucun projet ne correspond à vos filtres.
        </Card> : <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {filtered.map(project => <ShowcaseProjectCard key={project.id} project={project} professional={pro} />)}
        </div>}
    </div>;
  const proName = `${pro.first_name || ""} ${pro.last_name || ""}`.trim();
  return <>
      <SEO title={`Vitrine de ${proName || "Professionnel"}`} description={`Découvrez les projets d'achat et de vente proposés par ${proName || "ce professionnel"}, professionnel partenaire de LivingRoom.immo.`} />

      <div className="container mx-auto px-4 py-10">
        <Button variant="ghost" onClick={handleBack} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {backLabel}
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="hidden lg:block lg:col-span-1 lg:sticky top-10">
            <ProfessionnelCard professionnel={pro} />
          </div>

          <div className="col-span-1 lg:col-span-2">
            {FiltersAndList}

            <div className="mt-8 pt-6 border-t flex justify-start">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {backLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>;
};
export default ProfessionnelShowcasePage;