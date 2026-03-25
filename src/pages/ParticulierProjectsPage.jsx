// src/pages/ParticulierProjectsPage.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "../../lib/customSupabaseClient";

import { useToast } from "@/components/ui/use-toast";
import { Loader2, PlusCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import DashboardProjectCard from "@/components/particulier/DashboardProjectCard";
import NewProjectFormParticulier from "@/components/project/NewProjectFormParticulier";

const PENDING_PROJECT_KEY = "pending_particulier_project";

/* ----------------------------- Helpers localStorage ----------------------------- */
function safeReadPendingProject() {
  try {
    const raw = localStorage.getItem(PENDING_PROJECT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.type_projet || !["achat", "vente"].includes(parsed.type_projet)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function normalizeConnectionStatus(connections = []) {
  const approvedCount = connections.filter(
    (c) => String(c.status || "").toLowerCase() === "approved"
  ).length;

  const pendingCount = connections.filter(
    (c) => String(c.status || "").toLowerCase() !== "approved"
  ).length;

  if (approvedCount > 0) {
    return {
      connectionStatus: "approved",
      connectionCount: connections.length,
      approvedCount,
      pendingCount,
    };
  }

  if (connections.length > 0) {
    return {
      connectionStatus: "pending",
      connectionCount: connections.length,
      approvedCount: 0,
      pendingCount,
    };
  }

  return {
    connectionStatus: "none",
    connectionCount: 0,
    approvedCount: 0,
    pendingCount: 0,
  };
}

/* ----------------------------- Error Boundary ----------------------------- */
class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ParticulierProjectsPage error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto px-4 py-10">
          <h1 className="mb-2 text-2xl font-semibold">Une erreur est survenue</h1>
          <pre className="overflow-auto rounded border border-red-200 bg-red-50 p-4 text-red-700">
            {String(this.state.error?.message || this.state.error)}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

/* ----------------------------- Utils draft flow ----------------------------- */
function parseDraftErrorMessage(error) {
  const msg = (error?.message || "").toString();
  const details = (error?.details || "").toString();
  const hint = (error?.hint || "").toString();
  const full = [msg, details, hint].filter(Boolean).join(" | ");

  if (full.toLowerCase().includes("not authenticated") || full.includes("NOT_AUTHENTICATED")) {
    return {
      title: "Connexion requise",
      description: "Votre session n’est pas active. Reconnectez-vous puis revenez sur le lien.",
      debug: full,
    };
  }

  if (full.includes("DRAFT_EMAIL_MISMATCH")) {
    return {
      title: "Email différent",
      description:
        "Vous êtes connecté avec un email différent. Connectez-vous avec le bon compte, puis réessayez.",
      debug: full,
    };
  }

  if (full.includes("Draft introuvable") || full.includes("DRAFT_NOT_FOUND")) {
    return {
      title: "Brouillon introuvable",
      description: "Nous ne retrouvons pas le brouillon associé à ce lien.",
      debug: full,
    };
  }

  if (full.includes("Type projet") || full.includes("PROJECT_TYPE")) {
    return {
      title: "Projet incomplet",
      description: "Le brouillon est incomplet. Merci de recréer votre projet.",
      debug: full,
    };
  }

  if (full.includes("violates foreign key") || full.includes("particuliers")) {
    return {
      title: "Compte en cours d'initialisation",
      description: "Votre compte n’est pas encore prêt. Réessayez dans quelques secondes.",
      debug: full,
    };
  }

  return {
    title: "Finalisation impossible",
    description:
      "Votre compte est créé, mais nous n’avons pas pu finaliser le projet. Réessayez dans un instant.",
    debug: full || "unknown_error",
  };
}

async function waitForSessionUserId({ timeoutMs = 8000, stepMs = 150 } = {}) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const { data } = await supabase.auth.getSession();
    const uid = data?.session?.user?.id || null;
    if (uid) return uid;
    await new Promise((r) => setTimeout(r, stepMs));
  }

  return null;
}

/* ----------------------------- Page principale ----------------------------- */
const ParticulierProjectsPageInner = ({ particulierId = null }) => {
  const { user } = useAuth() || {};
  const { toast } = useToast();

  const location = useLocation();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const [pendingLocalProject, setPendingLocalProject] = useState(null);
  const [importingPending, setImportingPending] = useState(false);

  const [finalizingDraft, setFinalizingDraft] = useState(false);
  const [draftFinalized, setDraftFinalized] = useState(false);
  const [draftDebugMessage, setDraftDebugMessage] = useState("");

  const draftFinalizeOnceRef = useRef(false);
  const mountedRef = useRef(true);

  const actorUserId = user?.id || null;
  const targetParticulierId = particulierId || user?.id || null;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const draftId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("draft");
  }, [location.search]);

  const cleanDraftQueryParam = useCallback(() => {
    const params = new URLSearchParams(location.search);
    params.delete("draft");
    const nextSearch = params.toString();

    navigate(
      { pathname: location.pathname, search: nextSearch ? `?${nextSearch}` : "" },
      { replace: true }
    );
  }, [location.pathname, location.search, navigate]);

  const fetchProjects = useCallback(async () => {
    if (!targetParticulierId) {
      if (!mountedRef.current) return;
      setProjects([]);
      setLoading(false);
      return;
    }

    if (!mountedRef.current) return;
    setLoading(true);

    try {
      const buyingQuery = supabase
        .from("buying_projects_particulier")
        .select("*")
        .eq("particulier_id", targetParticulierId)
        .order("created_at", { ascending: false });

      const sellingQuery = supabase
        .from("selling_projects_particulier")
        .select("*")
        .eq("particulier_id", targetParticulierId)
        .order("created_at", { ascending: false });

      const connectionsQuery = supabase
        .from("connections_enriched_safe")
        .select("id, status, derived_project_id, particulier_id, created_at")
        .eq("particulier_id", targetParticulierId);

      const [
        { data: buyingData, error: buyingError },
        { data: sellingData, error: sellingError },
        { data: connectionsData, error: connectionsError },
      ] = await Promise.all([buyingQuery, sellingQuery, connectionsQuery]);

      if (buyingError) throw buyingError;
      if (sellingError) throw sellingError;
      if (connectionsError) throw connectionsError;

      const combined = [
        ...(buyingData || []).map((p) => ({
          ...p,
          type_projet: "achat",
          source: "particulier",
          particulier_id: p.particulier_id,
        })),
        ...(sellingData || []).map((p) => ({
          ...p,
          type_projet: "vente",
          source: "particulier",
          particulier_id: p.particulier_id,
        })),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      const connections = connectionsData || [];

      const enrichedProjects = combined.map((project) => {
        const relatedConnections = connections.filter(
          (c) => String(c.derived_project_id) === String(project.id)
        );

        return {
          ...project,
          relatedConnections,
          ...normalizeConnectionStatus(relatedConnections),
        };
      });

      if (!mountedRef.current) return;
      setProjects(enrichedProjects);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger vos projets.",
      });
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
    }
  }, [targetParticulierId, toast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  /* ----------------------------- Draft finalize flow ----------------------------- */
  useEffect(() => {
    if (!draftId) return;
    if (finalizingDraft) return;
    if (draftFinalized) return;
    if (draftFinalizeOnceRef.current) return;

    draftFinalizeOnceRef.current = true;

    const run = async () => {
      setFinalizingDraft(true);
      setDraftDebugMessage("");

      try {
        const sessionUserId = await waitForSessionUserId({ timeoutMs: 9000, stepMs: 150 });

        if (!sessionUserId) {
          toast({
            variant: "destructive",
            title: "Connexion requise",
            description:
              "Votre session n’est pas encore active. Réessayez dans quelques secondes, ou reconnectez-vous.",
          });
          cleanDraftQueryParam();
          return;
        }

        const { error: initErr } = await supabase.rpc("init_particulier_account");
        if (initErr) {
          console.error("[ParticulierProjectsPage] init_particulier_account error:", initErr);
          const parsed = parseDraftErrorMessage(initErr);
          setDraftDebugMessage(parsed.debug);
          toast({ variant: "destructive", title: parsed.title, description: parsed.description });
          cleanDraftQueryParam();
          return;
        }

        const { data: projectId, error: finErr } = await supabase.rpc(
          "finalize_particulier_draft",
          { p_draft_id: draftId }
        );

        if (finErr) {
          console.error("[ParticulierProjectsPage] finalize_particulier_draft error:", finErr);

          const parsed = parseDraftErrorMessage(finErr);
          const isDev = typeof import.meta !== "undefined" && import.meta.env?.DEV;

          setDraftDebugMessage(parsed.debug);
          toast({
            variant: "destructive",
            title: parsed.title,
            description: isDev ? parsed.debug : parsed.description,
          });

          cleanDraftQueryParam();
          return;
        }

        console.log("[Draft finalized] projectId =", projectId);

        setDraftFinalized(true);

        toast({
          title: "C’est enregistré ✅",
          description: "Votre projet est maintenant rattaché à votre compte.",
        });

        cleanDraftQueryParam();
        await fetchProjects();

        try {
          localStorage.removeItem(PENDING_PROJECT_KEY);
        } catch {}

        setPendingLocalProject(null);
      } finally {
        setFinalizingDraft(false);
      }
    };

    run();
  }, [draftId, finalizingDraft, draftFinalized, toast, cleanDraftQueryParam, fetchProjects]);

  /* ----------------------------- Old localStorage fallback ----------------------------- */
  useEffect(() => {
    const pending = safeReadPendingProject();
    if (pending) setPendingLocalProject(pending);
  }, []);

  useEffect(() => {
    if (projects.length > 0 && pendingLocalProject) {
      try {
        localStorage.removeItem(PENDING_PROJECT_KEY);
      } catch {}
      setPendingLocalProject(null);
    }
  }, [projects, pendingLocalProject]);

  useEffect(() => {
    if (draftId) return;
    if (!actorUserId) return;
    if (!targetParticulierId) return;
    if (!pendingLocalProject) return;
    if (projects.length > 0) return;
    if (importingPending) return;

    const run = async () => {
      setImportingPending(true);

      try {
        const { error: initErr } = await supabase.rpc("init_particulier_account");
        if (initErr) {
          console.error("[ParticulierProjectsPage] init_particulier_account (fallback) error:", initErr);
          toast({
            variant: "destructive",
            title: "Compte en cours d'initialisation",
            description: "Votre compte n’est pas encore prêt. Réessayez dans quelques secondes.",
          });
          return;
        }

        const stored = pendingLocalProject;
        const type = stored.type_projet === "vente" ? "vente" : "achat";
        const tableName =
          type === "achat" ? "buying_projects_particulier" : "selling_projects_particulier";

        const payload = {
          ...stored,
          particulier_id: targetParticulierId,
          user_id: actorUserId,
          type_projet: type,
          client_nonce: `local_${actorUserId}_${Date.now()}`,
        };

        delete payload.id;
        delete payload.created_at;
        delete payload.updated_at;

        const { error } = await supabase.from(tableName).insert(payload);
        if (error) {
          console.error("Erreur lors de l’import du projet en attente:", error);
          toast({
            variant: "destructive",
            title: "Erreur de sauvegarde",
            description:
              (error?.message || "") +
              " | Nous n'avons pas pu rattacher automatiquement votre projet. Vous pouvez le recréer depuis cette page.",
          });
          return;
        }

        try {
          localStorage.removeItem(PENDING_PROJECT_KEY);
        } catch {}

        setPendingLocalProject(null);

        toast({
          title: "Projet sauvegardé !",
          description: "Votre projet a bien été rattaché à votre compte.",
        });

        await fetchProjects();
      } finally {
        setImportingPending(false);
      }
    };

    run();
  }, [
    draftId,
    actorUserId,
    targetParticulierId,
    pendingLocalProject,
    projects.length,
    importingPending,
    toast,
    fetchProjects,
  ]);

  /* ----------------------------- CRUD UI ----------------------------- */
  const openCreate = () => {
    setEditingProject(null);
    setIsFormOpen(true);
  };

  const startEdit = (project) => {
    setEditingProject(project);
    setIsFormOpen(true);
  };

  const handleFormSuccess = (message) => {
    toast({ title: "Succès", description: message });
    setIsFormOpen(false);
    setEditingProject(null);
    fetchProjects();
  };

  const sanitizeVisibilityForParticulier = (data) => ({
    ...data,
    visibility_inter_agent: false,
    visibility_showcase: false,
  });

  const handleDuplicate = async (project) => {
    const { id, created_at, updated_at, source, relatedConnections, ...newProjectData } = project;
    const sanitized = sanitizeVisibilityForParticulier(newProjectData);

    sanitized.title = `${project.title || project.project_title || "Projet"} (Copie)`;
    sanitized.status = "active";
    sanitized.particulier_id = targetParticulierId;
    sanitized.user_id = actorUserId;

    delete sanitized.connectionStatus;
    delete sanitized.connectionCount;
    delete sanitized.pendingCount;
    delete sanitized.approvedCount;

    const tableName =
      project.type_projet === "achat" ? "buying_projects_particulier" : "selling_projects_particulier";

    const { error } = await supabase.from(tableName).insert(sanitized);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: (error?.message || "") + " | La duplication a échoué.",
      });
      console.error("Duplication error:", error);
    } else {
      toast({ title: "Succès", description: "Projet dupliqué." });
      fetchProjects();
    }
  };

  const handleDelete = async (project) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")) return;

    const tableName =
      project.type_projet === "achat" ? "buying_projects_particulier" : "selling_projects_particulier";

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq("id", project.id)
      .eq("particulier_id", targetParticulierId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: (error?.message || "") + " | La suppression a échoué.",
      });
    } else {
      toast({ title: "Succès", description: "Projet supprimé." });
      fetchProjects();
    }
  };

  const handleToggleStatus = async (project) => {
    const tableName =
      project.type_projet === "achat" ? "buying_projects_particulier" : "selling_projects_particulier";

    const newStatus = project.status === "suspended" ? "active" : "suspended";

    const { error } = await supabase
      .from(tableName)
      .update({ status: newStatus })
      .eq("id", project.id)
      .eq("particulier_id", targetParticulierId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: (error?.message || "") + " | Le changement de statut a échoué.",
      });
    } else {
      toast({
        title: "Succès",
        description: `Projet ${newStatus === "suspended" ? "suspendu" : "activé"}.`,
      });
      fetchProjects();
    }
  };

  const { buyingProjects, sellingProjects } = useMemo(
    () => ({
      buyingProjects: projects.filter((p) => p.type_projet === "achat"),
      sellingProjects: projects.filter((p) => p.type_projet === "vente"),
    }),
    [projects]
  );

  const formInitialData = useMemo(() => {
    if (editingProject) {
      return {
        ...editingProject,
        particulier_id: targetParticulierId,
        user_id: actorUserId,
      };
    }

    return {
      particulier_id: targetParticulierId,
      user_id: actorUserId,
    };
  }, [editingProject, targetParticulierId, actorUserId]);

  if (!actorUserId || !targetParticulierId) {
    return (
      <div className="container mx-auto px-4 py-10">
        <Loader2 className="mr-2 inline h-6 w-6 animate-spin" />
        Chargement de votre compte…
      </div>
    );
  }

  const PageTitle = () => (
    <div className="mb-8 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-brand-blue">Mes Projets</h1>
        <Button onClick={openCreate} disabled={finalizingDraft}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter un projet
        </Button>
      </div>

      {draftId && (
        <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          {finalizingDraft ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Finalisation de votre projet en cours…
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-700" />
              Finalisation effectuée. Chargement de vos projets…
            </>
          )}
        </div>
      )}

      {!!draftDebugMessage && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
          <div className="mb-1 font-semibold">Détail technique</div>
          <div className="break-words font-mono">{draftDebugMessage}</div>
        </div>
      )}

      {!draftId && pendingLocalProject && projects.length === 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Nous avons bien enregistré votre projet et sommes en train de le rattacher à votre compte.
          Il apparaîtra ici automatiquement. Si ce n’est pas le cas, vous pourrez le recréer.
        </div>
      )}
    </div>
  );

  const ProjectList = ({ title, projects: list }) => (
    <div>
      <h2 className="mb-4 text-2xl font-semibold text-gray-800">{title}</h2>

      {list.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {list.map((p) => (
            <DashboardProjectCard
              key={p.id}
              project={p}
              type={p.type_projet}
              connectionStatus={p.connectionStatus}
              connectionCount={p.connectionCount}
              pendingCount={p.pendingCount}
              approvedCount={p.approvedCount}
              onEdit={() => startEdit(p)}
              onDuplicate={() => handleDuplicate(p)}
              onToggleStatus={() => handleToggleStatus(p)}
              onDelete={() => handleDelete(p)}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">Aucun projet à afficher.</p>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-10">
      <SEO
        title="Mes Projets (Particulier)"
        description="Gérez vos projets d'achat et de vente côté particulier."
      />

      <PageTitle />

      {loading ? (
        <div className="flex justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-brand-blue" />
        </div>
      ) : (
        <div className="space-y-8">
          <ProjectList title="Biens recherchés" projects={buyingProjects} />
          <ProjectList title="Biens en vente" projects={sellingProjects} />
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? "Modifier le projet" : "Nouveau projet"}
            </DialogTitle>
            <DialogDescription>
              {editingProject
                ? "Mettez à jour les détails de votre projet."
                : "Ajoutez un nouveau projet en tant que particulier."}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[70vh] overflow-y-auto py-4 pr-2">
            <NewProjectFormParticulier
              key={editingProject?.id || "new"}
              initial={formInitialData}
              isEdit={!!editingProject}
              projectId={editingProject?.id}
              onBeforeSubmit={(payload) => sanitizeVisibilityForParticulier(payload)}
              onCreated={() => handleFormSuccess("Projet créé avec succès.")}
              onUpdated={() => handleFormSuccess("Projet mis à jour avec succès.")}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ParticulierProjectsPage = (props) => (
  <PageErrorBoundary>
    <ParticulierProjectsPageInner {...props} />
  </PageErrorBoundary>
);

export default ParticulierProjectsPage;