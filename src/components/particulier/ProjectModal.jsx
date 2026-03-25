import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import NewProjectFormParticulier from "@/components/project/NewProjectFormParticulier";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const ProjectModal = ({
  isOpen,
  setIsOpen,
  project,
  setProject,
  photos,
  setPhotos,
  onSubmit,                 // <- parent action (create/update)
  loading,
  isDuplicating = false,
  currentParticulierId,
}) => {
  const isBusy = !!loading;
  const formId = "modal-new-project-form";

  // Close after parent completes (parent is responsible for API)
  const handleFormSubmit = async (payloadFromForm) => {
    // Merge outer fields (title/visibility) with form payload.
    const merged = {
      ...payloadFromForm,
      title:
        (project?.title || "").trim() ||
        (payloadFromForm?.title || "").trim() ||
        null,
      visibility_public: !!project?.visibility_public,
      particulier_id: currentParticulierId ?? payloadFromForm?.particulier_id ?? null,
    };

    console.debug("[ProjectModal] onSubmit -> merged payload:", merged);

    if (typeof onSubmit !== "function") {
      // Failsafe: prevent silent failure
      console.error("[ProjectModal] Prop 'onSubmit' manquante.");
      if (typeof window !== "undefined") {
        window.alert(
          "Impossible d’enregistrer : action indisponible (onSubmit manquant côté modal)."
        );
      }
      return;
    }

    try {
      await onSubmit(merged);
      setIsOpen(false);
    } catch (err) {
      console.error("[ProjectModal] onSubmit error:", err);
      // laisse le parent gérer les toasts/erreurs si besoin
    }
  };

  const pfKey = `pf-${
    project?.id ?? "new"
  }-${project?.title ?? ""} -${project?.visibility_public ? "1" : "0"}-${
    isDuplicating ? "dup" : "std"
  }`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {project?.id && !isDuplicating
              ? "Modifier le Projet"
              : "Nouveau Projet Immobilier"}
          </DialogTitle>
          <DialogDescription>
            Remplissez les informations ci-dessous pour{" "}
            {project?.id && !isDuplicating
              ? "mettre à jour votre"
              : "créer un nouveau"}{" "}
            projet.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 max-h-[70vh] overflow-y-auto px-2 space-y-8">
          {/* === FORMULAIRE PRINCIPAL === */}
          <NewProjectFormParticulier
            key={pfKey}
            formId={formId}
            initial={{
              ...(project || {}),
              particulier_id: currentParticulierId,
              title: project?.title ?? "",
              visibility_public: !!project?.visibility_public,
            }}
            onSubmit={handleFormSubmit}     // <- IMPORTANT
          />

          {/* Champs externes facultatifs (titre, visibilité) */}
          <div className="space-y-2">
            <label
              htmlFor="project-title"
              className="text-sm font-medium leading-none"
            >
              Titre du projet
            </label>
            <input
              id="project-title"
              className="border rounded-md px-3 py-2 w-full"
              value={project?.title || ""}
              onChange={(e) =>
                setProject((p) => ({ ...p, title: e.target.value }))
              }
              placeholder="Ex. Achat T3, budget 320 000 €"
              maxLength={120}
            />
            <p className="text-xs text-muted-foreground">
              Un bon titre aide les pros à comprendre rapidement votre besoin.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">
              Visibilité du Projet
            </h3>
            <label className="flex items-center space-x-3 p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors">
              <input
                id="visibility_public"
                type="checkbox"
                checked={!!project?.visibility_public}
                onChange={(e) =>
                  setProject((p) => ({
                    ...p,
                    visibility_public: !!e.target.checked,
                  }))
                }
              />
              <span className="text-sm font-medium leading-none cursor-pointer flex-grow">
                Visible sur la Place des Projets
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t mt-4">
          <Button
            type="submit"
            form={formId}                      // <- déclenche submit du formulaire interne
            disabled={isBusy}
            className="w-full sm:w-auto bg-brand-orange hover:bg-orange-600"
          >
            {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isBusy
              ? project?.id && !isDuplicating
                ? "Mise à jour..."
                : "Création..."
              : project?.id && !isDuplicating
              ? "Sauvegarder"
              : "Créer le projet"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectModal;