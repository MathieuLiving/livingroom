import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/lib/customSupabaseClient";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Loader2,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Crown,
  CalendarDays,
  LineChart,
  Clock,
  UserCheck,
  Target,
  Info,
  Gift,
  Zap,
  ExternalLink,
} from "lucide-react";
import SEO from "@/components/SEO";
import {
  recordLegalAcceptance,
  hasAcceptedLegalDoc,
} from "@/lib/legalAcceptances";

const TABLE = "professionnels_billing_status";
const CGV_VERSION = "2026-01-02";
const PREMIUM_PLAN_CODE = "premium_plus";

const PRICING_FEATURES = [
  {
    label: "Vitrine professionnelle complète (photo, logo, présentation)",
    free: "check",
    premium: "check",
  },
  {
    label: "Carte de visite digitale & QR Code partageable",
    free: "Lien gratuit + QR simple",
    premium: "Lien premium + QR pro",
  },
  {
    label: "Personnalisation carte & QR",
    free: "Couleurs",
    premium: "Couleurs + logo QR",
  },
  {
    label: "Statistiques carte de visite (clics lien & scans QR)",
    free: "dash",
    premium: "check",
  },
  {
    label: "Présentation de vos recherches & ventes via votre carte de visite digitale",
    free: "check",
    premium: "check",
  },
  {
    label: "Formulaire de qualification du projet via la carte de visite digitale",
    free: "check",
    premium: "check",
  },
  {
    label: "Partage de vos projets sur la place de marché & le marché inter-pro",
    free: "Illimités",
    premium: "Illimités",
  },
  {
    label: "Prises de contact actives (demandes envoyées aux porteurs de projets)",
    free: "Jusqu'à 2 demandes",
    premium: "Illimitées",
  },
  {
    label: "Prises de contact entrantes sur vos projets",
    free: "Illimitées",
    premium: "Illimitées",
  },
  {
    label: "Mise en avant sur la plateforme (statut Partenaire)",
    free: "dash",
    premium: "Incluse",
  },
  {
    label: "Alertes prioritaires sur les nouveaux projets",
    free: "dash",
    premium: "check",
  },
  {
    label: 'Badge « Professionnel recommandé »',
    free: "dash",
    premium: "check",
  },
];

const CellValue = ({ value }) => {
  if (value === "check") {
    return <CheckCircle className="mx-auto h-5 w-5 text-emerald-500" aria-hidden />;
  }

  if (value === "dash") {
    return <span className="text-slate-300">—</span>;
  }

  return <span className="text-center text-sm font-medium text-slate-700">{value}</span>;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "dd MMMM yyyy", { locale: fr });
};

