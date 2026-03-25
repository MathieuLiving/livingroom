import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/customSupabaseClient";
import { useToast } from "@/components/ui/use-toast";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  ShieldCheck,
  CreditCard,
  Loader2,
  CalendarDays,
  Building2,
  Users,
  AlertTriangle,
  Zap,
  CheckCircle2,
  ExternalLink,
  UserCheck,
  Gift,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

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

const AVAILABLE_PLANS = ["agency_s", "agency_m", "agency_l"];

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

function getStatusBadge(status, currentPlanCode, billingStatus) {
  if (status === "active") {
    return {
      label: "Actif",
      className: "bg-green-100 text-green-800 border-green-200",
    };
  }

  if (status === "trialing") {
    return {
      label: "Essai",
      className: "bg-blue-100 text-blue-800 border-blue-200",
    };
  }

  if (status === "past_due") {
    return {
      label: "Paiement en retard",
      className: "bg-amber-100 text-amber-800 border-amber-200",
    };
  }

  if (status === "canceled") {
    return {
      label: "Annulé",
      className: "bg-red-100 text-red-800 border-red-200",
    };
  }

  if (
    currentPlanCode === "free" ||
    billingStatus?.is_comped === true ||
    billingStatus?.premium_reason === "free" ||
    billingStatus?.premium_reason === "comped" ||
    billingStatus?.premium_reason === "comped_legacy"
  ) {
    return {
      label: "Offert",
      className: "bg-emerald-100 text-emerald-800 border-emerald-200",
    };
  }

  return {
    label: "Offert",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  };
}

function buildInitialBillingForm(agency) {
  return {
    billing_entity: agency?.billing_entity || agency?.name || "",
    billing_address_line_1: agency?.billing_address_line_1 || "",
    billing_address_line_2: agency?.billing_address_line_2 || "",
    billing_postal_code: agency?.billing_postal_code || "",
    billing_city: agency?.billing_city || "",
    billing_country: agency?.billing_country || "France",
    billing_contact_last_name: agency?.billing_contact_last_name || "",
    billing_contact_first_name: agency?.billing_contact_first_name || "",
    billing_contact_phone: agency?.billing_contact_phone || "",
    billing_contact_email:
      agency?.billing_contact_email || agency?.contact_email || "",
  };
}

