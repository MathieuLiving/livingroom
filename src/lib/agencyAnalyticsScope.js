const normalizeId = (value) => String(value || "").trim();

const normalizeRole = (value) => {
  const raw = String(value || "").trim().toLowerCase();

  if (raw === "director" || raw === "agency_director" || raw === "directeur") {
    return "director";
  }

  if (raw === "team_leader" || raw === "teamleader" || raw === "leader") {
    return "team_leader";
  }

  if (raw === "agent_affiliate" || raw === "affiliate") {
    return "agent_affiliate";
  }

  if (raw === "agent") {
    return "agent";
  }

  return raw;
};

export function getAgencyAnalyticsScope({
  members = [],
  viewerRole,
  viewerProfessionnelId,
}) {
  const normalizedRole = normalizeRole(viewerRole);
  const viewerId = normalizeId(viewerProfessionnelId);
  const safeMembers = Array.isArray(members) ? members : [];

  if (!viewerId) {
    return {
      scopeType: "none",
      members: [],
    };
  }

  if (normalizedRole === "director") {
    return {
      scopeType: "agency",
      members: safeMembers,
    };
  }

  if (normalizedRole === "team_leader") {
    return {
      scopeType: "team_leader",
      members: safeMembers.filter((member) => {
        const memberId = normalizeId(member?.id);
        const memberTeamLeaderId = normalizeId(member?.team_leader_id);
        return memberId === viewerId || memberTeamLeaderId === viewerId;
      }),
    };
  }

  return {
    scopeType: "self",
    members: safeMembers.filter(
      (member) => normalizeId(member?.id) === viewerId
    ),
  };
}

export function getAgencyAnalyticsScopeMeta({ viewerRole }) {
  const normalizedRole = normalizeRole(viewerRole);

  if (normalizedRole === "director") {
    return {
      scopeType: "agency",
      scopeLabel: "Vue agence complète",
    };
  }

  if (normalizedRole === "team_leader") {
    return {
      scopeType: "team_leader",
      scopeLabel: "Vue limitée au périmètre du team leader",
    };
  }

  return {
    scopeType: "self",
    scopeLabel: "Vue individuelle",
  };
}

export { normalizeRole };