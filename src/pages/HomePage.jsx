import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Users,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Lock,
  UserCheck,
  FileCheck2,
} from "lucide-react";
import SEO from "@/components/SEO";
import { supabase } from "@/lib/customSupabaseClient";
import ProjectCard from "@/components/marketplace/ProjectCard";
import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_OG_IMAGE =
  "https://horizons-cdn.hostinger.com/f7eb5659-bed0-4bf7-847c-ea6067478f08/ea48c24ff95caccf8a26866969660af6.jpg";
const CANONICAL_URL = "https://livingroom.immo/";

// Images
const AGENCY_HERO_IMAGE_CDN_URL =
  "https://horizons-cdn.hostinger.com/f7eb5659-bed0-4bf7-847c-ea6067478f08/14a93870234860918b84e4f10cec2344.jpg";
const AGENCY_HERO_IMAGE_ALT = "Équipe professionnelle en réunion d'agence";
const AGENCY_HERO_IMAGE_PICTURE_ID = "agency_network_hero";

const PARTICULIER_IMAGE_CDN_URL =
  "https://horizons-cdn.hostinger.com/f7eb5659-bed0-4bf7-847c-ea6067478f08/98f7df34851948bc7602e32fe8c4b921.jpg";
const PARTICULIER_IMAGE_ALT = "Couple consultant un projet immobilier";
const PARTICULIER_IMAGE_PICTURE_ID = "98f7df34851948bc7602e32fe8c4b921";

function useProjectsPerView() {
  const [ppv, setPpv] = useState(() => {
    if (typeof window === "undefined") return 3;
    const w = window.innerWidth;
    if (w < 640) return 1;
    if (w < 1024) return 2;
    return 3;
  });

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      setPpv(w < 640 ? 1 : w < 1024 ? 2 : 3);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return ppv;
}

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
  ].filter(Boolean);

  let origin = "particulier";

  for (const c of candidates) {
    const s = String(c).toLowerCase().trim();
    if (s.includes("professionnel") || s === "professional" || s === "pro") {
      origin = "professionnel";
      break;
    }
  }

  const roleLabel = origin === "professionnel" ? "Professionnel" : "Particulier";
  const isProBool = origin === "professionnel";

  return {
    ...p,
    project_origin: origin,
    role: origin,
    origin: roleLabel,
    role_label: roleLabel,
    is_professional: isProBool,
    isProfessional: isProBool,
    isPro: isProBool,
    source: origin,
  };
}

