// src/pages/AdminConnectionsViewPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users, Paperclip } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/lib/customSupabaseClient";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import ProjectDetailsModal from "@/components/modals/ProjectDetailsModal";

/* ------------------------------ Helpers ------------------------------ */
function parseSnapshot(snap) {
  if (!snap) return null;
  try {
    if (typeof snap === "string") return JSON.parse(snap);
    if (typeof snap === "object") return snap;
    return null;
  } catch {
    return null;
  }
}
function formatNumberFR(n) {
  if (n == null || isNaN(Number(n))) return null;
  try {
    return new Intl.NumberFormat("fr-FR").format(Number(n));
  } catch {
    return String(n);
  }
}
function pick(obj, paths) {
  for (const p of paths) {
    const parts = p.split(".");
    let cur = obj;
    for (const part of parts) {
      if (cur && Object.prototype.hasOwnProperty.call(cur, part)) cur = cur[part];
      else {
        cur = undefined;
        break;
      }
    }
    if (cur != null && cur !== "") return cur;
  }
  return null;
}

/* ------------------------------ Ligne de tableau ------------------------------ */
const ConnectionRow = ({ connection }) => {
  const {
    requesting_first_name,
    requesting_last_name,
    requesting_email,
    target_first_name,
    target_last_name,
    target_email,
    status,
    created_at,
    project_snapshot,
    hydrated_project,
  } = connection;

  const [open, setOpen] = useState(false);

  const snapshot = useMemo(
    () => parseSnapshot(project_snapshot) || hydrated_project || null,
    [project_snapshot, hydrated_project]
  );

  const projectTitle =
    pick(snapshot, ["project_title", "title", "project.title"]) ||
    (pick(snapshot, ["type_projet"]) && pick(snapshot, ["type_bien"])
      ? `${pick(snapshot, ["type_projet"])} ${pick(snapshot, ["type_bien"])}`
      : null);

  const projectType = pick(snapshot, ["type_projet", "project.type_projet"]);
  const projectBien = pick(snapshot, ["type_bien", "project.type_bien"]);

  const prixRaw =
    pick(snapshot, ["prix_demande", "project.prix_demande"]) ??
    pick(snapshot, ["budget_max", "project.budget_max"]);
  const prix = prixRaw != null ? Number(prixRaw) : null;

  const surfaceRaw =
    pick(snapshot, ["surface", "project.surface"]) ??
    pick(snapshot, ["surface_max", "project.surface_max"]) ??
    pick(snapshot, ["surface_min", "project.surface_min"]);
  const surface = surfaceRaw != null ? Number(surfaceRaw) : null;

  const ville =
    pick(snapshot, ["location.city", "location_label", "city", "city_choice_1", "ville"]) || null;

  const quartier =
    pick(snapshot, ["location.quartier", "quartier", "quartier_choice_1"]) || null;

  const getStatusBadge = (s) => {
    switch ((s || "").toLowerCase()) {
      case "pending":
        return <Badge variant="warning">En attente</Badge>;
      case "approved":
        return <Badge variant="success">Approuvée</Badge>;
      case "rejected":
        return <Badge variant="destructive">Refusée</Badge>;
      default:
        return <Badge>{s}</Badge>;
    }
  };

  const onKeyOpen = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  };

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">
          {requesting_first_name} {requesting_last_name}
        </div>
        <div className="text-xs text-muted-foreground">{requesting_email}</div>
      </TableCell>

      <TableCell>
        <div className="font-medium">
          {target_first_name} {target_last_name}
        </div>
        <div className="text-xs text-muted-foreground">{target_email}</div>
      </TableCell>

      <TableCell>{getStatusBadge(status)}</TableCell>

      <TableCell>
        {snapshot ? (
          <div className="flex flex-col items-start gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
              <Paperclip className="h-4 w-4 mr-2" /> Voir le projet
            </Button>

            <div
              role="button"
              tabIndex={0}
              onClick={() => setOpen(true)}
              onKeyDown={onKeyOpen}
              aria-label="Ouvrir les détails du projet"
              className="border rounded-md p-2 bg-gray-50 w-full max-w-[260px] cursor-pointer hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <div className="text-xs font-medium text-brand-blue truncate">
                {projectTitle || "Projet sans titre"}
              </div>

              <div className="text-xs text-gray-700 mt-1">
                {projectType && (
                  <span className="inline-block mr-1">
                    <Badge variant="outline">{String(projectType)}</Badge>
                  </span>
                )}
                {projectBien && (
                  <span className="inline-block">
                    <Badge variant="outline">{String(projectBien)}</Badge>
                  </span>
                )}
              </div>

              {(prix != null || surface != null) && (
                <div className="text-xs text-gray-700 mt-1">
                  {prix != null && <span className="mr-2">💰 {formatNumberFR(prix)} €</span>}
                  {surface != null && <span>📐 {formatNumberFR(surface)} m²</span>}
                </div>
              )}

              {(ville || quartier) && (
                <div className="text-xs text-gray-600 mt-1 truncate">
                  📍 {ville}
                  {quartier ? ` — ${quartier}` : ""}
                </div>
              )}
            </div>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">N/A</span>
        )}

        <ProjectDetailsModal
          open={open}
          onOpenChange={setOpen}
          connection={{ project_snapshot: snapshot || null }}
        />
      </TableCell>

      <TableCell>{new Date(created_at).toLocaleDateString("fr-FR")}</TableCell>
    </TableRow>
  );
};

