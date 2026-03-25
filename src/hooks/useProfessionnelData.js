import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useToast } from "../components/ui/use-toast";
import { supabase } from "@/lib/customSupabaseClient";
import { isIgnorableFetchError } from "@/lib/fetchUtils";
import { useProfessionnelId } from "./useProfessionnelId";
import { useAuth } from "../contexts/SupabaseAuthContext";

const normalizeRole = (t) => String(t || "").trim().toLowerCase();

const FULL_RESET = {
  buying: [],
  selling: [],
  connections: [],
  subscription: null,
};

export const useProfessionnelData = (profile) => {
  const [buyingProjects, setBuyingProjects] = useState(FULL_RESET.buying);
  const [sellingProjects, setSellingProjects] = useState(FULL_RESET.selling);
  const [connections, setConnections] = useState(FULL_RESET.connections);
  const [subscription, setSubscription] = useState(FULL_RESET.subscription);
  const [loading, setLoading] = useState(true);

  const { toast } = useToast();

  const auth = useAuth();
  const user = auth?.user;
  const isAuthenticated = Boolean(user?.id);

  const isSigningOut = Boolean(auth?.isSigningOut);

  const mountedRef = useRef(true);
  const latestRunIdRef = useRef(0);

  const professionnelId = useProfessionnelId(profile);

  const actorUserId = useMemo(() => {
    return profile?.user_id || user?.id || null;
  }, [profile?.user_id, user?.id]);

  const role = useMemo(() => normalizeRole(profile?.role), [profile?.role]);
  const isPro = role === "professionnel";

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      latestRunIdRef.current += 1;
    };
  }, []);

  const safeSet = useCallback((setter, value) => {
    if (mountedRef.current) setter(value);
  }, []);

  const resetStateForAnonymous = useCallback(() => {
    safeSet(setBuyingProjects, []);
    safeSet(setSellingProjects, []);
    safeSet(setConnections, []);
    safeSet(setSubscription, null);
    safeSet(setLoading, false);
  }, [safeSet]);

  const shouldIgnoreRun = useCallback(
    (runId) => !mountedRef.current || isSigningOut || runId !== latestRunIdRef.current,
    [isSigningOut]
  );

  const BUYING_SELECT = useMemo(
    () => `
      id, professionnel_id, status, visibility_public, created_at, updated_at,
      title, type_projet, type_bien,
      budget_max, surface_min, surface_max, bedrooms_min, delai, description,
      city_choice_1, quartier_choice_1, department_choice_1, region_choice_1,
      city_choice_2, quartier_choice_2, department_choice_2, region_choice_2,
      city_choice_3, quartier_choice_3, department_choice_3, region_choice_3,
      has_garden, has_terrace, has_balcony, has_pool,
      has_elevator, has_cellar, has_parking, has_caretaker,
      has_clear_view, is_last_floor
    `,
    []
  );

  const SELLING_SELECT = useMemo(
    () => `
      id, professionnel_id, status, visibility_public, created_at, updated_at,
      title, type_projet, type_bien,
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

  const fetchData = useCallback(async () => {
    const runId = ++latestRunIdRef.current;

    if (!supabase) {
      console.error("Supabase client not initialized - check environment variables");
      if (isAuthenticated && !isSigningOut) {
         toast({
            variant: "destructive",
            title: "Erreur de configuration",
            description: "La connexion à la base de données est impossible (Clé API manquante).",
         });
      }
      resetStateForAnonymous();
      return;
    }

    if (!isAuthenticated || isSigningOut) {
      resetStateForAnonymous();
      return;
    }

    if (!isPro) {
      resetStateForAnonymous();
      return;
    }

    if (!professionnelId && !actorUserId) {
      resetStateForAnonymous();
      return;
    }

    safeSet(setLoading, true);

    try {
      let buyingData = [];
      let sellingData = [];
      let subData = null;

      if (professionnelId) {
        const [bRes, sRes, subRes] = await Promise.all([
          supabase
            .from("buying_projects_professionnel")
            .select(BUYING_SELECT)
            .eq("professionnel_id", professionnelId)
            .order("created_at", { ascending: false }),

          supabase
            .from("selling_projects_professionnel")
            .select(SELLING_SELECT)
            .eq("professionnel_id", professionnelId)
            .order("created_at", { ascending: false }),

          supabase
            .from("pro_subscriptions")
            .select("*")
            .eq("professionnel_id", professionnelId)
            .maybeSingle(),
        ]);

        if (shouldIgnoreRun(runId)) return;

        if (bRes.error) {
            console.error("Error fetching buying projects:", bRes.error);
            if (bRes.error.message?.includes("JWT") || bRes.error.code === "PGRST301") {
                throw new Error("Erreur d'authentification API.");
            }
            throw bRes.error;
        }
        if (sRes.error) {
            console.error("Error fetching selling projects:", sRes.error);
            if (sRes.error.message?.includes("JWT") || sRes.error.code === "PGRST301") {
                throw new Error("Erreur d'authentification API.");
            }
            throw sRes.error;
        }
        // subRes.error is ignored if it's just missing data, but logged if real error
        if (subRes.error && subRes.error.code !== 'PGRST116') console.warn("Subscription fetch error", subRes.error);

        buyingData = bRes.data || [];
        sellingData = sRes.data || [];
        subData = subRes.data || null;
      }

      let cons = [];
      const filters = [];
      if (actorUserId) {
        filters.push(`requesting_user_id.eq.${actorUserId}`);
        filters.push(`target_user_id.eq.${actorUserId}`);
      }
      if (professionnelId) {
        filters.push(`target_professionnel_id.eq.${professionnelId}`);
      }

      if (filters.length > 0) {
        const consRes = await supabase
          .from("connections_enriched_safe")
          .select(CONNECTIONS_SELECT)
          .or(filters.join(","))
          .order("created_at", { ascending: false });

        if (shouldIgnoreRun(runId)) return;

        if (consRes.error) {
            console.error("Error fetching connections:", consRes.error);
            throw consRes.error;
        }
        cons = consRes.data || [];
      }

      if (shouldIgnoreRun(runId)) return;

      safeSet(setBuyingProjects, buyingData);
      safeSet(setSellingProjects, sellingData);
      safeSet(setConnections, cons);
      safeSet(setSubscription, subData);
    } catch (error) {
      if (isIgnorableFetchError(error) || isSigningOut) return;

      console.error("[useProfessionnelData] fetch error:", error);

      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message === "Erreur d'authentification API." 
            ? "Problème de connexion à la base de données. Veuillez rafraîchir la page."
            : "Impossible de récupérer vos données.",
      });
      
      // Fallback to empty state on error
      safeSet(setBuyingProjects, []);
      safeSet(setSellingProjects, []);
      safeSet(setConnections, []);
      safeSet(setSubscription, null);

    } finally {
      if (shouldIgnoreRun(runId)) return;
      safeSet(setLoading, false);
    }
  }, [
    isAuthenticated,
    isSigningOut,
    isPro,
    professionnelId,
    actorUserId,
    toast,
    BUYING_SELECT,
    SELLING_SELECT,
    CONNECTIONS_SELECT,
    resetStateForAnonymous,
    shouldIgnoreRun,
    safeSet,
  ]);

  useEffect(() => {
    if (!isAuthenticated || isSigningOut) return;
    fetchData();
  }, [fetchData, isAuthenticated, isSigningOut]);

  const getTableName = useCallback((type) => {
    const t = (type || "").toString().toLowerCase();
    if (t === "achat" || t === "buy" || t === "buying") return "buying_projects_professionnel";
    if (t === "vente" || t === "sell" || t === "selling") return "selling_projects_professionnel";
    return "selling_projects_professionnel";
  }, []);

  const deleteProject = useCallback(
    async (projectId, type) => {
      if (!projectId) return;
      if (!supabase) return;
      if (!isAuthenticated || isSigningOut) return;
      if (!isPro) return;

      const tableName = getTableName(type);
      const { error } = await supabase.from(tableName).delete().eq("id", projectId);

      if (error) {
        if (!isIgnorableFetchError(error) && !isSigningOut) {
          console.error("[useProfessionnelData] deleteProject error:", error);
          toast({
            variant: "destructive",
            title: "Erreur",
            description: "La suppression du projet a échoué.",
          });
        }
        return;
      }

      toast({ title: "Succès", description: "Le projet a été supprimé." });

      if (isAuthenticated && !isSigningOut) fetchData();
    },
    [fetchData, getTableName, isAuthenticated, isPro, isSigningOut, toast]
  );

  const toggleProjectStatus = useCallback(
    async (project, type) => {
      if (!project?.id) return;
      if (!supabase) return;
      if (!isAuthenticated || isSigningOut) return;
      if (!isPro) return;

      const tableName = getTableName(type);

      const isCurrentlySuspended = project.status === "suspended";
      const newStatus = isCurrentlySuspended ? "pending_match" : "suspended";
      const human = newStatus === "suspended" ? "en pause" : "en recherche";

      const { error } = await supabase.from(tableName).update({ status: newStatus }).eq("id", project.id);

      if (error) {
        if (!isIgnorableFetchError(error) && !isSigningOut) {
          console.error("[useProfessionnelData] toggleProjectStatus error:", error);
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
        description: `Le projet est maintenant ${human}.`,
      });

      if (isAuthenticated && !isSigningOut) fetchData();
    },
    [fetchData, getTableName, isAuthenticated, isPro, isSigningOut, toast]
  );

  return {
    buyingProjects,
    sellingProjects,
    connections,
    subscription,
    loading,
    fetchData,
    deleteProject,
    toggleProjectStatus,
  };
};