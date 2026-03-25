import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgencyAnalytics } from "@/hooks/useAgencyAnalytics";
import AgencyStatsOverviewCards from "@/components/agence/stats/AgencyStatsOverviewCards";
import AgencyStatsMembersTable from "@/components/agence/stats/AgencyStatsMembersTable";
import { getAgencyAnalyticsScopeMeta } from "@/lib/agencyAnalyticsScope";

export default function AgencyStatisticsPage({
  agency,
  viewerRole,
  viewerProfessionnelId,
}) {
  const {
    loading,
    error,
    overview,
    memberStats,
    refreshAnalytics,
  } = useAgencyAnalytics({
    agencyId: agency?.id,
    viewerRole,
    viewerProfessionnelId,
  });

  const safeMembers = Array.isArray(memberStats) ? memberStats : [];
  const scopeMeta = getAgencyAnalyticsScopeMeta({ viewerRole });

  if (loading && safeMembers.length === 0) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Vue d’ensemble</h2>
          <p className="text-sm text-slate-500">{scopeMeta.scopeLabel}</p>
        </div>

        <Button variant="outline" onClick={refreshAnalytics} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Actualisation...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualiser
            </>
          )}
        </Button>
      </div>

      {error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-start gap-3 p-6">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
            <div>
              <p className="font-medium text-red-700">
                Impossible de charger les statistiques agence.
              </p>
              <p className="mt-1 text-sm text-red-600">
                {error?.message || "Une erreur technique est survenue."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <AgencyStatsOverviewCards
        totalBuyingProjects={overview?.buying_projects || 0}
        totalSellingProjects={overview?.selling_projects || 0}
        totalLeads={overview?.leads || 0}
        totalClicks={overview?.clicks || 0}
        totalScans={overview?.scans || 0}
      />

      <AgencyStatsMembersTable members={safeMembers} />
    </div>
  );
}