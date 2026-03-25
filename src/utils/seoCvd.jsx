import React from "react";
import { Helmet } from "react-helmet-async";

const FALLBACK_LR_LOGO =
  "https://horizons-cdn.hostinger.com/f7eb5659-bed0-4bf7-847c-ea6067478f08/81bc2da05b2ffbe090fd1540a48ac891.png";

const DEFAULT_SITE_NAME = "LivingRoom.immo";
const DEFAULT_SITE_URL = "https://livingroom.immo";
const DEFAULT_LOGO_URL =
  "https://storage.googleapis.com/hostinger-horizons-assets-prod/f7eb5659-bed0-4bf7-847c-ea6067478f08/ac2998631af90b02833788c39cf64042.png";

const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "gclid",
  "gbraid",
  "wbraid",
  "fbclid",
  "mc_cid",
  "mc_eid",
  "_ga",
  "_gl",
  "ref",
  "source",
  "trk",
]);

function safeUrl(input, fallback = DEFAULT_SITE_URL) {
  try {
    return new URL(input).toString();
  } catch {
    return fallback;
  }
}

function getWindowLocationHref() {
  if (typeof window === "undefined") return DEFAULT_SITE_URL;
  return window.location?.href || DEFAULT_SITE_URL;
}

function getWindowOrigin() {
  if (typeof window === "undefined") return DEFAULT_SITE_URL;
  return window.location?.origin || DEFAULT_SITE_URL;
}

function normalizePathname(pathname = "/") {
  if (!pathname) return "/";
  let normalized = String(pathname).replace(/\/{2,}/g, "/");

  if (normalized !== "/" && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }

  return normalized || "/";
}

function cleanSearchParams(url, { stripQuery = false } = {}) {
  if (stripQuery) {
    url.search = "";
    return;
  }

  const keysToDelete = [];
  url.searchParams.forEach((_, key) => {
    const lowerKey = String(key || "").toLowerCase();
    if (TRACKING_PARAMS.has(lowerKey) || lowerKey.startsWith("utm_")) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach((key) => url.searchParams.delete(key));
}

function buildCleanUrl(rawUrl, { stripQuery = false } = {}) {
  try {
    const url = new URL(rawUrl);
    url.hash = "";
    url.pathname = normalizePathname(url.pathname);
    cleanSearchParams(url, { stripQuery });
    return url.toString();
  } catch {
    return DEFAULT_SITE_URL;
  }
}

function getCleanCurrentUrl({ stripQuery = false } = {}) {
  return buildCleanUrl(getWindowLocationHref(), { stripQuery });
}

function absolutizeUrl(maybeUrl, siteUrl = DEFAULT_SITE_URL) {
  if (!maybeUrl) return null;

  try {
    return new URL(maybeUrl).toString();
  } catch {
    try {
      return new URL(
        String(maybeUrl).startsWith("/") ? maybeUrl : `/${maybeUrl}`,
        siteUrl
      ).toString();
    } catch {
      return null;
    }
  }
}

function normalizeSchema(schema) {
  if (!schema) return [];
  return Array.isArray(schema) ? schema.filter(Boolean) : [schema].filter(Boolean);
}

function buildDefaultWebsiteSchema({ siteUrl, siteName, logoUrl }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: siteUrl,
    name: siteName,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/place-des-projets?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: DEFAULT_SITE_NAME,
      url: DEFAULT_SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: logoUrl,
      },
    },
  };
}

function buildDefaultOrganizationSchema({ logoUrl }) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: DEFAULT_SITE_NAME,
    url: DEFAULT_SITE_URL,
    logo: logoUrl,
  };
}

function cleanText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function truncateText(value = "", max = 160) {
  const text = cleanText(value);
  if (!text) return "";
  if (text.length <= max) return text;

  const sliced = text.slice(0, max);
  const lastSpace = sliced.lastIndexOf(" ");
  return `${(lastSpace > 80 ? sliced.slice(0, lastSpace) : sliced).trim()}…`;
}

function getFullName(pro) {
  return cleanText(`${pro?.first_name || ""} ${pro?.last_name || ""}`) || "Professionnel immobilier";
}

