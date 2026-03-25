/* eslint-disable no-undef */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_BASE_URL = "https://livingroom.immo";
const CARD_BASE_URL = "https://card.livingroom.immo";

const PAGES_DIR = path.join(__dirname, "src", "pages");
const DIST_DIR = path.join(__dirname, "dist");

const SITEMAP_INDEX_FILE = path.join(DIST_DIR, "sitemap.xml");
const SITEMAP_PAGES_FILE = path.join(DIST_DIR, "sitemap-pages.xml");
const SITEMAP_CVD_FILE = path.join(DIST_DIR, "sitemap-cvd.xml");
const ROBOTS_FILE = path.join(DIST_DIR, "robots.txt");

/**
 * IMPORTANT :
 * - true  => génère aussi sitemap-cvd.xml
 * - false => ne génère PAS le sitemap CVD
 *
 * Mets cette valeur à false si tes cartes digitales sont en noindex
 * ou si tu ne veux plus pousser card.livingroom.immo au crawl.
 */
const ENABLE_CVD_SITEMAP = true;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

/**
 * Pages à exclure du sitemap principal.
 * On ne met que les pages réellement indexables.
 */
const EXCLUDED_PAGE_NAMES = new Set([
  "404",
  "AuthCallbackPage",
  "AuthPage",
  "CreateAdminPage",
  "EmailConfirmationPage",
  "PasswordRecoveryPage",
  "SupabaseDebugPage",
  "SupabaseVerifyRedirectPage",

  "AdminDashboardPage",
  "AdminProfessionnelValidationPage",
  "AdminProjectsViewPage",
  "AdminConnectionsViewPage",
  "AdminParticuliersViewPage",
  "AdminNotificationLogsPage",
  "AdminDirectLeadsPage",
  "AdminWebsitePicturesPage",
  "AdminClientsViewPage",

  "ParticulierDashboardPage",
  "ParticulierConnectionsPage",
  "ParticulierProjectsPage",
  "ParticulierRequestsPage",
  "ParticulierAlertsPage",

  "ProfessionnelDashboardPage",
  "ProfessionnelProfilePage",
  "ProfessionnelConnectionsPage",
  "ProfessionnelDirectLeadsPage",
  "ProfessionnelProfessionalMarketplacePage",
  "ProfessionnelAlertsPage",
  "ProfessionnelSharedProjectsPage",
  "ProfessionnelPartnerPage",
  "ProfessionnelShowcasePage",

  "ProjectOwnerPage",
  "ProjectOwnerConnectionsPage",
  "ProjectFirstFlowPage",
  "ContactProjectGatePage",
  "ChatPage",
  "MatchingPage",
  "DirectLeadFormPage",
  "StandaloneDigitalBusinessCardPage",
  "StandaloneProjectPage",
  "SignUpProPage",
  "SubscriptionPage",
  "MonEspaceRedirectPage",
  "ProPremiumRedirectPage",

  "AgencyInvitationPage",
  "AgencyAccountCreationPage",
  "AgencyCreateAccountPage",
  "AgencyFinalizePage",
  "AgencyNetworkPage",
  "AgencyLeadPage",
  "AgencyProjectsPilotPage",
  "AgencySubscriptionPage",
  "AgencyStatisticsPage",
  "AgencyAgentsPage",
  "AgencyContactsPage",

  "AgentConnectionsPage",
  "AgentDirectProjectsPage",
  "AgentDigitalBusinessCardPage",
  "AgentProjectSubmissionWithCardPage",
  "AgentSubmitProjectPage",
  "AgentConnectionsPage",

  "ProfessionnelReferralLinkPage",
  "CvdQrRedirectPage",
]);

/**
 * Mapping explicite recommandé pour les pages stratégiques.
 * On évite de laisser trop de routes "déduites automatiquement".
 */
