import { supabase } from "../../lib/customSupabaseClient";

/**
 * Records the acceptance of a legal document (CGU, CGV, Privacy Policy).
 * @param {object} params
 * @param {string} params.userId - The UUID of the user.
 * @param {string} params.docType - 'cgu', 'cgv', 'privacy_policy'.
 * @param {string} params.docVersion - Version string (e.g., '2024-01-01').
 * @param {string} [params.source] - Where the acceptance happened (e.g., 'signup', 'login_modal').
 * @param {object} [params.metadata] - Additional info (ip, user_agent - though typically handled by backend/logs).
 */
export async function recordLegalAcceptance({ userId, docType, docVersion, source = 'web', metadata = {} }) {
  if (!userId) return { error: new Error("User ID is required") };

  try {
    const { data, error } = await supabase
      .from('legal_acceptances')
      .insert({
        user_id: userId,
        doc_type: docType,
        doc_version: docVersion,
        source,
        metadata,
        accepted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error(`Error recording ${docType} acceptance:`, error);
    return { data: null, error };
  }
}

/**
 * Checks if a user has accepted a specific version of a legal document.
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.docType
 * @param {string} params.docVersion
 */
export async function hasAcceptedLegalDoc({ userId, docType, docVersion }) {
    if (!userId) return false;

    try {
        const { count, error } = await supabase
            .from('legal_acceptances')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('doc_type', docType)
            .eq('doc_version', docVersion);
        
        if (error) throw error;
        
        return count > 0;
    } catch (error) {
        console.error(`Error checking ${docType} acceptance:`, error);
        return false;
    }
}