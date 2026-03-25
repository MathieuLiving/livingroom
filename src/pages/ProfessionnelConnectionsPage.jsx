import React, { useEffect, useMemo, useState, Suspense, lazy, useCallback } from "react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/lib/customSupabaseClient";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  Users,
  MessageSquare,
  Phone,
  Mail,
  Paperclip,
  Building,
  User,
  UserCheck,
  CheckCircle,
  XCircle,
  Quote,
  ShieldAlert,
} from "lucide-react";

import ProjectVignette from "@/components/project/ProjectVignette";
import { normalizeConnectionRow } from "@/lib/normalizeConnectionRow";

const ChatPage = lazy(() => import("@/pages/ChatPage"));

const StatusBadge = (s) => {
  switch ((s || "").toLowerCase()) {
    case "approved":
      return <Badge variant="success">Approuvée</Badge>;
    case "pending":
      return <Badge variant="warning">En attente</Badge>;
    case "rejected":
      return <Badge variant="destructive">Refusée</Badge>;
    case "suspended":
      return <Badge variant="destructive">Suspendue</Badge>;
    default:
      return <Badge variant="secondary">{s || "N/A"}</Badge>;
  }
};

const Cols = () => (
  <colgroup>
    <col style={{ width: "26%" }} />
    <col style={{ width: "46%" }} />
    <col style={{ width: "10%" }} />
    <col style={{ width: "10%" }} />
    <col style={{ width: "8%" }} />
  </colgroup>
);

