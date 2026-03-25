import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { POSTS, AUDIENCES } from "@/blog/blogData";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Calendar, User, Clock, ArrowLeft, BookOpen, Tag } from "lucide-react";
import SEO from "@/components/SEO";
import { Helmet } from "react-helmet-async";

/* ---------------------------------------------------------------------- */
/*  Helpers SEO                                                           */
/* ---------------------------------------------------------------------- */

const SITE_NAME = "LivingRoom.immo";
const SITE_URL = "https://livingroom.immo";
const BLOG_PATH = "/blog";
const BLOG_CANONICAL = `${SITE_URL}${BLOG_PATH}`;
const DEFAULT_OG_IMAGE = "https://livingroom.immo/og-blog.jpg";

function isoOrNull(d) {
  try {
    const x = new Date(d);
    return Number.isNaN(x.getTime()) ? null : x.toISOString();
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------------------- */
/*  Carte article (liste)                                                 */
/* ---------------------------------------------------------------------- */

const BlogCard = ({ post }) => {
  const navigate = useNavigate();

  const {
    slug,
    title,
    excerpt,
    imageUrl,
    dateISO,
    author,
    readTime,
    readingTime,
    tags,
    description,
    audienceLabel,
  } = post;

  const finalDescription = excerpt || description || "";
  const date = new Date(dateISO).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleReadClick = () => {
    navigate(`/blog/${slug}`);
    window.scrollTo(0, 0);
  };

  const minutes = readTime || readingTime || "5";

  return (
    <Card
      className={[
        "overflow-hidden flex flex-col h-full",
        "border border-slate-200 rounded-2xl bg-white",
        "shadow-[0_2px_8px_rgba(15,23,42,0.04)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.08)]",
        "transition-shadow duration-200",
      ].join(" ")}
    >
      {imageUrl && (
        <div className="relative w-full aspect-video bg-slate-100 overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="object-cover w-full h-full transition-transform duration-500 hover:scale-105"
            loading="lazy"
          />
        </div>
      )}

      <CardHeader className="p-4 pb-2 bg-white border-b-0">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs text-slate-600 mb-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-medium bg-blue-50 text-blue-700 border-blue-100">
              <User className="h-3 w-3" />
              {author || "LivingRoom"}
            </span>

            {audienceLabel && (
              <>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-medium bg-slate-50 text-slate-700 border-slate-200">
                  {audienceLabel}
                </span>
              </>
            )}

            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {date}
            </span>
          </div>

          <CardTitle className="text-lg font-bold leading-tight text-slate-900 line-clamp-2">
            {title}
          </CardTitle>

          <CardDescription className="mt-1 text-xs text-slate-500 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{minutes} min de lecture</span>
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-3 flex-grow text-sm">
        <div className="flex flex-wrap gap-2 mb-2">
          {tags && tags.length > 0 ? (
            tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200 px-2.5 py-0.5 text-[11px] font-medium text-slate-700"
              >
                <Tag className="h-3 w-3 text-slate-400" />
                {tag}
              </span>
            ))
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
              <Tag className="h-3 w-3 text-slate-400" />
              Immobilier
            </span>
          )}
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="details" className="border-none">
            <div className="flex justify-start">
              <AccordionTrigger className="py-2 text-sm font-medium text-brand-blue hover:text-brand-blue/80 hover:no-underline p-0">
                Résumé
              </AccordionTrigger>
            </div>

            <AccordionContent className="px-0 pb-2 pt-1 text-slate-600">
              {finalDescription && (
                <p className="text-sm leading-relaxed line-clamp-4">
                  {finalDescription}
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>

      <CardFooter className="p-4 bg-slate-50/50 border-t border-slate-100">
        <Button
          onClick={handleReadClick}
          className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white shadow-sm transition-all hover:shadow-md"
        >
          <BookOpen className="mr-2 h-4 w-4" />
          Lire l&apos;article
        </Button>
      </CardFooter>
    </Card>
  );
};

/* ---------------------------------------------------------------------- */
/*  Page Blog                                                             */
/* ---------------------------------------------------------------------- */

const BlogPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Filtre audience (liste uniquement)
  const [audience, setAudience] = useState("all"); // "all" | AUDIENCES.PARTICULIER | AUDIENCES.PROFESSIONNEL | AUDIENCES.MIXTE

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Reset filtre si on change de page/route (optionnel mais pratique)
  useEffect(() => {
    if (slug) return;
    // si tu veux garder le filtre quand on revient sur /blog, commente la ligne suivante
    // setAudience("all");
  }, [location.pathname, slug]);

  const listTitle = "Le Blog LivingRoom | Conseils & inspirations immobilières";
  const listDescription =
    "Articles, conseils et analyses pour mieux comprendre le marché immobilier, optimiser votre prospection et suivre les évolutions de la Proptech.";

  const jsonLdBlog = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Blog",
      name: listTitle,
      description: listDescription,
      url: BLOG_CANONICAL,
      inLanguage: "fr-FR",
      publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    }),
    []
  );

  const jsonLdBreadcrumbList = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Blog", item: BLOG_CANONICAL },
      ],
    }),
    []
  );

  // Moved useMemo hooks here to avoid conditional execution
  const filteredPosts = useMemo(() => {
    if (audience === "all") return POSTS;
    return POSTS.filter((p) => p.audience === audience);
  }, [audience]);

  const counts = useMemo(() => {
    const total = POSTS.length;
    const particuliers = POSTS.filter((p) => p.audience === AUDIENCES.PARTICULIER).length;
    const pros = POSTS.filter((p) => p.audience === AUDIENCES.PROFESSIONNEL).length;
    const mixtes = POSTS.filter((p) => p.audience === AUDIENCES.MIXTE).length;
    return { total, particuliers, pros, mixtes };
  }, []);

  /* ------------------------ Vue article seul ------------------------ */
  if (slug) {
    const post = POSTS.find((p) => p.slug === slug);

    if (!post) {
      const canonical404 = `${BLOG_CANONICAL}`;
      return (
        <>
          <SEO
            title="Article introuvable | LivingRoom"
            description="Cet article n'existe pas ou a été déplacé. Retrouvez tous nos contenus sur le blog LivingRoom."
            url={canonical404}
            image={DEFAULT_OG_IMAGE}
          />
          <Helmet>
            <link rel="canonical" href={canonical404} />
            <meta name="robots" content="noindex,follow" />
          </Helmet>

          <div className="container mx-auto px-4 py-20 text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">
              Article introuvable
            </h1>
            <Button onClick={() => navigate("/blog")}>Retour au blog</Button>
          </div>
        </>
      );
    }

    const {
      title,
      excerpt,
      description,
      imageUrl,
      dateISO,
      author,
      readTime,
      readingTime,
      contentHtml,
      tags,
      updatedISO,
      audienceLabel,
    } = post;

    const finalDescription = excerpt || description || "";
    const formattedDate = new Date(dateISO).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const canonicalUrl = `${BLOG_CANONICAL}/${post.slug}`;
    const ogImage = imageUrl || DEFAULT_OG_IMAGE;

    const publishedTime = isoOrNull(dateISO);
    const modifiedTime = isoOrNull(updatedISO || dateISO);

    const minutes = readTime || readingTime || "5";

    const jsonLdBreadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Blog", item: BLOG_CANONICAL },
        { "@type": "ListItem", position: 3, name: title, item: canonicalUrl },
      ],
    };

    const jsonLdBlogPosting = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: title,
      description: finalDescription,
      image: [ogImage],
      author: {
        "@type": "Person",
        name: author || "LivingRoom",
      },
      publisher: {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
      },
      datePublished: publishedTime,
      dateModified: modifiedTime,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": canonicalUrl,
      },
      keywords: tags && tags.length ? tags.join(", ") : "immobilier, conseils, proptech",
      articleSection: tags && tags.length ? tags[0] : "Immobilier",
      inLanguage: "fr-FR",
    };

    return (
      <>
        <SEO
          title={title}
          description={finalDescription}
          image={ogImage}
          url={canonicalUrl}
        />

        <Helmet>
          <link rel="canonical" href={canonicalUrl} />
          <meta name="robots" content="index,follow" />
          {publishedTime && (
            <meta property="article:published_time" content={publishedTime} />
          )}
          {modifiedTime && (
            <meta property="article:modified_time" content={modifiedTime} />
          )}
          <script type="application/ld+json">{JSON.stringify(jsonLdBreadcrumb)}</script>
          <script type="application/ld+json">{JSON.stringify(jsonLdBlogPosting)}</script>
        </Helmet>

        <article className="min-h-screen bg-slate-50 pb-20 relative">
          <header className="relative pt-20 pb-16">
            {imageUrl ? (
              <div className="absolute inset-0">
                <img
                  src={imageUrl}
                  alt={title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/70 to-slate-900/60" />
              </div>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-brand-blue to-slate-900" />
            )}

            <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
              <Button
                variant="ghost"
                onClick={() => navigate("/blog")}
                className="mb-6 text-slate-100 hover:text-white hover:bg-white/10 -ml-3"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux articles
              </Button>

              <div className="flex flex-wrap gap-2 mb-5 text-[11px] sm:text-xs">
                <Badge className="bg-white/10 text-white border-white/20">
                  <User className="h-3 w-3 mr-1" />
                  {author || "LivingRoom"}
                </Badge>

                {audienceLabel && (
                  <Badge className="bg-white/10 text-white border-white/20">
                    {audienceLabel}
                  </Badge>
                )}

                <Badge variant="outline" className="border-white/30 text-slate-100">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formattedDate}
                </Badge>

                <Badge variant="outline" className="border-white/30 text-slate-100">
                  <Clock className="h-3 w-3 mr-1" />
                  {minutes} min de lecture
                </Badge>

                {tags && tags.length > 0 && (
                  <Badge variant="outline" className="border-white/30 text-slate-100">
                    <Tag className="h-3 w-3 mr-1" />
                    {tags[0]}
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
                {title}
              </h1>

              {finalDescription && (
                <p className="text-base sm:text-lg text-slate-100/90 max-w-3xl leading-relaxed">
                  {finalDescription}
                </p>
              )}
            </div>
          </header>

          <section className="max-w-3xl mx-auto px-4 sm:px-6 -mt-10 relative z-10">
            <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-slate-200">
              <div
                className="prose prose-slate prose-lg max-w-none prose-headings:text-brand-blue prose-a:text-brand-blue"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />
            </div>

            {/* CTA Section - Below Article */}
            <div className="mt-12 mb-16 bg-slate-100 rounded-2xl p-8 sm:p-10 text-center border border-slate-200 shadow-sm">
              <h3 className="text-xl sm:text-2xl font-bold text-brand-blue mb-6">
                Première plateforme de matching immobilier entre particuliers et professionnels
              </h3>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-brand-orange hover:bg-orange-600 text-white font-bold"
                >
                  <Link to="/inscription?role=particulier">Créer un compte Particulier</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="bg-brand-blue hover:bg-blue-800 text-white font-bold"
                >
                  <Link to="/pro-de-limmo/inscription">Créer un compte Professionnel</Link>
                </Button>
              </div>
            </div>

            <div className="mt-10 flex justify-center">
              <Button onClick={() => navigate("/blog")} variant="outline" size="lg">
                Voir tous les articles
              </Button>
            </div>
          </section>
        </article>
      </>
    );
  }

  /* ------------------------ Vue liste d’articles ------------------------ */

  const filterBadgeClass = (active) =>
    [
      "cursor-pointer select-none",
      "rounded-full border px-3 py-1 text-xs font-semibold",
      active
        ? "bg-brand-blue text-white border-brand-blue"
        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
    ].join(" ");

  return (
    <>
      <SEO
        title={listTitle}
        description={listDescription}
        url={BLOG_CANONICAL}
        image={DEFAULT_OG_IMAGE}
      />

      <Helmet>
        <link rel="canonical" href={BLOG_CANONICAL} />
        <meta name="robots" content="index,follow" />
        <script type="application/ld+json">{JSON.stringify(jsonLdBlog)}</script>
        <script type="application/ld+json">{JSON.stringify(jsonLdBreadcrumbList)}</script>
      </Helmet>

      <div className="min-h-screen bg-slate-50">
        <section className="pt-20 pb-10 bg-white border-b border-slate-100">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl text-center">
            <div className="inline-flex items-center rounded-full bg-orange-50 text-orange-700 text-[11px] sm:text-xs font-semibold px-3 py-1 mb-4">
              <span className="w-2 h-2 rounded-full bg-orange-500 mr-2" />
              Ressources LivingRoom
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-brand-blue mb-4 leading-tight">
              Le Blog LivingRoom.
              <br className="hidden sm:block" />
              <span className="text-slate-800">
                Conseils pour particuliers et pros de l&apos;immobilier.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
              Articles pratiques, retours d&apos;expérience et décryptages pour éviter les
              pièges et prendre les meilleures décisions immobilières.
            </p>

            {/* Filtres + compteur */}
            <div className="mt-8 flex flex-col items-center gap-3">
              <div className="flex flex-wrap justify-center gap-2">
                <span
                  className={filterBadgeClass(audience === "all")}
                  onClick={() => setAudience("all")}
                  role="button"
                  tabIndex={0}
                >
                  Tous ({counts.total})
                </span>
                <span
                  className={filterBadgeClass(audience === AUDIENCES.PARTICULIER)}
                  onClick={() => setAudience(AUDIENCES.PARTICULIER)}
                  role="button"
                  tabIndex={0}
                >
                  Particuliers ({counts.particuliers})
                </span>
                <span
                  className={filterBadgeClass(audience === AUDIENCES.PROFESSIONNEL)}
                  onClick={() => setAudience(AUDIENCES.PROFESSIONNEL)}
                  role="button"
                  tabIndex={0}
                >
                  Pros ({counts.pros})
                </span>
                <span
                  className={filterBadgeClass(audience === AUDIENCES.MIXTE)}
                  onClick={() => setAudience(AUDIENCES.MIXTE)}
                  role="button"
                  tabIndex={0}
                >
                  Mixte ({counts.mixtes})
                </span>
              </div>

              <div className="text-sm text-slate-500">
                {audience === "all"
                  ? `${filteredPosts.length} article(s) affiché(s)`
                  : `${filteredPosts.length} article(s) — filtre actif`}
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 pb-20">
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            {filteredPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {filteredPosts.map((post, index) => (
                  <BlogCard key={post.slug || index} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-500">
                Aucun article pour ce filtre.
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
};

export default BlogPage;