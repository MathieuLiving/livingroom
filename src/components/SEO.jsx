// src/components/SEO.jsx
import React from "react";
import { Helmet } from "react-helmet-async";

const FALLBACK_LR_LOGO =
  "https://horizons-cdn.hostinger.com/f7eb5659-bed0-4bf7-847c-ea6067478f08/81bc2da05b2ffbe090fd1540a48ac891.png";

const SITE_NAME = "LivingRoom.immo";
const SITE_URL = "https://livingroom.immo";
const DEFAULT_DESCRIPTION =
  "Recevez des projets immobiliers qualifiés et développez votre portefeuille. LivingRoom connecte particuliers et agences efficacement.";
const NEW_LOGO_URL =
  "https://storage.googleapis.com/hostinger-horizons-assets-prod/f7eb5659-bed0-4bf7-847c-ea6067478f08/ac2998631af90b02833788c39cf64042.png";

const TRACKING_PARAMS_PREFIXES = ["utm_"];
const TRACKING_PARAMS_EXACT = [
  "trk",
  "gclid",
  "fbclid",
  "msclkid",
  "mc_cid",
  "mc_eid",
  "ref",
  "source",
];

const INDEXABLE_QUERY_WHITELIST = [];

function safeUrl(input, fallback = SITE_URL) {
  try {
    return new URL(input).toString();
  } catch {
    return fallback;
  }
}

function getCurrentUrl() {
  if (typeof window === "undefined") return SITE_URL;
  return safeUrl(window.location.href, SITE_URL);
}

function absolutizeUrl(maybeUrl) {
  if (!maybeUrl) return null;

  try {
    return new URL(maybeUrl).toString();
  } catch {
    return `${SITE_URL}${String(maybeUrl).startsWith("/") ? "" : "/"}${String(maybeUrl)}`;
  }
}

function normalizeSchema(schema) {
  if (!schema) return [];
  return Array.isArray(schema) ? schema.filter(Boolean) : [schema].filter(Boolean);
}

function normalizePathname(pathname = "/") {
  let path = String(pathname || "/").trim();

  if (!path.startsWith("/")) path = `/${path}`;
  path = path.replace(/\/{2,}/g, "/");

  if (path.length > 1) {
    path = path.replace(/\/+$/, "");
  }

  return path || "/";
}

function hasPlaceholderSegment(pathname = "") {
  const path = String(pathname || "");

  return (
    path.includes("/:") ||
    path.includes("{") ||
    path.includes("}") ||
    path.includes("%7B") ||
    path.includes("%7D")
  );
}

function filterSearchParams(search = "", { stripAll = false } = {}) {
  const params = new URLSearchParams(search || "");
  const cleaned = new URLSearchParams();

  if (stripAll) return "";

  for (const [key, value] of params.entries()) {
    const lowerKey = String(key || "").toLowerCase();

    const isTrackingPrefix = TRACKING_PARAMS_PREFIXES.some((prefix) =>
      lowerKey.startsWith(prefix)
    );
    const isTrackingExact = TRACKING_PARAMS_EXACT.includes(lowerKey);
    const isWhitelisted = INDEXABLE_QUERY_WHITELIST.includes(lowerKey);

    if (isWhitelisted && !isTrackingPrefix && !isTrackingExact) {
      cleaned.append(key, value);
    }
  }

  const finalSearch = cleaned.toString();
  return finalSearch ? `?${finalSearch}` : "";
}

function getCleanUrl({ stripQuery = false, forcedUrl } = {}) {
  const raw = forcedUrl ? safeUrl(forcedUrl, SITE_URL) : getCurrentUrl();

  try {
    const url = new URL(raw);
    url.hash = "";
    url.pathname = normalizePathname(url.pathname);
    url.search = filterSearchParams(url.search, { stripAll: stripQuery });
    return url.toString();
  } catch {
    return SITE_URL;
  }
}

function getDerivedPathname(rawUrl) {
  try {
    const url = new URL(rawUrl);
    return normalizePathname(url.pathname);
  } catch {
    return "/";
  }
}

function hasTrackingSearch(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const params = new URLSearchParams(url.search || "");

    for (const key of params.keys()) {
      const lowerKey = String(key || "").toLowerCase();
      if (TRACKING_PARAMS_EXACT.includes(lowerKey)) return true;
      if (TRACKING_PARAMS_PREFIXES.some((prefix) => lowerKey.startsWith(prefix))) return true;
    }

    return false;
  } catch {
    return false;
  }
}

