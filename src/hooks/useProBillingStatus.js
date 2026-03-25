import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from "@/lib/customSupabaseClient";

export function useProBillingStatus(proId) {
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBillingStatus = useCallback(async () => {
    if (!proId) {
      setBilling(null);
      setLoading(false);
      setError(null);
      return;
    }

    if (!supabase) {
      console.error("Supabase client not initialized");
      setError("Configuration Supabase manquante. Veuillez vérifier vos variables d'environnement.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('professionnels_billing_status')
        .select('professionnel_id, is_validated_by_administrator, effective_plan, subscription_status, is_comped, comped_until_at, subscription_current_period_end, premium_reason')
        .eq('professionnel_id', proId)
        .single();

      if (fetchError) throw fetchError;

      setBilling(data);
    } catch (err) {
      console.error('Error fetching billing status:', err);
      setError(err.message || 'Failed to fetch billing status');
      setBilling(null);
    } finally {
      setLoading(false);
    }
  }, [proId]);

  useEffect(() => {
    fetchBillingStatus();
  }, [fetchBillingStatus]);

  const refresh = useCallback(() => {
    fetchBillingStatus();
  }, [fetchBillingStatus]);

  const isValidated = useMemo(() => {
    return billing?.is_validated_by_administrator === true;
  }, [billing]);

  const isPremium = useMemo(() => {
    return billing?.effective_plan === 'premium';
  }, [billing]);

  return {
    billing,
    loading,
    error,
    refresh,
    isValidated,
    isPremium
  };
}