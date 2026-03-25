import React, {
  useEffect,
  useMemo,
  useState,
  memo,
  useRef,
} from "react";
import { supabase } from "@/lib/customSupabaseClient";
import {
  MapPin,
  Star,
  TrendingDown,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

const isFilled = (v) =>
  v !== undefined && v !== null && String(v).trim() !== "";

const normalize = (v) => String(v || "").trim().toLowerCase();

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return null;

  const n = Number(value);
  if (!Number.isFinite(n)) return null;

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
};

const normalizeRpcProjectType = (type) => {
  const v = normalize(type);
  if (v === "vente" || v === "selling") return "vente";
  if (v === "achat" || v === "buying") return "achat";
  return "";
};

const projectTypeLabel = (type) => {
  const v = normalize(type);
  if (v === "achat") return "Recherche";
  if (v === "vente") return "Vente";
  return "Projet";
};

const propertyTypeLabel = (type) => {
  const types = {
    appartement: "Appartement",
    maison_villa: "Maison / Villa",
    "maison/villa": "Maison / Villa",
    loft_atelier_surface: "Loft / Atelier",
    parking_box: "Parking / Box",
    terrain: "Terrain",
    autre: "Autre",
  };

  return types[normalize(type)] || type || "";
};

const projectLocation = (project) => {
  const city =
    project?.city_choice_1 ||
    project?.city ||
    project?.location?.city ||
    "";

  const quartier =
    project?.quartier_choice_1 ||
    project?.quartier ||
    project?.location?.quartier ||
    "";

  if (city && quartier) return `${city} (${quartier})`;
  return city || quartier || "";
};

const projectPrice = (project) => {
  if (!project) return null;
  if (normalize(project?.type_projet) === "achat") {
    return formatCurrency(project?.budget_max);
  }
  return formatCurrency(project?.prix_demande ?? project?.price);
};

function FeaturedProjectsSectionComponent({
  professionnelId,
  accentColor = "#F89223",
  secondaryColor = "#22577A",
  onOpenAll,
  onOpenProject,
  initialProjects = null,
}) {
  const containerRef = useRef(null);

  const [shouldLoad, setShouldLoad] = useState(
    Array.isArray(initialProjects)
  );
  const [projects, setProjects] = useState(
    Array.isArray(initialProjects) ? initialProjects : []
  );
  const [loading, setLoading] = useState(!Array.isArray(initialProjects));

  useEffect(() => {
    if (Array.isArray(initialProjects)) {
      setProjects(initialProjects);
      setLoading(false);
      setShouldLoad(true);
    }
  }, [initialProjects]);

  useEffect(() => {
    if (shouldLoad) return;

    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: "200px 0px",
        threshold: 0.01,
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [shouldLoad]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (Array.isArray(initialProjects)) {
        if (!cancelled) {
          setLoading(false);
        }
        return;
      }

      if (!shouldLoad) return;

      if (!professionnelId) {
        if (!cancelled) {
          setProjects([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        const { data: keys, error: keysError } = await supabase.rpc(
          "get_featured_projects_for_professionnel",
          { p_professionnel_id: professionnelId }
        );

        if (keysError) throw keysError;

        const featuredKeys = Array.isArray(keys)
          ? keys
              .map((item) => ({
                ...item,
                project_type: normalizeRpcProjectType(item?.project_type),
              }))
              .filter(
                (item) =>
                  isFilled(item?.project_id) && isFilled(item?.project_type)
              )
          : [];

        if (!featuredKeys.length) {
          if (!cancelled) {
            setProjects([]);
            setLoading(false);
          }
          return;
        }

        const achatIds = featuredKeys
          .filter((x) => x.project_type === "achat")
          .map((x) => x.project_id);

        const venteIds = featuredKeys
          .filter((x) => x.project_type === "vente")
          .map((x) => x.project_id);

        const [buyRes, sellRes] = await Promise.all([
          achatIds.length
            ? supabase
                .from("buying_projects_professionnel")
                .select("*")
                .in("id", achatIds)
            : Promise.resolve({ data: [], error: null }),

          venteIds.length
            ? supabase
                .from("selling_projects_professionnel")
                .select("*")
                .in("id", venteIds)
            : Promise.resolve({ data: [], error: null }),
        ]);

        if (buyRes.error) {
          console.error("[FeaturedProjectsSection] buyRes error:", buyRes.error);
          throw buyRes.error;
        }

        if (sellRes.error) {
          console.error(
            "[FeaturedProjectsSection] sellRes error:",
            sellRes.error
          );
          throw sellRes.error;
        }

        const buyMap = new Map(
          (buyRes.data || []).map((p) => [p.id, { ...p, type_projet: "achat" }])
        );

        const sellMap = new Map(
          (sellRes.data || []).map((p) => [p.id, { ...p, type_projet: "vente" }])
        );

        const ordered = featuredKeys
          .map((k) => {
            if (k.project_type === "achat") {
              return buyMap.get(k.project_id) || null;
            }
            if (k.project_type === "vente") {
              return sellMap.get(k.project_id) || null;
            }
            return null;
          })
          .filter(Boolean)
          .slice(0, 2);

        if (!cancelled) {
          setProjects(ordered);
          setLoading(false);
        }
      } catch (error) {
        console.error("[FeaturedProjectsSection] load error:", {
          professionnelId,
          error,
        });

        if (!cancelled) {
          setProjects([]);
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [professionnelId, shouldLoad, initialProjects]);

  const hasProjects = useMemo(() => projects.length > 0, [projects]);

  return (
    <div ref={containerRef}>
      {loading || !hasProjects ? null : (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Star
                className="h-4 w-4 shrink-0"
                style={{ color: accentColor, fill: accentColor }}
              />
              <h3 className="text-sm font-semibold text-slate-900">
                Opportunités à la une
              </h3>
            </div>

            <button
              type="button"
              onClick={onOpenAll}
              className="inline-flex shrink-0 items-center gap-1 text-xs font-medium hover:underline"
              style={{ color: secondaryColor }}
            >
              Voir toutes
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {projects.map((project) => {
              const title = project?.project_title || project?.title || "Projet";
              const location = projectLocation(project);
              const price = projectPrice(project);
              const tx = normalize(project?.type_projet);
              const typeLabel = projectTypeLabel(tx);
              const assetLabel = propertyTypeLabel(project?.type_bien);

              return (
                <button
                  key={`${tx}-${project.id}`}
                  type="button"
                  onClick={() => onOpenProject?.(project)}
                  className="group w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={[
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                        tx === "vente"
                          ? "bg-red-50 text-red-700"
                          : "bg-emerald-50 text-emerald-700",
                      ].join(" ")}
                    >
                      {tx === "vente" ? (
                        <TrendingDown className="h-3 w-3" />
                      ) : (
                        <TrendingUp className="h-3 w-3" />
                      )}
                      {typeLabel}
                    </span>

                    {isFilled(price) && (
                      <span className="text-xs font-semibold text-slate-800">
                        {price}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-start justify-between gap-2">
                    <div className="line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-slate-950">
                      {title}
                    </div>
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 group-hover:text-slate-600" />
                  </div>

                  <div className="mt-1 flex items-center gap-1 text-xs text-slate-600">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="line-clamp-1">
                      {[location, assetLabel].filter(Boolean).join(" • ")}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const FeaturedProjectsSection = memo(FeaturedProjectsSectionComponent);
export default FeaturedProjectsSection;