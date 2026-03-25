import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, CheckCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/customSupabaseClient";
import { useAgencyInvitation } from "@/hooks/useAgencyInvitation";

const schema = z.object({
  firstName: z.string().min(2, "Le prénom est requis"),
  lastName: z.string().min(2, "Le nom est requis"),
  phone: z.string().optional(),
  password: z.string().min(8, "Le mot de passe doit faire au moins 8 caractères"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export default function AgencyAccountCreationPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { completeInvitation } = useAgencyInvitation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: ""
    }
  });

  useEffect(() => {
    if (!state?.email || !state?.token) {
      navigate('/connexion'); // Redirect if accessed directly without context
    }
  }, [state, navigate]);

  if (!state?.email) return null;

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // 1. Sign Up User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: state.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
            role: 'professionnel',
            agency_role: state.role, // 'agent' or 'team_leader'
            agency_id: state.agencyId,
            user_type: 'professionnel'
          }
        }
      });

      if (authError) throw authError;

      if (authData?.user) {
        // 2. Mark Invitation as Accepted (link user_id)
        await completeInvitation(state.token, authData.user.id);

        toast({
          title: "Compte créé avec succès !",
          description: "Bienvenue dans votre espace agence.",
          duration: 5000,
        });

        // Redirect
        navigate('/agency-dashboard');
      }

    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Erreur de création",
        description: err.message || "Une erreur est survenue lors de l'inscription.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-lg shadow-xl border-t-4 border-brand-blue">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
             <ShieldCheck className="w-6 h-6 text-brand-blue" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Finaliser votre inscription</CardTitle>
          <CardDescription>
            Complétez vos informations pour accéder à l'agence.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
            
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
              <Label className="text-xs text-muted-foreground uppercase">Email vérifié</Label>
              <div className="flex items-center gap-2 font-medium text-slate-700">
                {state.email} <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input id="firstName" {...register("firstName")} />
                {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input id="lastName" {...register("lastName")} />
                {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone (Mobile)</Label>
              <Input id="phone" type="tel" {...register("phone")} placeholder="06..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Définir un mot de passe</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input id="confirmPassword" type="password" {...register("confirmPassword")} />
              {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full bg-brand-blue hover:bg-blue-700 h-12 text-base">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Créer mon compte"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}