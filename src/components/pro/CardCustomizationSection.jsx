import React from "react";
import { Droplet, User, MessageSquare, Link2, QrCode as QrCodeIcon, Lock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { COLOR_DEFAULTS, isValidHex } from "@/utils/proHelpers";

const ColorField = ({
  id,
  label,
  value,
  onChange,
  disabled,
  fallback = "#0ea5e9",
  icon = <Droplet className="h-4 w-4" />
}) => {
  const valid = !value || /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(value);
  const displayValue = valid && value ? value : fallback;

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-gray-700">
        {icon} {label}
      </Label>
      <div className="flex items-center gap-2">
        <div className="relative">
          <Input 
            type="color" 
            value={displayValue} 
            onChange={e => onChange(e.target.value)} 
            disabled={disabled} 
            className="w-12 h-10 p-1 cursor-pointer" 
          />
        </div>
        <Input 
          id={id} 
          placeholder="#RRGGBB" 
          value={value || ""} 
          onChange={e => onChange(e.target.value)} 
          disabled={disabled} 
          className={`font-mono ${!valid ? "border-red-500 ring-red-200" : ""}`} 
        />
      </div>
      {!valid && (
        <p className="text-xs text-red-600">Format HEX (#RRGGBB) requis.</p>
      )}
    </div>
  );
};

export default function CardCustomizationSection({
  profile,
  setProfile, // Function to update parent state
  agency,
  allowCustomization,
  isDirector,
  saving,
  onToggleCustomization // Only for director to toggle permission
}) {
  const isEditable = isDirector || allowCustomization;

  if (!isEditable && !isDirector) {
    return (
      <Alert className="bg-gray-50 border-gray-200">
        <Lock className="h-4 w-4 text-gray-500" />
        <AlertTitle className="text-gray-700">Personnalisation verrouillée</AlertTitle>
        <AlertDescription className="text-gray-600">
          La personnalisation de votre carte est gérée par votre directeur d'agence afin d'assurer une cohérence de marque.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {isDirector && onToggleCustomization && (
        <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50/50 mb-6">
          <div className="space-y-0.5">
            <Label className="text-base font-semibold">Autoriser la personnalisation</Label>
            <p className="text-sm text-muted-foreground">
              Permettre aux membres de l'équipe de modifier leurs propres couleurs.
            </p>
          </div>
          <Switch 
            checked={allowCustomization} 
            onCheckedChange={onToggleCustomization} 
            disabled={saving}
          />
        </div>
      )}

      {/* Agency Reference Colors (Read-only view for guidance) */}
      {agency && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h4 className="text-sm font-semibold mb-3 text-gray-700 flex items-center gap-2">
            <Lock className="w-3 h-3" /> Couleurs de l'Agence (Référence)
          </h4>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border shadow-sm" style={{ backgroundColor: agency.card_banner_color || COLOR_DEFAULTS.card_banner_color }} />
              <span className="text-xs text-gray-500">Bandeau</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border shadow-sm" style={{ backgroundColor: agency.card_primary_button_color || COLOR_DEFAULTS.card_primary_button_color }} />
              <span className="text-xs text-gray-500">Bouton Primaire</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ColorField 
          id="card_banner_color" 
          label="Couleur du bandeau" 
          value={profile.card_banner_color} 
          onChange={v => setProfile({...profile, card_banner_color: v})} 
          disabled={saving || !isEditable} 
          fallback={COLOR_DEFAULTS.card_banner_color} 
        />
        
        <ColorField 
          id="card_text_color" 
          label="Couleur du texte principal" 
          value={profile.card_text_color} 
          onChange={v => setProfile({...profile, card_text_color: v})} 
          disabled={saving || !isEditable} 
          fallback="#111827" 
        />

        <ColorField 
          id="card_primary_button_color" 
          label="Bouton Principal" 
          value={profile.card_primary_button_color} 
          onChange={v => setProfile({...profile, card_primary_button_color: v})} 
          disabled={saving || !isEditable} 
          fallback={COLOR_DEFAULTS.card_primary_button_color} 
        />

        <ColorField 
          id="card_secondary_button_color" 
          label="Bouton Secondaire" 
          value={profile.card_secondary_button_color} 
          onChange={v => setProfile({...profile, card_secondary_button_color: v})} 
          disabled={saving || !isEditable} 
          fallback={COLOR_DEFAULTS.card_secondary_button_color} 
        />

        <ColorField 
          id="card_name_color" 
          label="Couleur du Nom" 
          value={profile.card_name_color} 
          onChange={v => setProfile({...profile, card_name_color: v})} 
          disabled={saving || !isEditable} 
          fallback={profile.card_text_color} 
          icon={<User className="h-4 w-4" />} 
        />

        <ColorField 
          id="card_qr_fg_color" 
          label="Couleur QR Code" 
          value={profile.card_qr_fg_color} 
          onChange={v => setProfile({...profile, card_qr_fg_color: v})} 
          disabled={saving || !isEditable} 
          fallback={COLOR_DEFAULTS.card_qr_fg_color} 
          icon={<QrCodeIcon className="h-4 w-4" />} 
        />
      </div>
      
      {/* Advanced Text Colors Collapsible or just listed below */}
      <div className="pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-6">
         <ColorField 
          id="card_signature_color" 
          label="Signature (Fonction)" 
          value={profile.card_signature_color} 
          onChange={v => setProfile({...profile, card_signature_color: v})} 
          disabled={saving || !isEditable} 
          fallback={profile.card_text_color} 
          icon={<MessageSquare className="h-4 w-4" />} 
        />
        <ColorField 
          id="card_company_name_color" 
          label="Nom Entreprise" 
          value={profile.card_company_name_color} 
          onChange={v => setProfile({...profile, card_company_name_color: v})} 
          disabled={saving || !isEditable} 
          fallback={profile.card_text_color} 
          icon={<Link2 className="h-4 w-4" />} 
        />
      </div>
    </div>
  );
}