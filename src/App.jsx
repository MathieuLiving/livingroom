import React, { useEffect, Suspense, lazy, useMemo, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
  useParams,
  Link,
} from "react-router-dom";
import { motion } from "framer-motion";
import { HelmetProvider } from "react-helmet-async";
import { Loader2 } from "lucide-react";
import { QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "./components/ui/toaster";
import { AuthProvider, useAuth } from "./contexts/SupabaseAuthContext";

import Header from "./components/Header";
import Footer from "./components/Footer";
import RequireAdmin from "./components/RequireAdmin";
import RequirePro from "./components/RequirePro";
import RequireParticulier from "./components/RequireParticulier";

import { getNeutralMode } from "./utils/cvdContext";

import { Button } from "./components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./components/ui/dialog";
import { Switch } from "./components/ui/switch";
import { Label } from "./components/ui/label";

import { queryClient } from "./lib/queryClient";

const COOKIE_CONSENT_KEY = "lr_cookie_consent_v1";

function readCookieConsent() {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCookieConsent(next) {
  const payload = {
    necessary: true,
    analytics: Boolean(next?.analytics),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(payload));
  return payload;
}

const AnalyticsLoader = () => {
  const [consent, setConsent] = useState(null);

  useEffect(() => {
    setConsent(readCookieConsent());
  }, []);

  return null;
};

const CookieBanner = ({ privacyPath = "/confidentialite" }) => {
  const [consent, setConsent] = useState(null);
  const [open, setOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    const current = readCookieConsent();
    setConsent(current);
    setAnalytics(Boolean(current?.analytics));
  }, []);

  if (consent) return null;

  const acceptAll = () => {
    const saved = writeCookieConsent({ analytics: true });
    setConsent(saved);
  };

  const refuseAll = () => {
    const saved = writeCookieConsent({ analytics: false });
    setConsent(saved);
  };

  const savePrefs = () => {
    const saved = writeCookieConsent({ analytics });
    setConsent(saved);
    setOpen(false);
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground leading-relaxed">
            LivingRoom.immo utilise des cookies nécessaires au fonctionnement du
            site et, avec votre accord, des cookies de mesure d&apos;audience.{" "}
            <Link
              to={privacyPath}
              className="underline underline-offset-2 hover:opacity-80"
            >
              En savoir plus
            </Link>
            .
          </p>

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <Button variant="secondary" onClick={refuseAll}>
              Refuser
            </Button>
            <Button variant="outline" onClick={() => setOpen(true)}>
              Paramétrer
            </Button>
            <Button onClick={acceptAll}>Accepter</Button>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Paramètres des cookies</DialogTitle>
            <DialogDescription>
              Vous pouvez choisir d&apos;autoriser ou non les cookies de mesure
              d&apos;audience. Les cookies nécessaires sont toujours actifs.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-1">
                <Label className="text-sm">Cookies nécessaires</Label>
                <p className="text-xs text-muted-foreground">
                  Indispensables au fonctionnement du site.
                </p>
              </div>
              <Switch checked disabled aria-readonly />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-1">
                <Label className="text-sm">Mesure d&apos;audience</Label>
                <p className="text-xs text-muted-foreground">
                  Nous aide à comprendre l&apos;usage du site (statistiques).
                </p>
              </div>
              <Switch checked={analytics} onCheckedChange={setAnalytics} />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="secondary"
              onClick={() => {
                const saved = writeCookieConsent({ analytics: false });
                setConsent(saved);
                setOpen(false);
              }}
            >
              Tout refuser
            </Button>
            <Button variant="outline" onClick={savePrefs}>
              Enregistrer
            </Button>
            <Button
              onClick={() => {
                const saved = writeCookieConsent({ analytics: true });
                setConsent(saved);
                setOpen(false);
              }}
            >
              Tout accepter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Lazy imports
const HomePage = lazy(() =>
  import("./pages/HomePage").then((module) => ({ default: module.default }))
);
const ProjectOwnerPage = lazy(() =>
  import("./pages/ProjectOwnerPage").then((module) => ({
    default: module.default,
  }))
);
const ParticulierDashboardPage = lazy(() =>
  import("./pages/ParticulierDashboardPage").then((module) => ({
    default: module.default,
  }))
);
const ProfessionnelDashboardPage = lazy(() =>
  import("./pages/ProfessionnelDashboardPage").then((module) => ({
    default: module.default,
  }))
);
const ProDeImmoPage = lazy(() =>
  import("./pages/ProDeImmoPage").then((module) => ({
    default: module.default,
  }))
);
const ProfessionnelProfilePage = lazy(() =>
  import("./pages/ProfessionnelProfilePage").then((module) => ({
    default: module.default,
  }))
);

const PublicProjectsMarketplacePage = lazy(() =>
  import("./pages/PublicProjectsMarketplacePage").then((module) => ({
    default: module.default,
  }))
);
const SubscriptionPage = lazy(() =>
  import("./pages/SubscriptionPage").then((module) => ({
    default: module.default,
  }))
);
const MatchingPage = lazy(() =>
  import("./pages/MatchingPage").then((module) => ({
    default: module.default,
  }))
);
const ProfessionnelConnectionsPage = lazy(() =>
  import("./pages/ProfessionnelConnectionsPage").then((module) => ({
    default: module.default,
  }))
);

const AdminDashboardPage = lazy(() =>
  import("./pages/AdminDashboardPage").then((module) => ({
    default: module.default,
  }))
);
const AdminProfessionnelValidationPage = lazy(() =>
  import("./pages/AdminProfessionnelValidationPage").then((module) => ({
    default: module.default,
  }))
);
const AdminProjectsViewPage = lazy(() =>
  import("./pages/AdminProjectsViewPage").then((module) => ({
    default: module.default,
  }))
);
const AdminConnectionsViewPage = lazy(() =>
  import("./pages/AdminConnectionsViewPage").then((module) => ({
    default: module.default,
  }))
);
const AdminParticuliersViewPage = lazy(() =>
  import("./pages/AdminParticuliersViewPage").then((module) => ({
    default: module.default,
  }))
);
const AdminNotificationLogsPage = lazy(() =>
  import("./pages/AdminNotificationLogsPage").then((module) => ({
    default: module.default,
  }))
);
const AdminDirectLeadsPage = lazy(() =>
  import("./pages/AdminDirectLeadsPage").then((module) => ({
    default: module.default,
  }))
);
const AdminWebsitePicturesPage = lazy(() =>
  import("./pages/AdminWebsitePicturesPage").then((module) => ({
    default: module.default,
  }))
);

const ProfessionnelDirectLeadsPage = lazy(() =>
  import("./pages/ProfessionnelDirectLeadsPage").then((module) => ({
    default: module.default,
  }))
);
const ProfessionnelProfessionalMarketplacePage = lazy(() =>
  import("./pages/ProfessionnelProfessionalMarketplacePage").then((module) => ({
    default: module.default,
  }))
);
const StandaloneDigitalBusinessCardPage = lazy(() =>
  import("./pages/StandaloneDigitalBusinessCardPage").then((module) => ({
    default: module.default,
  }))
);
const CvdQrRedirectPage = lazy(() =>
  import("./pages/CvdQrRedirectPage").then((module) => ({
    default: module.default,
  }))
);
const StandaloneProjectPage = lazy(() =>
  import("./pages/StandaloneProjectPage").then((module) => ({
    default: module.default,
  }))
);

const AgentImmobilierPage = lazy(() =>
  import("./pages/AgentImmobilierPage").then((module) => ({
    default: module.default,
  }))
);
const AgentImmobilierParisPage = lazy(() =>
  import("./pages/AgentImmobilierParisPage").then((module) => ({
    default: module.default,
  }))
);
const AgentImmobilierLyonPage = lazy(() =>
  import("./pages/AgentImmobilierLyonPage").then((module) => ({
    default: module.default,
  }))
);
const AgentImmobilierBordeauxPage = lazy(() =>
  import("./pages/AgentImmobilierBordeauxPage").then((module) => ({
    default: module.default,
  }))
);
const AgentImmobilierNicePage = lazy(() =>
  import("./pages/AgentImmobilierNicePage").then((module) => ({
    default: module.default,
  }))
);
const AgentImmobilierLillePage = lazy(() =>
  import("./pages/AgentImmobilierLillePage").then((module) => ({
    default: module.default,
  }))
);
const AgentImmobilierNantesPage = lazy(() =>
  import("./pages/AgentImmobilierNantesPage").then((module) => ({
    default: module.default,
  }))
);
const AgentImmobilierRennesPage = lazy(() =>
  import("./pages/AgentImmobilierRennesPage").then((module) => ({
    default: module.default,
  }))
);
const AgentImmobilierNancyPage = lazy(() =>
  import("./pages/AgentImmobilierNancyPage").then((module) => ({
    default: module.default,
  }))
);
const AgentImmobilierMetzPage = lazy(() =>
  import("./pages/AgentImmobilierMetzPage").then((module) => ({
    default: module.default,
  }))
);

const AcheterImmobilierParisPage = lazy(() =>
  import("./pages/AcheterImmobilierParisPage").then((module) => ({
    default: module.default,
  }))
);
const AcheterImmobilierLyonPage = lazy(() =>
  import("./pages/AcheterImmobilierLyonPage").then((module) => ({
    default: module.default,
  }))
);
const AcheterImmobilierBordeauxPage = lazy(() =>
  import("./pages/AcheterImmobilierBordeauxPage").then((module) => ({
    default: module.default,
  }))
);
const AcheterImmobilierNicePage = lazy(() =>
  import("./pages/AcheterImmobilierNicePage").then((module) => ({
    default: module.default,
  }))
);
const AcheterImmobilierLillePage = lazy(() =>
  import("./pages/AcheterImmobilierLillePage").then((module) => ({
    default: module.default,
  }))
);
const AcheterImmobilierNantesPage = lazy(() =>
  import("./pages/AcheterImmobilierNantesPage").then((module) => ({
    default: module.default,
  }))
);
const AcheterImmobilierRennesPage = lazy(() =>
  import("./pages/AcheterImmobilierRennesPage").then((module) => ({
    default: module.default,
  }))
);
const AcheterImmobilierNancyPage = lazy(() =>
  import("./pages/AcheterImmobilierNancyPage").then((module) => ({
    default: module.default,
  }))
);
const AcheterImmobilierMetzPage = lazy(() =>
  import("./pages/AcheterImmobilierMetzPage").then((module) => ({
    default: module.default,
  }))
);

const VendreImmobilierParisPage = lazy(() =>
  import("./pages/VendreImmobilierParisPage").then((module) => ({
    default: module.default,
  }))
);
const VendreImmobilierLyonPage = lazy(() =>
  import("./pages/VendreImmobilierLyonPage").then((module) => ({
    default: module.default,
  }))
);
const VendreImmobilierBordeauxPage = lazy(() =>
  import("./pages/VendreImmobilierBordeauxPage").then((module) => ({
    default: module.default,
  }))
);
const VendreImmobilierNicePage = lazy(() =>
  import("./pages/VendreImmobilierNicePage").then((module) => ({
    default: module.default,
  }))
);
const VendreImmobilierLillePage = lazy(() =>
  import("./pages/VendreImmobilierLillePage").then((module) => ({
    default: module.default,
  }))
);
const VendreImmobilierNantesPage = lazy(() =>
  import("./pages/VendreImmobilierNantesPage").then((module) => ({
    default: module.default,
  }))
);
const VendreImmobilierRennesPage = lazy(() =>
  import("./pages/VendreImmobilierRennesPage").then((module) => ({
    default: module.default,
  }))
);
const VendreImmobilierNancyPage = lazy(() =>
  import("./pages/VendreImmobilierNancyPage").then((module) => ({
    default: module.default,
  }))
);
const VendreImmobilierMetzPage = lazy(() =>
  import("./pages/VendreImmobilierMetzPage").then((module) => ({
    default: module.default,
  }))
);

const AgentsImmobiliersParVillePage = lazy(() =>
  import("./pages/AgentsImmobiliersParVillePage").then((module) => ({
    default: module.default,
  }))
);

const BlogPage = lazy(() =>
  import("./pages/BlogPage").then((module) => ({ default: module.default }))
);
const AboutPage = lazy(() =>
  import("./pages/AboutPage").then((module) => ({ default: module.default }))
);
const PasswordRecoveryPage = lazy(() =>
  import("./pages/PasswordRecoveryPage").then((module) => ({
    default: module.default,
  }))
);
const EmailConfirmationPage = lazy(() =>
  import("./pages/EmailConfirmationPage").then((module) => ({
    default: module.default,
  }))
);
const ChatPage = lazy(() =>
  import("./pages/ChatPage").then((module) => ({ default: module.default }))
);
const CreateAdminPage = lazy(() =>
  import("./pages/CreateAdminPage").then((module) => ({
    default: module.default,
  }))
);

const AuthCallbackPage = lazy(() =>
  import("./pages/AuthCallbackPage").then((module) => ({
    default: module.default,
  }))
);
const SupabaseVerifyRedirectPage = lazy(() =>
  import("./pages/SupabaseVerifyRedirectPage").then((module) => ({
    default: module.default,
  }))
);

const ProfessionnelPartnerPage = lazy(() =>
  import("./pages/ProfessionnelPartnerPage").then((module) => ({
    default: module.default,
  }))
);
const ProfessionnelShowcasePage = lazy(() =>
  import("./pages/ProfessionnelShowcasePage").then((module) => ({
    default: module.default,
  }))
);
const ProfessionnelSharedProjectsPage = lazy(() =>
  import("./pages/ProfessionnelSharedProjectsPage").then((module) => ({
    default: module.default,
  }))
);
const ProfessionnelFeaturedProjectsPage = lazy(() =>
  import("./pages/pro/ProfessionnelFeaturedProjectsPage").then((module) => ({
    default: module.default,
  }))
);
const ProfessionnelFeaturedProjectDetailPage = lazy(() =>
  import("./pages/pro/ProfessionnelFeaturedProjectDetailPage").then(
    (module) => ({
      default: module.default,
    })
  )
);

const SignUpProPage = lazy(() =>
  import("./pages/SignUpProPage").then((module) => ({
    default: module.default,
  }))
);
const DirectLeadFormPage = lazy(() =>
  import("./pages/DirectLeadFormPage").then((module) => ({
    default: module.default,
  }))
);
const ContactProjectGatePage = lazy(() =>
  import("./pages/ContactProjectGatePage").then((module) => ({
    default: module.default,
  }))
);
const ProfessionnelAlertsPage = lazy(() =>
  import("./pages/ProfessionnelAlertsPage").then((module) => ({
    default: module.default,
  }))
);
const ProjectFirstFlowPage = lazy(() =>
  import("./pages/ProjectFirstFlowPage").then((module) => ({
    default: module.default,
  }))
);
const AuthPage = lazy(() =>
  import("./pages/AuthPage").then((module) => ({ default: module.default }))
);
const SupabaseDebugPage = lazy(() =>
  import("./pages/SupabaseDebugPage").then((module) => ({
    default: module.default,
  }))
);
const ProPremiumRedirectPage = lazy(() =>
  import("./pages/ProPremiumRedirectPage").then((module) => ({
    default: module.default,
  }))
);

const ProspectsImmobiliersPage = lazy(() =>
  import("./pages/ProspectsImmobiliersPage").then((module) => ({
    default: module.default,
  }))
);
const AgencyNetworkPage = lazy(() =>
  import("./pages/AgencyNetworkPage").then((module) => ({
    default: module.default,
  }))
);
const AgencyCreateAccountPage = lazy(() =>
  import("./pages/AgencyCreateAccountPage").then((module) => ({
    default: module.default,
  }))
);
const AgencyFinalizePage = lazy(() =>
  import("./pages/AgencyFinalizePage").then((module) => ({
    default: module.default,
  }))
);

const CGVPage = lazy(() =>
  import("./pages/CGVPage").then((module) => ({ default: module.default }))
);
const CGUPage = lazy(() =>
  import("./pages/CGUPage").then((module) => ({ default: module.default }))
);
const MentionsLegalesPage = lazy(() =>
  import("./pages/MentionsLegalesPage").then((module) => ({
    default: module.default,
  }))
);
const ConfidentialitePage = lazy(() =>
  import("./pages/ConfidentialitePage").then((module) => ({
    default: module.default,
  }))
);

const ParticulierConnectionsPage = lazy(() =>
  import("./pages/ParticulierConnectionsPage").then((module) => ({
    default: module.default,
  }))
);
const ParticulierProjectsPage = lazy(() =>
  import("./pages/ParticulierProjectsPage").then((module) => ({
    default: module.default,
  }))
);
const ParticulierRequestsPage = lazy(() =>
  import("./pages/ParticulierRequestsPage").then((module) => ({
    default: module.default,
  }))
);
const ParticulierAlertsPage = lazy(() =>
  import("./pages/ParticulierAlertsPage").then((module) => ({
    default: module.default,
  }))
);

const AgencyAgentsPage = lazy(() =>
  import("./pages/agence/AgencyAgentsPage").then((module) => ({
    default: module.default,
  }))
);
const AgencyContactsPage = lazy(() =>
  import("./pages/agence/AgencyContactsPage").then((module) => ({
    default: module.default,
  }))
);
const DirectorTeamSetupPage = lazy(() =>
  import("./pages/agence/DirectorTeamSetupPage").then((module) => ({
    default: module.default,
  }))
);
const AgencyLeadPage = lazy(() =>
  import("./pages/agence/AgencyLeadPage").then((module) => ({
    default: module.default,
  }))
);
const AgenceDirectorDashboardPage = lazy(() =>
  import("./pages/agence/AgenceDirectorDashboardPage").then((module) => ({
    default: module.default,
  }))
);
const AgenceTeamLeaderDashboardPage = lazy(() =>
  import("./pages/agence/AgenceTeamLeaderDashboardPage").then((module) => ({
    default: module.default,
  }))
);
const AgencyProjectsPilotPage = lazy(() =>
  import("./pages/agence/AgencyProjectsPilotPage").then((module) => ({
    default: module.default,
  }))
);

const AgencySpaceContainer = lazy(() =>
  import("./components/agence/AgencySpaceContainer").then((module) => ({
    default: module.default,
  }))
);

const AgencyInvitationPage = lazy(() =>
  import("./pages/agence/AgencyInvitationPage").then((module) => ({
    default: module.default,
  }))
);
const AgencyAccountCreationPage = lazy(() =>
  import("./pages/agence/AgencyAccountCreationPage").then((module) => ({
    default: module.default,
  }))
);

const MonEspaceRedirectPage = lazy(() =>
  import("./pages/MonEspaceRedirectPage").then((module) => ({
    default: module.default,
  }))
);

const NotFoundPage = lazy(() =>
  import("./pages/NotFoundPage").then((module) => ({
    default: module.default,
  }))
);

const FullscreenLoader = () => (
  <div className="fixed inset-0 bg-white bg-opacity-75 flex justify-center items-center z-50">
    <Loader2 className="h-12 w-12 animate-spin text-brand-blue" />
  </div>
);

const norm = (v) => String(v ?? "").trim().toLowerCase();
const isSafeInternalPath = (p) =>
  typeof p === "string" &&
  p.startsWith("/") &&
  !p.startsWith("//") &&
  !p.includes("\\");

const getHostname = () =>
  typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";

const LOCAL_CARD_HOSTS = new Set(["localhost", "127.0.0.1"]);
const PROD_CARD_HOSTS = new Set(["card.livingroom.immo"]);

const RESERVED_ROUTE_SEGMENTS = new Set([
  "agence",
  "agence-lead",
  "admin",
  "admin-dashboard",
  "administration",
  "dashboard",
  "pro",
  "pro-de-limmo",
  "professionnel-dashboard",
  "dashboard-particulier",
  "mon-espace",
  "connexion",
  "inscription",
  "auth",
  "cvd",
  "qr",
  "livingroom",
  "place-des-projets",
  "projets",
  "direct-lead-form",
  "preciser-projet",
  "blog",
  "articles",
  "cgv",
  "cgu",
  "mentions-legales",
  "confidentialite",
  "matching",
  "chat",
  "nos-professionnels-partenaires",
  "professionnel-showcase",
  "projet_immo",
  "supabase-debug",
  "reseau-agences",
  "prospects-immobiliers",
  "agent-immobilier",
  "agents-immobiliers",
  "agents-immobiliers-par-ville",
  "particuliers",
  "particulier",
  "professionnel",
  "demandes",
  "alertes",
  "confirmation",
  "recuperation-mot-de-passe",
  "a-propos",
  "go",
  "admin-images",
  "admin-dashboard-images",
  "agency-dashboard",
  "agency-invitation",
  "agency-account-creation",
  "acheter-immobilier",
  "vendre-immobilier",
]);

const normalizeSlugPart = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const isReservedRouteSegment = (value) =>
  RESERVED_ROUTE_SEGMENTS.has(normalizeSlugPart(value));

const looksLikeSafeSlug = (value) => {
  const v = String(value || "").trim();
  if (!v) return false;
  if (v.length < 2 || v.length > 120) return false;
  if (!/^[a-zA-Z0-9-]+$/.test(v)) return false;
  if (v.startsWith("-") || v.endsWith("-")) return false;
  if (v.includes("--")) return false;
  return true;
};

const isLikelyLegacyCombinedSlug = (value) => {
  const v = normalizeSlugPart(value);
  if (!looksLikeSafeSlug(v)) return false;
  if (isReservedRouteSegment(v)) return false;
  return v.includes("-") && v.length >= 6;
};

const isLikelyLegacyCompanyCardPath = (companySlug, cardSlug) => {
  const company = normalizeSlugPart(companySlug);
  const card = normalizeSlugPart(cardSlug);

  if (!looksLikeSafeSlug(company) || !looksLikeSafeSlug(card)) return false;
  if (isReservedRouteSegment(company) || isReservedRouteSegment(card)) return false;

  return company.includes("-") && card.length >= 3;
};

const isCardHost = () => {
  const host = getHostname();
  return PROD_CARD_HOSTS.has(host) || LOCAL_CARD_HOSTS.has(host);
};

const ExternalRedirect = ({ to }) => {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);

  return <FullscreenLoader />;
};

const LivingroomLegacyRedirect = () => {
  const { slug } = useParams();
  return <Navigate to={`/cvd/${slug}`} replace />;
};

const PreciserProjetLegacyRedirect = () => {
  const { professionnelId } = useParams();
  const location = useLocation();
  const qs = location.search || "";
  return <Navigate to={`/direct-lead-form/${professionnelId}${qs}`} replace />;
};

const CombinedSlugRedirect = () => {
  const { combinedSlug } = useParams();

  if (!isLikelyLegacyCombinedSlug(combinedSlug)) {
    return <Navigate to="/nos-professionnels-partenaires" replace />;
  }

  const parts = String(combinedSlug).split("-").filter(Boolean);
  const slug = parts[parts.length - 1];

  if (!looksLikeSafeSlug(slug) || isReservedRouteSegment(slug)) {
    return <Navigate to="/nos-professionnels-partenaires" replace />;
  }

  return <Navigate to={`/cvd/${slug}`} replace />;
};

const PartnerShowcaseSlugRedirect = () => {
  const { slug } = useParams();
  const location = useLocation();
  const qs = location.search || "";
  if (!slug) return <Navigate to="/nos-professionnels-partenaires" replace />;
  return (
    <Navigate
      to={`/nos-professionnels-partenaires/slug/${slug}${qs}`}
      replace
    />
  );
};

const CardHostHomePage = () => {
  return <Navigate to="/nos-professionnels-partenaires" replace />;
};

const MainToCardSlugRedirect = () => {
  const { slug } = useParams();
  if (!slug) return <Navigate to="/" replace />;
  return (
    <ExternalRedirect
      to={`https://card.livingroom.immo/cvd/${encodeURIComponent(slug)}`}
    />
  );
};

const MainToCardQrRedirect = () => {
  const { slug } = useParams();
  if (!slug) return <Navigate to="/" replace />;
  return (
    <ExternalRedirect
      to={`https://card.livingroom.immo/qr/${encodeURIComponent(slug)}`}
    />
  );
};

const MainToCardLegacyCompanyRedirect = () => {
  const { companySlug, cardSlug } = useParams();

  if (!isLikelyLegacyCompanyCardPath(companySlug, cardSlug)) {
    return <Navigate to="/" replace />;
  }

  return (
    <ExternalRedirect
      to={`https://card.livingroom.immo/cvd/${encodeURIComponent(cardSlug)}`}
    />
  );
};

const MainToCardCombinedRedirect = () => {
  const { combinedSlug } = useParams();

  if (!isLikelyLegacyCombinedSlug(combinedSlug)) {
    return <NotFoundPage />;
  }

  return (
    <Navigate to="/nos-professionnels-partenaires" replace />
  );
};

const RequireAgencyRole = ({
  children,
  fallback = "/professionnel-dashboard",
  allowedRoles = ["director", "team_leader"],
}) => {
  const { isAuthBusy, user, userType, pro, proRole } = useAuth();

  const allowSet = useMemo(
    () => new Set(allowedRoles.map(norm)),
    [allowedRoles]
  );

  if (isAuthBusy) return <FullscreenLoader />;

  if (!user?.id) return <Navigate to="/connexion?role=professionnel" replace />;

  if (norm(userType) !== "professionnel")
    return <Navigate to={fallback} replace />;
  if (!pro?.id) return <Navigate to={fallback} replace />;
  if (!pro?.agency_id) return <Navigate to={fallback} replace />;

  const r = norm(proRole);
  if (!r || !allowSet.has(r)) return <Navigate to={fallback} replace />;

  return children;
};

const Layout = ({ children }) => {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  const cvdFlow = Boolean(getNeutralMode(location.pathname, location.search));

  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const forceLayout =
    params.get("layout") === "1" || location.state?.layout === true;

  const cardHost = isCardHost();

  const isStandaloneCardPath =
    location.pathname.startsWith("/carte-visite-digitale/") ||
    location.pathname.startsWith("/cvd/") ||
    location.pathname.startsWith("/livingroom/") ||
    location.pathname.startsWith("/qr/");

  const isStandaloneProjectPath =
    location.pathname.startsWith("/projet_immo/");

  const RESERVED_TOP_LEVEL = Array.from(RESERVED_ROUTE_SEGMENTS);

  const isCanonicalCard =
    pathSegments.length === 2 && !RESERVED_TOP_LEVEL.includes(pathSegments[0]);
  const isCombinedCardSlug =
    pathSegments.length === 1 && !RESERVED_TOP_LEVEL.includes(pathSegments[0]);

  const isDigitalCardRoute =
    cardHost || isStandaloneCardPath || isCanonicalCard || isCombinedCardSlug;

  const isDirectLeadForm =
    location.pathname.startsWith("/preciser-projet/") ||
    location.pathname.startsWith("/direct-lead-form");

  const isContactGate = location.pathname.includes("/contact");
  const isAuthPage = ["/connexion", "/inscription"].includes(location.pathname);
  const isProRedirect = location.pathname.startsWith("/go/pro");
  const isShowcasePage =
    location.pathname.startsWith("/nos-professionnels-partenaires") ||
    location.pathname.startsWith("/professionnel-showcase") ||
    location.pathname.startsWith("/pro/");
  const isInvitation =
    location.pathname.startsWith("/agency-invitation") ||
    location.pathname.startsWith("/agency-account-creation");

  const computedNoLayout =
    (isDigitalCardRoute && !forceLayout) ||
    isStandaloneProjectPath ||
    (isDirectLeadForm && !forceLayout) ||
    (isShowcasePage && cvdFlow && !forceLayout) ||
    isContactGate ||
    isAuthPage ||
    isProRedirect ||
    isInvitation ||
    location.pathname === "/auth/callback" ||
    location.pathname === "/auth/v1/verify";

  const noLayout = computedNoLayout;

  return (
    <motion.div
      key={location.pathname + location.search}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col"
    >
      {!noLayout && <Header />}
      <main className="flex-grow">{children}</main>
      {!noLayout && <Footer />}
      <Toaster />
    </motion.div>
  );
};

const AuthRedirector = () => {
  const { isAuthBusy, session, isAdmin, profile, userType } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthBusy) return;
    if (!session) return;

    const isAuthRoute =
      location.pathname === "/connexion" || location.pathname === "/inscription";
    if (!isAuthRoute) return;

    const params = new URLSearchParams(location.search);
    const next = params.get("next");

    if (isSafeInternalPath(next)) {
      navigate(next, { replace: true });
      return;
    }

    if (isAdmin) {
      navigate("/admin-dashboard", { replace: true });
      return;
    }

    const t = norm(userType || profile?.role);

    if (t === "professionnel" || t === "pro") {
      navigate("/mon-espace", { replace: true });
      return;
    }

    if (t === "particulier") {
      navigate("/dashboard-particulier", { replace: true });
      return;
    }

    navigate("/mon-espace", { replace: true });
  }, [
    isAuthBusy,
    session,
    isAdmin,
    profile,
    userType,
    navigate,
    location.pathname,
    location.search,
  ]);

  return null;
};

