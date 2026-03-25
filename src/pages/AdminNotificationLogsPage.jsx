// src/pages/AdminNotificationLogsPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/customSupabaseClient";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Mail, RefreshCw, AlertCircle } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Helmet } from "react-helmet-async";

const LogRow = ({ log }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case "sent":
        return <Badge variant="success">Envoyé</Badge>;
      case "pending":
        return <Badge variant="outline">En attente</Badge>;
      case "failed":
        return <Badge variant="destructive">Échoué</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <TableRow>
      <TableCell className="text-xs">
        {new Date(log.created_at).toLocaleString("fr-FR")}
      </TableCell>
      <TableCell>{log.recipient_email}</TableCell>
      <TableCell className="max-w-xs truncate">{log.subject}</TableCell>
      <TableCell>{getStatusBadge(log.status)}</TableCell>
      <TableCell>
        {log.error_message ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center"
                  aria-label="Voir l’erreur"
                >
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-sm">{log.error_message}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          "—"
        )}
      </TableCell>
    </TableRow>
  );
};

const AdminNotificationLogsPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // ✅ IMPORTANT: admin = isAdmin (pas profile.role)
  const { user, loading: authLoading, profileLoading, isAdmin } = useAuth();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notification_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les logs de notification.",
      });
      console.error("[AdminNotificationLogs] SELECT error:", error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (authLoading || profileLoading) return;

    if (!user) {
      navigate("/connexion", { replace: true });
      return;
    }

    if (!isAdmin) {
      toast({ variant: "destructive", title: "Accès non autorisé" });
      navigate("/", { replace: true });
      return;
    }

    fetchLogs();
  }, [authLoading, profileLoading, user, isAdmin, navigate, toast, fetchLogs]);

  if (authLoading || profileLoading) {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-brand-blue" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <>
      <Helmet>
        <title>Logs des Notifications - LivingRoom.immo</title>
        <meta
          name="description"
          content="Historique des notifications par e-mail envoyées par le système."
        />
      </Helmet>

      <div className="container mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-brand-blue flex items-center">
            <Mail className="mr-3 h-8 w-8" />
            Logs des Notifications
          </h1>

          <Button onClick={fetchLogs} variant="outline" disabled={loading}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Actualiser
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historique des envois</CardTitle>
            <CardDescription>
              Voici les 100 dernières notifications par e-mail gérées par le
              système.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-brand-blue" />
              </div>
            ) : logs.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Aucun log de notification trouvé.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Destinataire</TableHead>
                      <TableHead>Sujet</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Erreur</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <LogRow key={log.id} log={log} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Button onClick={() => navigate("/admin-dashboard")} variant="default">
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    </>
  );
};

export default AdminNotificationLogsPage;