import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/lib/customSupabaseClient";
import ProjectCard from "@/components/marketplace/ProjectCard";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const FALLBACK_OG_IMAGE = "https://livingroom.immo/logo.png";

const buildCanonicalProjectUrl = (slug) => {
  const cardOrigin =
    (import.meta?.env?.VITE_PUBLIC_APP_ORIGIN || "").replace(/\/+$/, "") ||
    "https://livingroom.immo";

  const safeSlug = String(slug || "").trim();
  if (!safeSlug) return `${cardOrigin}/projet_immo`;

  return `${cardOrigin}/projet_immo/${encodeURIComponent(safeSlug)}`;
};

const pickProjectTitle = (project) => {
  return (
    String(project?.project_title || "").trim() ||
    String(project?.title || "").trim() ||
    "Projet immobilier"
  );
};

const pickProjectDescription = (project) => {
  const raw = String(
    project?.description ||
      project?.project_description ||
      project?.summary ||
      ""
  )
    .replace(/\s+/g, " ")
    .trim();

  if (!raw) {
    return "Découvrez ce projet immobilier sur LivingRoom.";
  }

  if (raw.length <= 155) return raw;
  return `${raw.slice(0, 152).trim()}...`;
};

const pickProjectOgImage = (project) => {
  return (
    String(project?.image_1_url || "").trim() ||
    String(project?.image_2_url || "").trim() ||
    String(project?.image_3_url || "").trim() ||
    String(project?.cover_image_url || "").trim() ||
    String(project?.main_image_url || "").trim() ||
    FALLBACK_OG_IMAGE
  );
};

const buildProjectSchema = (project, canonicalUrl) => {
  if (!project || !canonicalUrl) return null;

  const title = pickProjectTitle(project);
  const description = pickProjectDescription(project);
  const image = pickProjectOgImage(project);

  const schema = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: title,
    url: canonicalUrl,
    description,
    image,
  };

  const addressParts = [
    project?.city,
    project?.postal_code,
    project?.department,
    project?.region,
    project?.country,
  ]
    .map((v) => String(v || "").trim())
    .filter(Boolean);

  if (addressParts.length) {
    schema.address = {
      "@type": "PostalAddress",
      addressLocality: String(project?.city || "").trim() || undefined,
      postalCode: String(project?.postal_code || "").trim() || undefined,
      addressRegion:
        String(project?.region || "").trim() ||
        String(project?.department || "").trim() ||
        undefined,
      addressCountry: String(project?.country || "").trim() || "FR",
    };
  }

  const price =
    project?.price ??
    project?.budget ??
    project?.amount ??
    project?.listing_price ??
    null;

  if (price !== null && price !== undefined && String(price).trim() !== "") {
    schema.offers = {
      "@type": "Offer",
      price: Number(price),
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: canonicalUrl,
    };
  }

  return schema;
};

const StandaloneProjectPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchProject() {
      setLoading(true);
      setError(null);
      setProject(null);

      if (!slug) {
        setLoading(false);
        setError("Slug manquant.");
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from("projects_marketplace_unified_all")
          .select("*")
          .eq("slug", slug)
          .single();

        if (fetchError) throw fetchError;

        if (isMounted) {
          setProject(data || null);
        }
      } catch (err) {
        console.error("[StandaloneProjectPage] fetchProject error:", err);
        if (isMounted) {
          setError("Ce projet n'existe pas ou a été retiré.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchProject();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
      return;
    }
    navigate("/place-des-projets");
  };

  const meta = useMemo(() => {
    const baseTitle = pickProjectTitle(project);
    const description = pickProjectDescription(project);
    const ogImage = pickProjectOgImage(project);
    const canonicalUrl = buildCanonicalProjectUrl(slug);
    const title = `${baseTitle} - LivingRoom`;

    return {
      title,
      baseTitle,
      description,
      ogImage,
      canonicalUrl,
    };
  }, [project, slug]);

  const schema = useMemo(
    () => buildProjectSchema(project, meta.canonicalUrl),
    [project, meta.canonicalUrl]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <Helmet>
          <title>Projet introuvable - LivingRoom</title>
          <meta name="robots" content="noindex" />
        </Helmet>

        <div className="text-center max-w-md">
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Projet introuvable
          </h1>
          <p className="text-slate-600 mb-6">
            {error || "Ce projet n'existe pas ou a été retiré."}
          </p>
          <Button onClick={() => navigate("/place-des-projets")}>
            Retour à la Place des projets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Helmet>
        <title>{meta.title}</title>
        <link rel="canonical" href={meta.canonicalUrl} />
        <meta name="description" content={meta.description} />
        <meta name="robots" content="index,follow,max-image-preview:large" />

        <meta property="og:type" content="website" />
        <meta property="og:url" content={meta.canonicalUrl} />
        <meta property="og:title" content={meta.baseTitle} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:image" content={meta.ogImage} />
        <meta property="og:image:alt" content={meta.baseTitle} />
        <meta property="og:site_name" content="LivingRoom" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={meta.canonicalUrl} />
        <meta name="twitter:title" content={meta.baseTitle} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content={meta.ogImage} />

        {schema && (
          <script type="application/ld+json">
            {JSON.stringify(schema, null, 2)}
          </script>
        )}
      </Helmet>

      <div className="flex-grow container mx-auto px-4 py-6 sm:py-8 max-w-3xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="pl-0 hover:bg-transparent hover:text-brand-blue"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>

        <div className="w-full">
          <ProjectCard
            project={project}
            standalone
            onConnect={() =>
              navigate("/contact-project-gate", {
                state: { projectId: project.id, project },
              })
            }
            onConnectionRequest={() =>
              navigate("/contact-project-gate", {
                state: { projectId: project.id, project },
              })
            }
          />
        </div>
      </div>
    </div>
  );
};

export default StandaloneProjectPage;