function addDays(dateStr, days) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function daysRemaining(dateStr) {
  if (!dateStr) return null;
  const end = new Date(dateStr).getTime();
  if (Number.isNaN(end)) return null;
  const diff = end - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function SubscriptionPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const userId = user?.id || null;

  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);

  const [acceptCgv, setAcceptCgv] = useState(false);
  const [legalLoading, setLegalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const loggedOnceRef = useRef(false);

  const fetchBilling = useCallback(async () => {
    if (!profile?.id) return;

    setLoading(true);

    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("professionnel_id", profile.id)
      .single();

    if (error) {
      console.error("[SubscriptionPage] fetchBilling error:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de récupérer vos informations d'abonnement.",
      });
      setBilling(null);
    } else {
      setBilling(data);
    }

    setLoading(false);
  }, [profile?.id, toast]);

  useEffect(() => {
    if (!authLoading && profile?.id) {
      fetchBilling();
    }
  }, [authLoading, profile?.id, fetchBilling]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!userId) return;

      try {
        const ok = await hasAcceptedLegalDoc({
          userId,
          docType: "cgv",
          docVersion: CGV_VERSION,
        });

        if (!cancelled && ok) {
          setAcceptCgv(true);
          loggedOnceRef.current = true;
        }
      } catch (e) {
        console.warn("[SubscriptionPage] hasAcceptedLegalDoc failed:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!acceptCgv) return;
      if (!userId) return;
      if (loggedOnceRef.current) return;

      setLegalLoading(true);

      try {
        await recordLegalAcceptance({
          userId,
          docType: "cgv",
          docVersion: CGV_VERSION,
          source: "subscription_page",
          metadata: {
            current_plan: billing?.billing_plan || "free",
          },
        });

        if (!cancelled) {
          loggedOnceRef.current = true;
        }
      } catch (e) {
        console.warn("[SubscriptionPage] recordLegalAcceptance failed:", e);

        if (!cancelled) {
          setAcceptCgv(false);
          toast({
            variant: "destructive",
            title: "Enregistrement CGV impossible",
            description:
              "Votre acceptation n'a pas pu être enregistrée. Veuillez réessayer.",
          });
        }
      } finally {
        if (!cancelled) {
          setLegalLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [acceptCgv, userId, billing?.billing_plan, toast]);

  const openCheckout = useCallback(
    async (planCode) => {
      if (!profile?.id) {
        toast({
          variant: "destructive",
          title: "Profil introuvable",
          description: "Impossible de lancer le paiement sans profil professionnel.",
        });
        return;
      }

      if (!acceptCgv) {
        toast({
          variant: "destructive",
          title: "Conditions requises",
          description: "Veuillez accepter les CGV avant de procéder au paiement.",
        });
        return;
      }

      setCheckoutLoading(true);

      try {
        const { data, error } = await supabase.functions.invoke(
          "create-checkout-session",
          {
            body: {
              professionnel_id: profile.id,
              plan_code: planCode,
              origin: window.location.origin,
            },
          }
        );

        if (error) {
          console.error("[SubscriptionPage] create-checkout-session invoke error:", error);
          throw new Error(error.message || "Impossible de créer la session Stripe.");
        }

        if (!data?.url) {
          throw new Error("URL de paiement Stripe manquante.");
        }

        window.location.assign(data.url);
      } catch (e) {
        console.error("[SubscriptionPage] openCheckout error:", e);
        toast({
          variant: "destructive",
          title: "Paiement indisponible",
          description: e?.message || "Impossible de lancer le paiement pour le moment.",
        });
      } finally {
        setCheckoutLoading(false);
      }
    },
    [profile?.id, acceptCgv, toast]
  );

  const openBillingPortal = useCallback(async () => {
    if (!profile?.id) {
      toast({
        variant: "destructive",
        title: "Profil introuvable",
        description: "Impossible d’ouvrir le portail Stripe.",
      });
      return;
    }

    try {
      setPortalLoading(true);

      const { data, error } = await supabase.functions.invoke(
        "create-customer-portal",
        {
          body: {
            professionnel_id: profile.id,
            origin: window.location.origin,
          },
        }
      );

      if (error) {
        throw new Error(error?.message || "Impossible d’ouvrir le portail Stripe.");
      }

      if (!data?.url) {
        throw new Error("URL du portail Stripe manquante.");
      }

      window.location.assign(data.url);
    } catch (e) {
      console.error("[SubscriptionPage] openBillingPortal error:", e);
      toast({
        variant: "destructive",
        title: "Portail Stripe indisponible",
        description: e?.message || "Impossible d’ouvrir le portail Stripe.",
      });
    } finally {
      setPortalLoading(false);
    }
  }, [profile?.id, toast]);

  const rawPlan = billing?.billing_plan || "free";
  const subStatus = billing?.subscription_status || "none";
  const effectivePlan = billing?.effective_plan || "free";

  const isPremium =
    effectivePlan === "premium" ||
    ["premium", "premium_plus"].includes(rawPlan);

  const isStripeTrialing = subStatus === "trialing";
  const isStripeActive = subStatus === "active";
  const hasStripeCustomer = Boolean(billing?.stripe_customer_id);

  const accountCreated = billing?.created_at || profile?.created_at || null;
  const validatedAt =
    billing?.validated_at ||
    billing?.admin_validated_at ||
    billing?.validation_date ||
    billing?.validated_by_administrator_at ||
    null;

  const isValidated = billing?.is_validated_by_administrator === true;

  const stripeTrialEndAt = billing?.trial_end_at || null;
  const subscriptionStartedAt = billing?.subscription_started_at || null;
  const subscriptionCurrentPeriodEnd =
    billing?.subscription_current_period_end || null;

  const premiumPrice = "19€ / mois";
  const planLabel = isPremium ? "Premium" : "Gratuit";

  const validationTrialEndAt = useMemo(() => {
    if (!validatedAt) return null;
    return addDays(validatedAt, 30);
  }, [validatedAt]);

  const hasAvailableTrialWindow = useMemo(() => {
    if (!validationTrialEndAt) return false;
    if (hasStripeCustomer) return false;
    return new Date(validationTrialEndAt).getTime() > Date.now();
  }, [validationTrialEndAt, hasStripeCustomer]);

  const availableTrialDaysLeft = useMemo(() => {
    if (!hasAvailableTrialWindow) return 0;
    return daysRemaining(validationTrialEndAt) ?? 0;
  }, [hasAvailableTrialWindow, validationTrialEndAt]);

  const stripeTrialDaysLeft = useMemo(() => {
    if (!stripeTrialEndAt) return null;
    return daysRemaining(stripeTrialEndAt);
  }, [stripeTrialEndAt]);

  const freeStartDate = useMemo(() => {
    if (isPremium) return null;
    return accountCreated || null;
  }, [isPremium, accountCreated]);

  const premiumStartDate = useMemo(() => {
    if (!isPremium) return null;
    return subscriptionStartedAt || null;
  }, [isPremium, subscriptionStartedAt]);

  const currentStatusLabel = useMemo(() => {
    if (isStripeTrialing) return "Essai Premium";
    if (isStripeActive) return "Actif";
    if (subStatus === "past_due") return "Paiement en attente";
    if (subStatus === "canceled") return "Annulé";
    if (!isPremium && hasAvailableTrialWindow) return "Essai disponible";
    return "Offert";
  }, [isStripeTrialing, isStripeActive, subStatus, isPremium, hasAvailableTrialWindow]);

  const statusBadge = useMemo(() => {
    if (isStripeTrialing) {
      return "bg-blue-100 text-blue-800 border-blue-200";
    }
    if (isStripeActive) {
      return "bg-green-100 text-green-800 border-green-200";
    }
    if (subStatus === "past_due") {
      return "bg-amber-100 text-amber-800 border-amber-200";
    }
    if (subStatus === "canceled") {
      return "bg-red-100 text-red-800 border-red-200";
    }
    if (!isPremium && hasAvailableTrialWindow) {
      return "bg-sky-100 text-sky-800 border-sky-200";
    }
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  }, [isStripeTrialing, isStripeActive, subStatus, isPremium, hasAvailableTrialWindow]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-brand-blue" />
        <p className="text-sm font-medium text-slate-500">
          Chargement de votre abonnement…
        </p>
      </div>
    );
  }

  if (!profile || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
        <XCircle className="mb-4 h-12 w-12 text-red-500" />
        <h1 className="mb-2 text-xl font-bold text-slate-900">Accès refusé</h1>
        <p className="max-w-md text-center text-slate-600">
          Vous devez être connecté en tant que professionnel pour gérer votre abonnement.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link to="/connexion">Se connecter</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <SEO
        title="Mon abonnement"
        description="Gérez votre abonnement LivingRoom, consultez votre historique et changez d'offre."
      />

      <div className="border-b border-slate-200 bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900 md:text-3xl">
                <ShieldCheck className="h-8 w-8 text-brand-blue" />
                Mon Abonnement
              </h1>
              <p className="mt-1 text-slate-500">
                Gérez votre offre et accédez à vos fonctionnalités.
              </p>
            </div>

            {isPremium && (
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
                <Crown className="h-4 w-4 fill-amber-700" />
                Membre Premium
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto space-y-10 px-4 py-8">
        <Card className="border-brand-blue/20 bg-gradient-to-br from-white to-blue-50/40 shadow-md">
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-blue-900">
                  Votre offre actuelle
                </CardTitle>
                <CardDescription>
                  Gérez votre abonnement professionnel et vos informations clés.
                </CardDescription>
              </div>

              <span
                className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-sm font-medium ${statusBadge}`}
              >
                {currentStatusLabel}
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-blue-100 p-3">
                <ShieldCheck className="h-7 w-7 text-brand-blue" />
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-2xl font-bold text-blue-900">{planLabel}</div>

                  {!isPremium && !hasAvailableTrialWindow && (
                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                      Offert
                    </span>
                  )}
                </div>

                <div className="text-sm text-muted-foreground">
                  {isStripeTrialing
                    ? `Essai Premium en cours : ${
                        stripeTrialDaysLeft ?? "—"
                      } jour${stripeTrialDaysLeft > 1 ? "s" : ""} restant${
                        stripeTrialDaysLeft > 1 ? "s" : ""
                      }.`
                    : isPremium
                    ? premiumPrice
                    : hasAvailableTrialWindow
                    ? `Essai Premium disponible : ${availableTrialDaysLeft} jour${
                        availableTrialDaysLeft > 1 ? "s" : ""
                      } restant${availableTrialDaysLeft > 1 ? "s" : ""}.`
                    : "Passez à Premium pour débloquer les demandes illimitées et la visibilité renforcée."}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border bg-white p-4">
                <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                  Offre utilisée
                </div>
                <div className="font-semibold text-slate-900">{planLabel}</div>
              </div>

              <div className="rounded-xl border bg-white p-4">
                <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  Date de création du compte
                </div>
                <div className="font-semibold text-slate-900">
                  {formatDate(accountCreated)}
                </div>
              </div>

              <div className="rounded-xl border bg-white p-4">
                <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                  <UserCheck className="h-4 w-4" />
                  Validation administrateur
                </div>
                <div className="font-semibold text-slate-900">
                  {isValidated ? formatDate(validatedAt) : "En attente"}
                </div>
              </div>

              <div className="rounded-xl border bg-white p-4">
                <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                  <Gift className="h-4 w-4" />
                  {isPremium ? "Début d’abonnement" : "Début de la gratuité"}
                </div>
                <div className="font-semibold text-slate-900">
                  {formatDate(isPremium ? premiumStartDate : freeStartDate)}
                </div>
              </div>

              {!isPremium && validatedAt && (
                <div className="rounded-xl border bg-white p-4">
                  <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                    <Gift className="h-4 w-4" />
                    Fin de fenêtre d’essai
                  </div>
                  <div className="font-semibold text-slate-900">
                    {formatDate(validationTrialEndAt)}
                  </div>
                </div>
              )}

              {isStripeTrialing && (
                <>
                  <div className="rounded-xl border bg-white p-4">
                    <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                      <Gift className="h-4 w-4" />
                      Fin de l’essai Stripe
                    </div>
                    <div className="font-semibold text-slate-900">
                      {formatDate(stripeTrialEndAt)}
                    </div>
                  </div>

                  <div className="rounded-xl border bg-white p-4">
                    <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Jours restants
                    </div>
                    <div className="font-semibold text-slate-900">
                      {stripeTrialDaysLeft ?? "—"}
                    </div>
                  </div>
                </>
              )}

              {subscriptionCurrentPeriodEnd && (
                <div className="rounded-xl border bg-white p-4 md:col-span-2 xl:col-span-4">
                  <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {subStatus === "canceled" ? "Accès jusqu’au" : "Prochaine échéance"}
                  </div>
                  <div className="font-semibold text-slate-900">
                    {formatDate(subscriptionCurrentPeriodEnd)}
                  </div>
                </div>
              )}
            </div>

            {hasStripeCustomer && (
              <div className="flex justify-start">
                <Button
                  variant="outline"
                  onClick={openBillingPortal}
                  disabled={portalLoading}
                >
                  {portalLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Ouverture...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Gérer l’abonnement sur Stripe
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {!isPremium && (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Zap className="h-5 w-5 text-brand-orange" />
                  Passer Premium
                </CardTitle>
                <CardDescription>
                  Débloquez l’offre professionnelle Premium.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-lg font-semibold text-slate-900">
                        Offre Premium
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {premiumPrice}
                      </div>
                    </div>

                    <Crown className="h-6 w-6 text-amber-500" />
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Demandes illimitées
                    </div>
                    <div className="flex items-center gap-2">
                      <LineChart className="h-4 w-4 text-emerald-500" />
                      Statistiques avancées
                    </div>
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-amber-500" />
                      Badge recommandé
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-emerald-500" />
                      Alertes prioritaires
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border bg-slate-50 p-4">
                  <label className="flex cursor-pointer items-start gap-3 text-sm">
                    <Checkbox
                      checked={acceptCgv}
                      onCheckedChange={(v) => {
                        const next = v === true;
                        setAcceptCgv(next);

                        if (next) {
                          toast({
                            title: "CGV acceptées",
                            description: legalLoading
                              ? "Enregistrement..."
                              : "Vous pouvez procéder au paiement.",
                          });
                        }
                      }}
                      disabled={legalLoading || checkoutLoading}
                      className="mt-0.5"
                    />

                    <div className="space-y-1">
                      <span className="block font-medium text-slate-900">
                        J'accepte les conditions
                      </span>
                      <span className="block text-xs leading-relaxed text-slate-600">
                        En cochant cette case, j'accepte les{" "}
                        <Link
                          to="/cgv"
                          target="_blank"
                          className="underline hover:text-brand-blue"
                        >
                          CGV
                        </Link>{" "}
                        et la{" "}
                        <Link
                          to="/confidentialite"
                          target="_blank"
                          className="underline hover:text-brand-blue"
                        >
                          Politique de confidentialité
                        </Link>
                        .
                      </span>
                    </div>
                  </label>
                </div>

                {!acceptCgv && (
                  <p className="flex items-center gap-2 rounded border border-amber-100 bg-amber-50 p-2 text-xs text-amber-600">
                    <Info className="h-3 w-3" />
                    Veuillez accepter les conditions pour continuer.
                  </p>
                )}
              </CardContent>

              <CardFooter>
                <Button
                  type="button"
                  className="w-full bg-brand-blue hover:bg-blue-700"
                  disabled={!acceptCgv || legalLoading || checkoutLoading}
                  onClick={() => openCheckout(PREMIUM_PLAN_CODE)}
                >
                  {checkoutLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirection...
                    </>
                  ) : hasAvailableTrialWindow ? (
                    "Activer mon essai Premium"
                  ) : (
                    "Souscrire à l’offre Premium"
                  )}
                </Button>
              </CardFooter>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-blue-900">Résumé</CardTitle>
                <CardDescription>
                  Ce que Premium vous apporte immédiatement.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 text-sm text-slate-700">
                <div className="rounded-xl border bg-slate-50 p-4">
                  <p className="font-medium text-slate-900">
                    Passez à la vitesse supérieure
                  </p>
                  <p className="mt-2">
                    Premium vous permet de contacter plus de porteurs de projets,
                    d’améliorer votre visibilité et de suivre vos performances.
                  </p>
                </div>

                {hasAvailableTrialWindow && (
                  <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
                    <p className="font-medium text-sky-900">
                      Essai de 30 jours disponible
                    </p>
                    <p className="mt-2 text-sky-800">
                      Il vous reste {availableTrialDaysLeft} jour
                      {availableTrialDaysLeft > 1 ? "s" : ""} pour démarrer votre essai.
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    Activation immédiate
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    Paiement sécurisé par Stripe
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    Résiliation possible à tout moment
                  </div>
                  {hasAvailableTrialWindow && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      30 jours d’essai à compter de l’activation
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <section className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-brand-blue">
              Comparatif détaillé
            </h3>
            <p className="text-slate-500">
              Tout ce qui est inclus dans chaque offre.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="w-2/5 rounded-tl-2xl px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Fonctionnalités
                  </th>
                  <th className="w-1/5 px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <div className="flex flex-col items-center gap-1">
                      <span>Gratuit</span>
                    </div>
                  </th>
                  <th className="w-2/5 rounded-tr-2xl bg-blue-50/30 px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <div className="flex flex-col items-center gap-1 text-brand-blue">
                      <span>Premium</span>
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {PRICING_FEATURES.map((row, idx) => (
                  <tr
                    key={row.label}
                    className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"}
                  >
                    <td className="px-6 py-3 text-left align-top text-slate-700">
                      {row.label}
                    </td>
                    <td className="px-6 py-3 text-center align-middle">
                      <CellValue value={row.free} />
                    </td>
                    <td className="bg-blue-50/10 px-6 py-3 text-center align-middle">
                      <CellValue value={row.premium} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}