function isTechnicalOrThinRoute(pathname = "") {
  const path = normalizePathname(pathname).toLowerCase();

  const blockedPrefixes = [
    "/preciser-projet",
    "/carte-visite-digitale",
    "/auth",
    "/login",
    "/signup",
    "/sign-up",
    "/reset-password",
    "/forgot-password",
    "/mon-espace",
    "/dashboard",
    "/admin",
    "/app",
    "/checkout",
    "/payment",
    "/success",
    "/cancel",
    "/callback",
    "/supabase-debug",
    "/supabase-verify-redirect",
    "/email-confirmation",
    "/password-recovery",
  ];

  return blockedPrefixes.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

function shouldNoindexAuto(rawUrl, explicitNoindex = false) {
  if (explicitNoindex === true) return true;

  const pathname = getDerivedPathname(rawUrl);

  if (hasPlaceholderSegment(pathname)) return true;
  if (hasTrackingSearch(rawUrl)) return true;
  if (isTechnicalOrThinRoute(pathname)) return true;

  return false;
}

function buildTitle(title, titleTemplate) {
  const baseTitle = String(title || "").trim();

  if (!baseTitle) return SITE_NAME;

  if (titleTemplate) {
    return titleTemplate.replace("%s", baseTitle);
  }

  if (baseTitle.includes(SITE_NAME)) {
    return baseTitle;
  }

  return `${baseTitle} | ${SITE_NAME}`;
}

const defaultWebSiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  url: SITE_URL,
  name: SITE_NAME,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/blog?search={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: NEW_LOGO_URL,
    },
  },
};

const defaultOrganizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: NEW_LOGO_URL,
};

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
  jsonLd,

  titleTemplate,

  imageAlt,
  ogImageWidth = 1200,
  ogImageHeight = 630,
  ogImageType = "image/png",

  lang = "fr",
  locale = "fr_FR",
}) => {
  const requestedUrl = canonicalUrl || url || getCurrentUrl();
  const cleanUrl = getCleanUrl({
    stripQuery: stripQueryForCanonical,
    forcedUrl: requestedUrl,
  });

  const pathname = getDerivedPathname(cleanUrl);
  const autoNoindex = shouldNoindexAuto(cleanUrl, noindex);
  const finalNoindex = noindex || autoNoindex;

  const fullTitle = buildTitle(title, titleTemplate);
  const finalDescription = String(description || "").trim() || DEFAULT_DESCRIPTION;

  const defaultKeywords =
    "immobilier, projet immobilier, agent immobilier, leads immobiliers, lead acquéreur, lead vendeur, trouver un agent, vente maison, achat appartement, mise en relation immobilière";
  const finalKeywords = keywords ? `${keywords}, ${defaultKeywords}` : defaultKeywords;

  const metaImage = absolutizeUrl(ogImage || image || FALLBACK_LR_LOGO);
  const finalImageAlt =
    imageAlt || fullTitle || "LivingRoom.immo – Plateforme de matching immobilier";

  const robotsValue = [
    finalNoindex ? "noindex" : "index",
    nofollow ? "nofollow" : "follow",
    "max-image-preview:large",
    "max-snippet:-1",
    "max-video-preview:-1",
  ].join(", ");

  const inputSchemas = [
    ...normalizeSchema(schema),
    ...normalizeSchema(jsonLd),
  ];

  const hasWebSite = inputSchemas.some((s) => s?.["@type"] === "WebSite");
  const hasOrg = inputSchemas.some((s) => s?.["@type"] === "Organization");

  const schemasArray = [
    ...(hasWebSite ? [] : [defaultWebSiteSchema]),
    ...(hasOrg ? [] : [defaultOrganizationSchema]),
    ...inputSchemas,
  ];

  return (
    <Helmet prioritizeSeoTags htmlAttributes={{ lang }}>
      <link rel="preconnect" href="https://horizons-cdn.hostinger.com" />
      <link rel="preconnect" href="https://storage.googleapis.com" />
      <link rel="preconnect" href="https://images.unsplash.com" />

      <title>{fullTitle}</title>

      <link rel="canonical" href={cleanUrl} />

      <meta name="robots" content={robotsValue} />
      <meta name="googlebot" content={robotsValue} />

      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={finalDescription} />
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
      <meta name="twitter:description" content={finalDescription} />
      {metaImage && <meta name="twitter:image" content={metaImage} />}
      {metaImage && <meta name="twitter:image:alt" content={finalImageAlt} />}

      <meta property="article:publisher" content={SITE_URL} />
      <meta name="application-name" content={SITE_NAME} />

      {schemasArray.map((item, index) => (
        <script key={`${pathname}-schema-${index}`} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;