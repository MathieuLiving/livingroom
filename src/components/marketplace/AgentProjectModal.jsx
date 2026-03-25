// src/components/marketplace/AgentProjectModal.jsx
import React, { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { supabase } from "../../../lib/customSupabaseClient";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/SupabaseAuthContext';

const toNumberOrNull = (v) => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(String(v).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

export default function AgentProjectModal({
  isOpen,
  onOpenChange,
  professionnel,                // { id, ... } (recommandé)
  defaultProjectType = "achat",  // "achat" | "vente"
  onCreated,                     // callback(row) optionnel
}) {
  const { toast } = useToast();
  const { session } = useAuth();

  // ---- champs
  const [title, setTitle] = useState("");
  const [projectType, setProjectType] = useState(defaultProjectType);
  const [typeBien, setTypeBien] = useState("");
  const [ville, setVille] = useState("");
  const [quartier, setQuartier] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [surfaceMin, setSurfaceMin] = useState("");
  const [surfaceMax, setSurfaceMax] = useState("");
  const [chambresMin, setChambresMin] = useState("");
  const [prixDemande, setPrixDemande] = useState("");
  const [surface, setSurface] = useState("");
  const [chambres, setChambres] = useState("");
  const [delai, setDelai] = useState("");
  const [description, setDescription] = useState("");

  // publication
  const [targets, setTargets] = useState({
    showcase: true,   // Carte de visite digitale
    public: false,    // Place des projets (public)
    interpro: false,  // Marché inter-pro
  });

  const [submitting, setSubmitting] = useState(false);

  const toggleTarget = (k) =>
    setTargets((t) => ({ ...t, [k]: !t[k] }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    if (!session?.user?.id) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour créer un projet.",
        variant: "destructive",
      });
      return;
    }
    if (!professionnel?.id) {
      toast({
        title: "Professionnel manquant",
        description: "Impossible d’associer le projet (professionnel_id absent).",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const common = {
        professionnel_id: professionnel.id,
        title: title || null,
        delai: delai || null,
        type_bien: typeBien || null,
        city: ville || null,
        quartier: quartier || null,
        description: description || null,
        criteres: {
          // tu peux brancher ici de vrais critères si tu en as d’autres
        },
        // Carte de visite digitale
        visibility_showcase: !!targets.showcase,
        // On garde les autres choix dans un JSON inoffensif
        publish_targets: targets, // jsonb (ok même si la colonne n’existe pas encore -> ajoute-la si besoin)
      };

      let table, payload;
      if (projectType === "achat") {
        table = "buying_projects_professionnel";
        payload = {
          ...common,
          localisations: quartier ? [ville, `${ville} - ${quartier}`] : (ville ? [ville] : null),
          budget_min: toNumberOrNull(budgetMin),
          budget_max: toNumberOrNull(budgetMax),
          surface_min: toNumberOrNull(surfaceMin),
          surface_max: toNumberOrNull(surfaceMax),
          chambres_min: toNumberOrNull(chambresMin),
        };
      } else {
        table = "selling_projects_professionnel";
        payload = {
          ...common,
          prix_demande: toNumberOrNull(prixDemande),
          surface: toNumberOrNull(surface),
          chambres: toNumberOrNull(chambres),
        };
      }

      const { data, error } = await supabase.from(table).insert(payload).select().single();
      if (error) throw error;

      toast({ title: "Projet créé", description: "Le projet a été ajouté avec succès." });
      onCreated?.(data);
      onOpenChange?.(false);
    } catch (err) {
      console.error(err);
      toast({
        title: "Création impossible",
        description: err?.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Nouveau Projet Professionnel</DialogTitle>
          <DialogDescription>Renseignez les informations pour créer un nouveau projet.</DialogDescription>
        </DialogHeader>

        {/* ✅ form avec onSubmit et bouton type=submit */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Titre en haut */}
          <div>
            <Label>Titre*</Label>
            <Input
              placeholder="ex : Très beau loft avec vue sur la Sarthe"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Type de projet & Type de bien */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Êtes-vous en train de créer un projet d’…*</Label>
              <select
                className="w-full border rounded-md h-10 px-3"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                required
              >
                <option value="">Sélectionner</option>
                <option value="achat">Achat</option>
                <option value="vente">Vente</option>
              </select>
            </div>
            <div>
              <Label>Type de Bien*</Label>
              <select
                className="w-full border rounded-md h-10 px-3"
                value={typeBien}
                onChange={(e) => setTypeBien(e.target.value)}
                required
              >
                <option value="">Sélectionner</option>
                <option>Appartement</option>
                <option>Maison</option>
                <option>Loft / Atelier / Surface</option>
                <option>Terrain</option>
                <option>Immeuble</option>
              </select>
            </div>
          </div>

          {/* Publication */}
          <div>
            <Label>Souhaitez-vous publier ce projet sur…</Label>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label className="flex items-center gap-2">
                <Checkbox checked={targets.showcase} onCheckedChange={() => toggleTarget("showcase")} />
                <span>Carte de visite digitale</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox checked={targets.public} onCheckedChange={() => toggleTarget("public")} />
                <span>Place des projets</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox checked={targets.interpro} onCheckedChange={() => toggleTarget("interpro")} />
                <span>Marché inter-pro</span>
              </label>
            </div>
          </div>

          {/* Localisation */}
          <div>
            <Label>Localisation(s) souhaitée(s)*</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <Input placeholder="Ville*" value={ville} onChange={(e) => setVille(e.target.value)} required />
              <Input placeholder="Quartier (optionnel)" value={quartier} onChange={(e) => setQuartier(e.target.value)} />
            </div>
          </div>

          {/* Champs spécifiques */}
          {projectType === "achat" ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Budget min (€)"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                />
                <Input
                  placeholder="Budget max (€)"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  required={!budgetMin}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input placeholder="Surface min (m²)" value={surfaceMin} onChange={(e) => setSurfaceMin(e.target.value)} />
                <Input placeholder="Surface max (m²)" value={surfaceMax} onChange={(e) => setSurfaceMax(e.target.value)} />
                <Input placeholder="Chambres min" value={chambresMin} onChange={(e) => setChambresMin(e.target.value)} />
              </div>
            </>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <Input
                placeholder="Prix demandé (€)"
                value={prixDemande}
                onChange={(e) => setPrixDemande(e.target.value)}
                required
              />
              <Input placeholder="Surface (m²)" value={surface} onChange={(e) => setSurface(e.target.value)} />
              <Input placeholder="Chambres" value={chambres} onChange={(e) => setChambres(e.target.value)} />
            </div>
          )}

          {/* Délai + Description */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Délai de réalisation*</Label>
              <select
                className="w-full border rounded-md h-10 px-3"
                value={delai}
                onChange={(e) => setDelai(e.target.value)}
                required
              >
                <option value="">Sélectionner</option>
                <option>Moins de 3 mois</option>
                <option>3 à 6 mois</option>
                <option>6 à 12 mois</option>
                <option>Plus de 12 mois</option>
              </select>
            </div>
            <div>{/* slot libre si tu veux ajouter un champ plus tard */}</div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              rows={4}
              placeholder="Précisez le besoin…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange?.(false)}>
              Fermer
            </Button>
            {/* ✅ Bouton actif (désactivé uniquement pendant la requête) */}
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création…
                </>
              ) : (
                "Créer le projet"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}