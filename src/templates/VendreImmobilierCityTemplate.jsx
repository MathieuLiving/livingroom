import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const toSlug = (s = "") =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .trim();

const cap = (s = "") => s.charAt(0).toUpperCase() + s.slice(1);

const VendreImmobilierCityTemplate = ({
  city,
  description,
  ogImage,
  heroTitle,
  heroSubtitle,
  whyTitle,
  whyParagraph,
  bullets = [],
  faqTitle = "Questions fréquentes",
  faqs = [],
}) => {
  const citySlug = toSlug(city);
  const canonical = `https://livingroom.immo/vendre-immobilier-${citySlug}`;
  const hub = "/vendre-immobilier";

  return (
    <>
      <Helmet>
        <title>{`Vendre un bien immobilier à ${city} | LivingRoom`}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />

        <meta property="og:title" content={`Vendre un bien immobilier à ${city} | LivingRoom`} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={ogImage || `https://livingroom.immo/og-vendre-immobilier-${citySlug}.jpg`} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <main className="bg-white">
        <section className="py-20 bg-slate-50 border-b border-slate-100">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="mb-6">
              <Link to={hub} className="text-sm text-slate-600 hover:underline">
                ← Voir toutes les villes (vente)
              </Link>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">
              {heroTitle || <>Vendre un bien immobilier à {city}</>}
            </h1>

            <p className="text-lg md:text-xl text-slate-700 max-w-3xl mb-10">
              {heroSubtitle ||
                `Déposez votre projet de vente à ${city}, comparez les approches, et choisissez le bon professionnel au bon moment.`}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="rounded-full px-8 py-6 bg-brand-orange hover:bg-orange-600">
                <Link to="/preciser-projet">Déposer mon projet de vente</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-8 py-6 border-brand-blue text-brand-blue">
                <Link to="/nos-professionnels-partenaires">Voir les pros</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
              {whyTitle || `Pourquoi vendre à ${city} avec LivingRoom ?`}
            </h2>

            <p className="text-slate-700 text-base md:text-lg leading-relaxed mb-8">
              {whyParagraph}
            </p>

            {!!bullets?.length && (
              <ul className="grid md:grid-cols-2 gap-3">
                {bullets.map((b, i) => (
                  <li key={i} className="rounded-xl border border-slate-200 bg-white p-4 text-slate-800">
                    <span className="font-semibold">{cap(city)} :</span> {b}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {!!faqs?.length && (
          <section className="py-16 bg-slate-50 border-t border-slate-100">
            <div className="container mx-auto px-4 max-w-5xl">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-8">{faqTitle}</h2>

              <div className="space-y-4">
                {faqs.map((f, i) => (
                  <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6">
                    <h3 className="font-semibold text-slate-900 mb-2">{f.q}</h3>
                    <p className="text-slate-700">{f.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
};

export default VendreImmobilierCityTemplate;