// src/pages/agence/AgenceDirectorDashboardPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "../../../lib/customSupabaseClient";
import SEO from "@/components/SEO";
import {
  Loader2,
  LayoutDashboard,
  UserCircle,
  LogOut,
  AlertCircle,
  RefreshCw,
  FolderKanban,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Tabs
import AgencyConfigurationTab from "@/components/agence/AgencyConfigurationTab";
import DirectorPersonalProfileTab from "@/components/agence/DirectorPersonalProfileTab";

export default function AgenceDirectorDashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [directorProId, setDirectorProId] = useState(null);
  const [agencyId, setAgencyId] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const fetchDirectorContext = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setLoadError(null);

    try {
      const { data, error } = await supabase
        .from("professionnels")
        .select("id, agency_id, agency_role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setDirectorProId(null);
        setAgencyId(null);
        setLoadError(
          "Aucun profil professionnel trouvé pour ce compte. Vérifie que ton utilisateur est bien relié à la table 'professionnels'."
        );
        return;
      }

      const role = String(data.agency_role || "").toLowerCase();
      if (role !== "director") {
        navigate("/professionnel-dashboard", { replace: true });
        return;
      }

      if (!data.agency_id) {
        setDirectorProId(data.id || null);
        setAgencyId(null);
        setLoadError(
          "Votre profil directeur n'est pas relié à une agence (agency_id manquant)."
        );
        return;
      }

      setDirectorProId(data.id);
      setAgencyId(data.agency_id);
    } catch (err) {
      console.error("[AgenceDirectorDashboardPage] Error fetching context:", err);
      setDirectorProId(null);
      setAgencyId(null);
      setLoadError(err?.message || "Erreur lors du chargement du contexte directeur.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, navigate]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/connexion", { replace: true });
      return;
    }

    fetchDirectorContext();
  }, [user, authLoading, navigate, fetchDirectorContext]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-brand-blue" />
          <p className="text-sm text-gray-500">Chargement de l’espace directeur…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SEO
          title="Espace Directeur | LivingRoom"
          description="Gérez votre agence et votre profil."
        />
        <div className="container mx-auto px-4 py-10 max-w-3xl">
          <Card className="border-red-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-red-100 p-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>

                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Accès impossible
                  </h2>

                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                    {loadError}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={fetchDirectorContext}
                      className="gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Réessayer
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => navigate("/professionnel-dashboard")}
                      className="gap-2"
                    >
                      Retour au dashboard pro
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => signOut()}
                      className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Déconnexion
                    </Button>
                  </div>

                  <div className="mt-6 text-xs text-gray-500">
                    Debug: directorProId=
                    <span className="font-mono">{String(directorProId || "null")}</span>{" "}
                    agencyId=
                    <span className="font-mono">{String(agencyId || "null")}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <SEO
        title="Tableau de Bord Directeur | LivingRoom"
        description="Gérez votre agence, votre profil et le pilotage des projets."
      />

      <header className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="text-brand-blue w-6 h-6" />
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block">
              Espace Directeur
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:inline">
              {user?.email}
            </span>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className="text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Tableau de Bord</h2>
          <p className="text-gray-500 mt-1">
            Configurez votre agence, gérez votre identité professionnelle et pilotez les projets de vos équipes.
          </p>
        </div>

        <Tabs defaultValue="agency" className="w-full space-y-8">
          <TabsList className="w-full sm:w-auto grid grid-cols-3 p-1 bg-white border shadow-sm rounded-xl h-14">
            <TabsTrigger
              value="agency"
              className="rounded-lg text-base font-medium data-[state=active]:bg-brand-blue data-[state=active]:text-white transition-all"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Configuration Agence
            </TabsTrigger>

            <TabsTrigger
              value="profile"
              className="rounded-lg text-base font-medium data-[state=active]:bg-brand-blue data-[state=active]:text-white transition-all"
            >
              <UserCircle className="w-4 h-4 mr-2" />
              Mon Profil
            </TabsTrigger>

            <TabsTrigger
              value="projects"
              onClick={() => navigate("/agence/projets")}
              className="rounded-lg text-base font-medium data-[state=active]:bg-brand-blue data-[state=active]:text-white transition-all"
            >
              <FolderKanban className="w-4 h-4 mr-2" />
              Projets de l’agence
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agency" className="outline-none">
            <AgencyConfigurationTab agencyId={agencyId} />
          </TabsContent>

          <TabsContent value="profile" className="outline-none">
            <DirectorPersonalProfileTab
              directorProId={directorProId}
              agencyId={agencyId}
            />
          </TabsContent>

          <TabsContent value="projects" className="outline-none">
            <Card>
              <CardContent className="p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Pilotage des projets de l’agence
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Accédez à la vue complète des projets achat et vente de tous les collaborateurs de votre agence.
                  </p>
                </div>

                <Button onClick={() => navigate("/agence/projets")} className="gap-2">
                  <FolderKanban className="w-4 h-4" />
                  Ouvrir le pilotage projets
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}