import React, { useState, useEffect, useMemo } from "react";
import {
  useParams,
  useSearchParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, Star } from "lucide-react";

import { supabase } from "@/lib/customSupabaseClient";
import { useToast } from "@/components/ui/use-toast";
import ShowcaseProjectCard from "@/components/pro/ShowcaseProjectCard";
import ProfessionnelCard from "@/components/pro/ProfessionnelCard";
import SEO from "@/components/SEO";

const PUBLIC_PRO_SELECT = `
  id,
  user_id,
  professionnel_id,
  card_slug,
  first_name,
  last_name,
  email,
  phone,
  function,
  professionnal_presentation,
  scope_intervention_choice_1,
  scope_intervention_choice_2,
  scope_intervention_choice_3,
  agency_id,
  agency_role,
  agency_name,
  is_agency_member,
  avatar_url,
  avatar_path,
  logo_url,
  logo_path,
  appointment_url,
  agency_website_url,
  customer_review_url,
  linkedin_url,
  facebook_url,
  instagram_url,
  youtube_url,
  tiktok_url,
  video_url,
  video_external_url,
  video_storage_path,
  video_preferred_source,
  effective_company_name,
  effective_logo_url,
  effective_logo_path,
  effective_website_url,
  effective_customer_review_url,
  effective_linkedin_url,
  effective_facebook_url,
  effective_instagram_url,
  effective_youtube_url,
  effective_tiktok_url,
  effective_video_url,
  effective_video_external_url,
  effective_video_storage_path,
  effective_video_preferred_source,
  card_banner_color,
  card_text_color,
  card_primary_button_color,
  card_secondary_button_color,
  card_name_color,
  card_signature_color,
  card_company_name_color,
  card_support_text_color,
  card_qr_fg_color,
  qr_code_with_logo,
  effective_card_banner_color,
  effective_card_text_color,
  effective_card_primary_button_color,
  effective_card_secondary_button_color,
  effective_card_name_color,
  effective_card_signature_color,
  effective_card_company_name_color,
  effective_card_support_text_color,
  effective_card_qr_fg_color,
  effective_qr_code_with_logo,
  digital_card_livingroom_url
`;

const normalize = (v) => String(v || "").trim().toLowerCase();

const normalizeRpcProjectType = (type) => {
  const v = normalize(type);
  if (v === "vente" || v === "selling") return "vente";
  return "achat";
};

async function fetchPublicProfessionalBySlug(slug) {
  const sources = [
    "professionnels_public",
    "professionnels_partner_page_public",
  ];

  for (const table of sources) {
    const { data, error } = await supabase
      .from(table)
      .select(PUBLIC_PRO_SELECT)
      .eq("card_slug", slug)
      .limit(1);

    if (error) {
      console.error(
        `[ProfessionnelFeaturedProjectsPage] source error (${table})`,
        error
      );
      continue;
    }

    if (Array.isArray(data) && data.length) {
      return data[0];
    }
  }

  const { data, error } = await supabase
    .from("professionnels")
    .select("*")
    .eq("card_slug", slug)
    .eq("is_public", true)
    .limit(1);

  if (error) throw error;
  return Array.isArray(data) && data.length ? data[0] : null;
}

