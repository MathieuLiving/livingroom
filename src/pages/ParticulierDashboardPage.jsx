// src/pages/ParticulierDashboardPage.jsx
import React, {
  useState,
  useEffect,
  Suspense,
  lazy,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { User, Briefcase, Loader2, Users, Send, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import SEO from "@/components/SEO";

// ✅ IMPORTANT : le client Supabase unique est à la racine /lib (pas dans src/lib)
import { supabase } from "../../lib/customSupabaseClient";

import ParticulierProfileForm from "@/components/particulier/ParticulierProfileForm";

// Lazy tabs
const ParticulierProjectsPage = lazy(() =>
  import("@/pages/ParticulierProjectsPage").then((m) => ({ default: m.default }))
);
const ParticulierConnectionsPage = lazy(() =>
  import("@/pages/ParticulierConnectionsPage").then((m) => ({
    default: m.default,
  }))
);
const ParticulierRequestsPage = lazy(() =>
  import("@/pages/ParticulierRequestsPage").then((m) => ({ default: m.default }))
);
const ParticulierAlertsPage = lazy(() =>
  import("@/pages/ParticulierAlertsPage").then((m) => ({ default: m.default }))
);

function isMissingRelationError(err) {
  const msg = String(err?.message || "").toLowerCase();
  return msg.includes("does not exist") || msg.includes("relation") || msg.includes("42p01");
}

export default function ParticulierDashboardPage() {
  const { user, isAuthBusy } = useAuth();
  const location = useLocation();

  const [tab, setTab] = useState("profile");

  // ✅ Identité (source unique): public.profiles
  const [meProfile, setMeProfile] = useState(null);
  const [meProfileLoading, setMeProfileLoading] = useState(true);

  // ✅ ID métier particulier (table `particuliers`.id) : nécessaire pour les hooks data
  const [particulierId, setParticulierId] = useState(null);
  const [particulierIdLoading, setParticulierIdLoading] = useState(true);

  // ✅ Compteurs connexions
  const [connCounts, setConnCounts] = useState({ received: 0, sent: 0, total: 0 });
  const [connCountsLoading, setConnCountsLoading] = useState(true);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ---- Tab from URL ----
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const t = sp.get("tab");
    const allowed = ["profile", "projects", "connections", "sent-leads", "alerts"];
    if (t && allowed.includes(t)) setTab(t);
    else setTab("profile");
  }, [location.search]);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url.toString());
  }, [tab]);

  // ---- Load public.profiles ----
  const loadMyProfile = useCallback(async () => {
    if (!user?.id) return;

    setMeProfileLoading(true);
    try {
      // 1) lecture profiles
      const { data, error } = await supabase
        .from("profiles")
        .select("id, role, first_name, last_name, phone, email, created_at, updated_at")
        .eq("id", user.id)
        .maybeSingle();

      if (!error && data) {
        if (mountedRef.current) setMeProfile(data);
        return;
      }

      // 2) fallback : upsert depuis metadata
      const meta = user?.user_metadata || {};
      const upsertPayload = {
        id: user.id,
        role: meta.role || meta.user_type || "particulier",
        first_name: meta.first_name || null,
        last_name: meta.last_name || null,
        phone: meta.phone || null,
        email: user.email || meta.email || null,
        updated_at: new Date().toISOString(),
      };

      const { data: upserted, error: upsertError } = await supabase
        .from("profiles")
        .upsert(upsertPayload, { onConflict: "id" })
        .select("id, role, first_name, last_name, phone, email, created_at, updated_at")
        .single();

      if (upsertError) {
        // eslint-disable-next-line no-console
        console.error("[ParticulierDashboard] profiles upsert error:", upsertError);
        if (mountedRef.current) setMeProfile(null);
      } else {
        if (mountedRef.current) setMeProfile(upserted || null);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[ParticulierDashboard] loadMyProfile unexpected error:", e);
      if (mountedRef.current) setMeProfile(null);
    } finally {
      if (mountedRef.current) setMeProfileLoading(false);
    }
  }, [user?.id, user?.email, user?.user_metadata]);

  useEffect(() => {
    if (!user?.id) return;
    loadMyProfile();
  }, [user?.id, loadMyProfile]);

  // ---- Load particulierId (table `particuliers`) ----
  const loadParticulierId = useCallback(async () => {
    if (!user?.id) return;

    setParticulierIdLoading(true);
    try {
      const uid = user.id;

      // 1) tente OR (id == uid ou user_id == uid)
      let res = await supabase
        .from("particuliers")
        .select("id,user_id")
        .or(`id.eq.${uid},user_id.eq.${uid}`)
        .maybeSingle();

      // 2) fallback 2-steps si OR / RLS / policy
      if (res?.error) {
        // eslint-disable-next-line no-console
        console.warn("[ParticulierDashboard] particuliers .or() failed, fallback:", res.error);

        res = await supabase.from("particuliers").select("id,user_id").eq("user_id", uid).maybeSingle();

        if (!res?.error && !res?.data) {
          res = await supabase.from("particuliers").select("id,user_id").eq("id", uid).maybeSingle();
        }
      }

      if (res?.error) throw res.error;

      if (mountedRef.current) setParticulierId(res?.data?.id ?? null);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[ParticulierDashboard] loadParticulierId error:", e);
      if (mountedRef.current) setParticulierId(null);
    } finally {
      if (mountedRef.current) setParticulierIdLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    loadParticulierId();
  }, [user?.id, loadParticulierId]);

  // ---- Connection counts (robuste + fallback) ----
  const actorUserId = useMemo(() => user?.id || null, [user?.id]);

  useEffect(() => {
    let cancelled = false;

    async function loadCounts() {
      if (!actorUserId) return;

      setConnCountsLoading(true);
      try {
        // 1) vue enriched si dispo
        let useView = true;

        const viewReceived = supabase
          .from("connections_enriched_safe")
          .select("id", { count: "exact", head: true })
          .eq("target_user_id", actorUserId);

        const viewSent = supabase
          .from("connections_enriched_safe")
          .select("id", { count: "exact", head: true })
          .eq("requesting_user_id", actorUserId);

        let [r1, r2] = await Promise.all([viewReceived, viewSent]);

        if (
          (r1?.error && isMissingRelationError(r1.error)) ||
          (r2?.error && isMissingRelationError(r2.error))
        ) {
          useView = false;
        }

        if (!useView) {
          // 2) fallback table connections
          [r1, r2] = await Promise.all([
            supabase
              .from("connections")
              .select("id", { count: "exact", head: true })
              .eq("target_user_id", actorUserId),
            supabase
              .from("connections")
              .select("id", { count: "exact", head: true })
              .eq("requesting_user_id", actorUserId),
          ]);
        }

        if (cancelled) return;

        if (r1?.error || r2?.error) {
          // eslint-disable-next-line no-console
          console.error(
            "[ParticulierDashboard] Error loading connection counts:",
            r1?.error || r2?.error
          );
          setConnCounts({ received: 0, sent: 0, total: 0 });
        } else {
          const received = r1?.count || 0;
          const sent = r2?.count || 0;
          setConnCounts({ received, sent, total: received + sent });
        }
      } catch (e) {
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.error("[ParticulierDashboard] Unexpected error loading connection counts:", e);
        setConnCounts({ received: 0, sent: 0, total: 0 });
      } finally {
        if (!cancelled) setConnCountsLoading(false);
      }
    }

    loadCounts();
    return () => {
      cancelled = true;
    };
  }, [actorUserId]);

  // ---- Global loader ----
  if (isAuthBusy || !user || meProfileLoading || particulierIdLoading) {
    return (
      <div className="container mx-auto py-10 px-4 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  const TabLoader = () => (
    <div className="flex justify-center items-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
    </div>
  );

  const identityMissing = !meProfile?.first_name || !meProfile?.last_name || !meProfile?.phone;

  return (
    <>
      <SEO
        title="Mon Tableau de Bord Particulier - LivingRoom"
        description="Gérez vos projets immobiliers, vos alertes et vos mises en relation avec des professionnels qualifiés."
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto py-10 px-4"
      >
        {/* ✅ Bandeau identité */}
        <Card className="mb-6">
          <CardContent className="py-4 flex items-center justify-between gap-4">
            <div className="text-sm">
              <div className="font-medium flex items-center gap-2">
                <User className="h-4 w-4" /> Mon identité
              </div>

              <div className="text-muted-foreground mt-1">
                {meProfile?.first_name || "—"} {meProfile?.last_name || "—"} • {meProfile?.phone || "—"} •{" "}
                {meProfile?.email || user.email}
              </div>

              {identityMissing && (
                <div className="text-xs mt-2 text-amber-700">
                  Certaines informations sont manquantes. Ouvrez l’onglet “Mon Profil” pour les compléter.
                </div>
              )}

              {/* ✅ Debug soft */}
              {!particulierId ? (
                <div className="text-xs mt-2 text-red-700">
                  Attention : aucun enregistrement <b>particuliers</b> n’a été trouvé pour cet utilisateur. (RLS / trigger /
                  compte incomplet)
                </div>
              ) : null}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => loadMyProfile()}>
                Rafraîchir
              </Button>
              <Button onClick={() => setTab("profile")}>Modifier</Button>
            </div>
          </CardContent>
        </Card>

        {/* Mises en relation */}
        <Card className="mb-6">
          <CardContent className="py-4 flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium flex items-center gap-2">
                <Users className="h-4 w-4" /> Mises en relation
              </div>
              {connCountsLoading ? (
                <div className="text-muted-foreground flex items-center gap-2 mt-1">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Chargement…
                </div>
              ) : (
                <div className="text-muted-foreground mt-1">
                  Total : <span className="text-foreground font-medium">{connCounts.total}</span> • &nbsp;Reçues :{" "}
                  <span className="text-foreground font-medium">{connCounts.received}</span> • &nbsp;Envoyées :{" "}
                  <span className="text-foreground font-medium">{connCounts.sent}</span>
                </div>
              )}
            </div>
            <Button onClick={() => setTab("connections")}>Voir les mises en relation</Button>
          </CardContent>
        </Card>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="profile">
              <User className="mr-2 h-4 w-4" />
              Mon Profil
            </TabsTrigger>
            <TabsTrigger value="projects">
              <Briefcase className="mr-2 h-4 w-4" />
              Mes Projets
            </TabsTrigger>
            <TabsTrigger value="connections">
              <Users className="mr-2 h-4 w-4" />
              Mises en Relation
            </TabsTrigger>
            <TabsTrigger value="sent-leads">
              <Send className="mr-2 h-4 w-4" />
              Mes demandes
            </TabsTrigger>
            <TabsTrigger value="alerts">
              <Bell className="mr-2 h-4 w-4" />
              Mes alertes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ParticulierProfileForm />
          </TabsContent>

          <TabsContent value="projects">
            <Suspense fallback={<TabLoader />}>
              <ParticulierProjectsPage particulierId={particulierId} />
            </Suspense>
          </TabsContent>

          <TabsContent value="connections">
            <Suspense fallback={<TabLoader />}>
              <ParticulierConnectionsPage particulierId={particulierId} />
            </Suspense>
          </TabsContent>

          <TabsContent value="sent-leads">
            <Suspense fallback={<TabLoader />}>
              <ParticulierRequestsPage particulierId={particulierId} />
            </Suspense>
          </TabsContent>

          <TabsContent value="alerts">
            <Suspense fallback={<TabLoader />}>
              <ParticulierAlertsPage particulierId={particulierId} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </motion.div>
    </>
  );
}