export default function ProfessionnelConnectionsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const proUserId = user?.id || null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);

  const [proByEmail, setProByEmail] = useState({});

  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [projectToView, setProjectToView] = useState(null);

  const [requestToManage, setRequestToManage] = useState(null);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const [suspendingId, setSuspendingId] = useState(null);

  const fetchConnections = useCallback(async () => {
    if (!proUserId) {
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("connections_enriched_safe")
        .select(
          [
            "id",
            "created_at",
            "status",
            "requesting_user_id",
            "target_user_id",
            "requesting_professionnel_id",
            "target_professionnel_id",
            "first_message",

            "requesting_first_name",
            "requesting_last_name",
            "requesting_email",
            "requesting_phone",
            "requesting_company",
            "requesting_role",

            "target_first_name",
            "target_last_name",
            "target_email",
            "target_phone",
            "target_company",
            "target_role",

            "ui_title",
            "ui_type_projet",
            "ui_property_type",
            "ui_description",
            "ui_image_1_url",
            "ui_image_2_url",
            "ui_image_3_url",
            "ui_location",
            "ui_quartier",
            "ui_timeline",
            "ui_prix_demande",
            "ui_surface",
            "ui_surface_min",
            "ui_surface_max",
            "ui_budget",
            "ui_budget_max",
            "ui_rooms",
            "ui_bedrooms",
            "ui_has_garden",
            "ui_has_terrace",
            "ui_has_balcony",
            "ui_has_pool",
            "ui_has_elevator",
            "ui_has_cellar",
            "ui_has_parking",
            "ui_has_caretaker",
            "ui_has_clear_view",
            "ui_is_last_floor",
          ].join(",")
        )
        .or(`target_user_id.eq.${proUserId},requesting_user_id.eq.${proUserId}`)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("[ProfessionnelConnectionsPage] fetchConnections error:", e);
      setRows([]);
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [proUserId]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (authLoading) return;
      if (cancelled) return;
      await fetchConnections();
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, fetchConnections]);

  const normalized = useMemo(() => {
    if (!proUserId) return [];
    return (rows || []).map((r) => normalizeConnectionRow(r, proUserId)).filter(Boolean);
  }, [rows, proUserId]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const emails = new Set();

      for (const n of normalized) {
        if (!n?.other) continue;
        const willShow = Boolean(n?.showContacts);
        const otherEmail = n?.other?.email;
        const isProfessional = Boolean(n?.other?.proId);

        if (isProfessional && willShow && otherEmail) {
          emails.add(otherEmail);
        }
      }

      const list = Array.from(emails).filter(Boolean);

      if (!list.length) {
        if (mounted) setProByEmail({});
        return;
      }

      const { data, error: enrichError } = await supabase
        .from("professionnels")
        .select(
          "email,digital_card_livingroom_url,company_name,function,logo_url,professionnal_presentation"
        )
        .in("email", list);

      if (enrichError) {
        console.error("[ProfessionnelConnectionsPage] enrich pros error:", enrichError);
        if (mounted) setProByEmail({});
        return;
      }

      const map = {};
      for (const row of data || []) {
        if (!row?.email) continue;
        map[row.email] = {
          digital_card_url: row.digital_card_livingroom_url || null,
          company_name: row.company_name || null,
          function: row.function || null,
          logo_url: row.logo_url || null,
          short_bio: row.professionnal_presentation || null,
        };
      }

      if (mounted) setProByEmail(map);
    })();

    return () => {
      mounted = false;
    };
  }, [normalized]);

  const normalizedWithEnrich = useMemo(() => {
    return (normalized || []).map((n) => {
      const email = n?.other?.email || null;
      const enrich = email ? proByEmail[email] || {} : {};
      const other = n?.other || {};

      return {
        ...n,
        other: {
          ...other,
          company_name: other.company_name || enrich.company_name || null,
          function: enrich.function || null,
          logo_url: enrich.logo_url || null,
          short_bio: enrich.short_bio || null,
          digital_card_url: enrich.digital_card_url || null,
        },
      };
    });
  }, [normalized, proByEmail]);

  const received = useMemo(
    () => normalizedWithEnrich.filter((n) => n && n.isTarget),
    [normalizedWithEnrich]
  );

  const sent = useMemo(
    () => normalizedWithEnrich.filter((n) => n && !n.isTarget),
    [normalizedWithEnrich]
  );

  const activeConnection = useMemo(
    () => normalizedWithEnrich.find((n) => n && n.id === activeId) || null,
    [normalizedWithEnrich, activeId]
  );

  const openChat = (id) => {
    setActiveId(id);
    setIsChatOpen(true);
  };

  const openProject = (project) => {
    setProjectToView(project);
    setIsProjectOpen(true);
  };

  const openRequestDialog = (connectionRow) => {
    if (!connectionRow) return;
    setRequestToManage(connectionRow);
    setIsRequestDialogOpen(true);
  };

  const handleConnectionAction = async (status) => {
    if (!requestToManage?.id || !user?.id) return;

    setProcessingAction(true);

    try {
      const { error: updateError } = await supabase
        .from("connections")
        .update({ status })
        .eq("id", requestToManage.id)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setRows((prev) =>
        prev.map((r) => (r.id === requestToManage.id ? { ...r, status } : r))
      );

      toast({
        title: status === "approved" ? "Demande acceptée" : "Demande refusée",
        description:
          status === "approved"
            ? "Vous pouvez maintenant échanger avec ce contact."
            : "La demande de mise en relation a été refusée.",
        variant: status === "approved" ? "default" : "destructive",
      });

      setRequestToManage((prev) => (prev ? { ...prev, status } : prev));

      if (status === "approved") {
        setIsRequestDialogOpen(false);
      }
    } catch (err) {
      console.error("[ProfessionnelConnectionsPage] handleConnectionAction error:", err);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut de la demande.",
        variant: "destructive",
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleSuspendConnection = async (id) => {
    if (!id || !user?.id) return;

    setSuspendingId(id);

    try {
      const { error: updateError } = await supabase
        .from("connections")
        .update({ status: "suspended" })
        .eq("id", id)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "suspended" } : r))
      );

      toast({
        title: "Mise en relation suspendue",
        description:
          "Vous ne recevrez plus de messages via cette mise en relation.",
      });

      if (activeId === id) {
        setIsChatOpen(false);
        setActiveId(null);
      }
    } catch (e) {
      console.error("[ProfessionnelConnectionsPage] handleSuspendConnection error:", e);
      toast({
        title: "Erreur",
        description: "Impossible de suspendre la mise en relation pour le moment.",
        variant: "destructive",
      });
    } finally {
      setSuspendingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-500">
        Erreur de chargement des données.
      </div>
    );
  }

  const InterlocuteurCell = ({ row }) => {
    if (!row || !row.other) {
      return <div className="text-muted-foreground text-sm">Données indisponibles</div>;
    }

    const name =
      row.other.first_name || row.other.last_name
        ? `${row.other.first_name || ""} ${row.other.last_name || ""}`.trim()
        : row.other.isProfessional
        ? "Professionnel"
        : "Utilisateur";

    const isPro = Boolean(row.other?.proId);

    return (
      <div className="align-top">
        <div className="font-medium flex items-center gap-2">
          {name}
          {isPro ? (
            <Building className="h-3 w-3 text-gray-400" />
          ) : (
            <User className="h-3 w-3 text-gray-400" />
          )}
        </div>

        <div className="text-sm text-muted-foreground capitalize">
          {isPro ? "Professionnel" : "Particulier"}
        </div>

        {(row.other.company_name || row.other.function) && (
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <Building className="h-3.5 w-3.5" />
            <span>
              {row.other.company_name || "Société"}
              {row.other.function ? ` — ${row.other.function}` : ""}
            </span>
          </div>
        )}

        <div className="flex flex-col gap-1 text-sm text-muted-foreground mt-1">
          <div className="flex gap-3 flex-wrap">
            {row.showContacts && row.other.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {row.other.phone}
              </span>
            )}

            {row.showContacts && row.other.email && (
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {row.other.email}
              </span>
            )}

            {!row.showContacts && (
              <span className="text-xs italic">Coordonnées masquées</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ProjectCell = ({ row }) => (
    <div className="align-top">
      {row?.project ? (
        <>
          <button
            type="button"
            className="mb-2 inline-flex items-center gap-2 text-sm text-brand-blue hover:underline"
            onClick={() => openProject(row.project)}
            aria-label="Voir le projet"
          >
            <Paperclip className="h-4 w-4" /> Voir le projet
          </button>
          <ProjectVignette project={row.project} />
        </>
      ) : (
        <span className="text-sm text-muted-foreground">Projet indisponible</span>
      )}
    </div>
  );

  return (
    <div className="container mx-auto py-6 max-w-7xl space-y-6 px-4 sm:px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Toutes les demandes</h1>
          <p className="text-gray-500">Suivez vos demandes reçues et envoyées.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2" /> Toutes les demandes
          </CardTitle>
          <CardDescription>
            Retrouvez ici l&apos;historique de vos prises de contact.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="received">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="received">Reçues ({received.length})</TabsTrigger>
              <TabsTrigger value="sent">Envoyées ({sent.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="received">
              <div className="overflow-x-auto">
                {received.length ? (
                  <Table className="table-fixed w-full border rounded-md overflow-hidden">
                    <Cols />
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="border-r">Interlocuteur</TableHead>
                        <TableHead className="border-r">Projet concerné</TableHead>
                        <TableHead className="text-center border-r whitespace-nowrap">
                          Date
                        </TableHead>
                        <TableHead className="text-center border-r">Actions</TableHead>
                        <TableHead className="text-right">Statut</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {received.map((row) => (
                        <TableRow key={row.id} className="hover:bg-muted/20">
                          <TableCell className="border-r align-top">
                            <InterlocuteurCell row={row} />
                          </TableCell>

                          <TableCell className="border-r align-top">
                            <ProjectCell row={row} />
                          </TableCell>

                          <TableCell className="border-r text-center align-top whitespace-nowrap">
                            {row.date ? new Date(row.date).toLocaleDateString("fr-FR") : "—"}
                          </TableCell>

                          <TableCell className="border-r text-center align-top">
                            {row.status === "pending" && (
                              <Button
                                size="sm"
                                className="bg-brand-blue hover:bg-brand-blue/90 text-white whitespace-nowrap"
                                onClick={() => openRequestDialog(row)}
                              >
                                <UserCheck className="h-4 w-4 mr-1" /> Voir la demande
                              </Button>
                            )}

                            {row.status === "approved" && (
                              <div className="flex flex-col items-center gap-2">
                                <Button size="sm" onClick={() => openChat(row.id)}>
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  Discuter
                                </Button>

                                <Button
                                  size="xs"
                                  variant="outline"
                                  className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 flex items-center gap-1"
                                  onClick={() => handleSuspendConnection(row.id)}
                                  disabled={suspendingId === row.id}
                                >
                                  {suspendingId === row.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <ShieldAlert className="h-3 w-3" />
                                  )}
                                  <span>Suspendre</span>
                                </Button>
                              </div>
                            )}

                            {row.status === "suspended" && (
                              <span className="text-xs text-red-700 font-medium">
                                Mise en relation suspendue
                              </span>
                            )}

                            {row.status === "rejected" && (
                              <span className="text-xs text-muted-foreground">
                                Demande refusée
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="text-right align-top">
                            {StatusBadge(row.status)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                    <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">
                      Aucune demande reçue
                    </h3>
                    <p className="text-gray-500">
                      Vous n&apos;avez pas encore reçu de demande de mise en relation.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="sent">
              <div className="overflow-x-auto">
                {sent.length ? (
                  <Table className="table-fixed w-full border rounded-md overflow-hidden">
                    <Cols />
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="border-r">Interlocuteur</TableHead>
                        <TableHead className="border-r">Projet concerné</TableHead>
                        <TableHead className="text-center border-r whitespace-nowrap">
                          Date
                        </TableHead>
                        <TableHead className="text-center border-r">Actions</TableHead>
                        <TableHead className="text-right">Statut</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {sent.map((row) => (
                        <TableRow key={row.id} className="hover:bg-muted/20">
                          <TableCell className="border-r align-top">
                            <InterlocuteurCell row={row} />
                          </TableCell>

                          <TableCell className="border-r align-top">
                            <ProjectCell row={row} />
                          </TableCell>

                          <TableCell className="border-r text-center align-top whitespace-nowrap">
                            {row.date ? new Date(row.date).toLocaleDateString("fr-FR") : "—"}
                          </TableCell>

                          <TableCell className="border-r text-center align-top">
                            {row.status === "approved" && (
                              <div className="flex flex-col items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => openChat(row.id)}
                                  title={`Envoyé le ${new Date(row.date).toLocaleString(
                                    "fr-FR",
                                    { dateStyle: "short", timeStyle: "short" }
                                  )}`}
                                >
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  Discuter
                                </Button>

                                <Button
                                  size="xs"
                                  variant="outline"
                                  className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 flex items-center gap-1"
                                  onClick={() => handleSuspendConnection(row.id)}
                                  disabled={suspendingId === row.id}
                                >
                                  {suspendingId === row.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <ShieldAlert className="h-3 w-3" />
                                  )}
                                  <span>Suspendre</span>
                                </Button>
                              </div>
                            )}

                            {row.status === "pending" && (
                              <Button size="sm" onClick={() => openChat(row.id)}>
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Voir
                              </Button>
                            )}

                            {row.status === "suspended" && (
                              <span className="text-xs text-red-700 font-medium">
                                Mise en relation suspendue
                              </span>
                            )}

                            {row.status === "rejected" && (
                              <span className="text-xs text-muted-foreground">
                                Demande refusée
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="text-right align-top">
                            {StatusBadge(row.status)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                    <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">
                      Aucune demande envoyée
                    </h3>
                    <p className="text-gray-500">
                      Vous n&apos;avez pas encore initié de demande de mise en relation.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog
        open={isRequestDialogOpen}
        onOpenChange={(open) => {
          setIsRequestDialogOpen(open);
          if (!open) setRequestToManage(null);
        }}
      >
        <DialogContent className="max-w-4xl h-[80vh] p-0">
          {requestToManage && (
            <div className="flex flex-col h-full">
              <DialogHeader className="px-6 pt-4 pb-3 border-b">
                <DialogTitle>Demande de mise en relation</DialogTitle>
                <DialogDescription>
                  De{" "}
                  <span className="font-semibold text-gray-900">
                    {requestToManage?.other?.first_name || ""}{" "}
                    {requestToManage?.other?.last_name || "Utilisateur"}
                  </span>
                  {requestToManage?.other?.company_name && (
                    <span> ({requestToManage.other.company_name})</span>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="px-6 py-4 space-y-4 border-b bg-muted/10">
                <div className="bg-muted/60 p-4 rounded-lg border">
                  <div className="flex items-start gap-3">
                    <Quote className="h-5 w-5 text-brand-blue/40 shrink-0 mt-1" />
                    <div className="text-sm text-gray-700 leading-relaxed">
                      {requestToManage.first_message ? (
                        <span className="italic">
                          &quot;{requestToManage.first_message}&quot;
                        </span>
                      ) : (
                        <span className="text-gray-500">
                          Aucun message personnalisé joint à cette demande.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  En acceptant, vos coordonnées seront partagées avec cet utilisateur.
                  Vous pouvez déjà répondre au message ci-dessous.
                </p>

                <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 w-full sm:w-auto"
                    onClick={() => handleConnectionAction("rejected")}
                    disabled={processingAction}
                  >
                    {processingAction ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Refuser
                  </Button>

                  <Button
                    className="bg-brand-blue hover:bg-brand-blue/90 w-full sm:w-auto"
                    onClick={() => handleConnectionAction("approved")}
                    disabled={processingAction}
                  >
                    {processingAction ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Accepter la demande
                  </Button>
                </DialogFooter>
              </div>

              <div className="flex-1 min-h-0 px-6 pb-6 pt-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Échanges avec cet interlocuteur
                </h3>
                <div className="border rounded-md h-full bg-slate-50 overflow-hidden shadow-inner">
                  <Suspense
                    fallback={
                      <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
                      </div>
                    }
                  >
                    <ChatPage
                      connectionId={requestToManage.id}
                      isModal={false}
                      managedByParentUI
                      showProjectContext={false}
                    />
                  </Suspense>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isChatOpen}
        onOpenChange={(open) => {
          setIsChatOpen(open);
          if (!open) setActiveId(null);
        }}
      >
        <DialogContent className="max-w-4xl h-[85vh] p-0">
          {activeConnection && (
            <div className="flex flex-col h-full">
              {activeConnection.first_message && (
                <div className="border-b px-4 py-3 bg-muted/40 text-sm space-y-2">
                  <div className="font-medium">Message d&apos;introduction</div>
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {activeConnection.first_message}
                  </p>
                </div>
              )}

              {activeConnection.status === "suspended" ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
                  <ShieldAlert className="h-10 w-10 text-red-500" />
                  <p className="font-semibold text-gray-800">
                    Mise en relation suspendue
                  </p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Vous avez suspendu cette mise en relation pour votre sécurité.
                    Aucun nouvel échange n&apos;est possible via cette conversation.
                  </p>
                </div>
              ) : (
                <div className="flex-1 min-h-0">
                  <Suspense
                    fallback={
                      <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
                      </div>
                    }
                  >
                    <ChatPage
                      connectionId={activeConnection.id}
                      isModal
                      managedByParentUI
                      closeModal={() => {
                        setIsChatOpen(false);
                        setActiveId(null);
                      }}
                      onConnectionUpdate={() => {
                        setIsChatOpen(false);
                        setActiveId(null);
                        fetchConnections();
                      }}
                      showProjectContext={false}
                    />
                  </Suspense>
                </div>
              )}

              {activeConnection.status === "approved" && (
                <div className="border-t px-4 py-2 flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 flex items-center gap-1"
                    onClick={() => handleSuspendConnection(activeConnection.id)}
                    disabled={suspendingId === activeConnection.id}
                  >
                    {suspendingId === activeConnection.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <ShieldAlert className="h-3 w-3" />
                    )}
                    <span>Suspendre la mise en relation</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isProjectOpen}
        onOpenChange={(open) => {
          setIsProjectOpen(open);
          if (!open) setProjectToView(null);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {projectToView && (
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-xl font-semibold text-brand-blue mb-1">
                  Détails du projet
                </h2>
                <div className="flex gap-2 mt-2">
                  {projectToView.type_projet && (
                    <Badge variant="secondary" className="capitalize">
                      {projectToView.type_projet}
                    </Badge>
                  )}
                  {projectToView.property_type && (
                    <Badge variant="outline">{projectToView.property_type}</Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  {projectToView.prix_demande ? (
                    <div className="flex justify-between border-b border-dashed pb-2">
                      <span className="text-gray-500">Prix demandé</span>
                      <span className="font-medium">
                        {Intl.NumberFormat("fr-FR").format(projectToView.prix_demande)} €
                      </span>
                    </div>
                  ) : projectToView.budget_max ? (
                    <div className="flex justify-between border-b border-dashed pb-2">
                      <span className="text-gray-500">Budget max</span>
                      <span className="font-medium">
                        {Intl.NumberFormat("fr-FR").format(projectToView.budget_max)} €
                      </span>
                    </div>
                  ) : null}

                  {projectToView.location_label && (
                    <div className="flex justify-between border-b border-dashed pb-2">
                      <span className="text-gray-500">Localisation</span>
                      <span className="font-medium text-right">
                        {projectToView.location_label}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {projectToView.surface && (
                    <div className="flex justify-between border-b border-dashed pb-2">
                      <span className="text-gray-500">Surface</span>
                      <span className="font-medium">{projectToView.surface} m²</span>
                    </div>
                  )}
                  {projectToView.bedrooms != null && (
                    <div className="flex justify-between border-b border-dashed pb-2">
                      <span className="text-gray-500">Chambres</span>
                      <span className="font-medium">{projectToView.bedrooms}</span>
                    </div>
                  )}
                  {projectToView.deadline_label && (
                    <div className="flex justify-between border-b border-dashed pb-2">
                      <span className="text-gray-500">Délai</span>
                      <span className="font-medium">{projectToView.deadline_label}</span>
                    </div>
                  )}
                </div>
              </div>

              {projectToView.description && (
                <div className="bg-slate-50 p-4 rounded-md">
                  <div className="text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                    {projectToView.description}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}