async function fetchFeaturedProjectsForPro(professionnelId) {
  const { data: keys, error: keysError } = await supabase.rpc(
    "get_featured_projects_for_professionnel",
    { p_professionnel_id: professionnelId }
  );

  if (keysError) throw keysError;

  const featuredKeys = Array.isArray(keys)
    ? keys
        .filter((item) => {
          if (typeof item?.is_active === "boolean") {
            return item.is_active === true;
          }
          return true;
        })
        .map((item) => ({
          ...item,
          project_type: normalizeRpcProjectType(item?.project_type),
        }))
    : [];

  if (!featuredKeys.length) return [];

  const achatIds = featuredKeys
    .filter((x) => x.project_type === "achat")
    .map((x) => x.project_id)
    .filter(Boolean);

  const venteIds = featuredKeys
    .filter((x) => x.project_type === "vente")
    .map((x) => x.project_id)
    .filter(Boolean);

  const [buyRes, sellRes] = await Promise.all([
    achatIds.length
      ? supabase
          .from("buying_projects_professionnel")
          .select("*")
          .in("id", achatIds)
          .eq("status", "active")
      : Promise.resolve({ data: [], error: null }),

    venteIds.length
      ? supabase
          .from("selling_projects_professionnel")
          .select("*")
          .in("id", venteIds)
          .eq("status", "active")
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (buyRes.error) throw buyRes.error;
  if (sellRes.error) throw sellRes.error;

  const buyMap = new Map(
    (buyRes.data || []).map((p) => [p.id, { ...p, type_projet: "achat" }])
  );

  const sellMap = new Map(
    (sellRes.data || []).map((p) => [p.id, { ...p, type_projet: "vente" }])
  );

  return featuredKeys
    .map((k) => {
      if (k.project_type === "achat") {
        return buyMap.get(k.project_id) || null;
      }
      return sellMap.get(k.project_id) || null;
    })
    .filter(Boolean);
}

const ProfessionnelFeaturedProjectsPage = () => {
  const { slug, card_slug } = useParams();
  const resolvedSlug = slug || card_slug || "";
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [professional, setProfessional] = useState(null);
  const [projects, setProjects] = useState([]);

  const returnTo = searchParams.get("returnTo");
  const isFromDigitalCard =
    searchParams.get("cvd") === "1" ||
    searchParams.get("entry") === "external";

  useEffect(() => {
    let isMounted = true;

    const fetchProfessionalAndProjects = async () => {
      if (!resolvedSlug) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const proData = await fetchPublicProfessionalBySlug(resolvedSlug);

        if (!proData) {
          if (isMounted) {
            setProfessional(null);
            setProjects([]);
            setLoading(false);
          }
          return;
        }

        const proId = proData?.professionnel_id || proData?.id || null;
        const featuredProjects = proId
          ? await fetchFeaturedProjectsForPro(proId)
          : [];

        if (isMounted) {
          setProfessional(proData);
          setProjects(featuredProjects);
        }
      } catch (error) {
        console.error(
          "[ProfessionnelFeaturedProjectsPage] Error fetching featured projects:",
          error
        );
        if (isMounted) {
          toast({
            variant: "destructive",
            title: "Erreur",
            description: "Impossible de charger les projets à la une.",
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProfessionalAndProjects();

    return () => {
      isMounted = false;
    };
  }, [resolvedSlug, toast]);

  const handleBack = () => {
    if (returnTo) {
      navigate(returnTo);
      return;
    }

    if (resolvedSlug) {
      const suffix = isFromDigitalCard ? "?cvd=1&entry=external" : "";
      navigate(`/cvd/${resolvedSlug}${suffix}`);
      return;
    }

    navigate("/");
  };

  const handleOpenProject = (project) => {
    const tx = project?.type_projet;
    const id = project?.id;
    if (!tx || !id || !resolvedSlug) return;

    const sp = new URLSearchParams(location.search || "");
    sp.set("returnTo", `${location.pathname}${location.search || ""}`);

    navigate(
      `/pro/${encodeURIComponent(
        resolvedSlug
      )}/opportunites/${encodeURIComponent(tx)}/${encodeURIComponent(
        id
      )}?${sp.toString()}`,
      {
        state: {
          projectSnapshot: project,
          cardReturnTo: returnTo || "",
        },
      }
    );
  };

  const proName = useMemo(() => {
    const name = `${professional?.first_name || ""} ${
      professional?.last_name || ""
    }`.trim();
    return name || "Professionnel";
  }, [professional?.first_name, professional?.last_name]);

  const seoTitle = `Opportunités à la une - ${proName}`;
  const seoDescription = `Découvrez les opportunités immobilières mises en avant par ${proName}.`;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-1 flex-col items-center justify-center">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
        <p className="text-slate-500">Chargement des opportunités...</p>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="flex min-h-[60vh] flex-1 flex-col items-center justify-center px-4 text-center">
        <h2 className="mb-2 text-2xl font-bold text-slate-800">
          Professionnel introuvable
        </h2>
        <p className="mb-6 text-slate-500">
          Le profil que vous recherchez n&apos;existe pas ou a été supprimé.
        </p>
        <button
          onClick={() => navigate("/")}
          className="rounded-md bg-primary px-6 py-2 text-white transition-colors hover:bg-primary/90"
        >
          Retour à l&apos;accueil
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO title={seoTitle} description={seoDescription} />

      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <button
            onClick={handleBack}
            className="flex items-center text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au profil
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-8 lg:flex-row">
          <div className="hidden w-full shrink-0 lg:sticky lg:top-24 lg:block lg:w-[350px]">
            <ProfessionnelCard
              professionnel={professional}
              origin={isFromDigitalCard ? "digital-card" : "featured-projects"}
            />
          </div>

          <div className="w-full flex-1">
            <div className="mb-6">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                <Star className="h-4 w-4 fill-current" />
                Opportunités à la une
              </div>

              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Opportunités à la une
              </h1>
              <p className="mt-2 text-slate-500">
                Sélection de projets immobiliers proposés par {proName}.
              </p>
            </div>

            {projects.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <Star className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="mb-2 text-lg font-medium text-slate-900">
                  Aucune opportunité mise en avant pour le moment
                </h3>
                <p className="mx-auto max-w-md text-slate-500">
                  Ce professionnel n&apos;a pas encore ajouté de projets à sa
                  sélection.
                </p>
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.08 }}
              >
                {projects.map((project, index) => (
                  <motion.div
                    key={project.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.04 }}
                    className="h-full cursor-pointer"
                    onClick={() => handleOpenProject(project)}
                  >
                    <ShowcaseProjectCard
                      project={project}
                      professional={professional}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionnelFeaturedProjectsPage;