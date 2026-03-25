import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/customSupabaseClient";
import { isIgnorableFetchError } from "@/lib/fetchUtils";
import { useAuth } from "@/contexts/SupabaseAuthContext";

export const useProfessionnelId = () => {
  const auth = useAuth();
  const user = auth?.user;

  const isAuthBusy = Boolean(auth?.isAuthBusy);

  const [professionnelId, setProfessionnelId] = useState(null);
  const [loading, setLoading] = useState(true);

  const mountedRef = useRef(true);
  const runIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      runIdRef.current += 1;
    };
  }, []);

  const authUid = useMemo(() => user?.id || null, [user?.id]);

  useEffect(() => {
    const runId = ++runIdRef.current;

    const safeSet = (setter, value) => {
      if (!mountedRef.current) return;
      if (runId !== runIdRef.current) return;
      setter(value);
    };

    const fetchProfessionnelId = async () => {
      if (!supabase) {
        safeSet(setProfessionnelId, null);
        safeSet(setLoading, false);
        return;
      }

      if (isAuthBusy) {
        safeSet(setProfessionnelId, null);
        safeSet(setLoading, true);
        return;
      }

      if (!authUid) {
        safeSet(setProfessionnelId, null);
        safeSet(setLoading, false);
        return;
      }

      safeSet(setLoading, true);

      try {
        const uid = authUid;

        let res = await supabase
          .from("professionnels")
          .select("id,user_id")
          .or(`user_id.eq.${uid},id.eq.${uid}`)
          .maybeSingle();

        if (res?.error) {
          console.warn("[useProfessionnelId] .or() failed, fallback 2-steps:", res.error);

          res = await supabase
            .from("professionnels")
            .select("id,user_id")
            .eq("user_id", uid)
            .maybeSingle();

          if (!res?.error && !res?.data) {
            res = await supabase
              .from("professionnels")
              .select("id,user_id")
              .eq("id", uid)
              .maybeSingle();
          }
        }

        if (res?.error) throw res.error;

        safeSet(setProfessionnelId, res?.data?.id ?? null);
      } catch (err) {
        if (isIgnorableFetchError(err)) return;

        console.error("[useProfessionnelId] Error fetching professional ID:", err);
        safeSet(setProfessionnelId, null);
      } finally {
        safeSet(setLoading, false);
      }
    };

    fetchProfessionnelId();
  }, [authUid, isAuthBusy]);

  return professionnelId;
};