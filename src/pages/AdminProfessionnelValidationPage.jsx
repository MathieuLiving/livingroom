// src/pages/admin/AdminProfessionnelValidationPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Loader2, RefreshCw, Search, ShieldCheck, Gift, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import SEO from "@/components/SEO";
import { supabase } from "@/lib/customSupabaseClient";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

const fmtDate = (d) => {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("fr-FR");
  } catch {
    return "-";
  }
};

const planLabel = (effectivePlan) => {
  const p = (effectivePlan || "free").toLowerCase();
  return p === "premium" ? "Premium" : "Gratuit";
};

const planVariant = (effectivePlan) => {
  const p = (effectivePlan || "free").toLowerCase();
  return p === "premium" ? "default" : "outline";
};

export default function AdminProfessionnelValidationPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading, profileLoading, isAdmin } = useAuth();

  const [rows, setRows] = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingIds, setUpdatingIds] = useState(() => new Set());

  const setUpdating = (id, value) => {
    setUpdatingIds((prev) => {
      const next = new Set(prev);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const fetchProfessionnels = useCallback(async () => {
    setLoadingPage(true);

    // ✅ IMPORTANT : PAS D'EMBED "professionnels!inner(...)" !!!
    // Tout doit venir de la vue professionnels_billing_status
    const { data, error } = await supabase
      .from("professionnels_billing_status")
      .select(`
        professionnel_id,
        created_at,
        updated_at,
        first_name,
        last_name,
        email,
        company_name,
        agency_id,
        agency_name,
        agency_role,
        agency_kind,
        is_validated_by_administrator,
        effective_plan,
        is_comped,
        comped_until_at,
        subscription_started_at,
        subscription_current_period_end,
        subscription_status,
        premium_reason
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[AdminValidation] SELECT error:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de charger les professionnels.",
      });
      setRows([]);
    } else {
      setRows(data || []);
    }

    setLoadingPage(false);
  }, [toast]);

  useEffect(() => {
    if (loading || profileLoading) return;

    if (!user) {
      navigate("/connexion", { replace: true });
      return;
    }

    if (!isAdmin) {
      toast({
        variant: "destructive",
        title: "Accès non autorisé",
        description: "Cette page est réservée aux administrateurs.",
      });
      navigate("/", { replace: true });
      return;
    }

    fetchProfessionnels();
  }, [loading, profileLoading, user, isAdmin, navigate, toast, fetchProfessionnels]);

  // ✅ Validation binaire : on écrit UNIQUEMENT dans professionnels.is_validated_by_administrator
  const setValidated = useCallback(
    async (proId, value) => {
      if (!proId) return;
      if (updatingIds.has(proId)) return;

      const before = rows.find((p) => p.professionnel_id === proId) || null;

      setUpdating(proId, true);
      setRows((prev) =>
        prev.map((p) =>
          p.professionnel_id === proId
            ? { ...p, is_validated_by_administrator: !!value }
            : p
        )
      );

      try {
        const { error } = await supabase
          .from("professionnels")
          .update({ is_validated_by_administrator: !!value })
          .eq("id", proId);

        if (error) throw error;

        toast({
          title: "Succès",
          description: `Validation admin mise à jour (${value ? "Oui" : "Non"}).`,
        });

        // refresh pour refléter toute logique future (si un trigger évolue)
        await fetchProfessionnels();
      } catch (err) {
        console.error("[AdminValidation] UPDATE validated error:", err);
        if (before) {
          setRows((prev) =>
            prev.map((p) => (p.professionnel_id === proId ? before : p))
          );
        }
        toast({
          variant: "destructive",
          title: "Erreur",
          description: err?.message || "La mise à jour a échoué.",
        });
      } finally {
        setUpdating(proId, false);
      }
    },
    [rows, toast, updatingIds, fetchProfessionnels]
  );

  const grantComped = useCallback(
    async (proId, months) => {
      if (!proId) return;
      if (updatingIds.has(proId)) return;

      const before = rows.find((p) => p.professionnel_id === proId) || null;

      setUpdating(proId, true);
      setRows((prev) =>
        prev.map((p) =>
          p.professionnel_id === proId ? { ...p, is_comped: true } : p
        )
      );

      try {
        const { error } = await supabase.rpc("admin_grant_comped_premium", {
          p_professionnel_id: proId,
          p_months: months,
        });

        if (error) throw error;

        toast({
          title: "Offre appliquée",
          description: `Abonnement premium offert ${months} mois.`,
        });

        await fetchProfessionnels();
      } catch (err) {
        console.error("[AdminValidation] RPC comped error:", err);
        if (before) {
          setRows((prev) =>
            prev.map((p) => (p.professionnel_id === proId ? before : p))
          );
        }
        toast({
          variant: "destructive",
          title: "Erreur",
          description: err?.message || "Impossible d'offrir l'abonnement.",
        });
      } finally {
        setUpdating(proId, false);
      }
    },
    [rows, toast, updatingIds, fetchProfessionnels]
  );

  const revokeComped = useCallback(
    async (proId) => {
      if (!proId) return;
      if (updatingIds.has(proId)) return;

      const before = rows.find((p) => p.professionnel_id === proId) || null;

      setUpdating(proId, true);
      setRows((prev) =>
        prev.map((p) =>
          p.professionnel_id === proId
            ? { ...p, is_comped: false, comped_until_at: null }
            : p
        )
      );

      try {
        // ⚠️ si tu veux retirer proprement l'offre : on agit sur pro_subscriptions (source de vérité)
        const { error } = await supabase
          .from("pro_subscriptions")
          .update({ is_comped: false, comped_until_at: null })
          .eq("professionnel_id", proId);

        if (error) throw error;

        toast({ title: "Offre retirée", description: "L'abonnement offert a été retiré." });
        await fetchProfessionnels();
      } catch (err) {
        console.error("[AdminValidation] revoke comped error:", err);
        if (before) {
          setRows((prev) =>
            prev.map((p) => (p.professionnel_id === proId ? before : p))
          );
        }
        toast({
          variant: "destructive",
          title: "Erreur",
          description: err?.message || "Impossible de retirer l'abonnement offert.",
        });
      } finally {
        setUpdating(proId, false);
      }
    },
    [rows, toast, updatingIds, fetchProfessionnels]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((p) => {
      const hay = `${p.email ?? ""} ${p.first_name ?? ""} ${p.last_name ?? ""} ${p.company_name ?? ""} ${p.agency_name ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, searchQuery]);

  if (loading || profileLoading || loadingPage) {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-brand-blue" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="container mx-auto px-4 py-10">
      <SEO
        title="Gestion des Professionnels"
        description="Validation binaire + suivi plan effectif + offre d’abonnement."
      />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-brand-blue flex items-center gap-3">
          <ShieldCheck className="h-8 w-8" />
          Gestion des Professionnels
        </h1>
        <p className="text-base text-gray-700 max-w-4xl mt-2">
          Validation binaire (Oui/Non) + suivi du <span className="font-semibold">plan effectif</span> + offre d’abonnement (1 / 3 / 6 mois).
        </p>
      </motion.div>

      <div className="mb-6 flex gap-4 items-center">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Rechercher par nom, email, société..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Button variant="outline" onClick={fetchProfessionnels} disabled={loadingPage}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loadingPage ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[22%]">Professionnel</TableHead>
                <TableHead className="w-[18%]">Agence</TableHead>
                <TableHead className="w-[12%]">Validé admin</TableHead>
                <TableHead className="w-[10%]">Plan</TableHead>
                <TableHead className="w-[18%]">Abonnement offert</TableHead>
                <TableHead className="w-[10%]">Création</TableHead>
                <TableHead className="w-[10%]">Début abo</TableHead>
                <TableHead className="w-[10%]">Fin abo</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.length > 0 ? (
                filtered.map((pro) => {
                  const proId = pro.professionnel_id;
                  const isUpdating = updatingIds.has(proId);

                  const displayName =
                    pro.company_name?.trim() ||
                    `${pro.first_name ?? ""} ${pro.last_name ?? ""}`.trim() ||
                    "—";

                  const agencyLabel =
                    pro.agency_name?.trim() ||
                    (pro.agency_id ? "Agence" : "Indépendant");

                  const startDate = pro.subscription_started_at || null;
                  const endDate = pro.comped_until_at || pro.subscription_current_period_end || null;

                  return (
                    <TableRow key={proId} className={isUpdating ? "opacity-70" : ""}>
                      {/* Professionnel */}
                      <TableCell>
                        <div className="font-medium">{displayName}</div>
                        <div className="text-sm text-muted-foreground">{pro.email || "-"}</div>
                        <div className="text-[11px] text-gray-400">ID: {String(proId).slice(0, 8)}…</div>
                      </TableCell>

                      {/* Agence */}
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="font-medium">{agencyLabel}</div>
                          <div className="text-xs text-muted-foreground">
                            {pro.agency_id ? `agency_id: ${String(pro.agency_id).slice(0, 8)}…` : "—"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Rôle : {pro.agency_role || "—"} {pro.agency_kind ? `(${pro.agency_kind})` : ""}
                          </div>
                        </div>
                      </TableCell>

                      {/* Validé admin (binaire) */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Badge variant={pro.is_validated_by_administrator ? "default" : "secondary"} className="text-xs">
                            {pro.is_validated_by_administrator ? "Oui" : "Non"}
                          </Badge>

                          <Switch
                            checked={!!pro.is_validated_by_administrator}
                            disabled={isUpdating}
                            onCheckedChange={(checked) => setValidated(proId, checked)}
                          />

                          {isUpdating && (
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              MAJ…
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Plan */}
                      <TableCell>
                        <Badge variant={planVariant(pro.effective_plan)} className="text-xs">
                          {planLabel(pro.effective_plan)}
                        </Badge>
                        <div className="text-[11px] text-muted-foreground mt-1">
                          {pro.premium_reason ? `Raison: ${pro.premium_reason}` : ""}
                        </div>
                      </TableCell>

                      {/* Abonnement offert */}
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={pro.is_comped ? "secondary" : "outline"} className="text-xs">
                              {pro.is_comped ? "Offert" : "Non offert"}
                            </Badge>
                            {pro.comped_until_at && (
                              <span className="text-xs text-muted-foreground">
                                jusqu’au {fmtDate(pro.comped_until_at)}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" disabled={isUpdating} onClick={() => grantComped(proId, 1)}>
                              <Gift className="h-4 w-4 mr-2" />
                              Offrir 1 mois
                            </Button>

                            <Button variant="outline" size="sm" disabled={isUpdating} onClick={() => grantComped(proId, 3)}>
                              <Gift className="h-4 w-4 mr-2" />
                              Offrir 3 mois
                            </Button>

                            <Button variant="outline" size="sm" disabled={isUpdating} onClick={() => grantComped(proId, 6)}>
                              <Gift className="h-4 w-4 mr-2" />
                              Offrir 6 mois
                            </Button>

                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={isUpdating || !pro.is_comped}
                              onClick={() => revokeComped(proId)}
                              title="Retirer l'abonnement offert"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Retirer
                            </Button>
                          </div>

                          <p className="text-[11px] text-muted-foreground">
                            Le plan effectif passe en Premium tant que l’offre est active (ou si abonnement Stripe actif).
                          </p>
                        </div>
                      </TableCell>

                      {/* Création */}
                      <TableCell className="text-sm">{fmtDate(pro.created_at)}</TableCell>

                      {/* Début abo */}
                      <TableCell className="text-sm">{fmtDate(startDate)}</TableCell>

                      {/* Fin abo */}
                      <TableCell className="text-sm">{fmtDate(endDate)}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    Aucun professionnel trouvé.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </motion.div>
    </div>
  );
}