const STATIC_ROUTE_MAP = {
  HomePage: "/",
  AboutPage: "/a-propos",
  BlogPage: "/blog",
  BlogIndexPage: "/blog",

  CGUPage: "/cgu",
  CGVPage: "/cgv",
  MentionsLegalesPage: "/mentions-legales",
  ConfidentialitePage: "/confidentialite",

  ProDeImmoPage: "/pro-de-limmo",
  AgentImmobilierPage: "/agent-immobilier",
  AgentsImmobiliersParVillePage: "/agents-immobiliers-par-ville",
  ProspectsImmobiliersPage: "/prospects-immobiliers",

  // À inclure seulement si tu veux vraiment indexer cette page
  PublicProjectsMarketplacePage: "/place-des-projets",

  AgentImmobilierParisPage: "/agent-immobilier-paris",
  AgentImmobilierLyonPage: "/agent-immobilier-lyon",
  AgentImmobilierBordeauxPage: "/agent-immobilier-bordeaux",
  AgentImmobilierNicePage: "/agent-immobilier-nice",
  AgentImmobilierLillePage: "/agent-immobilier-lille",
  AgentImmobilierNantesPage: "/agent-immobilier-nantes",
  AgentImmobilierRennesPage: "/agent-immobilier-rennes",
  AgentImmobilierNancyPage: "/agent-immobilier-nancy",
  AgentImmobilierMetzPage: "/agent-immobilier-metz",

  AcheterImmobilierParisPage: "/acheter-immobilier-paris",
  AcheterImmobilierLyonPage: "/acheter-immobilier-lyon",
  AcheterImmobilierBordeauxPage: "/acheter-immobilier-bordeaux",
  AcheterImmobilierNicePage: "/acheter-immobilier-nice",
  AcheterImmobilierLillePage: "/acheter-immobilier-lille",
  AcheterImmobilierNantesPage: "/acheter-immobilier-nantes",
  AcheterImmobilierRennesPage: "/acheter-immobilier-rennes",
  AcheterImmobilierNancyPage: "/acheter-immobilier-nancy",
  AcheterImmobilierMetzPage: "/acheter-immobilier-metz",

  VendreImmobilierParisPage: "/vendre-immobilier-paris",
  VendreImmobilierLyonPage: "/vendre-immobilier-lyon",
  VendreImmobilierBordeauxPage: "/vendre-immobilier-bordeaux",
  VendreImmobilierNicePage: "/vendre-immobilier-nice",
  VendreImmobilierLillePage: "/vendre-immobilier-lille",
  VendreImmobilierNantesPage: "/vendre-immobilier-nantes",
  VendreImmobilierRennesPage: "/vendre-immobilier-rennes",
  VendreImmobilierNancyPage: "/vendre-immobilier-nancy",
  VendreImmobilierMetzPage: "/vendre-immobilier-metz",

  // Exemple si tu veux indexer une page locale supplémentaire
  ImmobilierReimsPage: "/immobilier-reims",
};

const MANUAL_ROUTES = [
  // N’ajoute ici que des routes qui existent VRAIMENT.
  // Si tu n’as pas encore créé ces pages, ne les mets pas.
  // {
  //   loc: `${SITE_BASE_URL}/acheter-immobilier`,
  //   changefreq: "monthly",
  //   priority: "0.5",
  // },
];

/**
 * Routes automatiquement exclues si jamais une page non mappée est détectée.
 * Ça évite de polluer le sitemap avec des pages techniques.
 */
