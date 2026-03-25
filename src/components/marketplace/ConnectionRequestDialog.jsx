import React, { useMemo, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "../../../lib/customSupabaseClient";

const ConnectionRequestDialog = ({ project, open, onOpenChange, onConnect }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const projectLabel = useMemo(() => {
    if (!project) return "";
    return (
      project.project_title ||
      project.title ||
      project.nom ||
      project.type_projet ||
      "ce projet"
    );
  }, [project]);

  const resolveTargetUserId = (currentProject) => {
    if (!currentProject) return null;

    if (currentProject.source === "particulier") {
      return currentProject.particulier_id || null;
    }

    if (currentProject.source === "professionnel") {
      return currentProject.professionnel_id || null;
    }

    return currentProject.target_user_id || null;
  };

  const resolveConnectionType = (currentProfile, currentProject) => {
    const requesterRole = String(currentProfile?.role || "").toLowerCase().trim();
    const projectSource = String(currentProject?.source || "").toLowerCase().trim();

    if (requesterRole === "professionnel" && projectSource === "particulier") {
      return "professionnel_to_particulier";
    }

    if (requesterRole === "particulier" && projectSource === "professionnel") {
      return "particulier_to_professionnel";
    }

    if (requesterRole === "professionnel" && projectSource === "professionnel") {
      return "professionnel_to_professionnel";
    }

    return "direct";
  };

  const resolveProjectTypeColumn = (currentProject) => {
    if (!currentProject?.type_projet || !currentProject?.source) return null;

    const typeProjet = String(currentProject.type_projet).toLowerCase().trim();
    const source = String(currentProject.source).toLowerCase().trim();

    const isBuying = typeProjet === "achat";
    const isParticulier = source === "particulier";
    const isProfessionnel = source === "professionnel";

    if (isBuying && isParticulier) return "buying_project_particulier_id";
    if (isBuying && isProfessionnel) return "buying_project_professionnel_id";
    if (!isBuying && isParticulier) return "selling_project_particulier_id";
    if (!isBuying && isProfessionnel) return "selling_project_professionnel_id";

    return null;
  };

  const buildPayload = async () => {
    if (!user || !profile || !project) {
      throw new Error("Données utilisateur ou projet manquantes.");
    }

    let targetUserId = resolveTargetUserId(project);
    const projectSource = String(project?.source || "").toLowerCase().trim();

    let targetProfessionnelId = null;

    if (projectSource === "professionnel") {
      targetProfessionnelId = project.professionnel_id || null;

      // Si le projet stocke directement professionnel_id comme user target, on tente de le résoudre proprement
      if (targetProfessionnelId && (!targetUserId || targetUserId === targetProfessionnelId)) {
        const { data: proRow, error: proError } = await supabase
          .from("professionnels")
          .select("id, user_id")
          .eq("id", targetProfessionnelId)
          .maybeSingle();

        if (proError) {
          throw new Error("Impossible de récupérer le compte utilisateur du professionnel.");
        }

        if (!proRow?.user_id) {
          throw new Error("Aucun utilisateur lié à ce professionnel n'a été trouvé.");
        }

        targetUserId = proRow.user_id;
      }
    }

    if (!targetUserId) {
      throw new Error("Impossible de déterminer l'utilisateur cible.");
    }

    if (targetUserId === user.id) {
      throw new Error("Vous ne pouvez pas vous envoyer une demande à vous-même.");
    }

    const projectTypeColumn = resolveProjectTypeColumn(project);
    const connectionType = resolveConnectionType(profile, project);

    const payload = {
      user_id: user.id,
      requesting_user_id: user.id,
      target_user_id: targetUserId,
      status: "pending",
      connection_type: connectionType,
      first_message: message.trim() || null,
      project_marketplace_id: project.id || null,
      project_type: project.type_projet || null,
      project_type_bien: project.type_bien || null,
      project_city_choice_1: project.city_choice_1 || null,
      city_choice_1: project.city_choice_1 || null,
      project_origin: project.source || null,
    };

    if (projectTypeColumn && project.id) {
      payload[projectTypeColumn] = project.id;
    }

    if (targetProfessionnelId) {
      payload.target_professionnel_id = targetProfessionnelId;
    }

    return payload;
  };

  const handleRequest = async () => {
    setLoading(true);

    try {
      const payload = await buildPayload();

      const { error } = await supabase.from("connections").insert(payload);

      if (error) {
        throw error;
      }

      toast({
        title: "Succès",
        description: "Demande de mise en relation envoyée.",
      });

      setMessage("");

      if (typeof onConnect === "function") {
        onConnect(project?.id);
      }

      if (typeof onOpenChange === "function") {
        onOpenChange(false);
      }
    } catch (err) {
      console.error("[ConnectionRequestDialog] handleRequest error:", err);

      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          err?.message || "Une erreur est survenue lors de l'envoi de la demande.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDialogChange = (nextOpen) => {
    if (!loading && !nextOpen) {
      setMessage("");
    }

    if (typeof onOpenChange === "function") {
      onOpenChange(nextOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Envoyer une demande de mise en relation</DialogTitle>
          <DialogDescription>
            Un message d’introduction est recommandé pour vous présenter
            {projectLabel ? ` au sujet de ${projectLabel}.` : "."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Textarea
            placeholder="Votre message ici..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={loading}
          />
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" disabled={loading}>
              Annuler
            </Button>
          </DialogClose>

          <Button onClick={handleRequest} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectionRequestDialog;