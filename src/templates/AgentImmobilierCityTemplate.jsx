import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Zap,
  TrendingUp,
  HeartHandshake as Handshake,
} from "lucide-react";

const AgentImmobilierCityTemplate = ({
  city,
  description,
  ogImage,
  heroTitle,
  heroSubtitle,
  heroImageAlt,
  heroImageSrc,
  valuePropositionTitle,
  valueProps = [],
  featuresTitle,
  featuresList = [],
  featuresImageAlt,
  featuresImageSrc,
  howItWorksTitle,
  howItWorksSteps = [],
  testimonialsTitle,
  testimonials = [],
  callToActionTitle,
  callToActionSubtitle,

  // ✅ Ajout : paragraphe SEO “autres villes”
  otherCitiesTitle,
  otherCitiesParagraph,
}) => {
  const normalizedCity = (city || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");

  // ✅ URL CANONIQUE (selon tes nouveaux slugs)
  const canonicalPath = `/agent-immobilier-${normalizedCity}`;
  const canonicalUrl = `https://livingroom.immo${canonicalPath}`;

  const proRegistrationLink = `/pro-de-limmo/inscription?city=${normalizedCity}`;

  const resolvedOgImage =
    ogImage || `https://livingroom.immo/og-agent-immobilier-${normalizedCity}.jpg`;

  const metaTitle = `Agent Immobilier ${city} - Développez votre Réseau avec LivingRoom`;

  const renderIcon = (iconName) => {
    switch (iconName) {
      case "Zap":
        return <Zap className="h-12 w-12 text-brand-blue mb-4" />;
      case "TrendingUp":
        return <TrendingUp className="h-12 w-12 text-brand-blue mb-4" />;
      case "Handshake":
        return <Handshake className="h-12 w-12 text-brand-blue mb-4" />;
      case "CheckCircle":
        return (
          <CheckCircle className="h-6 w-6 text-emerald-500 mr-3 flex-shrink-0 mt-1" />
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-white to-blue-50"
    >
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={description} />

        {/* ✅ Canonical (important SEO) */}
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph */}
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={resolvedOgImage} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={resolvedOgImage} />
      </Helmet>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6"
          >
            {heroTitle}
          </motion.h1>

          <motion.p
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto mb-8"
          >
            {heroSubtitle}
          </motion.p>

          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Button
              asChild
              size="lg"
              className="bg-brand-blue hover:bg-brand-blue-dark text-white text-lg px-8 py-6 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1"
            >
              <Link to={proRegistrationLink}>Rejoignez LivingRoom Pro {city}</Link>
            </Button>
          </motion.div>
        </div>

        {/* ✅ FIX: className + vraie balise img */}
        {heroImageSrc ? (
          <img
            className="absolute inset-0 w-full h-full object-cover opacity-10"
            alt={heroImageAlt || `Agent immobilier à ${city}`}
            src={heroImageSrc}
            loading="lazy"
          />
        ) : null}
      </section>

      {/* Value Proposition Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            {valuePropositionTitle}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {valueProps.map((prop, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-50 p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center text-center"
              >
                {renderIcon(prop.icon)}
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  {prop.title}
                </h3>
                <p className="text-gray-600">{prop.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-blue-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                {featuresTitle}
              </h2>

              <ul className="space-y-4 text-lg text-gray-700">
                {featuresList.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    {renderIcon("CheckCircle")}
                    <span
                      dangerouslySetInnerHTML={{ __html: feature.text }}
                    />
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7 }}
              className="flex justify-center"
            >
              {/* ✅ FIX: vraie balise img */}
              {featuresImageSrc ? (
                <img
                  className="rounded-lg shadow-xl w-full max-w-md md:max-w-none"
                  alt={featuresImageAlt || "Fonctionnalités LivingRoom"}
                  src={featuresImageSrc}
                  loading="lazy"
                />
              ) : null}
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">
            {howItWorksTitle}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorksSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex flex-col items-center p-6 bg-gray-50 rounded-lg shadow-md"
              >
                <span className="text-4xl font-extrabold text-brand-blue mb-4">
                  {step.stepNumber}
                </span>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24 bg-blue-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">
            {testimonialsTitle}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="bg-white p-8 rounded-lg shadow-md flex flex-col items-center text-center"
              >
                {/* ✅ FIX: vraie balise img */}
                {testimonial.imageSrc ? (
                  <img
                    className="w-24 h-24 rounded-full mb-4 object-cover"
                    alt={testimonial.imageAlt || "Témoignage"}
                    src={testimonial.imageSrc}
                    loading="lazy"
                  />
                ) : null}

                <p className="text-gray-700 italic mb-4">
                  "{testimonial.quote}"
                </p>
                <p className="font-semibold text-gray-800">
                  {testimonial.author}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ✅ Nouveau bloc SEO : autres villes */}
      {(otherCitiesTitle || otherCitiesParagraph) && (
        <section className="py-10 md:py-14 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            {otherCitiesTitle ? (
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                {otherCitiesTitle}
              </h2>
            ) : null}

            {otherCitiesParagraph ? (
              <p className="mt-3 text-gray-700 text-base md:text-lg leading-relaxed">
                {otherCitiesParagraph}
              </p>
            ) : null}
          </div>
        </section>
      )}

      {/* Call to Action Section */}
      <section className="py-16 md:py-24 bg-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            {callToActionTitle}
          </h2>
          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto mb-8">
            {callToActionSubtitle}
          </p>
          <Button
            asChild
            size="lg"
            className="bg-brand-blue hover:bg-brand-blue-dark text-white text-lg px-8 py-6 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1"
          >
            <Link to={proRegistrationLink}>Inscrivez-vous Gratuitement</Link>
          </Button>
        </div>
      </section>
    </motion.div>
  );
};

export default AgentImmobilierCityTemplate;