function getCompanyName(pro) {
  return cleanText(
    pro?.effective_company_name || pro?.company_name || pro?.agency_name || ""
  );
}

function getRole(pro) {
  return cleanText(pro?.function || "Professionnel de l'immobilier");
}

function getPresentation(pro) {
  return cleanText(pro?.professionnal_presentation || "");
}

function getAreas(pro) {
  return [
    pro?.scope_intervention_choice_1,
    pro?.scope_intervention_choice_2,
    pro?.scope_intervention_choice_3,
  ]
    .map((item) => cleanText(item))
    .filter(Boolean);
}

function getPrimaryArea(pro) {
  return getAreas(pro)[0] || "";
}

function getReadableAreas(pro) {
  const areas = getAreas(pro);
  if (areas.length === 0) return "";
  if (areas.length === 1) return areas[0];
  if (areas.length === 2) return `${areas[0]} et ${areas[1]}`;
  return `${areas[0]}, ${areas[1]} et ${areas[2]}`;
}

function startsWithVowelSound(value = "") {
  return /^[aeiouyhàâäéèêëîïôöùûüh]/i.test(cleanText(value));
}

function withArticleRole(role) {
  const r = cleanText(role);
  if (!r) return "professionnel de l'immobilier";
  return `${startsWithVowelSound(r) ? "un" : "un"} ${r.toLowerCase()}`;
}

export function buildCvdTitleFromPro(pro) {
  if (!pro) return "Carte de visite digitale | LivingRoom.immo";

  const name = getFullName(pro);
  const company = getCompanyName(pro);
  const role = getRole(pro);
  const primaryArea = getPrimaryArea(pro);

  const parts = [name];

  if (role) parts.push(role);
  if (company) parts.push(company);
  if (primaryArea) parts.push(primaryArea);

  return parts.filter(Boolean).join(" | ");
}

export function buildCvdMetaDescriptionFromPro(pro) {
  if (!pro) {
    return "Découvrez cette carte de visite digitale professionnelle sur LivingRoom.immo et contactez un professionnel de l’immobilier pour votre projet.";
  }

  const name = getFullName(pro);
  const company = getCompanyName(pro);
  const role = getRole(pro);
  const area = getReadableAreas(pro);
  const presentation = getPresentation(pro);

  let base = `${name}, ${role}`;
  if (company) {
    base += ` chez ${company}`;
  }
  if (area) {
    base += `, intervient à ${area}`;
  }
  base += ". ";

  const suffix = presentation
    ? truncateText(presentation, Math.max(40, 155 - base.length))
    : "Découvrez son profil, ses coordonnées professionnelles et ses secteurs d’intervention.";

  return truncateText(`${base}${suffix}`, 155);
}

export function generateCvdSeoTextFromPro(pro) {
  if (!pro) return "";

  const name = getFullName(pro);
  const company = getCompanyName(pro);
  const role = getRole(pro);
  const presentation = getPresentation(pro);
  const areas = getAreas(pro);
  const readableAreas = getReadableAreas(pro);

  const introParts = [];

  if (name) {
    introParts.push(`${name} est ${withArticleRole(role)}`);
  } else {
    introParts.push(`Ce profil présente ${withArticleRole(role)}`);
  }

  if (company) {
    introParts.push(`exerçant au sein de ${company}`);
  }

  let intro = introParts.join(" ");
  if (!intro.endsWith(".")) intro += ".";

  let areaSentence = "";
  if (readableAreas) {
    areaSentence = `${name || "Ce professionnel"} intervient notamment sur ${readableAreas} pour accompagner des projets immobiliers avec une approche adaptée au secteur, au type de bien et au calendrier du client.`;
  }

  let presentationSentence = "";
  if (presentation) {
    presentationSentence = presentation;
    if (!/[.!?]$/.test(presentationSentence)) {
      presentationSentence += ".";
    }
  }

  let valueSentence = `${name || "Ce professionnel"} peut être contacté via sa carte de visite digitale pour découvrir son activité, ses coordonnées professionnelles, ses liens utiles et ses domaines d’intervention.`;

  if (areas.length > 0) {
    valueSentence += ` Cette page permet aussi d’identifier plus facilement un professionnel de l’immobilier actif sur ${readableAreas}.`;
  }

  return [intro, areaSentence, presentationSentence, valueSentence]
    .filter(Boolean)
    .map((item) => cleanText(item))
    .join(" ");
}