/* ------------------------------ Page principale ------------------------------ */
const AdminConnectionsViewPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // ✅ IMPORTANT: admin = isAdmin (pas profile.role)
  const { user, loading: authLoading, profileLoading, isAdmin } = useAuth();

  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  const [statusTab, setStatusTab] = useState("all");
  const [q, setQ] = useState("");

  const fetchConnections = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("connections_enriched_safe")
        .select(
          [
            "id",
            "created_at",
            "status",
            "requesting_first_name",
            "requesting_last_name",
            "requesting_email",
            "target_first_name",
            "target_last_name",
            "target_email",
            "project_snapshot",
            "derived_project_id",

            // UI / fallbacks
            "ui_title",
            "ui_type_projet",
            "ui_property_type",
            "ui_description",
            "ui_image_1_url",
            "ui_image_2_url",
            "ui_image_3_url",
            "ui_location",
            "ui_quartier",
            "ui_prix_demande",
            "ui_surface",
            "ui_surface_min",
            "ui_surface_max",
            "ui_budget",
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
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows = (data || []).map((r) => {
        const hasSnap = !!parseSnapshot(r.project_snapshot);
        if (hasSnap) return r;

        const hydrated_project = {
          title: r.ui_title || null,
          type_projet: r.ui_type_projet || null,
          type_bien: r.ui_property_type || null,
          description: r.ui_description || null,

          prix_demande: r.ui_prix_demande ?? null,
          budget_max: r.ui_budget ?? null,

          surface: r.ui_surface ?? null,
          surface_min: r.ui_surface_min ?? null,
          surface_max: r.ui_surface_max ?? null,
          bedrooms: r.ui_bedrooms ?? null,
          rooms_min: r.ui_rooms ?? null,

          city: r.ui_location || null,
          quartier: r.ui_quartier || null,

          image_1_url: r.ui_image_1_url || null,
          image_2_url: r.ui_image_2_url || null,
          image_3_url: r.ui_image_3_url || null,

          has_garden: r.ui_has_garden ?? null,
          has_terrace: r.ui_has_terrace ?? null,
          has_balcony: r.ui_has_balcony ?? null,
          has_pool: r.ui_has_pool ?? null,
          has_elevator: r.ui_has_elevator ?? null,
          has_cellar: r.ui_has_cellar ?? null,
          has_parking: r.ui_has_parking ?? null,
          has_caretaker: r.ui_has_caretaker ?? null,
          has_clear_view: r.ui_has_clear_view ?? null,
          is_last_floor: r.ui_is_last_floor ?? null,
        };

        return { ...r, hydrated_project };
      });

      setConnections(rows);
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger l'historique des demandes.",
      });
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

    fetchConnections();
  }, [authLoading, profileLoading, user, isAdmin, navigate, toast, fetchConnections]);

  const filtered = useMemo(() => {
    let rows = connections;

    if (statusTab !== "all") {
      rows = rows.filter((r) => (r.status || "").toLowerCase() === statusTab);
    }

    if (q) {
      const qq = q.toLowerCase().trim();
      rows = rows.filter((r) => {
        const a = `${r.requesting_first_name || ""} ${r.requesting_last_name || ""} ${r.requesting_email || ""}`.toLowerCase();
        const b = `${r.target_first_name || ""} ${r.target_last_name || ""} ${r.target_email || ""}`.toLowerCase();
        return a.includes(qq) || b.includes(qq);
      });
    }

    return rows;
  }, [connections, statusTab, q]);

  if (authLoading || profileLoading || loading) {
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
        title="Historique des Demandes"
        description="Consultez toutes les demandes de mise en relation de la plateforme."
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <h1 className="text-3xl font-bold mb-2 text-brand-blue flex items-center justify-center">
          <Users className="mr-3 h-8 w-8" /> Historique des Demandes
        </h1>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto">
          Consultez toutes les demandes de mise en relation de la plateforme.
        </p>
      </motion.div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-brand-blue">
            Liste des Demandes ({filtered.length})
          </CardTitle>

          <CardDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span>
              Cliquez sur <Paperclip className="inline h-4 w-4" /> ou sur la vignette pour
              voir le projet associé.
            </span>

            <div className="flex gap-3 items-center">
              <Tabs value={statusTab} onValueChange={setStatusTab}>
                <TabsList>
                  <TabsTrigger value="all">Toutes</TabsTrigger>
                  <TabsTrigger value="pending">En attente</TabsTrigger>
                  <TabsTrigger value="approved">Approuvées</TabsTrigger>
                  <TabsTrigger value="rejected">Refusées</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="w-64">
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Recherche (nom / email)…"
                />
              </div>
            </div>
          </CardDescription>
        </CardHeader>

        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Aucune demande trouvée.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Demandeur</TableHead>
                    <TableHead>Destinataire</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Projet associé</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((connection) => (
                    <ConnectionRow key={connection.id} connection={connection} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 text-center">
        <Button
          onClick={() => navigate("/admin/dashboard")}
          className="bg-brand-blue text-white hover:bg-opacity-90"
        >
          Retour au tableau de bord
        </Button>
      </div>
    </div>
  );
};

export default AdminConnectionsViewPage;