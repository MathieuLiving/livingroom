import React, { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

export default function ProfileInfoSection({
  profile,
  setProfile,
  saving,
  canEditCompany = false,
  isAgencyMember = false,
  agency = null,
}) {
  const { toast } = useToast();

  const handleInputChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setProfile((prev) => ({ ...(prev || {}), [name]: value }));
    },
    [setProfile]
  );

  const showLockedToast = useCallback(() => {
    toast({
      title: "Champ verrouillé",
      description: "Cette information est gérée par l’agence.",
    });
  }, [toast]);

  const agencyDisplayName =
    (agency && agency.name) || profile?.agency_name || profile?.company_name || "";

  return (
    <div className="space-y-6">
      {isAgencyMember && (
        <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800 mb-4">
          Certaines informations de branding entreprise sont gérées par votre agence.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">Prénom *</Label>
          <Input
            id="first_name"
            name="first_name"
            value={profile?.first_name || ""}
            onChange={handleInputChange}
            required
            disabled={saving}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">Nom *</Label>
          <Input
            id="last_name"
            name="last_name"
            value={profile?.last_name || ""}
            onChange={handleInputChange}
            required
            disabled={saving}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={profile?.email || ""}
            disabled
            className="bg-slate-100"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            name="phone"
            value={profile?.phone || ""}
            onChange={handleInputChange}
            placeholder="06 12 34 56 78"
            disabled={saving}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="function">Fonction / Titre</Label>
        <Input
          id="function"
          name="function"
          value={profile?.function || ""}
          onChange={handleInputChange}
          placeholder="Ex: Conseiller Immobilier, Directeur..."
          disabled={saving}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="company_name">Nom de l'entreprise / Agence</Label>

        {canEditCompany ? (
          <Input
            id="company_name"
            name="company_name"
            value={profile?.company_name || ""}
            onChange={handleInputChange}
            placeholder="Ma Super Agence"
            disabled={saving}
          />
        ) : (
          <Input
            id="company_name"
            name="company_name"
            value={agencyDisplayName}
            readOnly
            onClick={isAgencyMember ? showLockedToast : undefined}
            className="bg-slate-50 cursor-not-allowed"
          />
        )}

        {isAgencyMember && (
          <p className="text-xs text-muted-foreground">
            Le nom et le logo entreprise se modifient dans l’espace{" "}
            <span className="font-medium">Agence</span>.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="professionnal_presentation">Bio / Présentation</Label>
        <Textarea
          id="professionnal_presentation"
          name="professionnal_presentation"
          value={profile?.professionnal_presentation || ""}
          onChange={handleInputChange}
          rows={4}
          placeholder="Présentez-vous en quelques lignes..."
          disabled={saving}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="video_external_url">Lien vidéo de présentation</Label>
        <Input
          id="video_external_url"
          name="video_external_url"
          value={profile?.video_external_url || ""}
          onChange={handleInputChange}
          placeholder="https://www.youtube.com/... ou https://vimeo.com/..."
          disabled={saving}
        />
        <p className="text-xs text-muted-foreground">
          Cette vidéo pourra être affichée sur votre carte de visite digitale.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="number_card_professional">Numéro de carte pro (CPI) *</Label>
          <Input
            id="number_card_professional"
            name="number_card_professional"
            value={profile?.number_card_professional || ""}
            onChange={handleInputChange}
            required
            disabled={saving}
          />
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t">
        <Label>Zones d'intervention (max 3)</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Zone 1 (ex: Paris 15)"
            name="scope_intervention_choice_1"
            value={profile?.scope_intervention_choice_1 || ""}
            onChange={handleInputChange}
            disabled={saving}
          />
          <Input
            placeholder="Zone 2"
            name="scope_intervention_choice_2"
            value={profile?.scope_intervention_choice_2 || ""}
            onChange={handleInputChange}
            disabled={saving}
          />
          <Input
            placeholder="Zone 3"
            name="scope_intervention_choice_3"
            value={profile?.scope_intervention_choice_3 || ""}
            onChange={handleInputChange}
            disabled={saving}
          />
        </div>
      </div>
    </div>
  );
}