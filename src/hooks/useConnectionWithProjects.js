import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/customSupabaseClient";
import { isIgnorableFetchError } from "@/lib/fetchUtils";
import { useAuth } from "@/contexts/SupabaseAuthContext";

export function useConnectionWithProjects({
  role,
  proId = null,
  particulierId = null,
  status = "all",
}) {
  const auth = useAuth();

  const user = auth?.user || null;
  const isSigningOut = Boolean(auth?.isSigningOut);
  const isAuthenticated = Boolean(auth?.isAuthenticated ?? user?.id);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);
  const runIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      runIdRef.current += 1;
    };
  }, []);

  const safeSet = (setter, value) => {
    if (mountedRef.current) setter(value);
  };

  const buildQuery = useCallback(
    (baseQuery) => {
      let query = baseQuery.order("created_at", { ascending: false });

      const r = String(role || "").toLowerCase();

      if (r === "pro" && proId) {
        query = query.or(
          `requesting_professionnel_id.eq.${proId},target_professionnel_id.eq.${proId},pro1_id.eq.${proId},pro2_id.eq.${proId},pro_id.eq.${proId}`
        );
      } else if (r === "particulier" && particulierId) {
        query = query.or(
          `requesting_user_id.eq.${particulierId},target_user_id.eq.${particulierId},particulier_id.eq.${particulierId},user_id.eq.${particulierId}`
        );
      } else {
        const ors = [];

        if (proId) {
          ors.push(`requesting_professionnel_id.eq.${proId}`);
          ors.push(`target_professionnel_id.eq.${proId}`);
          ors.push(`pro1_id.eq.${proId}`);
          ors.push(`pro2_id.eq.${proId}`);
          ors.push(`pro_id.eq.${proId}`);
        }

        if (particulierId) {
          ors.push(`requesting_user_id.eq.${particulierId}`);
          ors.push(`target_user_id.eq.${particulierId}`);
          ors.push(`particulier_id.eq.${particulierId}`);
          ors.push(`user_id.eq.${particulierId}`);
        }

        if (ors.length) {
          query = query.or(ors.join(","));
        }
      }

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      return query;
    },
    [role, proId, particulierId, status]
  );

  useEffect(() => {
    const currentRunId = ++runIdRef.current;

    if (!supabase) {
      safeSet(setRows, []);
      safeSet(setError, null);
      safeSet(setLoading, false);
      return;
    }

    if (!isAuthenticated || isSigningOut) {
      safeSet(setRows, []);
      safeSet(setError, null);
      safeSet(setLoading, false);
      return;
    }

    const hasActor = Boolean(proId || particulierId);
    if (!hasActor) {
      safeSet(setRows, []);
      safeSet(setError, null);
      safeSet(setLoading, false);
      return;
    }

    (async () => {
      safeSet(setLoading, true);
      safeSet(setError, null);

      try {
        let query = supabase
          .from("connections_enriched_safe")
          .select("*");

        query = buildQuery(query);

        const { data, error: err } = await query;

        if (!mountedRef.current || isSigningOut || currentRunId !== runIdRef.current) {
          return;
        }

        if (err) {
          safeSet(setError, err);
          safeSet(setRows, []);
        } else {
          safeSet(setRows, Array.isArray(data) ? data : []);
        }
      } catch (e) {
        if (
          !mountedRef.current ||
          isSigningOut ||
          currentRunId !== runIdRef.current ||
          isIgnorableFetchError(e)
        ) {
          return;
        }

        console.error("[useConnectionWithProjects] load error:", e);
        safeSet(setError, e);
        safeSet(setRows, []);
      } finally {
        if (!mountedRef.current || isSigningOut || currentRunId !== runIdRef.current) {
          return;
        }
        safeSet(setLoading, false);
      }
    })();
  }, [buildQuery, isAuthenticated, isSigningOut, proId, particulierId]);

  const items = useMemo(() => {
    return (rows || []).map((r) => {
      const connectionId = r.id;

      const projectTitle =
        r.ui_title ||
        r.project_snapshot?.project_title ||
        r.project_snapshot?.title ||
        "Projet";

      const locationLabel =
        r.ui_location ||
        r.project_city_choice_1 ||
        r.city_choice_1 ||
        null;

      const counterpartName =
        [r.target_first_name, r.target_last_name].filter(Boolean).join(" ") ||
        [r.requesting_first_name, r.requesting_last_name].filter(Boolean).join(" ") ||
        null;

      return {
        id: connectionId,
        connection: {
          id: connectionId,
          created_at: r.created_at,
          status: r.status,
          requesting_user_id: r.requesting_user_id,
          target_user_id: r.target_user_id,
          requesting_professionnel_id: r.requesting_professionnel_id,
          target_professionnel_id: r.target_professionnel_id,
          connection_type: r.connection_type,
          first_message: r.first_message,
        },
        project: {
          project_id: r.derived_project_id || r.project_marketplace_id || null,
          title: projectTitle,
          location_label: locationLabel,
          city: r.project_city_choice_1 || r.city_choice_1 || null,
          budget_min: null,
          budget_max: r.ui_budget_max ?? r.ui_budget ?? null,
          property_type: r.ui_property_type || r.project_type_bien || null,
          surface_min: r.ui_surface_min ?? null,
          surface_max: r.ui_surface_max ?? null,
          rooms_min: r.ui_bedrooms ?? null,
          deadline_label: r.ui_timeline || null,
          image_1_url: r.ui_image_1_url || null,
          image_2_url: r.ui_image_2_url || null,
          image_3_url: r.ui_image_3_url || null,
        },
        counterpart: {
          interlocutor_name: counterpartName,
          interlocutor_email: r.target_email_masked || r.target_email || null,
          interlocutor_phone: r.target_phone_masked || r.target_phone || null,
          interlocutor_agency: r.target_agency_name_masked || r.target_agency_name || null,
          interlocutor_role: r.target_role || null,
        },
      };
    });
  }, [rows]);

  return { items, loading, error };
}