export default function SubscriptionTab({ agencyId }) {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState("");
  const [portalLoading, setPortalLoading] = useState(false);
  const [savingBilling, setSavingBilling] = useState(false);

  const [directorProId, setDirectorProId] = useState(null);
  const [agency, setAgency] = useState(null);
  const [billingStatus, setBillingStatus] = useState(null);
  const [accountsCreated, setAccountsCreated] = useState(0);

  const [billingDialogOpen, setBillingDialogOpen] = useState(false);
  const [billingForm, setBillingForm] = useState(buildInitialBillingForm(null));

  useEffect(() => {
    if (!agencyId) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agencyId]);

  async function fetchData() {
    try {
      setLoading(true);

      const { data: agencyData, error: agencyError } = await supabase
        .from("agencies")
        .select("*")
        .eq("id", agencyId)
        .single();

      if (agencyError) throw agencyError;

      setAgency(agencyData);
      setBillingForm(buildInitialBillingForm(agencyData));

      const { data: directorPro, error: directorError } = await supabase
        .from("professionnels")
        .select("id, agency_id, agency_role")
        .eq("agency_id", agencyId)
        .eq("agency_role", "director")
        .maybeSingle();

      if (directorError) throw directorError;

      const resolvedDirectorProId = directorPro?.id || null;
      setDirectorProId(resolvedDirectorProId);

      if (resolvedDirectorProId) {
        const { data: billingData, error: billingError } = await supabase
          .from("professionnels_billing_status")
          .select("*")
          .eq("professionnel_id", resolvedDirectorProId)
          .maybeSingle();

        if (billingError) throw billingError;
        setBillingStatus(billingData || null);
      } else {
        setBillingStatus(null);
      }

      const { count: accountsCount, error: accountsError } = await supabase
        .from("professionnels")
        .select("id", { count: "exact", head: true })
        .eq("agency_id", agencyId);

      if (accountsError) throw accountsError;

      setAccountsCreated(accountsCount || 0);
    } catch (err) {
      console.error("SubscriptionTab fetchData error:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les informations d’abonnement.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function startCheckout(planCode) {
    if (!directorProId) {
      toast({
        variant: "destructive",
        title: "Impossible de continuer",
        description:
          "Aucun profil directeur n’a été trouvé pour lancer l’abonnement.",
      });
      return;
    }

    try {
      setCheckoutLoading(planCode);

      const { data, error } = await supabase.functions.invoke(
        "create-checkout-session",
        {
          body: {
            professionnel_id: directorProId,
            plan_code: planCode,
            origin: window.location.origin,
          },
        }
      );

      if (error) {
        const message =
          error?.context?.error ||
          error?.message ||
          "Impossible de lancer le paiement.";
        throw new Error(message);
      }

      if (!data?.url) {
        throw new Error("URL Stripe manquante");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("Checkout error:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err?.message || "Impossible de lancer le paiement.",
      });
    } finally {
      setCheckoutLoading("");
    }
  }

  async function openBillingPortal() {
    if (!directorProId) {
      toast({
        variant: "destructive",
        title: "Impossible de continuer",
        description:
          "Aucun profil directeur n’a été trouvé pour ouvrir la facturation.",
      });
      return;
    }

    try {
      setPortalLoading(true);

      const { data, error } = await supabase.functions.invoke(
        "create-customer-portal",
        {
          body: {
            professionnel_id: directorProId,
            origin: window.location.origin,
          },
        }
      );

      if (error) {
        const message =
          error?.context?.error ||
          error?.message ||
          "Impossible d’ouvrir le portail de facturation.";
        throw new Error(message);
      }

      if (!data?.url) {
        throw new Error("URL du portail Stripe manquante");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("Billing portal error:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          err?.message || "Impossible d’ouvrir le portail de facturation.",
      });
    } finally {
      setPortalLoading(false);
    }
  }

  async function saveBillingDetails() {
    try {
      setSavingBilling(true);

      const payload = {
        billing_entity: billingForm.billing_entity?.trim() || null,
        billing_address_line_1:
          billingForm.billing_address_line_1?.trim() || null,
        billing_address_line_2:
          billingForm.billing_address_line_2?.trim() || null,
        billing_postal_code: billingForm.billing_postal_code?.trim() || null,
        billing_city: billingForm.billing_city?.trim() || null,
        billing_country: billingForm.billing_country?.trim() || "France",
        billing_contact_last_name:
          billingForm.billing_contact_last_name?.trim() || null,
        billing_contact_first_name:
          billingForm.billing_contact_first_name?.trim() || null,
        billing_contact_phone: billingForm.billing_contact_phone?.trim() || null,
        billing_contact_email: billingForm.billing_contact_email?.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("agencies")
        .update(payload)
        .eq("id", agencyId)
        .select("*")
        .single();

      if (error) throw error;

      setAgency(data);
      setBillingForm(buildInitialBillingForm(data));
      setBillingDialogOpen(false);

      toast({
        title: "Facturation mise à jour",
        description:
          "Les informations de facturation ont bien été enregistrées.",
      });
    } catch (err) {
      console.error("saveBillingDetails error:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          err?.message ||
          "Impossible d’enregistrer les informations de facturation.",
      });
    } finally {
      setSavingBilling(false);
    }
  }

  const currentPlanCode = billingStatus?.billing_plan || "free";
  const currentPlanLabel = PLAN_LABELS[currentPlanCode] || "Gratuit";
  const currentPlanPrice =
    PLAN_PRICES[currentPlanCode] || "Aucune facturation en cours";

  const statusBadge = getStatusBadge(
    billingStatus?.subscription_status,
    currentPlanCode,
    billingStatus
  );

  const startDate = billingStatus?.subscription_started_at || null;
  const renewalDate = billingStatus?.subscription_current_period_end || null;
  const createdAt = billingStatus?.created_at || null;
  const validatedAt =
    billingStatus?.validated_at ||
    billingStatus?.admin_validated_at ||
    billingStatus?.validation_date ||
    billingStatus?.validated_by_administrator_at ||
    null;

  const freeStartDate = useMemo(() => {
    if (currentPlanCode !== "free") return null;
    return startDate || createdAt || null;
  }, [currentPlanCode, startDate, createdAt]);

  const hasActiveAgencyPlan = useMemo(() => {
    return AVAILABLE_PLANS.includes(currentPlanCode);
  }, [currentPlanCode]);

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Card className="border-brand-blue/20 shadow-md bg-gradient-to-br from-white to-blue-50/40">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-blue-900">
                Votre offre actuelle
              </CardTitle>
              <CardDescription>
                Gérez l’abonnement agence et les informations de facturation.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-blue-100 p-3">
              <ShieldCheck className="h-7 w-7 text-brand-blue" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="text-2xl font-bold text-blue-900">
                  {currentPlanLabel}
                </div>

                <Badge variant="outline" className={statusBadge.className}>
                  {statusBadge.label}
                </Badge>
              </div>

              <div className="text-sm text-muted-foreground">
                {hasActiveAgencyPlan
                  ? currentPlanPrice
                  : "Passez à une offre agence pour débloquer la gestion avancée."}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border bg-white p-4">
              <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                Offre utilisée
              </div>
              <div className="font-semibold text-slate-900">
                {currentPlanLabel}
              </div>
            </div>

            <div className="rounded-xl border bg-white p-4">
              <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                Date de création du compte
              </div>
              <div className="font-semibold text-slate-900">
                {formatDate(createdAt)}
              </div>
            </div>

            <div className="rounded-xl border bg-white p-4">
              <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <UserCheck className="h-4 w-4" />
                Validation administrateur
              </div>
              <div className="font-semibold text-slate-900">
                {billingStatus?.is_validated_by_administrator
                  ? formatDate(validatedAt)
                  : "Non validé"}
              </div>
            </div>

            <div className="rounded-xl border bg-white p-4">
              <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <Gift className="h-4 w-4" />
                Début de la gratuité
              </div>
              <div className="font-semibold text-slate-900">
                {formatDate(freeStartDate)}
              </div>
            </div>
          </div>

          {hasActiveAgencyPlan && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border bg-white p-4">
                <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                  Début d’abonnement
                </div>
                <div className="font-semibold text-slate-900">
                  {formatDate(startDate)}
                </div>
              </div>

              <div className="rounded-xl border bg-white p-4">
                <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                  Prochaine échéance
                </div>
                <div className="font-semibold text-slate-900">
                  {formatDate(renewalDate)}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl border bg-white p-4">
            <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
              Comptes créés
            </div>
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <Users className="h-4 w-4 text-brand-blue" />
              {accountsCreated}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Zap className="h-5 w-5 text-brand-orange" />
              Changer d’offre
            </CardTitle>
            <CardDescription>
              3 offres agence sont disponibles.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {AVAILABLE_PLANS.map((planCode) => {
              const isCurrentPlan = currentPlanCode === planCode;

              return (
                <div
                  key={planCode}
                  className={`flex flex-col gap-4 rounded-xl border p-4 md:flex-row md:items-center md:justify-between ${
                    isCurrentPlan
                      ? "border-brand-blue bg-blue-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">
                        {PLAN_LABELS[planCode]}
                      </span>
                      {isCurrentPlan && (
                        <Badge
                          variant="outline"
                          className="border-blue-200 bg-blue-100 text-blue-800"
                        >
                          Offre actuelle
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {PLAN_PRICES[planCode]}
                    </div>
                  </div>

                  <Button
                    onClick={() => startCheckout(planCode)}
                    disabled={checkoutLoading === planCode}
                    variant={isCurrentPlan ? "outline" : "default"}
                    className={
                      !isCurrentPlan ? "bg-brand-blue hover:bg-blue-700" : ""
                    }
                  >
                    {checkoutLoading === planCode ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Redirection...
                      </>
                    ) : isCurrentPlan ? (
                      "Choisir à nouveau"
                    ) : (
                      "Choisir cette offre"
                    )}
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <CreditCard className="h-5 w-5 text-brand-blue" />
              Facturation
            </CardTitle>
            <CardDescription>
              Coordonnées administratives de l’agence et accès au portail Stripe.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-3 rounded-xl border bg-slate-50 p-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Entité
                </div>
                <div className="font-medium">
                  {agency?.billing_entity || agency?.name || "—"}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Adresse de facturation
                </div>
                <div className="whitespace-pre-line font-medium">
                  {[
                    agency?.billing_address_line_1,
                    agency?.billing_address_line_2,
                    [agency?.billing_postal_code, agency?.billing_city]
                      .filter(Boolean)
                      .join(" "),
                    agency?.billing_country,
                  ]
                    .filter(Boolean)
                    .join("\n") || "—"}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Interlocuteur facturation
                </div>
                <div className="font-medium">
                  {[
                    agency?.billing_contact_first_name,
                    agency?.billing_contact_last_name,
                  ]
                    .filter(Boolean)
                    .join(" ") || "—"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {[agency?.billing_contact_phone, agency?.billing_contact_email]
                    .filter(Boolean)
                    .join(" • ") || "—"}
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 sm:flex-row">
            <Dialog open={billingDialogOpen} onOpenChange={setBillingDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:flex-1">
                  Modifier les coordonnées
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Informations de facturation</DialogTitle>
                  <DialogDescription>
                    Renseignez les éléments administratifs utilisés pour la
                    facturation.
                  </DialogDescription>
                </DialogHeader>

                <div className="max-h-[70vh] space-y-6 overflow-y-auto py-2 pr-1">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <Building2 className="h-4 w-4" />
                      Entité
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="billing_entity">Entité</Label>
                      <Input
                        id="billing_entity"
                        value={billingForm.billing_entity}
                        onChange={(e) =>
                          setBillingForm((prev) => ({
                            ...prev,
                            billing_entity: e.target.value,
                          }))
                        }
                        placeholder="Nom de l’agence ou de la société"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <CalendarDays className="h-4 w-4" />
                      Adresse de facturation
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="billing_address_line_1">Adresse</Label>
                      <Input
                        id="billing_address_line_1"
                        value={billingForm.billing_address_line_1}
                        onChange={(e) =>
                          setBillingForm((prev) => ({
                            ...prev,
                            billing_address_line_1: e.target.value,
                          }))
                        }
                        placeholder="Adresse"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="billing_address_line_2">
                        Complément d’adresse
                      </Label>
                      <Textarea
                        id="billing_address_line_2"
                        value={billingForm.billing_address_line_2}
                        onChange={(e) =>
                          setBillingForm((prev) => ({
                            ...prev,
                            billing_address_line_2: e.target.value,
                          }))
                        }
                        placeholder="Bâtiment, étage, complément..."
                        rows={3}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="billing_postal_code">Code postal</Label>
                        <Input
                          id="billing_postal_code"
                          value={billingForm.billing_postal_code}
                          onChange={(e) =>
                            setBillingForm((prev) => ({
                              ...prev,
                              billing_postal_code: e.target.value,
                            }))
                          }
                          placeholder="75008"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="billing_city">Ville</Label>
                        <Input
                          id="billing_city"
                          value={billingForm.billing_city}
                          onChange={(e) =>
                            setBillingForm((prev) => ({
                              ...prev,
                              billing_city: e.target.value,
                            }))
                          }
                          placeholder="Paris"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="billing_country">Pays</Label>
                      <Input
                        id="billing_country"
                        value={billingForm.billing_country}
                        onChange={(e) =>
                          setBillingForm((prev) => ({
                            ...prev,
                            billing_country: e.target.value,
                          }))
                        }
                        placeholder="France"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <Users className="h-4 w-4" />
                      Interlocuteur en charge de la facturation
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="billing_contact_last_name">Nom</Label>
                        <Input
                          id="billing_contact_last_name"
                          value={billingForm.billing_contact_last_name}
                          onChange={(e) =>
                            setBillingForm((prev) => ({
                              ...prev,
                              billing_contact_last_name: e.target.value,
                            }))
                          }
                          placeholder="Dupont"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="billing_contact_first_name">Prénom</Label>
                        <Input
                          id="billing_contact_first_name"
                          value={billingForm.billing_contact_first_name}
                          onChange={(e) =>
                            setBillingForm((prev) => ({
                              ...prev,
                              billing_contact_first_name: e.target.value,
                            }))
                          }
                          placeholder="Marie"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="billing_contact_phone">
                          N° de téléphone
                        </Label>
                        <Input
                          id="billing_contact_phone"
                          value={billingForm.billing_contact_phone}
                          onChange={(e) =>
                            setBillingForm((prev) => ({
                              ...prev,
                              billing_contact_phone: e.target.value,
                            }))
                          }
                          placeholder="06 12 34 56 78"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="billing_contact_email">Email</Label>
                        <Input
                          id="billing_contact_email"
                          type="email"
                          value={billingForm.billing_contact_email}
                          onChange={(e) =>
                            setBillingForm((prev) => ({
                              ...prev,
                              billing_contact_email: e.target.value,
                            }))
                          }
                          placeholder="facturation@agence.fr"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setBillingDialogOpen(false)}
                    disabled={savingBilling}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={saveBillingDetails}
                    disabled={savingBilling}
                    className="bg-brand-blue hover:bg-blue-700"
                  >
                    {savingBilling ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Enregistrer
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              className="w-full bg-brand-blue hover:bg-blue-700 sm:flex-1"
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
                  Portail Stripe
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card className="border-amber-200 bg-amber-50/40">
        <CardHeader>
          <div className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
            <CardTitle className="text-lg">À noter</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-slate-700">
          Le bouton <strong>Modifier les coordonnées</strong> enregistre les
          informations administratives de l’agence. Le bouton{" "}
          <strong>Portail Stripe</strong> ouvre l’espace sécurisé Stripe pour
          gérer la carte bancaire, les factures et l’abonnement.
        </CardContent>
      </Card>
    </div>
  );
}