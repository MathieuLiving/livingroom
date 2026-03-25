import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "../../lib/customSupabaseClient";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useToast } from "@/components/ui/use-toast";

const ATTACHED_ROLES = new Set(["director", "team_leader", "agent_affiliate"]);

const normalizeRole = (value) => String(value || "").toLowerCase().trim();

function isAgencyAttachedRole(role) {
  return ATTACHED_ROLES.has(normalizeRole(role));
}

function isMissingRelationError(err) {
  const msg = String(err?.message || "").toLowerCase();
  const code = String(err?.code || "").toLowerCase();
  return (
    msg.includes("does not exist") ||
    msg.includes("relation") ||
    msg.includes("42p01") ||
    code === "42p01"
  );
}

function getMyRoleFromAgencyRow(row) {
  const candidates = [
    row?.me_agency_role,
    row?.me_role,
    row?.role,
    row?.agency_role,
    row?.me_agency_role_text,
  ]
    .map((v) => String(v || "").toLowerCase().trim())
    .filter(Boolean);

  return candidates[0] || null;
}

function getMyRoleFromPro(pro) {
  const r = String(pro?.agency_role || "").toLowerCase().trim();
  return r || null;
}

function normalizeAgencyRow(row) {
  if (!row) return null;

  return {
    ...row,

    id: row.id || row.agency_id || null,
    agency_id: row.agency_id || row.id || null,

    name: row.name || row.agency_name || row.company_name || "",
    network_name: row.network_name || row.franchise_name || row.groupement_name || "",

    website_url:
      row.website_url ||
      row.agency_website_url ||
      row.effective_website_url ||
      "",

    estimation_tool_url:
      row.estimation_tool_url || row.estimation_url || row.estimation_link || "",

    logo_url:
      row.logo_url ||
      row.agency_logo_url ||
      row.effective_logo_url ||
      "",

    logo_storage_path:
      row.logo_storage_path ||
      row.logo_path ||
      row.agency_logo_path ||
      row.effective_logo_path ||
      "",

    video_url:
      row.video_url ||
      row.agency_video_url ||
      row.effective_video_url ||
      "",

    video_external_url:
      row.video_external_url ||
      row.agency_video_external_url ||
      row.effective_video_external_url ||
      "",

    video_storage_path:
      row.video_storage_path ||
      row.agency_video_storage_path ||
      row.effective_video_storage_path ||
      "",

    video_preferred_source:
      row.video_preferred_source ||
      row.agency_video_preferred_source ||
      row.effective_video_preferred_source ||
      "none",

    me_can_edit_agency: !!row.me_can_edit_agency,
    lock_colors: !!row.lock_colors,
    lock_links: !!row.lock_links,
    colors_uniform: !!row.colors_uniform,
    team_leader_can_edit_agency: !!row.team_leader_can_edit_agency,
    agent_can_edit_agency: !!row.agent_can_edit_agency,
    enforce_logo: !!row.enforce_logo,
    enforce_video: !!row.enforce_video,

    card_banner_color:
      row.card_banner_color ??
      row.agency_card_banner_color ??
      row.effective_card_banner_color ??
      null,

    card_text_color:
      row.card_text_color ??
      row.agency_card_text_color ??
      row.effective_card_text_color ??
      null,

    card_primary_button_color:
      row.card_primary_button_color ??
      row.agency_card_primary_button_color ??
      row.effective_card_primary_button_color ??
      null,

    card_secondary_button_color:
      row.card_secondary_button_color ??
      row.agency_card_secondary_button_color ??
      row.effective_card_secondary_button_color ??
      null,

    card_name_color:
      row.card_name_color ??
      row.agency_card_name_color ??
      row.effective_card_name_color ??
      null,

    card_signature_color:
      row.card_signature_color ??
      row.agency_card_signature_color ??
      row.effective_card_signature_color ??
      null,

    card_company_name_color:
      row.card_company_name_color ??
      row.agency_card_company_name_color ??
      row.effective_card_company_name_color ??
      null,

    card_support_text_color:
      row.card_support_text_color ??
      row.agency_card_support_text_color ??
      row.effective_card_support_text_color ??
      null,

    card_qr_fg_color:
      row.card_qr_fg_color ??
      row.agency_card_qr_fg_color ??
      row.effective_card_qr_fg_color ??
      null,

    qr_code_with_logo: !!(
      row.qr_code_with_logo ??
      row.agency_qr_code_with_logo ??
      row.effective_qr_code_with_logo
    ),

    updated_at: row.updated_at || null,
  };
}