const SEO = ({
  title,
  description,
  keywords,
  image,
  ogImage,
  canonicalUrl,
  url,
  stripQueryForCanonical = false,
  noindex = false,
  nofollow = false,
  type = "website",
  schema,
  titleTemplate,
  imageAlt,
  ogImageWidth = 1200,
  ogImageHeight = 630,
  ogImageType = "image/jpeg",
  lang = "fr",
  locale = "fr_FR",
  siteName = DEFAULT_SITE_NAME,
  siteUrl,
  logoUrl = DEFAULT_LOGO_URL,
}) => {
  const resolvedSiteUrl = safeUrl(siteUrl || getWindowOrigin(), DEFAULT_SITE_URL);

  const derivedCleanUrl = getCleanCurrentUrl({
    stripQuery: stripQueryForCanonical,
  });

  const cleanUrl = buildCleanUrl(canonicalUrl || url || derivedCleanUrl, {
    stripQuery: stripQueryForCanonical,
  });

  const baseTitle = title || siteName;
  const fullTitle = titleTemplate
    ? titleTemplate.replace("%s", baseTitle)
    : title
      ? `${baseTitle} | ${siteName}`
      : siteName;

  const defaultKeywords =
    "immobilier, projet immobilier, agent immobilier, carte de visite digitale, professionnel immobilier, agent immobilier local, leads immobiliers, mise en relation immobilière";
  const finalKeywords = keywords ? `${keywords}, ${defaultKeywords}` : defaultKeywords;

  const metaImage = absolutizeUrl(
    ogImage || image || FALLBACK_LR_LOGO,
    resolvedSiteUrl
  );

  const finalImageAlt =
    imageAlt || title || "LivingRoom.immo – Plateforme de matching immobilier";

  const robotsValue = [
    noindex ? "noindex" : "index",
    nofollow ? "nofollow" : "follow",
    "max-image-preview:large",
    "max-snippet:-1",
    "max-video-preview:-1",
  ].join(", ");

  const inputSchemas = normalizeSchema(schema);
  const hasWebSite = inputSchemas.some((s) => s?.["@type"] === "WebSite");
  const hasOrg = inputSchemas.some((s) => s?.["@type"] === "Organization");

  const schemasArray = [
    ...(hasWebSite
      ? []
      : [
          buildDefaultWebsiteSchema({
            siteUrl: resolvedSiteUrl,
            siteName,
            logoUrl,
          }),
        ]),
    ...(hasOrg ? [] : [buildDefaultOrganizationSchema({ logoUrl })]),
    ...inputSchemas,
  ];

  return (
    <Helmet htmlAttributes={{ lang }}>
      <link rel="preconnect" href="https://horizons-cdn.hostinger.com" />
      <link rel="preconnect" href="https://storage.googleapis.com" />
      <link rel="preconnect" href="https://images.unsplash.com" />
      <link rel="preconnect" href="https://ohddhnegsqvxhyohgsoi.supabase.co" />

      <title>{fullTitle}</title>

      <link rel="canonical" href={cleanUrl} />

      <meta name="robots" content={robotsValue} />
      <meta name="googlebot" content={robotsValue} />

      {description && <meta name="description" content={description} />}
      <meta name="keywords" content={finalKeywords} />

      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={cleanUrl} />
      <meta property="og:locale" content={locale} />

      {metaImage && <meta property="og:image" content={metaImage} />}
      {metaImage && <meta property="og:image:width" content={String(ogImageWidth)} />}
      {metaImage && <meta property="og:image:height" content={String(ogImageHeight)} />}
      {metaImage && <meta property="og:image:type" content={ogImageType} />}
      {metaImage && <meta property="og:image:alt" content={finalImageAlt} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      {metaImage && <meta name="twitter:image" content={metaImage} />}
      {metaImage && <meta name="twitter:image:alt" content={finalImageAlt} />}

      {schemasArray.map((item, idx) => (
        <script key={idx} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;