// src/hooks/useParticulierData.js
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useToast } from "@/components/ui/use-toast";

// ✅ IMPORTANT : le client Supabase unique est à la racine /lib (pas dans src/lib)
import { supabase } from "../../lib/customSupabaseClient";

import { isIgnorableFetchError } from "@/lib/fetchUtils";
import { useAuth } from "@/contexts/SupabaseAuthContext";

export const useParticulierData = (particulierId) => {
  const [buyingProjects, setBuyingProjects] = useState([]);
  const [sellingProjects, setSellingProjects] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  const { toast } = useToast();
  const auth = useAuth();
  const user = auth?.user || null;

  const isAuthBusy = Boolean(auth?.isAuthBusy);
  const isAuthenticated = Boolean(user?.id);

  const isSigningOut = Boolean(auth?.isSigningOut);

  const actorUserId = useMemo(() => user?.id || null, [user?.id]);

  const mountedRef = useRef(true);
  const runIdRef = useRef(0);

  const OWNER_COL = "particulier_id";

  const BUYING_SELECT = useMemo(
    () => `
      id, ${OWNER_COL}, status, visibility_public, created_at, updated_at,
      project_title, title, type_projet, type_bien,
      budget_min, budget_max, surface_min, surface_max, bedrooms_min, delai, description,
      city_choice_1, quartier_choice_1, department_choice_1, region_choice_1,
      city_choice_2, quartier_choice_2, department_choice_2, region_choice_2,
      city_choice_3, quartier_choice_3, department_choice_3, region_choice_3,
      city_choice_4, quartier_choice_4, department_choice_4, region_choice_4,
      city_choice_5, quartier_choice_5, department_choice_5, region_choice_5,
      has_garden, has_terrace, has_balcony, has_pool,
      has_elevator, has_cellar, has_parking, has_caretaker,
      has_clear_view, is_last_floor
    `,
    []
  );

  const SELLING_SELECT = useMemo(
    () => `
      id, ${OWNER_COL}, status, visibility_public, created_at, updated_at,
      project_title, title, type_projet, type_bien,
      surface, bedrooms, prix_demande,
      city_choice_1, quartier_choice_1, department_choice_1, region_choice_1,
      delai, description,
      image_1_url, image_2_url, image_3_url,
      has_garden, has_terrace, has_balcony, has_pool,
      has_elevator, has_cellar, has_parking, has_caretaker,
      has_clear_view, is_last_floor
    `,
    []
  );

  const CONNECTIONS_SELECT = useMemo(
    () => `
      id, created_at, status, connection_type,
      requesting_user_id, target_user_id, target_professionnel_id,
      project_type, project_origin, project_marketplace_id, project_snapshot,
      requesting_first_name, requesting_last_name, requesting_email, requesting_phone, requesting_company, requesting_role,
      target_first_name, target_last_name, target_email, target_phone, target_company, target_role
    `,
    []
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      runIdRef.current += 1;
    };
  }, []);

  const safeSet = (setter, value, runId) => {
    if (!mountedRef.current) return;
    if (runId && runId !== runIdRef.current) return;
    setter(value);
  };

  const parseMaybeJson = (v) => {
    if (!v) return null;
    if (typeof v === "object") return v;
    try {
      return JSON.parse(v);
    } catch {
      return null;
    }
  };

  const resetStateForAnonymous = useCallback(() => {
    if (!mountedRef.current) return;
    setBuyingProjects([]);
    setSellingProjects([]);
    setConnections([]);
    setLoading(false);
  }, []);

  const shouldIgnoreRun = useCallback(
    (runId) => !mountedRef.current || isSigningOut || runId !== runIdRef.current,
    [isSigningOut]
  );

  const fetchData = useCallback(async () => {
    const runId = ++runIdRef.current;

    if (!supabase) {
      resetStateForAnonymous();
      return;
    }

    if (isAuthBusy) {
      safeSet(setLoading, true, runId);
      return;
    }

    if (!isAuthenticated || isSigningOut || !particulierId || !actorUserId) {
      resetStateForAnonymous();
      return;
    }

    safeSet(setLoading, true, runId);

    try {
      const [
        { data: buyingData, error: e1 },
        { data: sellingData, error: e2 },
      ] = await Promise.all([
        supabase
          .from("buying_projects_particulier")
          .select(BUYING_SELECT)
          .eq(OWNER_COL, particulierId)
          .order("created_at", { ascending: false }),

        supabase
          .from("selling_projects_particulier")
          .select(SELLING_SELECT)
          .eq(OWNER_COL, particulierId)
          .order("created_at", { ascending: false }),
      ]);

      if (shouldIgnoreRun(runId)) return;
      if (e1) throw e1;
      if (e2) throw e2;

      const { data: cons, error: e3 } = await supabase
        .from("connections_enriched_safe")
        .select(CONNECTIONS_SELECT)
        .or(
          `requesting_user_id.eq.${actorUserId},target_user_id.eq.${actorUserId}`
        )
        .order("created_at", { ascending: false });

      if (shouldIgnoreRun(runId)) return;
      if (e3) throw e3;

      const marketplaceIds = [
        ...new Set(
          (cons || [])
            .map((c) => c?.project_marketplace_id)
            .filter((v) => typeof v === "string" && v.length > 0)
        ),
      ];

      let projMap = new Map();
      if (marketplaceIds.length > 0) {
        const { data: projects, error: e4 } = await supabase
          .from("projects_marketplace_unified_all")
          .select(
            `
            id, source, role, status, created_at, updated_at,
            type_projet, type_bien,
            budget_max, surface_min, surface_max, bedrooms_min,
            surface, bedrooms, prix_demande,
            delai, description,
            city_choice_1, quartier_choice_1, department_choice_1, region_choice_1,
            project_title, title
          `
          )
          .in("id", marketplaceIds);

        if (shouldIgnoreRun(runId)) return;
        if (e4) throw e4;

        projMap = new Map((projects || []).map((p) => [p.id, p]));
      }

      const normalizedConnections = (cons || []).map((c) => {
        const oldSnap = parseMaybeJson(c.project_snapshot) ?? null;
        const live = c.project_marketplace_id
          ? projMap.get(c.project_marketplace_id) || null
          : null;

        const mergedSnap = live ? { ...oldSnap, ...live } : oldSnap;
        return { ...c, project_snapshot: mergedSnap };
      });

      if (shouldIgnoreRun(runId)) return;

      safeSet(setBuyingProjects, buyingData || [], runId);
      safeSet(setSellingProjects, sellingData || [], runId);
      safeSet(setConnections, normalizedConnections, runId);
    } catch (error) {
      if (isSigningOut || isIgnorableFetchError(error)) return;

      console.error("[useParticulierData] fetch error:", error);

      if (mountedRef.current) {
        const msg =
          typeof error?.message === "string"
            ? error.message
            : "Impossible de récupérer vos données.";
        toast({ variant: "destructive", title: "Erreur", description: msg });
      }
    } finally {
      if (shouldIgnoreRun(runId)) return;
      safeSet(setLoading, false, runId);
    }
  }, [
    particulierId,
    actorUserId,
    isAuthBusy,
    isAuthenticated,
    isSigningOut,
    resetStateForAnonymous,
    toast,
    BUYING_SELECT,
    SELLING_SELECT,
    CONNECTIONS_SELECT,
    shouldIgnoreRun,
  ]);

  useEffect(() => {
    if (isSigningOut) return;
    fetchData();
  }, [fetchData, isSigningOut]);

  const getTableName = (type) => {
    const t = (type || "").toString().toLowerCase();
    if (t === "achat" || t === "buy" || t === "buying")
      return "buying_projects_particulier";
    if (t === "vente" || t === "sell" || t === "selling")
      return "selling_projects_particulier";
    return "selling_projects_particulier";
  };

  const deleteProject = async (projectId, type) => {
    if (!projectId) return;
    if (!supabase) return;
    if (isAuthBusy || !isAuthenticated || isSigningOut) return;
    if (!particulierId) return;

    const tableName = getTableName(type);
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq("id", projectId);

    if (error) {
      if (!isSigningOut && !isIgnorableFetchError(error)) {
        console.error("[useParticulierData] deleteProject error:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "La suppression du projet a échoué.",
        });
      }
      return;
    }

    toast({ title: "Succès", description: "Le projet a été supprimé." });
    if (!isSigningOut) fetchData();
  };

  const toggleProjectStatus = async (project, type) => {
    if (!project?.id) return;
    if (!supabase) return;
    if (isAuthBusy || !isAuthenticated || isSigningOut) return;
    if (!particulierId) return;

    const tableName = getTableName(type);
    const newStatus =
      project.status === "active" || project.status === "pending_match"
        ? "suspended"
        : "active";

    const { error } = await supabase
      .from(tableName)
      .update({ status: newStatus })
      .eq("id", project.id);

    if (error) {
      if (!isSigningOut && !isIgnorableFetchError(error)) {
        console.error("[useParticulierData] toggleProjectStatus error:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Le changement de statut a échoué.",
        });
      }
      return;
    }

    toast({
      title: "Succès",
      description: `Le projet est maintenant ${newStatus === "suspended" ? "suspendu" : "actif"
        }.`,
    });

    if (!isSigningOut) fetchData();
  };

  const respondToConnection = async (connectionId, action) => {
    if (!connectionId) return;
    if (!supabase) return;
    if (isAuthBusy || !isAuthenticated || isSigningOut) return;

    const statusMap = { accept: "approved", decline: "rejected" };
    const newStatus = statusMap[action];
    if (!newStatus) return;

    const { error } = await supabase
      .from("connections")
      .update({ status: newStatus })
      .eq("id", connectionId);

    if (error) {
      if (!isSigningOut && !isIgnorableFetchError(error)) {
        console.error("[useParticulierData] respondToConnection error:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de mettre à jour la mise en relation.",
        });
      }
      return;
    }

    toast({ title: "Succès", description: "Mise en relation mise à jour." });
    if (!isSigningOut) fetchData();
  };

  return {
    buyingProjects,
    sellingProjects,
    connections,
    loading,
    fetchData,
    deleteProject,
    toggleProjectStatus,
    respondToConnection,
  };
};