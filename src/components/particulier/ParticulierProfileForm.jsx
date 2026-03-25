// src/components/particulier/ParticulierProfileForm.jsx

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "../../../lib/customSupabaseClient";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const ParticulierProfileForm = () => {
  const { user, profile, getSessionAndProfile } = useAuth();
  const { toast } = useToast();

  const userId = user?.id || profile?.id || null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Données réelles "particuliers"
  const [particulier, setParticulier] = useState(null);

  const emailToShow = useMemo(() => {
    // ✅ Fallback: auth email > particulier.email > profile.email
    return user?.email || particulier?.email || profile?.email || "";
  }, [user?.email, particulier?.email, profile?.email]);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });

  const fetchParticulier = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("particuliers")
        .select("id, first_name, last_name, phone, email, role, updated_at")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;

      setParticulier(data || null);

      // Hydrate le form depuis la table particuliers (source de vérité)
      setForm({
        first_name: data?.first_name ?? "",
        last_name: data?.last_name ?? "",
        phone: data?.phone ?? "",
      });
    } catch (err) {
      console.error("[ParticulierProfileForm] Erreur fetch particuliers:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          "Impossible de charger vos informations pour le moment.",
      });
      setParticulier(null);
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  // Chargement initial + quand l'utilisateur change
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    fetchParticulier();
  }, [userId, fetchParticulier]);

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!userId) return;

    const payload = {
      first_name: form.first_name?.trim() || null,
      last_name: form.last_name?.trim() || null,
      phone: form.phone?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    setSaving(true);
    try {
      const { error } = await supabase
        .from("particuliers")
        .update(payload)
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Profil mis à jour",
        description: "Vos informations personnelles ont été sauvegardées.",
      });

      // Recharge la source de vérité
      await fetchParticulier();

      // Rafraîchit aussi le contexte global (si tu l’utilises ailleurs)
      try {
        await getSessionAndProfile?.();
      } catch (e) {
        console.warn(
          "[ParticulierProfileForm] Refresh contexte non bloquant:",
          e
        );
      }
    } catch (err) {
      console.error("[ParticulierProfileForm] Erreur sauvegarde:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de sauvegarder votre profil pour le moment.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Loading state : on attend userId + fetch
  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  // Si pas d'userId, c'est que l'utilisateur n'est pas prêt/c’est un état anormal
  if (!userId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mes informations</CardTitle>
          <CardDescription>
            Impossible d’identifier votre session. Veuillez vous reconnecter.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mes informations</CardTitle>
        <CardDescription>Actualisez vos informations personnelles.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Petit indicateur si la ligne n'existe pas (rare, mais utile) */}
        {!particulier && (
          <div className="rounded-md border p-3 text-sm">
            Nous n’avons pas retrouvé votre fiche particulier. Si le problème
            persiste, contactez le support.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="first_name">Prénom</Label>
            <Input
              id="first_name"
              value={form.first_name}
              onChange={handleChange("first_name")}
              disabled={saving}
            />
          </div>

          <div>
            <Label htmlFor="last_name">Nom</Label>
            <Input
              id="last_name"
              value={form.last_name}
              onChange={handleChange("last_name")}
              disabled={saving}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={emailToShow}
            disabled
            className="bg-slate-100"
          />
          <p className="mt-1 text-xs text-slate-500">
            L&apos;adresse e-mail est gérée par votre compte (authentification) et ne
            peut pas être modifiée ici.
          </p>
        </div>

        <div>
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={handleChange("phone")}
            disabled={saving}
          />
        </div>

        <div className="pt-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sauvegarde en cours…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Sauvegarder les informations
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ParticulierProfileForm;