async function resolveAgencyIdFromProfessionnel(userId) {
  if (!userId || !supabase) return null;

  const { data, error } = await supabase
    .from("professionnels")
    .select("agency_id, agency_role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  const role = normalizeRole(data?.agency_role);
  if (!data?.agency_id) return null;
  if (!isAgencyAttachedRole(role)) return null;

  return {
    agency_id: data.agency_id,
    agency_role: role || null,
  };
}

export function useAgencyData() {
  const { user, isAuthBusy, isAdmin, pro } = useAuth();
  const { toast } = useToast();

  const [agency, setAgency] = useState(null);
  const [resolvedAgencyContext, setResolvedAgencyContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);
  const lastLoadedAgencyIdRef = useRef(null);
  const lastLoadedDataRef = useRef(null);
  const abortControllerRef = useRef(null);
  const currentAgencyIdRef = useRef(null);
  const lastUpdatedAtRef = useRef(null);

  const proAgencyRole = useMemo(() => normalizeRole(pro?.agency_role), [pro?.agency_role]);

  const proAgencyIdFromContext = useMemo(() => {
    if (!pro?.agency_id) return null;
    if (!isAgencyAttachedRole(proAgencyRole)) return null;
    return pro.agency_id;
  }, [pro?.agency_id, proAgencyRole]);

  const effectiveAgencyId = useMemo(() => {
    return (
      agency?.agency_id ||
      agency?.id ||
      resolvedAgencyContext?.agency_id ||
      proAgencyIdFromContext ||
      null
    );
  }, [
    agency?.agency_id,
    agency?.id,
    resolvedAgencyContext?.agency_id,
    proAgencyIdFromContext,
  ]);

  const commitAgencyState = useCallback((nextRow) => {
    const normalized = normalizeAgencyRow(nextRow);
    lastLoadedDataRef.current = normalized;
    lastLoadedAgencyIdRef.current = normalized?.agency_id || normalized?.id || null;
    lastUpdatedAtRef.current = normalized?.updated_at || null;

    if (mountedRef.current) {
      setAgency(normalized);
      setError(null);
      setLoading(false);
    }

    return normalized;
  }, []);

  const stopAndClear = useCallback(() => {
    if (!mountedRef.current) return;

    setAgency(null);
    setResolvedAgencyContext(null);
    setError(null);
    setLoading(false);

    lastLoadedAgencyIdRef.current = null;
    lastLoadedDataRef.current = null;
    lastUpdatedAtRef.current = null;

    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch {}
    }

    abortControllerRef.current = null;
    currentAgencyIdRef.current = null;
    inFlightRef.current = false;
  }, []);

  const loadAgency = useCallback(
    async (options = {}) => {
      const { force = false, reason = "normal" } = options;

      if (isAuthBusy || !user || isAdmin) {
        stopAndClear();
        return;
      }

      if (!supabase) {
        console.error("Supabase client not initialized in useAgencyData");
        stopAndClear();
        return;
      }

      let resolved = null;

      try {
        if (proAgencyIdFromContext) {
          resolved = {
            agency_id: proAgencyIdFromContext,
            agency_role: proAgencyRole || null,
          };
        } else {
          resolved = await resolveAgencyIdFromProfessionnel(user.id);
        }
      } catch (err) {
        console.error("useAgencyData resolveAgencyIdFromProfessionnel error:", err);
        if (mountedRef.current) {
          setError(err);
          setAgency(null);
          setResolvedAgencyContext(null);
          setLoading(false);
        }
        return;
      }

      const targetAgencyId = resolved?.agency_id || null;

      if (!targetAgencyId) {
        stopAndClear();
        return;
      }

      if (mountedRef.current) {
        setResolvedAgencyContext(resolved);
      }

      if (inFlightRef.current && !force) return;

      if (!force && lastLoadedAgencyIdRef.current === targetAgencyId && lastLoadedDataRef.current) {
        if (mountedRef.current) {
          setAgency(lastLoadedDataRef.current);
          setLoading(false);
          setError(null);
        }
        return;
      }

      const shouldAbort =
        Boolean(abortControllerRef.current) &&
        (currentAgencyIdRef.current !== targetAgencyId || force);

      if (shouldAbort) {
        try {
          abortControllerRef.current.abort();
        } catch {}
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      currentAgencyIdRef.current = targetAgencyId;

      try {
        if (!mountedRef.current) return;

        inFlightRef.current = true;
        setLoading(true);
        setError(null);

        let res = await supabase
          .from("agency_settings_effective_v2")
          .select("*")
          .eq("agency_id", targetAgencyId)
          .maybeSingle()
          .abortSignal(abortController.signal);

        if (res?.error && isMissingRelationError(res.error)) {
          res = await supabase
            .from("agency_settings_effective")
            .select("*")
            .eq("agency_id", targetAgencyId)
            .maybeSingle()
            .abortSignal(abortController.signal);
        }

        if (abortController.signal.aborted) return;
        if (res?.error) throw res.error;

        let normalized = normalizeAgencyRow(res?.data || null);

        if (!normalized) {
          const { data: agencyRow, error: agencyError } = await supabase
            .from("agencies")
            .select("*")
            .eq("id", targetAgencyId)
            .maybeSingle()
            .abortSignal(abortController.signal);

          if (abortController.signal.aborted) return;
          if (agencyError) throw agencyError;

          normalized = normalizeAgencyRow(agencyRow || null);
        }

        if (!mountedRef.current) return;

        commitAgencyState(normalized);
      } catch (err) {
        if (abortController.signal.aborted) return;

        console.error("useAgencyData load error:", { err, reason, targetAgencyId });

        if (!mountedRef.current) return;

        setError(err);
        setAgency(null);
        setLoading(false);

        lastLoadedAgencyIdRef.current = null;
        lastLoadedDataRef.current = null;
        lastUpdatedAtRef.current = null;
      } finally {
        inFlightRef.current = false;
      }
    },
    [isAuthBusy, user, isAdmin, proAgencyIdFromContext, proAgencyRole, stopAndClear, commitAgencyState]
  );

  useEffect(() => {
    mountedRef.current = true;
    loadAgency({ force: false, reason: "mount-or-deps" });

    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } catch {}
      }
    };
  }, [loadAgency]);

  useEffect(() => {
    if (!effectiveAgencyId || !supabase) return;

    const channel = supabase
      .channel(`agency-${effectiveAgencyId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "agencies",
          filter: `id=eq.${effectiveAgencyId}`,
        },
        async (payload) => {
          const incoming = payload?.new || null;
          const incomingUpdatedAt = incoming?.updated_at || null;
          const currentUpdatedAt = lastUpdatedAtRef.current || null;

          if (
            incomingUpdatedAt &&
            currentUpdatedAt &&
            new Date(incomingUpdatedAt).getTime() <= new Date(currentUpdatedAt).getTime()
          ) {
            return;
          }

          if (incoming) {
            commitAgencyState(incoming);
            return;
          }

          await loadAgency({ force: true, reason: "realtime-update" });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [effectiveAgencyId, loadAgency, commitAgencyState]);

  const applyAgencyPatch = useCallback((patch) => {
    const next = normalizeAgencyRow({
      ...(lastLoadedDataRef.current || {}),
      ...(patch || {}),
    });

    lastLoadedDataRef.current = next;
    lastLoadedAgencyIdRef.current = next?.agency_id || next?.id || null;
    lastUpdatedAtRef.current = next?.updated_at || lastUpdatedAtRef.current;

    setAgency(next);
  }, []);

  const updateAgency = useCallback(
    async (updates, opts = { toastOnSuccess: true }) => {
      const id = effectiveAgencyId;
      if (!id) return { error: new Error("Missing agencyId") };
      if (!supabase) return { error: new Error("Supabase not initialized") };

      try {
        const payload = {
          ...(updates || {}),
          updated_at: new Date().toISOString(),
        };

        const { data, error: updError } = await supabase
          .from("agencies")
          .update(payload)
          .eq("id", id)
          .select("*")
          .single();

        if (updError) throw updError;

        const normalized = commitAgencyState(data || { id, ...payload });

        if (opts?.toastOnSuccess) {
          toast({
            title: "Succès",
            description: "Les informations de l'agence ont été mises à jour.",
          });
        }

        return { error: null, data: normalized };
      } catch (err) {
        console.error("useAgencyData update error:", err);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: err?.message || "Impossible de mettre à jour l'agence.",
        });
        return { error: err };
      }
    },
    [effectiveAgencyId, toast, commitAgencyState]
  );

  const permissions = useMemo(() => {
    const meCanEditAgencyFromView = !!agency?.me_can_edit_agency;

    const meRoleFromView = getMyRoleFromAgencyRow(agency);
    const meRoleFromPro = getMyRoleFromPro(pro);
    const meRole = meRoleFromView || meRoleFromPro || resolvedAgencyContext?.agency_role || null;

    const isDirector = meRole === "director";
    const isTeamLeader = meRole === "team_leader";
    const isAgentAffiliate = meRole === "agent_affiliate";
    const isAgent = meRole === "agent";

    const lockColors = !!agency?.lock_colors;
    const lockLinks = !!agency?.lock_links;
    const colorsUniform = !!agency?.colors_uniform;

    const teamLeaderCanEditAgency = !!agency?.team_leader_can_edit_agency;
    const agentCanEditAgency = !!agency?.agent_can_edit_agency;

    const canEditAgency = isDirector || meCanEditAgencyFromView;
    const canEditLinks = canEditAgency;
    const canEditColors = canEditAgency && !lockColors;

    const canModifyAgencyLinks = (() => {
      if (isDirector) return true;
      if (lockLinks) return false;
      if (isTeamLeader) return teamLeaderCanEditAgency;
      if (isAgentAffiliate) return agentCanEditAgency;
      return false;
    })();

    return {
      meRole,
      isDirector,
      isTeamLeader,
      isAgentAffiliate,
      isAgent,

      canEditAgency,
      canEditColors,
      canEditLinks,

      colorsUniform,
      lockColors,
      lockLinks,

      teamLeaderCanEditAgency,
      agentCanEditAgency,

      canModifyAgencyLinks,
    };
  }, [agency, pro?.agency_role, resolvedAgencyContext?.agency_role]);

  return {
    agency,
    agencyId: effectiveAgencyId,
    loading,
    error,
    permissions,
    updateAgency,
    applyAgencyPatch,
    reloadAgency: (force = false) => loadAgency({ force: Boolean(force), reason: "manual" }),
  };
}