const LoopingProjectsCarousel = ({ projects, loading }) => {
  const projectsPerView = useProjectsPerView();
  const [[page, direction], setPage] = useState([0, 0]);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(null);
  const containerRef = useRef(null);

  const groupedProjects = useMemo(() => {
    if (!projects || projects.length === 0) return [];
    const groups = [];
    for (let i = 0; i < projects.length; i += projectsPerView) {
      groups.push(projects.slice(i, i + projectsPerView));
    }
    return groups;
  }, [projects, projectsPerView]);

  const currentIndex = useMemo(() => {
    if (groupedProjects.length === 0) return 0;
    return (page % groupedProjects.length + groupedProjects.length) % groupedProjects.length;
  }, [page, groupedProjects.length]);

  const paginate = useCallback((newDirection) => {
    setPage(([prevPage]) => [prevPage + newDirection, newDirection]);
  }, []);

  useEffect(() => {
    if (groupedProjects.length <= 1 || isPaused) return;

    const handleVisibility = () => setIsPaused(document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);

    const id = setInterval(() => paginate(1), 5000);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [groupedProjects.length, isPaused, paginate]);

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return;
    paginate(delta > 0 ? -1 : 1);
  };

  const variants = {
    enter: (dir) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir) => ({
      zIndex: 0,
      x: dir < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
  };

  if (loading) {
    return (
      <div className="flex justify-center gap-4 sm:gap-6 overflow-hidden mt-6 sm:mt-12 px-2">
        {[...Array(projectsPerView)].map((_, i) => (
          <Skeleton
            key={i}
            className="w-[17.5rem] sm:w-80 h-[420px] sm:h-[520px] md:h-[600px] rounded-2xl flex-shrink-0"
          />
        ))}
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return <div className="text-center py-10 text-gray-500">Aucun projet à afficher pour le moment.</div>;
  }

  return (
    <div
      ref={containerRef}
      className="relative mt-6 sm:mt-8 px-2 md:px-12"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="w-full overflow-hidden relative h-[420px] sm:h-[550px] md:h-[620px]">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={page}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="absolute inset-0 flex w-full justify-center gap-4 sm:gap-6"
          >
            {(groupedProjects[currentIndex] || []).map((project, idx) => (
              <div key={`${project.id}-${idx}`} className="w-[18rem] sm:w-80 flex-shrink-0 h-full pb-4">
                <ProjectCard project={project} hideOwnership={true} />
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {groupedProjects.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Projets précédents"
            onClick={() => paginate(-1)}
            className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 items-center justify-center h-12 w-12 rounded-full bg-white hover:bg-slate-50 shadow-lg border border-slate-100 z-10 transition-transform hover:scale-105"
          >
            <ChevronLeft className="h-6 w-6 text-slate-700" />
          </button>

          <button
            type="button"
            aria-label="Prochains projets"
            onClick={() => paginate(1)}
            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 items-center justify-center h-12 w-12 rounded-full bg-white hover:bg-slate-50 shadow-lg border border-slate-100 z-10 transition-transform hover:scale-105"
          >
            <ChevronRight className="h-6 w-6 text-slate-700" />
          </button>

          <div className="mt-4 flex items-center justify-center gap-2">
            {groupedProjects.map((_, i) => (
              <button
                key={i}
                onClick={() => setPage([i, i > currentIndex ? 1 : -1])}
                aria-label={`Aller au slide ${i + 1}`}
                className={`h-2 rounded-full transition-all ${
                  i === currentIndex ? "w-6 bg-brand-blue" : "w-2 bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const HomePage = () => {
  const [images, setImages] = useState({});
  const [latestProjects, setLatestProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      const { data, error } = await supabase
        .from("picture_website")
        .select("picture_id, picture_url, picture_name")
        .in("picture_id", [
          "hero_background",
          PARTICULIER_IMAGE_PICTURE_ID,
          "pro_sign",
          AGENCY_HERO_IMAGE_PICTURE_ID,
        ]);

      if (error) {
        console.error("Error fetching images:", error);
        return;
      }

      const imageMap = (data || []).reduce((acc, img) => {
        acc[img.picture_id] = {
          url: img.picture_url,
          alt: img.picture_name,
        };
        return acc;
      }, {});

      setImages(imageMap);
    };

    const fetchLatestProjects = async () => {
      setProjectsLoading(true);

      const { data, error } = await supabase
        .from("projects_marketplace_unified_all")
        .select("*")
        .eq("status", "active")
        .eq("visibility_public", true)
        .order("created_at", { ascending: false })
        .limit(15);

      if (error) {
        console.error("Error fetching latest projects:", error);
      } else {
        setLatestProjects((data || []).map(normalizeProjectOrigin));
      }

      setProjectsLoading(false);
    };

    fetchImages();
    fetchLatestProjects();
  }, []);

  const heroImage = images.hero_background;

  const particulierImage = images[PARTICULIER_IMAGE_PICTURE_ID] || {
    url: PARTICULIER_IMAGE_CDN_URL,
    alt: PARTICULIER_IMAGE_ALT,
  };

  const proImage = images.pro_sign;
  const agencyImage = images[AGENCY_HERO_IMAGE_PICTURE_ID] || {
    url: AGENCY_HERO_IMAGE_CDN_URL,
    alt: AGENCY_HERO_IMAGE_ALT,
  };

  const ogImage = heroImage?.url || DEFAULT_OG_IMAGE;

  const websiteJsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "LivingRoom.immo",
      url: "https://livingroom.immo/",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://livingroom.immo/place-des-projets?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    }),
    []
  );

  const organizationJsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "LivingRoom",
      url: "https://livingroom.immo/",
      logo: ogImage,
    }),
    [ogImage]
  );

  const breadcrumbJsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Accueil",
          item: "https://livingroom.immo/",
        },
      ],
    }),
    []
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <SEO
        title="Plateforme de matching immobilier entre particuliers et professionnels"
        description="LivingRoom connecte acheteurs, vendeurs et professionnels de l’immobilier grâce à un matching intelligent. Déposez votre projet, recevez des propositions qualifiées et trouvez le bon expert."
        canonicalUrl={CANONICAL_URL}
        ogImage={ogImage}
        schema={[websiteJsonLd, organizationJsonLd, breadcrumbJsonLd]}
      />

      <header className="relative text-white overflow-hidden min-h-[620px] sm:min-h-[600px] h-[92svh] sm:h-[85vh] flex items-center justify-center">
        {heroImage ? (
          <img
            src={heroImage.url}
            alt={heroImage.alt || "LivingRoom – matching immobilier"}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-slate-800" />
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/55 to-slate-900/85" />

        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 text-center pb-0 sm:pb-0">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-[11px] sm:text-sm font-bold tracking-widest uppercase text-brand-orange mb-3 sm:mb-4">
              Plateforme de matching immobilier
            </p>

            <h1 className="text-2xl leading-[1.1] sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-5 sm:mb-6 drop-shadow-lg">
              Première plateforme de matching immobilier
              <br className="hidden md:block" /> entre particuliers et professionnels
            </h1>

            <p className="max-w-3xl mx-auto text-base sm:text-xl md:text-2xl text-slate-100 mb-6 sm:mb-8 leading-relaxed drop-shadow-md font-semibold">
              Votre projet immobilier mérite les meilleurs professionnels. Sans démarchage, sans perte de temps.
            </p>

            <p className="max-w-2xl mx-auto text-base sm:text-xl text-slate-100 mb-8 sm:mb-10 leading-relaxed drop-shadow-md">
              Déposez votre projet, recevez des propositions qualifiées.
              <br />
              Simple, discret et terriblement efficace.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto bg-brand-orange hover:bg-orange-600 text-white font-bold text-base sm:text-lg px-8 py-6 rounded-full shadow-xl shadow-orange-900/20"
              >
                <Link to="/preciser-projet">Préciser mon projet</Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-brand-blue font-bold text-base sm:text-lg px-8 py-6 rounded-full bg-transparent backdrop-blur-sm"
              >
                <Link to="/pro-de-limmo">Je suis un professionnel</Link>
              </Button>
            </div>

            <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm font-medium text-slate-200">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-brand-orange" />
                <span>Professionnels vérifiés</span>
              </div>
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-brand-orange" />
                <span>Profils authentifiés</span>
              </div>
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-brand-orange" />
                <span>Annonces contrôlées</span>
              </div>
            </div>

            <div className="mt-7 sm:mt-10 px-2">
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-center gap-2 sm:gap-3 text-sm">
                <Link
                  to="/nos-professionnels-partenaires"
                  className="text-center rounded-full bg-white/10 border border-white/15 px-3 py-2 hover:bg-white/15 transition"
                >
                  Trouver un agent
                </Link>

                <Link
                  to="/place-des-projets"
                  className="text-center rounded-full bg-white/10 border border-white/15 px-3 py-2 hover:bg-white/15 transition"
                >
                  Explorer les projets
                </Link>

                <Link
                  to="/preciser-projet"
                  className="text-center rounded-full bg-white/10 border border-white/15 px-3 py-2 hover:bg-white/15 transition"
                >
                  Préciser mon projet
                </Link>

                <Link
                  to="/particuliers"
                  className="col-span-2 sm:col-auto text-center rounded-full bg-white/10 border border-white/15 px-3 py-2 hover:bg-white/10 transition"
                >
                  Acheter et vendre
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      <main className="flex-grow">
        <section className="py-16 md:py-24 bg-slate-50 relative overflow-hidden">
          <div className="container mx-auto px-4 max-w-7xl relative z-10">
            <div className="text-center mb-10">
              <div className="inline-flex items-center rounded-full bg-white border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-600 shadow-sm mb-4">
                <Users className="w-4 h-4 mr-2 text-brand-blue" />
                En direct du marché
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-brand-blue mb-4">
                Les derniers projets immobiliers
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Découvrez en temps réel les recherches de bien et les projets de vente déposés sur LivingRoom.
              </p>
            </div>

            <LoopingProjectsCarousel projects={latestProjects} loading={projectsLoading} />

            <div className="mt-12 text-center">
              <Button
                asChild
                size="lg"
                variant="outline"
                className="px-8 py-6 rounded-full border-2 border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white text-base font-bold transition-all"
              >
                <Link to="/place-des-projets">Explorer tous les projets</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <span className="text-brand-orange font-bold tracking-wider text-sm uppercase mb-2 block">
                  Particuliers
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-brand-blue mb-6">
                  Le choix vous appartient.
                </h2>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  Fini le démarchage téléphonique intempestif. Sur LivingRoom, vous déposez votre projet et ce sont les professionnels pertinents qui vous proposent leur accompagnement. Vous restez maître de vos contacts.
                </p>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-brand-orange">
                      <FileCheck2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-brand-blue text-lg">Projet qualifié</h3>
                      <p className="text-slate-600">
                        Un formulaire intelligent vous aide à structurer votre projet pour attirer les bons experts.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-brand-orange">
                      <Lock className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-brand-blue text-lg">Confidentialité</h3>
                      <p className="text-slate-600">
                        Vous choisissez le professionnel à qui vous souhaitez transmettre vos coordonnées.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex flex-col sm:flex-row gap-3">
                  <Button
                    asChild
                    size="lg"
                    className="bg-brand-orange hover:bg-orange-600 text-white rounded-full px-8 py-6 text-lg font-bold"
                  >
                    <Link to="/preciser-projet">Préciser mon projet</Link>
                  </Button>

                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-full px-8 py-6 text-lg font-bold border-2 border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white"
                  >
                    <Link to="/particuliers">Espace particuliers</Link>
                  </Button>
                </div>
              </div>

              <div className="order-1 md:order-2">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] group">
                  {particulierImage ? (
                    <img
                      src={particulierImage.url}
                      alt={particulierImage.alt || PARTICULIER_IMAGE_ALT}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-200 animate-pulse" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-slate-50 border-t border-slate-200">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] group">
                  {proImage ? (
                    <img
                      src={proImage.url}
                      alt={proImage.alt || "Agent immobilier professionnel"}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-200 animate-pulse" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60" />
                </div>
              </div>

              <div>
                <span className="text-brand-blue font-bold tracking-wider text-sm uppercase mb-2 block">
                  Professionnels
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-brand-blue mb-6">
                  Des leads qui transforment.
                </h2>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  Accédez à un flux de projets (achat/vente) qualifiés et chauds. Ne perdez plus de temps en prospection à froid : concentrez-vous sur des clients qui ont un vrai projet et qui attendent un expert.
                </p>
                <ul className="space-y-4 mb-10">
                  {[
                    "Projets détaillés et vérifiés",
                    "Matching par secteur et typologie",
                    "Outils de mise en relation intégrés",
                    "Carte de visite digitale incluse",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center text-slate-700 font-medium">
                      <CheckCircle className="h-5 w-5 text-brand-blue mr-3" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  size="lg"
                  className="bg-brand-blue hover:bg-blue-800 text-white rounded-full px-8 py-6 text-lg font-bold"
                >
                  <Link to="/pro-de-limmo">Découvrir l&apos;offre Pro</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-white border-t border-slate-200">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <span className="text-brand-orange font-bold tracking-wider text-sm uppercase mb-2 block">
                  Agences & Réseaux
                </span>

                <h2 className="text-3xl sm:text-4xl font-bold text-brand-blue mb-6">
                  Déployez LivingRoom à l’échelle de votre réseau.
                </h2>

                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  Vous êtes une agence multi-collaborateurs, un réseau, une franchise ou un groupement ? LivingRoom s’adapte à votre organisation : diffusion, performance, pilotage et montée en charge… sans complexité.
                </p>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-brand-orange">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-brand-blue text-lg">Structure agence / réseau</h3>
                      <p className="text-slate-600">
                        Centralisez, répartissez et suivez les opportunités par agence, équipe ou collaborateur.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-brand-orange">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-brand-blue text-lg">Qualité & performance</h3>
                      <p className="text-slate-600">
                        Des projets qualifiés, un matching intelligent et des outils de conversion pensés pour scaler.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex flex-col sm:flex-row gap-3">
                  <Button
                    asChild
                    size="lg"
                    className="bg-brand-orange hover:bg-orange-600 text-white rounded-full px-8 py-6 text-lg font-bold"
                  >
                    <Link to="/reseau-agences">Voir l’offre Réseau</Link>
                  </Button>
                </div>
              </div>

              <div className="order-1 md:order-2">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] group">
                  {agencyImage ? (
                    <img
                      src={agencyImage.url}
                      alt={agencyImage.alt || "Agence immobilière en réunion"}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-200 animate-pulse" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white border-t border-slate-200">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-blue mb-4">
              Immobilier en France : trouvez le bon expert au bon moment
            </h2>
            <p className="text-slate-700 leading-relaxed">
              LivingRoom est une plateforme de matching immobilier qui connecte les particuliers (acheteurs et vendeurs) avec des professionnels qualifiés. Vous déposez votre projet, vous recevez des propositions adaptées à votre zone et à votre typologie (appartement, maison, investissement, résidence principale). Le tout, sans démarchage : vous gardez le contrôle sur le partage de vos coordonnées et vous choisissez avec qui vous échangez.
            </p>

            <p className="text-slate-700 leading-relaxed mt-4">
              Côté professionnels, LivingRoom permet d’accéder à des projets structurés et à une place de marché pour collaborer plus vite. Côté particuliers, c’est un moyen simple d’identifier l’expert pertinent (secteur, spécialité, type de bien) et d’avancer plus sereinement.
            </p>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h3 className="font-bold text-slate-900 mb-2">Trouver un agent partenaire</h3>
                <p className="text-slate-600 text-sm mb-4">
                  Découvrez nos professionnels partenaires et choisissez celui qui correspond à votre projet.
                </p>
                <Link to="/nos-professionnels-partenaires" className="text-brand-blue font-semibold hover:underline">
                  Voir nos agents partenaires →
                </Link>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h3 className="font-bold text-slate-900 mb-2">Préciser un projet immobilier</h3>
                <p className="text-slate-600 text-sm mb-4">
                  Précisez votre projet d’achat immobilier ou votre projet de vente immobilière en quelques minutes, sans démarchage.
                </p>
                <Link to="/preciser-projet" className="text-brand-blue font-semibold hover:underline">
                  Préciser mon projet (achat/vente) →
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-brand-blue text-white text-center">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6 tracking-tight">Prêt à accélérer ?</h2>
            <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Rejoignez la communauté LivingRoom et donnez vie à vos projets immobiliers dès aujourd&apos;hui.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-brand-orange hover:bg-orange-600 text-white font-bold text-lg px-10 py-6 rounded-full shadow-lg"
              >
                <Link to="/place-des-projets">Voir les projets</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-brand-blue font-bold text-lg px-10 py-6 rounded-full"
              >
                <Link to="/inscription">Créer un compte</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;