const EXCLUDED_ROUTE_PREFIXES = [
  "/admin",
  "/dashboard",
  "/mon-espace",
  "/auth",
  "/login",
  "/signup",
  "/sign-up",
  "/reset-password",
  "/forgot-password",
  "/checkout",
  "/payment",
  "/callback",
  "/supabase-debug",
  "/preciser-projet",
  "/carte-visite-digitale",
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function toIsoDate(input) {
  if (!input) return new Date().toISOString();
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

function buildUrlEntry({ loc, lastmod, changefreq, priority }) {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    ${lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : ""}
    ${changefreq ? `<changefreq>${escapeXml(changefreq)}</changefreq>` : ""}
    ${priority !== undefined ? `<priority>${priority}</priority>` : ""}
  </url>`;
}

function buildSitemapXml(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>
`;
}

function buildSitemapIndexXml(sitemaps) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps
      .map(
        (item) => `  <sitemap>
    <loc>${escapeXml(item.loc)}</loc>
    <lastmod>${escapeXml(item.lastmod)}</lastmod>
  </sitemap>`
      )
      .join("\n")}
</sitemapindex>
`;
}

function normalizeRoute(route) {
  if (!route) return null;

  let value = String(route).trim();
  if (!value.startsWith("/")) value = `/${value}`;
  value = value.replace(/\/{2,}/g, "/");

  if (value.length > 1) {
    value = value.replace(/\/+$/, "");
  }

  return value;
}

function defaultRouteFromPageName(name) {
  return normalizeRoute(
    "/" +
    name
      .replace(/Page$/, "")
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .toLowerCase()
  );
}

function shouldSkipPageFile(fileName, filePath) {
  if (!fileName.endsWith(".jsx")) return true;
  if (!fs.existsSync(filePath)) return true;
  if (fs.statSync(filePath).isDirectory()) return true;

  // Fichiers dynamiques style [slug].jsx
  if (path.parse(fileName).name.startsWith("[")) return true;

  return false;
}

function isIndexableRoute(route) {
  const normalized = normalizeRoute(route);
  if (!normalized) return false;

  if (normalized.includes(":")) return false;
  if (normalized.includes("{") || normalized.includes("}")) return false;
  if (normalized.includes("[") || normalized.includes("]")) return false;
  if (normalized.includes("?")) return false;

  if (
    EXCLUDED_ROUTE_PREFIXES.some(
      (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`)
    )
  ) {
    return false;
  }

  return true;
}

function getPriorityForRoute(route) {
  if (route === "/") return "1.0";
  if (route === "/pro-de-limmo") return "0.9";
  if (route === "/prospects-immobiliers") return "0.9";
  if (route === "/blog") return "0.8";
  if (route.startsWith("/agent-immobilier-")) return "0.8";
  if (route.startsWith("/acheter-immobilier-")) return "0.8";
  if (route.startsWith("/vendre-immobilier-")) return "0.8";
  return "0.7";
}

function getChangefreqForRoute(route) {
  if (route === "/") return "daily";
  if (route === "/blog") return "weekly";
  if (route.startsWith("/blog")) return "weekly";
  return "weekly";
}

function getStaticPageRoutes() {
  const routes = new Map();
  const files = fs.readdirSync(PAGES_DIR);

  for (const file of files) {
    const filePath = path.join(PAGES_DIR, file);

    if (shouldSkipPageFile(file, filePath)) continue;

    const pageName = path.parse(file).name;
    if (EXCLUDED_PAGE_NAMES.has(pageName)) continue;

    const mappedRoute =
      STATIC_ROUTE_MAP[pageName] ||
      (pageName === "HomePage" ? "/" : defaultRouteFromPageName(pageName));

    const route = normalizeRoute(mappedRoute);
    if (!route || !isIndexableRoute(route)) continue;

    const loc = `${SITE_BASE_URL}${route}`;

    routes.set(loc, {
      loc,
      lastmod: toIsoDate(fs.statSync(filePath).mtime),
      changefreq: getChangefreqForRoute(route),
      priority: getPriorityForRoute(route),
    });
  }

  for (const item of MANUAL_ROUTES) {
    const loc = String(item?.loc || "").trim();
    if (!loc) continue;

    routes.set(loc, {
      loc,
      lastmod: toIsoDate(item.lastmod || new Date()),
      changefreq: item.changefreq || "weekly",
      priority: item.priority ?? "0.7",
    });
  }

  return Array.from(routes.values()).sort((a, b) => a.loc.localeCompare(b.loc));
}

function getSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return null;
  }

  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function getCvdRoutes() {
  if (!ENABLE_CVD_SITEMAP) {
    return [];
  }

  const supabase = getSupabaseClient();

  if (!supabase) {
    console.warn(
      "⚠️ Supabase non configuré pour le sitemap CVD. Ajoute VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (ou VITE_SUPABASE_ANON_KEY)."
    );
    return [];
  }

  const allRows = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("professionnels")
      .select("card_slug, updated_at, is_public, is_active, is_archived, validation_status")
      .eq("is_public", true)
      .eq("is_active", true)
      .or("is_archived.is.null,is_archived.eq.false")
      .eq("validation_status", "validated")
      .not("card_slug", "is", null)
      .range(from, from + pageSize - 1);

    if (error) {
      console.error("❌ Erreur récupération CVD depuis Supabase :", error);
      return [];
    }

    const batch = Array.isArray(data) ? data : [];
    allRows.push(...batch);

    if (batch.length < pageSize) break;
    from += pageSize;
  }

  const unique = new Map();

  for (const row of allRows) {
    const slug = String(row?.card_slug || "").trim();
    if (!slug) continue;

    const loc = `${CARD_BASE_URL}/cvd/${encodeURIComponent(slug)}`;

    unique.set(loc, {
      loc,
      lastmod: toIsoDate(row?.updated_at),
      changefreq: "weekly",
      priority: "0.7",
    });
  }

  return Array.from(unique.values()).sort((a, b) => a.loc.localeCompare(b.loc));
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, "utf8");
}

function generateRobotsTxt() {
  return `User-agent: *
Allow: /

Disallow: /admin
Disallow: /dashboard
Disallow: /mon-espace
Disallow: /auth
Disallow: /login
Disallow: /signup
Disallow: /sign-up
Disallow: /reset-password
Disallow: /forgot-password
Disallow: /checkout
Disallow: /payment
Disallow: /supabase-debug

Sitemap: ${SITE_BASE_URL}/sitemap.xml
`;
}

async function generateSitemaps() {
  try {
    ensureDir(DIST_DIR);

    const staticPages = getStaticPageRoutes();
    const cvdPages = await getCvdRoutes();

    const pagesXml = buildSitemapXml(
      staticPages.map((entry) => buildUrlEntry(entry))
    );

    writeFile(SITEMAP_PAGES_FILE, pagesXml);

    const nowIso = toIsoDate();
    const sitemapIndexEntries = [
      {
        loc: `${SITE_BASE_URL}/sitemap-pages.xml`,
        lastmod: nowIso,
      },
    ];

    if (ENABLE_CVD_SITEMAP) {
      const cvdXml = buildSitemapXml(
        cvdPages.map((entry) => buildUrlEntry(entry))
      );

      writeFile(SITEMAP_CVD_FILE, cvdXml);

      sitemapIndexEntries.push({
        loc: `${SITE_BASE_URL}/sitemap-cvd.xml`,
        lastmod: nowIso,
      });
    }

    const sitemapIndexXml = buildSitemapIndexXml(sitemapIndexEntries);

    writeFile(SITEMAP_INDEX_FILE, sitemapIndexXml);
    writeFile(ROBOTS_FILE, generateRobotsTxt());

    console.log(`✅ Sitemap index generated: ${SITEMAP_INDEX_FILE}`);
    console.log(`✅ Static pages sitemap: ${SITEMAP_PAGES_FILE} (${staticPages.length} URLs)`);

    if (ENABLE_CVD_SITEMAP) {
      console.log(`✅ CVD sitemap: ${SITEMAP_CVD_FILE} (${cvdPages.length} URLs)`);
    } else {
      console.log("ℹ️ CVD sitemap disabled.");
    }

    console.log(`✅ Robots.txt generated: ${ROBOTS_FILE}`);
  } catch (error) {
    console.error("❌ Error generating sitemap files:", error);
    process.exitCode = 1;
  }
}

generateSitemaps();