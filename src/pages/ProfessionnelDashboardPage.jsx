import React from "react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  HeartHandshake,
  User,
  Users,
  Star,
  Briefcase,
  Bell,
  ShoppingCart,
  Crown,
  AlertTriangle,
  Settings,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SEO from "@/components/SEO";
import ProfessionnelProfilePage from "@/pages/ProfessionnelProfilePage";
import ProfessionnelProfessionalMarketplacePage from "@/pages/ProfessionnelProfessionalMarketplacePage";
import ProfessionnelConnectionsPage from "@/pages/ProfessionnelConnectionsPage";
import ProfessionnelDirectLeadsPage from "@/pages/ProfessionnelDirectLeadsPage";
import ProfessionnelSharedProjectsPage from "@/pages/ProfessionnelSharedProjectsPage";
import ProfessionnelAlertsPage from "@/pages/ProfessionnelAlertsPage";
import SubscriptionPage from "@/pages/SubscriptionPage";
import { supabase } from "@/lib/customSupabaseClient";
import { Button } from "@/components/ui/button";

const DashboardTab = ({ value, children, hasNotification }) => (
  <TabsTrigger value={value} className="relative">
    {children}
    {hasNotification && (
      <span className="absolute -top-1 -right-1 flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
      </span>
    )}
  </TabsTrigger>
);

const ADMIN_EMAIL = "mathieu.guerin@livingpage.fr";
const normalizeRole = (v) => String(v || "").trim().toLowerCase();

/**
 * ✅ Nouveau modèle Gratuit | Premium
 * Premium = a une carte premium OU appartient à une agence (agency_id)
 * Gratuit = sinon
 */
const computePlan = (p) => {
  const isPremium = !!(p?.premium_professionnel_card || p?.agency_id);
  return {
    isPremium,
    planLabel: isPremium ? "Premium" : "Gratuit",
  };
};

const fetchProfessionnelRowId = async (uid) => {
  if (!uid) return null;

  // Post-migration: idéalement professionnels.id = auth.uid()
  // On tente d'abord par id, puis fallback par user_id (legacy)
  let res = await supabase
    .from("professionnels")
    .select("id")
    .eq("id", uid)
    .maybeSingle();

  if (!res.error && res.data?.id) return res.data.id;

  res = await supabase
    .from("professionnels")
    .select("id")
    .eq("user_id", uid)
    .maybeSingle();

  if (res.error) throw res.error;
  return res.data?.id ?? null;
};

const ensureProfessionnelRowExists = async ({ user }) => {
  const uid = user?.id;
  if (!uid) return { ok: false, reason: "missing_user" };

  const existingId = await fetchProfessionnelRowId(uid);
  if (existingId) return { ok: true, created: false, proId: existingId };

  // ✅ IMPORTANT : on n’insère PLUS billing_plan / subscription_status (colonnes inexistantes)
  // On reste compatible avec ta table "professionnels"
  const payload = {
    id: uid, // 👈 post-migration: pro.id = auth.uid()
    user_id: uid,
    email: user?.email ?? null,
    role: "professionnel",
    is_active: true,

    // visibilité partner-page : par défaut OFF (gratuit), le premium choisira
    visibility_pro_partner_page: false,
    is_public: true,
    validation_status: "pending",
  };

  const { error: insErr } = await supabase.from("professionnels").insert(payload);
  if (insErr) throw insErr;

  const createdId = await fetchProfessionnelRowId(uid);
  return { ok: true, created: true, proId: createdId || uid };
};

