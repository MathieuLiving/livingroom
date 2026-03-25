// src/pages/agence/AgenceTeamLeaderDashboardPage.jsx
import React, { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "../../../lib/customSupabaseClient";
import SEO from "@/components/SEO";
import {
  Loader2,
  LayoutDashboard,
  Users,
  Megaphone,
  UserCheck,
  Settings,
  Building,
  FolderKanban,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

import { useProCardData } from "@/hooks/useProCardData";
import { useProCardSave } from "@/hooks/useProCardSave";
import { useAgencyData } from "@/hooks/useAgencyData";

const ProfessionnelProfilePage = lazy(() => import("@/pages/ProfessionnelProfilePage"));
const ProfessionnelConnectionsPage = lazy(() => import("@/pages/ProfessionnelConnectionsPage"));
const ProfessionnelSharedProjectsPage = lazy(() => import("@/pages/ProfessionnelSharedProjectsPage"));
const ProfessionnelDirectLeadsPage = lazy(() => import("@/pages/ProfessionnelDirectLeadsPage"));
const AgencyAgentsPage = lazy(() => import("@/pages/agence/AgencyAgentsPage"));

const AgencySettingsPlaceholder = () => (
  <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500">
    <Building className="h-12 w-12 mb-4 text-gray-300" />
    <h3 className="text-lg font-medium text-gray-900">Paramètres de l'agence</h3>
    <p>Vous avez l'autorisation de modifier certaines informations de l'agence.</p>
    <Button
      className="mt-4"
      variant="outline"
      onClick={() => {
        window.location.href = "/agence/configuration";
      }}
    >
      Aller à la configuration
    </Button>
  </div>
);

const ProjectsPilotPlaceholder = ({ onOpen }) => (
  <Card>
    <CardHeader>
      <CardTitle>Pilotage des projets de l’équipe</CardTitle>
      <CardDescription>
        Consultez les projets achat et vente de votre équipe, puis définissez les projets à la une.
      </CardDescription>
    </CardHeader>
    <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-gray-600">
        Cette vue vous permet de suivre l’activité de votre équipe et d’accéder à la page dédiée au pilotage des projets.
      </p>
      <Button onClick={onOpen} className="gap-2">
        <FolderKanban className="w-4 h-4" />
        Ouvrir le pilotage projets
      </Button>
    </CardContent>
  </Card>
);

const ErrorBox = ({ title, description, onRetry, onBack }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-3">
        <Button onClick={onRetry}>Recharger</Button>
        <Button variant="outline" onClick={onBack}>
          Retour
        </Button>
      </CardContent>
    </Card>
  </div>
);

/**
 * Récupère le contexte agence/role avec fallback :
 * 1) RPC agency_me
 * 2) VIEW professionnels_agency_v3
 * 3) TABLE professionnels
 */
async function fetchAgencyContextForUser(userId) {
  try {
    const { data, error } = await supabase.rpc("agency_me");
    if (!error) {
      const row = Array.isArray(data) ? data[0] : data;
      if (row && (row.agency_role || row.agency_id)) return row;
    }
  } catch {
    // ignore
  }

  try {
    const { data, error } = await supabase
      .from("professionnels_agency_v3")
      .select("user_id, agency_id, agency_role")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && data && (data.agency_role || data.agency_id)) {
      return { ...data };
    }
  } catch {
    // ignore
  }

  try {
    const { data, error } = await supabase
      .from("professionnels")
      .select("user_id, agency_id, agency_role")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && data && (data.agency_role || data.agency_id)) {
      return { ...data };
    }
  } catch {
    // ignore
  }

  return null;
}

const AgenceTeamLeaderDashboardPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin } = useAuth();

  const [checkingRole, setCheckingRole] = useState(true);
  const [roleError, setRoleError] = useState(null);

  const [me, setMe] = useState(null);
  const [canEditAgency, setCanEditAgency] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const authUid = user?.id || null;

  const { profile, setProfile } = useProCardData(authUid, user?.email);
  useProCardSave(profile, setProfile, authUid, user?.email);
  useAgencyData();

  const roleLower = useMemo(
    () => String(me?.agency_role || "").toLowerCase(),
    [me?.agency_role]
  );
  const isTeamLeader = roleLower === "team_leader";
  const isDirector = roleLower === "director";

  const retry = () => window.location.reload();
  const backToPro = () => navigate("/professionnel-dashboard");

  useEffect(() => {
    let mounted = true;

    const checkRole = async () => {
      if (authLoading) return;

      if (mounted) {
        setCheckingRole(true);
        setRoleError(null);
        setMe(null);
        setCanEditAgency(false);
      }

      try {
        if (!user) {
          navigate("/connexion?role=professionnel&next=/agence/team-leader");
          return;
        }

        if (isAdmin) {
          navigate("/admin-dashboard");
          return;
        }

        const ctx = await fetchAgencyContextForUser(user.id);

        if (!mounted) return;

        if (!ctx) {
          throw new Error("Impossible de déterminer le rôle (agency_me/view/pro : empty).");
        }

        setMe(ctx);

        const role = String(ctx?.agency_role || "").toLowerCase();

        if (role === "director") {
          navigate("/agence/dashboard");
          return;
        }

        if (role !== "team_leader") {
          navigate("/professionnel-dashboard");
          return;
        }

        if (ctx?.agency_id) {
          const { data: agencyData, error: agencyError } = await supabase
            .from("agencies")
            .select("team_leader_can_edit_agency")
            .eq("id", ctx.agency_id)
            .maybeSingle();

          if (!agencyError && mounted) {
            setCanEditAgency(!!agencyData?.team_leader_can_edit_agency);
          }
        }

        if (mounted) {
          setCheckingRole(false);
        }
      } catch (err) {
        console.error("[TL Dashboard] role check failed:", err);
        if (!mounted) return;
        setRoleError(err);
        setCheckingRole(false);
      }
    };

    checkRole();

    return () => {
      mounted = false;
    };
  }, [authLoading, user, isAdmin, navigate]);

  if (authLoading || checkingRole) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-brand-blue" />
        <span className="sr-only">Chargement...</span>
      </div>
    );
  }

  if (roleError) {
    return (
      <ErrorBox
        title="Impossible de charger l'espace Chef d'Équipe"
        description={roleError?.message || "Une erreur est survenue pendant la vérification des droits."}
        onRetry={retry}
        onBack={backToPro}
      />
    );
  }

  if (isDirector) return null;
  if (!isTeamLeader) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-10">
      <SEO
        title="Tableau de Bord Chef d'Équipe"
        description="Gérez votre équipe, vos projets et vos leads."
      />

      <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-blue/10 rounded-lg">
                <Users className="h-6 w-6 text-brand-blue" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Espace Chef d'Équipe</h1>
                <p className="text-xs text-gray-500">Gestion d'équipe et activité</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canEditAgency && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/agence/configuration")}
                  className="hidden md:flex"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Configuration
                </Button>
              )}
            </div>
          </div>

          <div className="mt-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b rounded-none space-x-6 overflow-x-auto no-scrollbar">
                <TabsTrigger
                  value="profile"
                  className="data-[state=active]:border-brand-blue data-[state=active]:text-brand-blue data-[state=active]:shadow-none border-b-2 border-transparent rounded-none px-2 py-3 bg-transparent h-auto font-medium text-gray-500 hover:text-gray-700"
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Mon Profil & Carte
                </TabsTrigger>

                <TabsTrigger
                  value="team"
                  className="data-[state=active]:border-brand-blue data-[state=active]:text-brand-blue data-[state=active]:shadow-none border-b-2 border-transparent rounded-none px-2 py-3 bg-transparent h-auto font-medium text-gray-500 hover:text-gray-700"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Mon Équipe
                </TabsTrigger>

                <TabsTrigger
                  value="leads"
                  className="data-[state=active]:border-brand-blue data-[state=active]:text-brand-blue data-[state=active]:shadow-none border-b-2 border-transparent rounded-none px-2 py-3 bg-transparent h-auto font-medium text-gray-500 hover:text-gray-700"
                >
                  <Megaphone className="w-4 h-4 mr-2" />
                  Leads Directs
                </TabsTrigger>

                <TabsTrigger
                  value="connections"
                  className="data-[state=active]:border-brand-blue data-[state=active]:text-brand-blue data-[state=active]:shadow-none border-b-2 border-transparent rounded-none px-2 py-3 bg-transparent h-auto font-medium text-gray-500 hover:text-gray-700"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Mises en relation
                </TabsTrigger>

                <TabsTrigger
                  value="projects"
                  className="data-[state=active]:border-brand-blue data-[state=active]:text-brand-blue data-[state=active]:shadow-none border-b-2 border-transparent rounded-none px-2 py-3 bg-transparent h-auto font-medium text-gray-500 hover:text-gray-700"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Mes Projets
                </TabsTrigger>

                <TabsTrigger
                  value="projects-pilot"
                  className="data-[state=active]:border-brand-blue data-[state=active]:text-brand-blue data-[state=active]:shadow-none border-b-2 border-transparent rounded-none px-2 py-3 bg-transparent h-auto font-medium text-gray-500 hover:text-gray-700"
                >
                  <FolderKanban className="w-4 h-4 mr-2" />
                  Projets équipe
                </TabsTrigger>

                {canEditAgency && (
                  <TabsTrigger
                    value="agency"
                    className="data-[state=active]:border-brand-blue data-[state=active]:text-brand-blue data-[state=active]:shadow-none border-b-2 border-transparent rounded-none px-2 py-3 bg-transparent h-auto font-medium text-gray-500 hover:text-gray-700"
                  >
                    <Building className="w-4 h-4 mr-2" />
                    Agence
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Suspense
          fallback={
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          }
        >
          <Tabs value={activeTab} className="space-y-4">
            <TabsContent value="profile" className="outline-none">
              <ProfessionnelProfilePage />
            </TabsContent>

            <TabsContent value="team" className="outline-none">
              <AgencyAgentsPage />
            </TabsContent>

            <TabsContent value="leads" className="outline-none">
              <ProfessionnelDirectLeadsPage />
            </TabsContent>

            <TabsContent value="connections" className="outline-none">
              <ProfessionnelConnectionsPage />
            </TabsContent>

            <TabsContent value="projects" className="outline-none">
              <ProfessionnelSharedProjectsPage />
            </TabsContent>

            <TabsContent value="projects-pilot" className="outline-none">
              <ProjectsPilotPlaceholder onOpen={() => navigate("/agence/projets")} />
            </TabsContent>

            {canEditAgency && (
              <TabsContent value="agency" className="outline-none">
                <Card>
                  <CardHeader>
                    <CardTitle>Gestion de l'agence</CardTitle>
                    <CardDescription>
                      Vous avez l'autorisation de modifier certaines informations de l'agence.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AgencySettingsPlaceholder />
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </Suspense>
      </div>
    </div>
  );
};

export default AgenceTeamLeaderDashboardPage;