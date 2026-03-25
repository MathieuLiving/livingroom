import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap, TrendingUp, HeartHandshake as Handshake, CheckCircle } from 'lucide-react'; // Added CheckCircle for features list

const toSlug = (s = "") =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .trim();

// Note: cap is not used in the template, but kept for consistency if needed elsewhere.
// const cap = (s = "") => s.charAt(0).toUpperCase() + s.slice(1);

const AcheterImmobilierCityTemplate = ({
  city,
  description,
  ogImage,
  heroTitle,
  heroSubtitle,
  heroImageAlt,
  valuePropositionTitle,
  valueProps = [],
  featuresTitle,
  featuresImageAlt,
  featuresList = [],
  howItWorksTitle,
  howItWorksSteps = [],
  testimonialsTitle,
  testimonials = [],
  callToActionTitle,
  callToActionSubtitle,
}) => {
  const citySlug = toSlug(city);
  const canonical = `https://livingroom.immo/acheter-immobilier-${citySlug}`;
  const hub = "/acheter-immobilier";

  // Map icon names to actual Lucide components
  const iconMap = {
    Zap: Zap,
    TrendingUp: TrendingUp,
    Handshake: Handshake,
    CheckCircle: CheckCircle // Added for default checkmark in features
  };

  return (
    <>
      <Helmet>
        <title>{`Acheter un bien immobilier à ${city} | LivingRoom`}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />

        <meta property="og:title" content={`Acheter un bien immobilier à ${city} | LivingRoom`} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={ogImage || `https://livingroom.immo/og-acheter-immobilier-${citySlug}.jpg`} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <main className="bg-white">
        <section className="py-20 bg-slate-50 border-b border-slate-100">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="mb-6">
              <Link to={hub} className="text-sm text-slate-600 hover:underline">
                ← Voir toutes les villes (achat)
              </Link>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">
              {heroTitle || <>Acheter un bien immobilier à {city}</>}
            </h1>

            <p className="text-lg md:text-xl text-slate-700 max-w-3xl mb-10">
              {heroSubtitle ||
                `Déposez votre projet d’achat à ${city} et recevez des opportunités pertinentes, sans perdre de temps.`}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="rounded-full px-8 py-6 bg-brand-orange hover:bg-orange-600">
                <Link to="/preciser-projet">Déposer mon projet d’achat</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-8 py-6 border-brand-blue text-brand-blue">
                <Link to="/place-des-projets">Voir les projets</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Value Proposition Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
              {valuePropositionTitle}
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {valueProps.map((prop, index) => {
                const IconComponent = iconMap[prop.icon] || null;
                return (
                  <div key={index} className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-sm border border-slate-200">
                    {IconComponent && <IconComponent className="h-10 w-10 text-brand-blue mb-4" />}
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">{prop.title}</h3>
                    <p className="text-slate-700">{prop.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-slate-50">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
              {featuresTitle}
            </h2>
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <ul className="space-y-6">
                  {featuresList.map((feature, index) => (
                    <li key={index} className="flex items-start text-slate-700">
                      <CheckCircle className="h-6 w-6 text-brand-orange mr-3 mt-1 flex-shrink-0" />
                      <span dangerouslySetInnerHTML={{ __html: feature.text }} />
                    </li>
                  ))}
                </ul>
              </div>
              <div className="hidden md:block">
                <img alt={featuresImageAlt} className="rounded-lg shadow-lg w-full h-auto object-cover" src="https://images.unsplash.com/photo-1684171699438-57cff629192f" />
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
              {howItWorksTitle}
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {howItWorksSteps.map((step, index) => (
                <div key={index} className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-sm border border-slate-200">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-brand-blue text-white text-xl font-bold mb-4">
                    {step.stepNumber}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">{step.title}</h3>
                  <p className="text-slate-700">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        {!!testimonials?.length && (
          <section className="py-16 bg-slate-50">
            <div className="container mx-auto px-4 max-w-5xl">
              <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
                {testimonialsTitle}
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="bg-white p-8 rounded-lg shadow-md border border-slate-200">
                    <p className="text-lg text-slate-700 italic mb-6">"{testimonial.quote}"</p>
                    <div className="flex items-center">
                      <img alt={testimonial.imageAlt} className="w-12 h-12 rounded-full mr-4 object-cover" src="https://images.unsplash.com/photo-1652841190565-b96e0acbae17" />
                      <div>
                        <p className="font-semibold text-slate-900">{testimonial.author}</p>
                        {testimonial.title && <p className="text-sm text-slate-600">{testimonial.title}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Call to Action Section */}
        <section className="py-20 bg-brand-blue text-white text-center">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-4xl font-extrabold mb-4">{callToActionTitle}</h2>
            <p className="text-xl mb-8">{callToActionSubtitle}</p>
            <Button asChild size="lg" className="rounded-full px-10 py-7 bg-brand-orange hover:bg-orange-600 text-lg">
              <Link to="/preciser-projet">Déposer mon projet d’achat</Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  );
};

export default AcheterImmobilierCityTemplate;