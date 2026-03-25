import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/customSupabaseClient";
import { isIgnorableFetchError } from "@/lib/fetchUtils";
import { useAuth } from "@/contexts/SupabaseAuthContext";

export const useClientData = (profile) => {
  const { toast } = useToast();
  const auth = useAuth();

  const user = auth?.user || null;
  const isAuthBusy = Boolean(auth?.isAuthBusy);
  const isSigningOut = Boolean(auth?.isSigningOut);

  const [buyingProjects, setBuyingProjects] = useState([]);
  const [sellingProjects, setSellingProjects] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  const particulierId = useMemo(() => {
    return profile?.id || null;
  }, [profile?.id]);

  const actorUserId = useMemo(() => {
    return user?.id || profile?.user_id || null;
  }, [user?.id, profile?.user_id]);

  const BUYING_SELECT = useMemo(
    () => `
      id, particulier_id, status, visibility_public, created_at, updated_at,
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
      id, particulier_id, status, visibility_public, created_at, updated_at,
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

  const mountedRef = useRef(true);
  const runIdRef = useRef(0);

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

  const resetState = useCallback(() => {
    if (!mountedRef.current) return;
    setBuyingProjects([]);
    setSellingProjects([]);
    setConnections([]);
    setLoading(false);
  }, []);

  const fetchData = useCallback(async () => {
    const runId = ++runIdRef.current;

    if (!supabase) {
      resetState();
      return;
    }

    if (isAuthBusy) {
      safeSet(setLoading, true, runId);
      return;
    }

    if (!particulierId || !actorUserId || isSigningOut) {
      resetState();
      return;
    }

    safeSet(setLoading, true, runId);

    try {
      const [
        { data: buyingData, error: buyingError },
        { data: sellingData, error: sellingError },
        { data: connectionsData, error: connectionsError },
      ] = await Promise.all([
        supabase
          .from("buying_projects_particulier")
          .select(BUYING_SELECT)
          .eq("particulier_id", particulierId)
          .order("created_at", { ascending: false }),

        supabase
          .from("selling_projects_particulier")
          .select(SELLING_SELECT)
          .eq("particulier_id", particulierId)
          .order("created_at", { ascending: false }),

        supabase
          .from("connections_enriched_safe")
          .select(CONNECTIONS_SELECT)
          .or(`requesting_user_id.eq.${actorUserId},target_user_id.eq.${actorUserId}`)
          .order("created_at", { ascending: false }),
      ]);

      if (runId !== runIdRef.current || !mountedRef.current) return;

      if (buyingError) throw buyingError;
      if (sellingError) throw sellingError;

      if (connectionsError) {
        const { data: rawCons, error: rawErr } = await supabase
          .from("connections")
          .select("id, created_at, status, connection_type, requesting_user_id, target_user_id, target_professionnel_id, project_type, project_origin, project_marketplace_id, project_snapshot")
          .or(`requesting_user_id.eq.${actorUserId},target_user_id.eq.${actorUserId}`)
          .order("created_at", { ascending: false });

        if (rawErr && rawErr.code !== "PGRST116") throw rawErr;

        safeSet(setConnections, rawCons || [], runId);
      } else {
        safeSet(setConnections, connectionsData || [], runId);
      }

      safeSet(setBuyingProjects, buyingData || [], runId);
      safeSet(setSellingProjects, sellingData || [], runId);
    } catch (error) {
      if (isSigningOut || isIgnorableFetchError(error)) return;

      console.error("[useClientData] fetch error:", error);

      toast({
        variant: "destructive",
        title: "Erreur",
        description: error?.message || "Impossible de récupérer vos données.",
      });
    } finally {
      safeSet(setLoading, false, runId);
    }
  }, [
    isAuthBusy,
    isSigningOut,
    particulierId,
    actorUserId,
    toast,
    BUYING_SELECT,
    SELLING_SELECT,
    CONNECTIONS_SELECT,
    resetState,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getTableName = (type) => {
    const t = (type || "").toString().toLowerCase();
    return t === "achat" || t === "buy" || t === "buying"
      ? "buying_projects_particulier"
      : "selling_projects_particulier";
  };

  const deleteProject = async (projectId, type) => {
    if (!projectId || !supabase) return;
    if (isAuthBusy || isSigningOut) return;
    if (!particulierId) return;

    const tableName = getTableName(type);
    const { error } = await supabase.from(tableName).delete().eq("id", projectId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "La suppression du projet a échoué.",
      });
      return;
    }

    toast({ title: "Succès", description: "Le projet a été supprimé." });
    fetchData();
  };

  const toggleProjectStatus = async (project, type) => {
    if (!project?.id || !supabase) return;
    if (isAuthBusy || isSigningOut) return;
    if (!particulierId) return;

    const tableName = getTableName(type);
    const currentStatus = project.status;
    const newStatus =
      currentStatus === "active" || currentStatus === "pending_match"
        ? "suspended"
        : "active";

    const { error } = await supabase.from(tableName).update({ status: newStatus }).eq("id", project.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Le changement de statut a échoué.",
      });
      return;
    }

    toast({
      title: "Succès",
      description: `Le projet est maintenant ${newStatus === "suspended" ? "suspendu" : "actif"}.`,
    });

    fetchData();
  };

  return {
    buyingProjects,
    sellingProjects,
    connections,
    loading,
    fetchData,
    deleteProject,
    toggleProjectStatus,
  };
};