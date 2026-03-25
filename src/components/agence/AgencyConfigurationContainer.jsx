// src/components/agence/AgencyConfigurationContainer.jsx
import React, { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Palette,
  Users,
  BarChart3,
  CreditCard,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// ✅ Onglet 1 = fusion
import AgencySettingsForm from "./AgencySettingsForm";
import AgencyColorsToggle from "./AgencyColorsToggle";
import AgencySocialNetworksForm from "./AgencySocialNetworksForm";

// ✅ Onglets existants
import TeamManagementTab from "./TeamManagementTab";
import SubscriptionTab from "./SubscriptionTab";
import StatisticsTab from "./StatisticsTab";

// ✅ Source de vérité agence + permissions + updateAgency()
import { useAgencyData } from "@/hooks/useAgencyData";

/**
 * ✅ AgencyConfigurationContainer
 * - Centralise un "permissions" normalisé pour les forms agence
 * - Ajoute un mapping cohérent pour la gestion des liens (lock_links + délégation)
 * - Passe aussi le contexte viewer au tab statistiques
 */
export default function AgencyConfigurationContainer({
  agencyId,
  viewerProfessionnelId,
  viewerAgencyRole,
}) {
  const { agency, loading, error, permissions, updateAgency, applyAgencyPatch } =
    useAgencyData();

  const effectiveAgency = agency || { id: agencyId };
  const onAgencyUpdated = (patch) => applyAgencyPatch?.(patch);

  const normalizedPermissions = useMemo(() => {
    const p = permissions || {};
    const a = effectiveAgency || {};

    const roleRaw = String(
      p.role ||
        p.agency_role ||
        p.agencyRole ||
        p.currentRole ||
        p.userAgencyRole ||
        ""
    )
      .trim()
      .toLowerCase();

    const professionnelId =
      p.professionnelId ||
      p.professionnel_id ||
      p.proId ||
      p.meProfessionnelId ||
      null;

    const effectiveRole = String(
      viewerAgencyRole || p.role || roleRaw || ""
    )
      .trim()
      .toLowerCase();

    const effectiveProfessionnelId =
      viewerProfessionnelId || professionnelId || null;

    const isDirector =
      !!p.isDirector ||
      effectiveRole === "director" ||
      effectiveRole === "directeur" ||
      effectiveRole === "agency_director";

    const isTeamLeader =
      !!p.isTeamLeader ||
      effectiveRole === "team_leader" ||
      effectiveRole === "teamleader";

    const isAgentAffiliate =
      !!p.isAgentAffiliate ||
      effectiveRole === "agent_affiliate" ||
      effectiveRole === "affiliate";

    const canEditAgency =
      typeof p.canEditAgency === "boolean" ? p.canEditAgency : isDirector;

    const canEditLinks =
      typeof p.canEditLinks === "boolean" ? p.canEditLinks : isDirector;

    const lockLinks =
      typeof p.lockLinks === "boolean" ? p.lockLinks : !!a.lock_links;

    const teamLeaderCanEdit =
      typeof p.teamLeaderCanEditAgency === "boolean"
        ? p.teamLeaderCanEditAgency
        : !!a.team_leader_can_edit_agency;

    const agentCanEdit =
      typeof p.agentCanEditAgency === "boolean"
        ? p.agentCanEditAgency
        : !!a.agent_can_edit_agency;

    const canModifyAgencyLinks = (() => {
      if (isDirector) return true;
      if (lockLinks) return false;
      if (isTeamLeader) return !!teamLeaderCanEdit;
      if (isAgentAffiliate) return !!agentCanEdit;
      return false;
    })();

    return {
      ...p,

      // standardisés
      role: effectiveRole || null,
      professionnelId: effectiveProfessionnelId,

      isDirector,
      isTeamLeader,
      isAgentAffiliate,

      canEditAgency,
      canEditLinks,
      lockLinks,

      teamLeaderCanEditAgency: teamLeaderCanEdit,
      agentCanEditAgency: agentCanEdit,

      canModifyAgencyLinks,
    };
  }, [permissions, effectiveAgency, viewerProfessionnelId, viewerAgencyRole]);

  if (!agencyId) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border min-h-[700px] overflow-hidden">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold text-gray-900">L’Agence</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gérez l’identité de l’agence, la charte graphique, les réseaux,
          l’équipe, les statistiques et l’abonnement.
        </p>
      </div>

      <div className="p-6">
        {loading && !agency && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription className="text-xs">
              {error?.message || "Erreur lors du chargement de l’agence."}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="brand" className="w-full">
          <TabsList className="w-full grid grid-cols-2 md:grid-cols-4 p-1 bg-slate-50 border rounded-xl h-14">
            <TabsTrigger
              value="brand"
              className="rounded-lg text-sm md:text-base font-medium data-[state=active]:bg-brand-blue data-[state=active]:text-white transition-all"
            >
              <Palette className="w-4 h-4 mr-2" />
              Charte & Réseaux
            </TabsTrigger>

            <TabsTrigger
              value="team"
              className="rounded-lg text-sm md:text-base font-medium data-[state=active]:bg-brand-blue data-[state=active]:text-white transition-all"
            >
              <Users className="w-4 h-4 mr-2" />
              Équipe
            </TabsTrigger>

            <TabsTrigger
              value="stats"
              className="rounded-lg text-sm md:text-base font-medium data-[state=active]:bg-brand-blue data-[state=active]:text-white transition-all"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Statistiques Agence
            </TabsTrigger>

            <TabsTrigger
              value="subscription"
              className="rounded-lg text-sm md:text-base font-medium data-[state=active]:bg-brand-blue data-[state=active]:text-white transition-all"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Abonnement
            </TabsTrigger>
          </TabsList>

          <TabsContent value="brand" className="outline-none mt-6">
            <div className="space-y-6">
              <AgencySettingsForm
                agency={effectiveAgency}
                permissions={normalizedPermissions}
                updateAgency={updateAgency}
                onAgencyUpdated={onAgencyUpdated}
              />

              <AgencyColorsToggle
                agency={effectiveAgency}
                permissions={normalizedPermissions}
                updateAgency={updateAgency}
                onAgencyUpdated={onAgencyUpdated}
              />

              <AgencySocialNetworksForm
                agency={effectiveAgency}
                permissions={normalizedPermissions}
                updateAgency={updateAgency}
                onAgencyUpdated={onAgencyUpdated}
              />
            </div>
          </TabsContent>

          <TabsContent value="team" className="outline-none mt-6">
            <TeamManagementTab agency={effectiveAgency} />
          </TabsContent>

          <TabsContent value="stats" className="outline-none mt-6">
            <StatisticsTab
              agency={effectiveAgency}
              viewerRole={normalizedPermissions?.role}
              viewerProfessionnelId={normalizedPermissions?.professionnelId}
            />
          </TabsContent>

          <TabsContent value="subscription" className="outline-none mt-6">
            <SubscriptionTab agencyId={agencyId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}