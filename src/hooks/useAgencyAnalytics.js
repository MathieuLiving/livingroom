import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/customSupabaseClient";
import {
  getAgencyAnalyticsScope,
  normalizeRole as normalizeScopeRole,
} from "@/lib/agencyAnalyticsScope";

const normalizeRole = (value) =>
  normalizeScopeRole
    ? normalizeScopeRole(value)
    : String(value || "").trim().toLowerCase();

const normalizeId = (value) => String(value || "").trim();
const safeArray = (value) => (Array.isArray(value) ? value : []);

const addToMap = (map, key, value = 1) => {
  const id = normalizeId(key);
  if (!id) return;
  map.set(id, (Number(map.get(id) || 0) || 0) + (Number(value) || 0));
};

const getProjectOwnerId = (row) =>
  normalizeId(row?.assigned_to || row?.professionnel_id);

async function resolveViewerContext({
  agencyId,
  viewerRole,
  viewerProfessionnelId,
}) {
  const explicitRole = normalizeRole(viewerRole);
  const explicitProId = normalizeId(viewerProfessionnelId);

  if (explicitRole && explicitProId) {
    return {
      viewerRole: explicitRole,
      viewerProfessionnelId: explicitProId,
      source: "props",
    };
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;

  if (!user?.id) {
    return {
      viewerRole: explicitRole || "",
      viewerProfessionnelId: explicitProId || "",
      source: "none",
    };
  }

  const { data: pro, error: proError } = await supabase
    .from("professionnels")
    .select("id, agency_id, agency_role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (proError) throw proError;

  const resolvedRole = normalizeRole(explicitRole || pro?.agency_role);
  const resolvedProId = normalizeId(explicitProId || pro?.id);
  const resolvedAgencyId = normalizeId(pro?.agency_id);

  if (agencyId && resolvedAgencyId && normalizeId(agencyId) !== resolvedAgencyId) {
    console.warn("[useAgencyAnalytics] agence incohérente", {
      expectedAgencyId: agencyId,
      resolvedAgencyId,
    });
  }

  return {
    viewerRole: resolvedRole,
    viewerProfessionnelId: resolvedProId,
    source: "auth-fallback",
  };
}

export function useAgencyAnalytics({
  agencyId,
  viewerRole,
  viewerProfessionnelId,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [overview, setOverview] = useState({
    buying_projects: 0,
    selling_projects: 0,
    projects: 0,
    leads: 0,
    clicks: 0,
    scans: 0,
  });

  const [memberStats, setMemberStats] = useState([]);
  const [scopeType, setScopeType] = useState("agency");

  const refreshAnalytics = useCallback(async () => {
    if (!agencyId) {
      setOverview({
        buying_projects: 0,
        selling_projects: 0,
        projects: 0,
        leads: 0,
        clicks: 0,
        scans: 0,
      });
      setMemberStats([]);
      setError(null);
      setScopeType("none");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const resolvedViewer = await resolveViewerContext({
        agencyId,
        viewerRole,
        viewerProfessionnelId,
      });

      const resolvedViewerRole = normalizeRole(resolvedViewer?.viewerRole);
      const resolvedViewerProfessionnelId = normalizeId(
        resolvedViewer?.viewerProfessionnelId
      );

      const { data: members, error: membersError } = await supabase
        .from("professionnels")
        .select(`
          id,
          first_name,
          last_name,
          agency_role,
          agency_id,
          is_active,
          is_archived,
          director_id,
          team_leader_id
        `)
        .eq("agency_id", agencyId)
        .order("last_name", { ascending: true });

      if (membersError) throw membersError;

      const allMembers = safeArray(members).filter(
        (member) =>
          member?.is_active !== false && member?.is_archived !== true
      );

      const scope = getAgencyAnalyticsScope({
        members: allMembers,
        viewerRole: resolvedViewerRole,
        viewerProfessionnelId: resolvedViewerProfessionnelId,
      });

      const scopedMembers = safeArray(scope.members);
      const memberIds = scopedMembers
        .map((m) => normalizeId(m?.id))
        .filter(Boolean);

      setScopeType(scope.scopeType || "agency");

      if (memberIds.length === 0) {
        setOverview({
          buying_projects: 0,
          selling_projects: 0,
          projects: 0,
          leads: 0,
          clicks: 0,
          scans: 0,
        });
        setMemberStats([]);
        setLoading(false);
        return;
      }

      const memberIdsCsv = memberIds.join(",");

      const [sellingRes, buyingRes, leadsRes, cardsRes] = await Promise.all([
        supabase
          .from("selling_projects_professionnel")
          .select("id, professionnel_id, assigned_to, status, agency_id")
          .eq("status", "active")
          .or(
            `professionnel_id.in.(${memberIdsCsv}),assigned_to.in.(${memberIdsCsv})`
          ),

        supabase
          .from("buying_projects_professionnel")
          .select("id, professionnel_id, assigned_to, status, agency_id")
          .eq("status", "active")
          .or(
            `professionnel_id.in.(${memberIdsCsv}),assigned_to.in.(${memberIdsCsv})`
          ),

        supabase
          .from("direct_leads")
          .select("id, professionnel_id, status, agency_id")
          .eq("status", "active")
          .in("professionnel_id", memberIds),

        supabase
          .from("pro_cards_effective_v4")
          .select("professionnel_id, card_url_clicks, card_qr_scans")
          .in("professionnel_id", memberIds),
      ]);

      if (sellingRes.error) throw sellingRes.error;
      if (buyingRes.error) throw buyingRes.error;
      if (leadsRes.error) throw leadsRes.error;
      if (cardsRes.error) throw cardsRes.error;

      const sellingRows = safeArray(sellingRes.data);
      const buyingRows = safeArray(buyingRes.data);
      const leadsRows = safeArray(leadsRes.data);
      const cardsRows = safeArray(cardsRes.data);

      const sellingMap = new Map();
      const buyingMap = new Map();
      const leadsMap = new Map();
      const clicksMap = new Map();
      const scansMap = new Map();

      for (const row of sellingRows) {
        const ownerId = getProjectOwnerId(row);
        if (memberIds.includes(ownerId)) addToMap(sellingMap, ownerId, 1);
      }

      for (const row of buyingRows) {
        const ownerId = getProjectOwnerId(row);
        if (memberIds.includes(ownerId)) addToMap(buyingMap, ownerId, 1);
      }

      for (const row of leadsRows) {
        const ownerId = normalizeId(row?.professionnel_id);
        if (memberIds.includes(ownerId)) addToMap(leadsMap, ownerId, 1);
      }

      for (const row of cardsRows) {
        const id = normalizeId(row?.professionnel_id);
        if (!memberIds.includes(id)) continue;

        addToMap(clicksMap, id, Number(row?.card_url_clicks ?? 0) || 0);
        addToMap(scansMap, id, Number(row?.card_qr_scans ?? 0) || 0);
      }

      const rows = scopedMembers
        .map((member) => {
          const memberId = normalizeId(member?.id);

          const sellingCount = sellingMap.get(memberId) || 0;
          const buyingCount = buyingMap.get(memberId) || 0;
          const totalProjects = sellingCount + buyingCount;
          const totalLeads = leadsMap.get(memberId) || 0;
          const totalClicks = clicksMap.get(memberId) || 0;
          const totalScans = scansMap.get(memberId) || 0;

          return {
            id: memberId,
            first_name: member?.first_name || "",
            last_name: member?.last_name || "",
            full_name:
              `${member?.first_name || ""} ${member?.last_name || ""}`.trim() ||
              "Collaborateur",
            role: normalizeRole(member?.agency_role),
            is_active: member?.is_active ?? true,
            director_id: normalizeId(member?.director_id),
            team_leader_id: normalizeId(member?.team_leader_id),
            selling_projects: sellingCount,
            buying_projects: buyingCount,
            projects: totalProjects,
            leads: totalLeads,
            clicks: totalClicks,
            scans: totalScans,
          };
        })
        .sort((a, b) => a.full_name.localeCompare(b.full_name, "fr"));

      const totals = rows.reduce(
        (acc, row) => {
          acc.buying_projects += Number(row.buying_projects || 0);
          acc.selling_projects += Number(row.selling_projects || 0);
          acc.projects += Number(row.projects || 0);
          acc.leads += Number(row.leads || 0);
          acc.clicks += Number(row.clicks || 0);
          acc.scans += Number(row.scans || 0);
          return acc;
        },
        {
          buying_projects: 0,
          selling_projects: 0,
          projects: 0,
          leads: 0,
          clicks: 0,
          scans: 0,
        }
      );

      setMemberStats(rows);
      setOverview(totals);
    } catch (err) {
      console.error("Error fetching agency stats:", err);
      setError(err);
      setOverview({
        buying_projects: 0,
        selling_projects: 0,
        projects: 0,
        leads: 0,
        clicks: 0,
        scans: 0,
      });
      setMemberStats([]);
    } finally {
      setLoading(false);
    }
  }, [agencyId, viewerRole, viewerProfessionnelId]);

  useEffect(() => {
    refreshAnalytics();
  }, [refreshAnalytics]);

  return {
    loading,
    error,
    overview,
    memberStats,
    scopeType,
    refreshAnalytics,
  };
}

export default useAgencyAnalytics;