const ChatGate = ({ children }) => {
  const { isAuthBusy, user } = useAuth();
  const location = useLocation();

  if (isAuthBusy) return <FullscreenLoader />;

  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return (
      <Navigate to={`/connexion?role=professionnel&next=${next}`} replace />
    );
  }

  return children;
};

const MainSiteRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/supabase-debug" element={<SupabaseDebugPage />} />

      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/auth/v1/verify" element={<SupabaseVerifyRedirectPage />} />

      <Route path="/agency-invitation" element={<AgencyInvitationPage />} />
      <Route
        path="/agency-account-creation"
        element={<AgencyAccountCreationPage />}
      />

      <Route
        path="/administration"
        element={<Navigate to="/admin-dashboard" replace />}
      />
      <Route
        path="/administration/*"
        element={<Navigate to="/admin-dashboard" replace />}
      />
      <Route
        path="/dashboard"
        element={<Navigate to="/admin-dashboard" replace />}
      />
      <Route
        path="/dashboard/*"
        element={<Navigate to="/admin-dashboard" replace />}
      />

      <Route path="/mon-espace" element={<MonEspaceRedirectPage />} />

      <Route
        path="/prospects-immobiliers"
        element={<ProspectsImmobiliersPage />}
      />
      <Route path="/reseau-agences" element={<AgencyNetworkPage />} />
      <Route
        path="/reseau-agences/inscription"
        element={<AgencyCreateAccountPage />}
      />
      <Route
        path="/reseau-agences/finalisation"
        element={<AgencyFinalizePage />}
      />

      <Route path="/agence-lead" element={<AgencyLeadPage />} />
      <Route path="/agence-lead/" element={<AgencyLeadPage />} />
      <Route path="/agence-lead/*" element={<AgencyLeadPage />} />

      <Route
        path="/agence"
        element={
          <RequirePro mode="agency">
            <RequireAgencyRole>
              <Navigate to="/agence/dashboard" replace />
            </RequireAgencyRole>
          </RequirePro>
        }
      />

      <Route
        path="/agence/dashboard"
        element={
          <RequirePro mode="agency" allowRoles={["director"]}>
            <AgenceDirectorDashboardPage />
          </RequirePro>
        }
      />

      <Route
        path="/agency-dashboard"
        element={
          <RequirePro
            mode="agency"
            allowRoles={["director", "team_leader", "agent"]}
          >
            <AgencySpaceContainer />
          </RequirePro>
        }
      />

      <Route
        path="/agence/team-leader"
        element={
          <RequirePro mode="agency" allowRoles={["team_leader"]}>
            <AgenceTeamLeaderDashboardPage />
          </RequirePro>
        }
      />

      <Route
        path="/agence/agents"
        element={
          <RequirePro mode="agency" allowRoles={["director", "team_leader"]}>
            <AgencyAgentsPage />
          </RequirePro>
        }
      />

      <Route
        path="/agence/contacts"
        element={
          <RequirePro mode="agency" allowRoles={["director", "team_leader"]}>
            <AgencyContactsPage />
          </RequirePro>
        }
      />

      <Route
        path="/agence/configuration"
        element={
          <RequirePro mode="agency" allowRoles={["director"]}>
            <DirectorTeamSetupPage />
          </RequirePro>
        }
      />

      <Route
        path="/agence/projets"
        element={
          <RequirePro mode="agency" allowRoles={["director", "team_leader"]}>
            <AgencyProjectsPilotPage />
          </RequirePro>
        }
      />

      <Route path="/particuliers" element={<ProjectOwnerPage />} />
      <Route path="/preciser-projet" element={<ProjectFirstFlowPage />} />

      <Route
        path="/dashboard-particulier"
        element={
          <RequireParticulier fallback="/">
            <ParticulierDashboardPage />
          </RequireParticulier>
        }
      />

      <Route
        path="/particulier/connections"
        element={
          <RequireParticulier fallback="/dashboard-particulier">
            <ParticulierConnectionsPage />
          </RequireParticulier>
        }
      />
      <Route
        path="/dashboard-particulier/mises-en-relation"
        element={
          <RequireParticulier fallback="/dashboard-particulier">
            <ParticulierConnectionsPage />
          </RequireParticulier>
        }
      />
      <Route
        path="/particulier/projets"
        element={
          <RequireParticulier fallback="/dashboard-particulier">
            <ParticulierProjectsPage />
          </RequireParticulier>
        }
      />
      <Route
        path="/particulier/demandes"
        element={
          <RequireParticulier fallback="/dashboard-particulier">
            <ParticulierRequestsPage />
          </RequireParticulier>
        }
      />
      <Route
        path="/particulier/alertes"
        element={
          <RequireParticulier fallback="/dashboard-particulier">
            <ParticulierAlertsPage />
          </RequireParticulier>
        }
      />

      <Route
        path="/projets"
        element={
          <RequireParticulier fallback="/dashboard-particulier">
            <ParticulierProjectsPage />
          </RequireParticulier>
        }
      />
      <Route
        path="/demandes"
        element={
          <RequireParticulier fallback="/dashboard-particulier">
            <ParticulierRequestsPage />
          </RequireParticulier>
        }
      />
      <Route
        path="/alertes"
        element={
          <RequireParticulier fallback="/dashboard-particulier">
            <ParticulierAlertsPage />
          </RequireParticulier>
        }
      />

      <Route path="/pro-de-limmo" element={<ProDeImmoPage />} />
      <Route path="/agent-immobilier" element={<AgentImmobilierPage />} />

      <Route
        path="/agents-immobiliers-par-ville"
        element={<AgentsImmobiliersParVillePage />}
      />
      <Route
        path="/agents-immobiliers"
        element={<Navigate to="/agents-immobiliers-par-ville" replace />}
      />

      <Route
        path="/agent-immobilier-paris"
        element={<AgentImmobilierParisPage />}
      />
      <Route
        path="/agent-immobilier-lyon"
        element={<AgentImmobilierLyonPage />}
      />
      <Route
        path="/agent-immobilier-bordeaux"
        element={<AgentImmobilierBordeauxPage />}
      />
      <Route
        path="/agent-immobilier-nice"
        element={<AgentImmobilierNicePage />}
      />
      <Route
        path="/agent-immobilier-lille"
        element={<AgentImmobilierLillePage />}
      />
      <Route
        path="/agent-immobilier-nantes"
        element={<AgentImmobilierNantesPage />}
      />
      <Route
        path="/agent-immobilier-rennes"
        element={<AgentImmobilierRennesPage />}
      />
      <Route
        path="/agent-immobilier-nancy"
        element={<AgentImmobilierNancyPage />}
      />
      <Route
        path="/agent-immobilier-metz"
        element={<AgentImmobilierMetzPage />}
      />

      <Route
        path="/acheter-immobilier"
        element={<Navigate to="/acheter-immobilier-paris" replace />}
      />
      <Route
        path="/vendre-immobilier"
        element={<Navigate to="/vendre-immobilier-paris" replace />}
      />

      <Route
        path="/acheter-immobilier-paris"
        element={<AcheterImmobilierParisPage />}
      />
      <Route
        path="/acheter-immobilier-lyon"
        element={<AcheterImmobilierLyonPage />}
      />
      <Route
        path="/acheter-immobilier-bordeaux"
        element={<AcheterImmobilierBordeauxPage />}
      />
      <Route
        path="/acheter-immobilier-nice"
        element={<AcheterImmobilierNicePage />}
      />
      <Route
        path="/acheter-immobilier-lille"
        element={<AcheterImmobilierLillePage />}
      />
      <Route
        path="/acheter-immobilier-nantes"
        element={<AcheterImmobilierNantesPage />}
      />
      <Route
        path="/acheter-immobilier-rennes"
        element={<AcheterImmobilierRennesPage />}
      />
      <Route
        path="/acheter-immobilier-nancy"
        element={<AcheterImmobilierNancyPage />}
      />
      <Route
        path="/acheter-immobilier-metz"
        element={<AcheterImmobilierMetzPage />}
      />

      <Route
        path="/vendre-immobilier-paris"
        element={<VendreImmobilierParisPage />}
      />
      <Route
        path="/vendre-immobilier-lyon"
        element={<VendreImmobilierLyonPage />}
      />
      <Route
        path="/vendre-immobilier-bordeaux"
        element={<VendreImmobilierBordeauxPage />}
      />
      <Route
        path="/vendre-immobilier-nice"
        element={<VendreImmobilierNicePage />}
      />
      <Route
        path="/vendre-immobilier-lille"
        element={<VendreImmobilierLillePage />}
      />
      <Route
        path="/vendre-immobilier-nantes"
        element={<VendreImmobilierNantesPage />}
      />
      <Route
        path="/vendre-immobilier-rennes"
        element={<VendreImmobilierRennesPage />}
      />
      <Route
        path="/vendre-immobilier-nancy"
        element={<VendreImmobilierNancyPage />}
      />
      <Route
        path="/vendre-immobilier-metz"
        element={<VendreImmobilierMetzPage />}
      />

      <Route
        path="/agent-immobilier/paris"
        element={<Navigate to="/agent-immobilier-paris" replace />}
      />
      <Route
        path="/agent-immobilier/lyon"
        element={<Navigate to="/agent-immobilier-lyon" replace />}
      />
      <Route
        path="/agent-immobilier/bordeaux"
        element={<Navigate to="/agent-immobilier-bordeaux" replace />}
      />
      <Route
        path="/agent-immobilier/nice"
        element={<Navigate to="/agent-immobilier-nice" replace />}
      />
      <Route
        path="/agent-immobilier/lille"
        element={<Navigate to="/agent-immobilier-lille" replace />}
      />
      <Route
        path="/agent-immobilier/nantes"
        element={<Navigate to="/agent-immobilier-nantes" replace />}
      />
      <Route
        path="/agent-immobilier/rennes"
        element={<Navigate to="/agent-immobilier-rennes" replace />}
      />
      <Route
        path="/agent-immobilier/nancy"
        element={<Navigate to="/agent-immobilier-nancy" replace />}
      />
      <Route
        path="/agent-immobilier/metz"
        element={<Navigate to="/agent-immobilier-metz" replace />}
      />

      <Route path="/pro-de-limmo/inscription" element={<SignUpProPage />} />

      <Route
        path="/professionnel-dashboard"
        element={
          <RequirePro mode="pro">
            <ProfessionnelDashboardPage />
          </RequirePro>
        }
      />

      <Route
        path="/pro-de-limmo/dashboard"
        element={
          <RequirePro mode="pro">
            <ProfessionnelDashboardPage />
          </RequirePro>
        }
      />
      <Route
        path="/pro-de-limmo/profil"
        element={
          <RequirePro mode="pro">
            <ProfessionnelProfilePage />
          </RequirePro>
        }
      />
      <Route
        path="/professionnel/profil"
        element={
          <RequirePro mode="pro">
            <ProfessionnelProfilePage />
          </RequirePro>
        }
      />
      <Route
        path="/pro-de-limmo/mises-en-relation"
        element={
          <RequirePro mode="pro">
            <ProfessionnelConnectionsPage />
          </RequirePro>
        }
      />
      <Route
        path="/pro-de-limmo/abonnement"
        element={
          <RequirePro mode="pro">
            <SubscriptionPage />
          </RequirePro>
        }
      />
      <Route
        path="/pro-de-limmo/leads-directs"
        element={
          <RequirePro mode="pro">
            <ProfessionnelDirectLeadsPage />
          </RequirePro>
        }
      />
      <Route
        path="/pro-de-limmo/marche-inter-pro"
        element={
          <RequirePro mode="pro">
            <ProfessionnelProfessionalMarketplacePage />
          </RequirePro>
        }
      />
      <Route
        path="/pro-de-limmo/alertes"
        element={
          <RequirePro mode="pro">
            <ProfessionnelAlertsPage />
          </RequirePro>
        }
      />
      <Route
        path="/pro-de-limmo/projets-partages"
        element={
          <RequirePro mode="pro">
            <ProfessionnelSharedProjectsPage />
          </RequirePro>
        }
      />
      <Route
        path="/pro/mes-projets-partages"
        element={
          <RequirePro mode="pro">
            <ProfessionnelSharedProjectsPage />
          </RequirePro>
        }
      />

      <Route
        path="/nos-professionnels-partenaires"
        element={<ProfessionnelPartnerPage />}
      />
      <Route
        path="/nos-professionnels-partenaires/:slug"
        element={<PartnerShowcaseSlugRedirect />}
      />
      <Route
        path="/nos-professionnels-partenaires/slug/:slug"
        element={<ProfessionnelShowcasePage />}
      />
      <Route
        path="/nos-professionnels-partenaires/id/:professionnelId"
        element={<ProfessionnelShowcasePage />}
      />

      <Route
        path="/pro/:slug/opportunites"
        element={<ProfessionnelFeaturedProjectsPage />}
      />
      <Route
        path="/pro/:slug/opportunites/:projectType/:projectId"
        element={<ProfessionnelFeaturedProjectDetailPage />}
      />

      <Route
        path="/professionnel-showcase/:card_slug/featured-projects"
        element={<ProfessionnelFeaturedProjectsPage />}
      />
      <Route
        path="/professionnel-showcase/:card_slug/:projectType/:projectId"
        element={<ProfessionnelFeaturedProjectDetailPage />}
      />
      <Route
        path="/professionnel-showcase/:card_slug"
        element={<ProfessionnelShowcasePage />}
      />

      <Route
        path="/place-des-projets"
        element={<PublicProjectsMarketplacePage />}
      />
      <Route
        path="/place-des-projets/:origin/:type/:id/contact"
        element={<ContactProjectGatePage />}
      />

      <Route path="/projet_immo/:slug" element={<StandaloneProjectPage />} />
      <Route path="/contact-project-gate" element={<ContactProjectGatePage />} />
      <Route path="/matching/:projectId" element={<MatchingPage />} />

      <Route
        path="/admin-dashboard"
        element={
          <RequireAdmin>
            <AdminDashboardPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <RequireAdmin>
            <AdminDashboardPage />
          </RequireAdmin>
        }
      />

      <Route
        path="/admin/website-pictures"
        element={
          <RequireAdmin>
            <AdminWebsitePicturesPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/images"
        element={<Navigate to="/admin/website-pictures" replace />}
      />
      <Route
        path="/admin/images/*"
        element={<Navigate to="/admin/website-pictures" replace />}
      />

      <Route
        path="/admin/validation-professionnels"
        element={
          <RequireAdmin>
            <AdminProfessionnelValidationPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/projets"
        element={
          <RequireAdmin>
            <AdminProjectsViewPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/connexions"
        element={
          <RequireAdmin>
            <AdminConnectionsViewPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/particuliers"
        element={
          <RequireAdmin>
            <AdminParticuliersViewPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/creation-admin"
        element={
          <RequireAdmin>
            <CreateAdminPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/notifications"
        element={
          <RequireAdmin>
            <AdminNotificationLogsPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/leads-directs"
        element={
          <RequireAdmin>
            <AdminDirectLeadsPage />
          </RequireAdmin>
        }
      />

      <Route path="/blog" element={<BlogPage />} />
      <Route path="/articles" element={<BlogPage />} />
      <Route path="/blog/:slug" element={<BlogPage />} />
      <Route path="/a-propos" element={<AboutPage />} />
      <Route path="/connexion" element={<AuthPage />} />
      <Route path="/inscription" element={<AuthPage />} />
      <Route
        path="/recuperation-mot-de-passe"
        element={<PasswordRecoveryPage />}
      />
      <Route path="/confirmation" element={<EmailConfirmationPage />} />

      <Route path="/cgv" element={<CGVPage />} />
      <Route path="/cgu" element={<CGUPage />} />
      <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
      <Route path="/confidentialite" element={<ConfidentialitePage />} />

      <Route
        path="/chat/:connectionId"
        element={
          <ChatGate>
            <ChatPage />
          </ChatGate>
        }
      />

      <Route
        path="/direct-lead-form/:professionnelId"
        element={<DirectLeadFormPage />}
      />
      <Route
        path="/preciser-projet/:professionnelId"
        element={<PreciserProjetLegacyRedirect />}
      />

      <Route path="/go/pro/:id" element={<ProPremiumRedirectPage />} />

      <Route path="/cvd/:slug" element={<MainToCardSlugRedirect />} />
      <Route path="/qr/:slug" element={<MainToCardQrRedirect />} />
      <Route
        path="/carte-visite-digitale/:professionnelId"
        element={<Navigate to="/" replace />}
      />
      <Route path="/livingroom/:slug" element={<MainToCardSlugRedirect />} />
      <Route
        path="/:companySlug/:cardSlug"
        element={<MainToCardLegacyCompanyRedirect />}
      />
      <Route path="/:combinedSlug" element={<MainToCardCombinedRedirect />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

const CardHostRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<CardHostHomePage />} />

      <Route
        path="/carte-visite-digitale/:professionnelId"
        element={<StandaloneDigitalBusinessCardPage />}
      />
      <Route path="/qr/:slug" element={<CvdQrRedirectPage />} />
      <Route
        path="/cvd/:slug"
        element={<StandaloneDigitalBusinessCardPage />}
      />
      <Route path="/livingroom/:slug" element={<LivingroomLegacyRedirect />} />

      <Route
        path="/nos-professionnels-partenaires"
        element={<ProfessionnelPartnerPage />}
      />
      <Route
        path="/nos-professionnels-partenaires/:slug"
        element={<PartnerShowcaseSlugRedirect />}
      />
      <Route
        path="/nos-professionnels-partenaires/slug/:slug"
        element={<ProfessionnelShowcasePage />}
      />
      <Route
        path="/nos-professionnels-partenaires/id/:professionnelId"
        element={<ProfessionnelShowcasePage />}
      />

      <Route
        path="/pro/:slug/opportunites"
        element={<ProfessionnelFeaturedProjectsPage />}
      />
      <Route
        path="/pro/:slug/opportunites/:projectType/:projectId"
        element={<ProfessionnelFeaturedProjectDetailPage />}
      />

      <Route
        path="/professionnel-showcase/:card_slug/featured-projects"
        element={<ProfessionnelFeaturedProjectsPage />}
      />
      <Route
        path="/professionnel-showcase/:card_slug/:projectType/:projectId"
        element={<ProfessionnelFeaturedProjectDetailPage />}
      />
      <Route
        path="/professionnel-showcase/:card_slug"
        element={<ProfessionnelShowcasePage />}
      />

      <Route
        path="/direct-lead-form/:professionnelId"
        element={<DirectLeadFormPage />}
      />
      <Route
        path="/preciser-projet/:professionnelId"
        element={<PreciserProjetLegacyRedirect />}
      />

      <Route path="/go/pro/:id" element={<ProPremiumRedirectPage />} />

      <Route
        path="/:companySlug/:cardSlug"
        element={<StandaloneDigitalBusinessCardPage />}
      />
      <Route path="/:combinedSlug" element={<CombinedSlugRedirect />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

const AppRoutes = () => {
  const cardHost = isCardHost();

  return (
    <Layout>
      <Suspense fallback={<FullscreenLoader />}>
        {cardHost ? <CardHostRoutes /> : <MainSiteRoutes />}
      </Suspense>
    </Layout>
  );
};

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthProvider>
            <AuthRedirector />
            <AppRoutes />
            <AnalyticsLoader />
            <CookieBanner privacyPath="/confidentialite" />
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;