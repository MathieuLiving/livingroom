// src/components/pro/SecuritySection.jsx
import React, { useState } from "react";
import { supabase } from "../../../lib/customSupabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SecuritySection({ userEmail }) {
  const { toast } = useToast();
  const [loadingPass, setLoadingPass] = useState(false);
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas.",
      });
      return;
    }

    if (passwords.newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Mot de passe trop court",
        description: "Le mot de passe doit contenir au moins 6 caractères.",
      });
      return;
    }

    setLoadingPass(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.newPassword,
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Votre mot de passe a été mis à jour.",
      });
      setPasswords({ newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le mot de passe.",
      });
    } finally {
      setLoadingPass(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Email du compte</Label>
          <div className="flex items-center gap-2">
            <Input value={userEmail || ""} disabled className="bg-slate-50" />
            <ShieldCheck className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-xs text-muted-foreground">
            L'email sert d'identifiant unique et ne peut pas être modifié ici.
          </p>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Lock className="h-4 w-4" /> Changer de mot de passe
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loadingPass || !passwords.newPassword}>
              {loadingPass && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Mettre à jour le mot de passe
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}