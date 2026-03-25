import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/customSupabaseClient";

export const useProjectForm = ({ onSuccess, initialData = null, mode = "create" }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const submitProject = useCallback(
    async (formData, table, extraData = {}) => {
      setLoading(true);
      try {
        const payload = {
          ...formData,
          ...extraData,
          updated_at: new Date().toISOString(),
        };

        let error;
        
        if (mode === "create") {
          const { error: insertError } = await supabase
            .from(table)
            .insert([payload]);
          error = insertError;
        } else if (mode === "edit" && initialData?.id) {
          const { error: updateError } = await supabase
            .from(table)
            .update(payload)
            .eq("id", initialData.id);
          error = updateError;
        }

        if (error) throw error;

        toast({
          title: "Succès",
          description: mode === "create" ? "Projet créé avec succès." : "Projet mis à jour.",
        });

        if (onSuccess) onSuccess();
        return true;
      } catch (error) {
        console.error("Error submitting project:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Une erreur est survenue lors de l'enregistrement.",
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [mode, initialData, onSuccess, toast]
  );

  return {
    loading,
    submitProject,
  };
};