const ProfessionnelDashboardPage = () => {
  const { user, profile, isAuthBusy, isAdmin, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [proId, setProId] = React.useState(null);
  const [loadingProId, setLoadingProId] = React.useState(true);

  const [projectsCount, setProjectsCount] = React.useState(null);
  const [contactsCount, setContactsCount] = React.useState(null);
  const [loadingCounters, setLoadingCounters] = React.useState(true);

  const [hasPendingConnections, setHasPendingConnections] = React.useState(false);
  const [hasNewDirectLeads, setHasNewDirectLeads] = React.useState(false);
  const [hasNewAlerts, setHasNewAlerts] = React.useState(false);

  const [agencyRole, setAgencyRole] = React.useState("agent");
  const [checkingAgencyRole, setCheckingAgencyRole] = React.useState(false);

  // ---------------------------
  // Guards d’accès
  // ---------------------------
  React.useEffect(() => {
    if (isAuthBusy) return;

    const email = (user?.email || "").toLowerCase();

    if (isAdmin || email === ADMIN_EMAIL) {
      navigate("/admin-dashboard", { replace: true });
      return;
    }

    if (!user?.id) {
      navigate("/pro-de-limmo", { replace: true });
      return;
    }

    const role = normalizeRole(profile?.role);
    if (role && role !== "professionnel") {
      navigate("/pro-de-limmo", { replace: true });
      return;
    }
  }, [isAuthBusy, isAdmin, user?.id, user?.email, profile?.role, navigate]);

  // ---------------------------
  // Ensure pro row exists + proId
  // ---------------------------
  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (isAuthBusy) return;

      if (!user?.id) {
        setProId(null);
        setLoadingProId(false);
        return;
      }

      const email = (user?.email || "").toLowerCase();
      if (isAdmin || email === ADMIN_EMAIL) {
        setProId(null);
        setLoadingProId(false);
        return;
      }

      const role = normalizeRole(profile?.role);
      if (role && role !== "professionnel") {
        setProId(null);
        setLoadingProId(false);
        return;
      }

      setLoadingProId(true);
      try {
        const { ok, created, proId: ensuredId } = await ensureProfessionnelRowExists({ user });
        if (!ok) {
          if (!cancelled) setProId(null);
          return;
        }

        if (!cancelled) setProId(ensuredId ?? null);

        if (created) {
          try {
            await refreshProfile?.();
          } catch (e) {
            console.error("refreshProfile after pro ensure failed:", e);
          }
        }
      } catch (e) {
        console.error("ENSURE_PRO_ROW / FETCH_PRO_ID error:", e);
        if (!cancelled) setProId(null);
      } finally {
        if (!cancelled) setLoadingProId(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [isAuthBusy, user?.id, user?.email, profile?.role, isAdmin, refreshProfile]);

  // ---------------------------
  // Agency role (inchangé)
  // ---------------------------
  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (isAuthBusy) return;
      if (!user?.id) return;

      const role = normalizeRole(profile?.role);
      if (role && role !== "professionnel") return;

      setCheckingAgencyRole(true);
      try {
        const { data, error } = await supabase
          .from("professionnels_agency_v2")
          .select("agency_role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          console.error("FETCH_AGENCY_ROLE_ERROR", error);
          setAgencyRole("agent");
          return;
        }

        const r = normalizeRole(data?.agency_role);
        setAgencyRole(r || "agent");
      } catch (e) {
        if (!cancelled) {
          console.error("FETCH_AGENCY_ROLE_FATAL", e);
          setAgencyRole("agent");
        }
      } finally {
        if (!cancelled) setCheckingAgencyRole(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [isAuthBusy, user?.id, profile?.role]);

  // redirect vers espaces agence si besoin
  React.useEffect(() => {
    if (isAuthBusy) return;
    if (!user?.id) return;

    const role = normalizeRole(profile?.role);
    if (role && role !== "professionnel") return;

    if (checkingAgencyRole) return;

    const path = window.location.pathname || "";
    if (path.startsWith("/agence/")) return;

    if (agencyRole === "director") {
      navigate("/agence/directeur", { replace: true });
    } else if (agencyRole === "team_leader") {
      navigate("/agence/team-leader", { replace: true });
    }
  }, [isAuthBusy, user?.id, profile?.role, checkingAgencyRole, agencyRole, navigate]);

  // ---------------------------
  // Counters
  // ---------------------------
  React.useEffect(() => {
    let cancelled = false;

    const fetchCounters = async () => {
      if (!user?.id) return;

      const role = normalizeRole(profile?.role);
      if (role && role !== "professionnel") return;

      setLoadingCounters(true);

      try {
        // pending connections (cible auth user)
        const { count: pendingConnCount, error: pendingErr } = await supabase
          .from("connections")
          .select("id", { count: "exact", head: true })
          .eq("target_user_id", user.id)
          .eq("status", "pending");

        if (pendingErr) console.error("pending connections count error", pendingErr);
        if (!cancelled) setHasPendingConnections((pendingConnCount || 0) > 0);

        if (!proId) {
          if (!cancelled) {
            setProjectsCount(0);
            setContactsCount(0);
            setHasNewDirectLeads(false);
            setHasNewAlerts(false);
          }
          return;
        }

        // projects count
        const { count: projectsCountRaw, error: projectsError } = await supabase
          .from("projects_marketplace_unified_all")
          .select("id", { count: "exact", head: true })
          .eq("role", "professionnel")
          .eq("professionnel_id", proId)
          .or("visibility_public.eq.true,visibility_showcase.eq.true,visibility_inter_agent.eq.true");

        if (!cancelled) {
          if (!projectsError) setProjectsCount(projectsCountRaw ?? 0);
          else {
            console.error("Error counting projects:", projectsError);
            setProjectsCount(0);
          }
        }

        // contacts count
        const { count: contactsCountRaw, error: contactsError } = await supabase
          .from("connections")
          .select("id", { count: "exact", head: true })
          .eq("requesting_professionnel_id", proId)
          .eq("is_active", true);

        if (!cancelled) {
          if (!contactsError) setContactsCount(contactsCountRaw ?? 0);
          else {
            console.error("Error counting connections:", contactsError);
            setContactsCount(0);
          }
        }

        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        // new direct leads
        const { count: newLeadsCount, error: leadsErr } = await supabase
          .from("direct_leads")
          .select("id", { count: "exact", head: true })
          .eq("professionnel_id", proId)
          .gte("created_at", threeDaysAgo.toISOString());

        if (leadsErr) console.error("direct_leads count error", leadsErr);
        if (!cancelled) setHasNewDirectLeads((newLeadsCount || 0) > 0);

        // alerts matches
        const { data: alerts, error: alertsErr } = await supabase
          .from("project_alerts")
          .select("id")
          .eq("professionnel_id", proId);

        if (alertsErr) console.error("project_alerts select error", alertsErr);

        if (alerts && alerts.length > 0) {
          const alertIds = alerts.map((a) => a.id);

          const { count: newAlertsCount, error: matchErr } = await supabase
            .from("alert_matches_log")
            .select("id", { count: "exact", head: true })
            .in("alert_id", alertIds)
            .gte("matched_at", threeDaysAgo.toISOString());

          if (matchErr) console.error("alert_matches_log count error", matchErr);
          if (!cancelled) setHasNewAlerts((newAlertsCount || 0) > 0);
        } else {
          if (!cancelled) setHasNewAlerts(false);
        }
      } finally {
        if (!cancelled) setLoadingCounters(false);
      }
    };

    fetchCounters();
    return () => {
      cancelled = true;
    };
  }, [user?.id, profile?.role, proId]);

  // ---------------------------
  // Loading / guards render
  // ---------------------------
  if (isAuthBusy || loadingProId) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-brand-blue" />
      </div>
    );
  }

  const email = (user?.email || "").toLowerCase();
  if (isAdmin || email === ADMIN_EMAIL) return null;

  if (!user?.id) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500">
        <p>Redirection vers votre espace professionnel…</p>
      </div>
    );
  }

  const role = normalizeRole(profile?.role);
  if (role && role !== "professionnel") {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500">
        <p>Redirection vers votre espace professionnel…</p>
      </div>
    );
  }

  // ---------------------------
  // ✅ Nouveau modèle Gratuit | Premium
  // ---------------------------
  const { isPremium, planLabel } = computePlan(profile);

  // Limites : gratuit => 2 contacts, premium => illimité
  const maxContacts = isPremium ? null : 2;
  const formattedContactsLimit = maxContacts === null ? "illimitées" : `${maxContacts}`;

  const hasReachedContactsLimit =
    !isPremium && contactsCount !== null && maxContacts !== null && contactsCount >= maxContacts;

  // Premium visible sauf s’il décide de ne pas l’être :
  // -> il faut être premium ET visibility_pro_partner_page = true
  const hasPartnerVisibility = !!(isPremium && profile?.visibility_pro_partner_page);

  // Alertes / badge : dans ce modèle simple, on les met Premium
  const canCreateAlerts = isPremium;
  const hasRecommendedBadge = isPremium;

  const planTagColor = isPremium
    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : "bg-gray-100 text-gray-700 border-gray-200";

  const isDirector = agencyRole === "director";

  return (
    <>
      <SEO
        title="Tableau de Bord Professionnel"
        description="Gérez vos projets, votre profil et vos mises en relation."
      />

      <div className="container mx-auto px-4 py-10">
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-brand-blue">
              Tableau de Bord Professionnel
            </h1>
            <p className="text-lg text-gray-600">
              Bienvenue, {profile?.first_name || "cher professionnel"} !
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Pro ID: <span className="font-mono">{proId || "—"}</span> • Agency role:{" "}
              <span className="font-mono">{agencyRole}</span>
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2">
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${planTagColor}`}
            >
              <Crown className="h-4 w-4" />
              <span>Plan : {planLabel}</span>
            </div>

            {hasRecommendedBadge && (
              <div className="flex items-center gap-1 text-xs text-blue-700">
                <Star className="h-3 w-3 fill-blue-500 text-blue-500" />
                <span>Badge “Professionnel recommandé” activé</span>
              </div>
            )}

            {isDirector && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => navigate("/agence/configuration")}
                disabled={checkingAgencyRole}
              >
                <Settings className="h-4 w-4" />
                Configurer mon agence
              </Button>
            )}
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold text-brand-blue">
              Statistiques & limites de votre plan
            </h2>
            {loadingCounters ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement de vos statistiques…
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Projets diffusés sur la place de marché</span>
                  <span className="font-semibold">{projectsCount ?? 0}</span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span>Prises de contact actives</span>
                  <span className="font-semibold">
                    {contactsCount ?? 0} / {formattedContactsLimit}
                  </span>
                </div>

                {hasReachedContactsLimit && (
                  <p className="mt-1 flex items-start gap-1 text-xs text-amber-600">
                    <AlertTriangle className="mt-0.5 h-3 w-3" />
                    <span>
                      Votre plan Gratuit permet jusqu’à 2 prises de contact.
                      Passez en Premium pour contacter tous les projets.
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold text-brand-blue">
              Fonctionnalités de votre abonnement
            </h2>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>
                • Visibilité “Professionnel partenaire” :{" "}
                <strong>{hasPartnerVisibility ? "activée" : "non incluse / désactivée"}</strong>
              </li>
              <li>
                • Alertes email sur les nouveaux projets :{" "}
                <strong>{canCreateAlerts ? "activées (Premium)" : "réservées au Premium"}</strong>
              </li>
              <li>
                • Badge “Professionnel recommandé” :{" "}
                <strong>{hasRecommendedBadge ? "activé" : "réservé au Premium"}</strong>
              </li>
            </ul>

            {!isPremium && (
              <p className="mt-3 text-xs text-gray-500">
                Passez en <span className="font-semibold">Premium</span> pour débloquer les alertes,
                le badge et la visibilité “professionnel partenaire”.
              </p>
            )}
          </div>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-7 h-auto">
            <TabsTrigger value="profile">
              <User className="mr-2 h-4 w-4" />
              Mon Profil
            </TabsTrigger>
            <TabsTrigger value="shared-projects">
              <Briefcase className="mr-2 h-4 w-4" />
              Mes Projets
            </TabsTrigger>
            <TabsTrigger value="pro-marketplace">
              <HeartHandshake className="mr-2 h-4 w-4" />
              Marché Inter-pro
            </TabsTrigger>
            <DashboardTab value="connections" hasNotification={hasPendingConnections}>
              <Users className="mr-2 h-4 w-4" />
              Relations
            </DashboardTab>
            <DashboardTab value="leads" hasNotification={hasNewDirectLeads}>
              <Star className="mr-2 h-4 w-4" />
              Leads Directs
            </DashboardTab>
            <DashboardTab value="alerts" hasNotification={hasNewAlerts}>
              <Bell className="mr-2 h-4 w-4" />
              Alertes
            </DashboardTab>
            <TabsTrigger value="subscription">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Abonnement
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <ProfessionnelProfilePage />
          </TabsContent>

          <TabsContent value="shared-projects" className="mt-6">
            <ProfessionnelSharedProjectsPage />
          </TabsContent>

          <TabsContent value="pro-marketplace" className="mt-6">
            <ProfessionnelProfessionalMarketplacePage />
          </TabsContent>

          <TabsContent value="connections" className="mt-6">
            <ProfessionnelConnectionsPage />
          </TabsContent>

          <TabsContent value="leads" className="mt-6">
            <ProfessionnelDirectLeadsPage />
          </TabsContent>

          <TabsContent value="alerts" className="mt-6">
            {!canCreateAlerts && (
              <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                Les alertes email sur les nouveaux projets sont réservées aux comptes{" "}
                <strong>Premium</strong>.
              </div>
            )}
            <ProfessionnelAlertsPage />
          </TabsContent>

          <TabsContent value="subscription" className="mt-6">
            <SubscriptionPage />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default ProfessionnelDashboardPage;