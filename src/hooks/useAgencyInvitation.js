// src/hooks/useAgencyInvitation.js
import { useState } from "react";
import { supabase } from "@/lib/customSupabaseClient";

export function useAgencyInvitation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Source unique: Edge Function (respecte RLS, évite lectures directes de tables).
   */
  const getInvitationDetails = async (token) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("agency-invite-info", {
        body: { token },
      });
      if (fnErr) throw fnErr;
      if (!data?.ok) throw new Error(data?.error || "Invitation introuvable ou expirée.");
      return data.invite; // { id, email, agency_id, agency_name, role, one_time_code_expires_at, ... }
    } catch (err) {
      console.error("getInvitationDetails error:", err);
      setError(err?.message || "Impossible de charger l'invitation.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Vérifie le code via RPC si tu l'utilises encore quelque part.
   * IMPORTANT: pas de fallback table direct (sinon RLS + champs divergents).
   */
  const verifyCode = async (token, code) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc("verify_invitation_code", {
        p_token: token,
        p_code: code,
      });

      if (rpcError) throw rpcError;
      if (data && data.success === false) throw new Error(data.message || "Code invalide");

      return data; // { success: true, ... }
    } catch (err) {
      console.error("verifyCode error:", err);
      setError(err?.message || "Vérification impossible.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * ✅ Acceptation atomique quand l'utilisateur est déjà connecté
   * (ex: utilisateur déjà inscrit qui rejoint une agence via un lien token).
   */
  const acceptInvitationWhenAuthenticated = async (token) => {
    setLoading(true);
    setError(null);
    try {
      const { error: rpcError } = await supabase.rpc("accept_agency_invitation", {
        p_token: token,
      });
      if (rpcError) throw rpcError;
      return true;
    } catch (err) {
      console.error("acceptInvitationWhenAuthenticated error:", err);
      setError(err?.message || "Impossible d'accepter l'invitation.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    verifyCode,
    getInvitationDetails,
    acceptInvitationWhenAuthenticated,
  };
}