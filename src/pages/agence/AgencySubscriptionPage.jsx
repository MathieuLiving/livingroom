import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/customSupabaseClient";
import { useAuth } from "@/contexts/SupabaseAuthContext";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import {
  Loader2,
  CreditCard,
  ShieldCheck,
  Zap,
  Building2,
  CalendarDays,
  UserCheck,
  Gift,
} from "lucide-react";

const PLAN_LABELS = {
  free: "Gratuit",
  agency_s: "Agence S",
  agency_m: "Agence M",
  agency_l: "Agence L",
};

const PLAN_PRICES = {
  agency_s: "79€ / mois",
  agency_m: "149€ / mois",
  agency_l: "249€ / mois",
};

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function AgencySubscriptionPage() {
  const { user } = useAuth();

  const [subscription, setSubscription] = useState(null);
  const [professionnelId, setProfessionnelId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSubscription() {
      if (!user) return;

      try {
        setLoading(true);

        const { data: proData, error: proError } = await supabase
          .from("professionnels")
          .select("id, agency_id, agency_role")
          .eq("user_id", user.id)
          .single();

        if (proError) throw proError;

        setProfessionnelId(proData.id);

        const { data: billingData, error: billingError } = await supabase
          .from("professionnels_billing_status")
          .select("*")
          .eq("professionnel_id", proData.id)
          .single();

        if (billingError) throw billingError;

        setSubscription({
          plan: billingData.billing_plan || "free",
          status: billingData.subscription_status || "none",
          role: proData.agency_role,

          createdAt: billingData.created_at || null,
          isValidatedByAdministrator:
            billingData.is_validated_by_administrator === true,

          validatedAt:
            billingData.validated_at ||
            billingData.admin_validated_at ||
            billingData.validation_date ||
            billingData.validated_by_administrator_at ||
            null,

          subscriptionStartedAt: billingData.subscription_started_at || null,
          trialEndAt: billingData.trial_end_at || null,
          isComped: billingData.is_comped === true,
          compedUntilAt: billingData.comped_until_at || null,
          premiumReason: billingData.premium_reason || null,
        });
      } catch (err) {
        console.error("Error fetching subscription:", err);
        setError("Impossible de charger les informations d'abonnement.");
      } finally {
        setLoading(false);
      }
    }

    fetchSubscription();
  }, [user]);

  const startCheckout = async (planCode) => {
    if (!professionnelId) return;

    try {
      setCheckoutLoading(planCode);

      const { data, error } = await supabase.functions.invoke(
        "create-checkout-session",
        {
          body: {
            professionnel_id: professionnelId,
            plan_code: planCode,
            origin: window.location.origin,
          },
        }
      );

      if (error) throw error;
      if (!data?.url) throw new Error("Stripe URL manquante");

      window.location.href = data.url;
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Impossible de lancer le paiement.");
    } finally {
      setCheckoutLoading("");
    }
  };

  const freeStartDate = useMemo(() => {
    if (!subscription) return null;
    if (subscription.plan !== "free") return null;

    return subscription.subscriptionStartedAt || subscription.createdAt || null;
  }, [subscription]);

  const planLabel = PLAN_LABELS[subscription?.plan] || "Gratuit";

  const accountStatusLabel = useMemo(() => {
    if (subscription?.status === "active") return "Actif";
    if (subscription?.status === "trialing") return "Essai gratuit";
    if (
      subscription?.plan === "free" ||
      subscription?.isComped ||
      subscription?.premiumReason === "free"
    ) {
      return "Offert";
    }
    return "Offert";
  }, [
    subscription?.status,
    subscription?.plan,
    subscription?.isComped,
    subscription?.premiumReason,
  ]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 rounded-lg">
        <p>{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-blue">
            Abonnement Agence
          </h2>
          <p className="text-blue-600">
            Gérez votre offre et vos options de facturation.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2 border-l-4 border-l-brand-blue shadow-sm">
          <CardHeader>
            <div>
              <CardTitle className="text-xl text-blue-700">
                Votre Offre Actuelle
              </CardTitle>
              <CardDescription className="text-blue-600">
                État de votre souscription
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-blue-50 rounded-full">
                <ShieldCheck className="h-8 w-8 text-brand-blue" />
              </div>

              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-lg font-semibold text-blue-800">
                    {planLabel}
                  </h3>
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
                    {accountStatusLabel}
                  </span>
                </div>

                <p className="text-sm text-blue-700 mt-1">
                  {subscription?.plan === "free"
                    ? "Accès offert aux fonctionnalités de base pour démarrer."
                    : "Accès complet aux outils avancés de l'agence."}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-blue-600 mb-2">
                  <CalendarDays className="h-4 w-4" />
                  Date de création du compte
                </div>
                <div className="font-semibold text-slate-900">
                  {formatDate(subscription?.createdAt)}
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-blue-600 mb-2">
                  <UserCheck className="h-4 w-4" />
                  Validation administrateur
                </div>
                <div className="font-semibold text-slate-900">
                  {subscription?.isValidatedByAdministrator
                    ? formatDate(subscription?.validatedAt)
                    : "Non validé"}
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-blue-600 mb-2">
                  <Gift className="h-4 w-4" />
                  Début de la gratuité
                </div>
                <div className="font-semibold text-slate-900">
                  {formatDate(freeStartDate)}
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                <div className="text-xs uppercase tracking-wide text-blue-600 mb-2">
                  Offre utilisée
                </div>
                <div className="font-semibold text-slate-900">
                  {planLabel}
                </div>
              </div>
            </div>

            {subscription?.plan === "free" && (
              <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                <h4 className="font-semibold text-sm mb-4 flex items-center gap-2 text-blue-800">
                  <Zap className="h-4 w-4 text-brand-orange" />
                  Choisir une offre agence
                </h4>

                <div className="grid gap-4 md:grid-cols-3">
                  {["agency_s", "agency_m", "agency_l"].map((plan) => (
                    <Card key={plan} className="border border-blue-200">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-700">
                          <Building2 className="h-5 w-5" />
                          {PLAN_LABELS[plan]}
                        </CardTitle>

                        <CardDescription>{PLAN_PRICES[plan]}</CardDescription>
                      </CardHeader>

                      <CardContent>
                        <Button
                          className="w-full"
                          onClick={() => startCheckout(plan)}
                          disabled={checkoutLoading === plan}
                        >
                          {checkoutLoading === plan ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Redirection...
                            </>
                          ) : (
                            "Souscrire"
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <CreditCard className="h-5 w-5 text-brand-blue" />
              Facturation
            </CardTitle>
          </CardHeader>

          <CardContent className="text-center py-8 text-blue-600 bg-blue-50/50">
            <p>
              L'historique de vos factures sera disponible ici prochainement.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-blue-700">Utilisation</CardTitle>
          </CardHeader>

          <CardContent className="text-center py-8 text-blue-600 bg-blue-50/50">
            <p>
              Les statistiques d'utilisation de votre plan seront affichées ici.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}