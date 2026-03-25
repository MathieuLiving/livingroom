// src/pages/AdminProjectsViewPage.jsx
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
import { Eye, Loader2, Briefcase, Globe, Users, Smartphone, FilterX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/lib/customSupabaseClient";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

/* ---------------------------------------------------------------------- */
/*  Helpers & Components                                                  */
/* ---------------------------------------------------------------------- */

const ChannelBadges = ({ project }) => {
  return (
    <div className="flex gap-1 flex-wrap">
      {project.visibility_public && (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200"
          title="Place des projets"
        >
          <Globe className="h-3 w-3 mr-1" /> Public
        </Badge>
      )}
      {project.visibility_inter_agent && (
        <Badge
          variant="outline"
          className="bg-purple-50 text-purple-700 border-purple-200"
          title="Marché Inter-Pro"
        >
          <Users className="h-3 w-3 mr-1" /> Pro
        </Badge>
      )}
      {project.visibility_showcase && (
        <Badge
          variant="outline"
          className="bg-orange-50 text-orange-700 border-orange-200"
          title="Carte de visite digitale"
        >
          <Smartphone className="h-3 w-3 mr-1" /> CVD
        </Badge>
      )}
      {!project.visibility_public &&
        !project.visibility_inter_agent &&
        !project.visibility_showcase && (
          <span className="text-xs text-slate-400 italic">Aucune diffusion</span>
        )}
    </div>
  );
};

const ProjectRow = ({ project, onShowDetails }) => {
  const isBuying = project.project_type === "achat";
  const owner = project.owner;
  const ownerType = project.owner_type;
  const isActive = project.status === "active";

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">
          {owner?.first_name} {owner?.last_name}
        </div>
        <div className="text-xs text-muted-foreground">{owner?.email}</div>
      </TableCell>
      <TableCell>
        <Badge variant={ownerType === "Professionnel" ? "secondary" : "outline"}>
          {ownerType}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge
          className={
            isBuying
              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200"
              : "bg-rose-100 text-rose-800 hover:bg-rose-200 border-rose-200"
          }
          variant="outline"
        >
          {isBuying ? "Achat" : "Vente"}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={isActive ? "success" : "secondary"}>
          {isActive ? "Actif" : project.status || "Inactif"}
        </Badge>
      </TableCell>
      <TableCell>
        <ChannelBadges project={project} />
      </TableCell>
      <TableCell className="max-w-[150px] truncate" title={project.type_bien}>
        {project.type_bien}
      </TableCell>
      <TableCell
        className="max-w-[150px] truncate"
        title={project.city_choice_1 || project.city}
      >
        {project.city_choice_1 || project.city || "N/A"}
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm" onClick={() => onShowDetails(project)}>
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

const Filters = ({ filters, setFilters, resetFilters, users }) => {
  const displayedUsers = users.filter((u) => {
    if (filters.ownerType === "all") return true;
    const targetRole =
      filters.ownerType === "Professionnel" ? "professionnel" : "particulier";
    return u.role === targetRole;
  });

  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm mb-6 space-y-4 md:space-y-0 md:flex md:items-end md:gap-4 flex-wrap">
      {/* Owner Type */}
      <div className="space-y-2 w-full md:w-40">
        <Label className="text-xs font-semibold text-muted-foreground">
          Type de compte
        </Label>
        <Select
          value={filters.ownerType}
          onValueChange={(val) =>
            setFilters((prev) => ({
              ...prev,
              ownerType: val,
              specificUserId: "all",
            }))
          }
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Tous" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="Particulier">Particulier</SelectItem>
            <SelectItem value="Professionnel">Professionnel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Specific User */}
      <div className="space-y-2 w-full md:w-56">
        <Label className="text-xs font-semibold text-muted-foreground">
          Utilisateur spécifique
        </Label>
        <Select
          value={filters.specificUserId}
          onValueChange={(val) =>
            setFilters((prev) => ({ ...prev, specificUserId: val }))
          }
          disabled={displayedUsers.length === 0}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Tous les utilisateurs" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value="all">Tous les utilisateurs</SelectItem>
            {displayedUsers.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.first_name} {u.last_name} (
                {u.role === "professionnel" ? "Pro" : "Part"})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Transaction Type */}
      <div className="space-y-2 w-full md:w-40">
        <Label className="text-xs font-semibold text-muted-foreground">
          Type de transaction
        </Label>
        <Select
          value={filters.transactionType}
          onValueChange={(val) =>
            setFilters((prev) => ({ ...prev, transactionType: val }))
          }
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Tous" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="achat">Achat</SelectItem>
            <SelectItem value="vente">Vente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status */}
      <div className="space-y-2 w-full md:w-40">
        <Label className="text-xs font-semibold text-muted-foreground">
          Statut
        </Label>
        <Select
          value={filters.status}
          onValueChange={(val) => setFilters((prev) => ({ ...prev, status: val }))}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Tous" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="active">Actif</SelectItem>
            <SelectItem value="inactive">Inactif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Channels */}
      <div className="space-y-2 flex-grow min-w-[200px]">
        <Label className="text-xs font-semibold text-muted-foreground block mb-2">
          Canaux de diffusion
        </Label>
        <div className="flex flex-wrap gap-4 pt-1">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="chan-public"
              checked={!!filters.channels.public}
              onCheckedChange={(checked) =>
                setFilters((prev) => ({
                  ...prev,
                  channels: { ...prev.channels, public: !!checked },
                }))
              }
            />
            <Label htmlFor="chan-public" className="text-sm font-normal cursor-pointer">
              Place des projets
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="chan-inter"
              checked={!!filters.channels.inter}
              onCheckedChange={(checked) =>
                setFilters((prev) => ({
                  ...prev,
                  channels: { ...prev.channels, inter: !!checked },
                }))
              }
            />
            <Label htmlFor="chan-inter" className="text-sm font-normal cursor-pointer">
              Inter-Pro
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="chan-showcase"
              checked={!!filters.channels.showcase}
              onCheckedChange={(checked) =>
                setFilters((prev) => ({
                  ...prev,
                  channels: { ...prev.channels, showcase: !!checked },
                }))
              }
            />
            <Label
              htmlFor="chan-showcase"
              className="text-sm font-normal cursor-pointer"
            >
              CVD
            </Label>
          </div>
        </div>
      </div>

      {/* Reset */}
      <div className="pb-0.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="text-muted-foreground hover:text-destructive"
        >
          <FilterX className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------------- */
/*  Detail Dialog                                                         */
/* ---------------------------------------------------------------------- */

const ProjectDetailDialog = ({ project, open, onOpenChange }) => {
  if (!project) return null;

  const owner = project.owner;
  const isBuying = project.project_type === "achat";
  const nf = new Intl.NumberFormat("fr-FR");

  const budget = isBuying
    ? project.budget_max
      ? nf.format(project.budget_max) + " €"
      : "Non spécifié"
    : project.prix_demande
      ? nf.format(project.prix_demande) + " €"
      : "Non spécifié";

  const surface = isBuying
    ? `${project.surface_min || 0} - ${project.surface_max || "∞"} m²`
    : `${project.surface || "?"} m²`;

  const rooms = isBuying
    ? `Min ${project.bedrooms_min || 0} ch.`
    : `${project.bedrooms || "?"} ch.`;

  const images = [project.image_1_url, project.image_2_url, project.image_3_url].filter(Boolean);

  const features = [
    { label: "Jardin", val: project.has_garden },
    { label: "Terrasse", val: project.has_terrace },
    { label: "Balcon", val: project.has_balcony },
    { label: "Piscine", val: project.has_pool },
    { label: "Ascenseur", val: project.has_elevator },
    { label: "Cave", val: project.has_cellar },
    { label: "Parking", val: project.has_parking },
    { label: "Gardien", val: project.has_caretaker },
    { label: "Vue dégagée", val: project.has_clear_view },
    { label: "Dernier étage", val: project.is_last_floor },
  ]
    .filter((f) => f.val)
    .map((f) => f.label);

  const locations = [
    { city: project.city_choice_1 || project.city, q: project.quartier_choice_1 },
    { city: project.city_choice_2, q: project.quartier_choice_2 },
    { city: project.city_choice_3, q: project.quartier_choice_3 },
    { city: project.city_choice_4, q: project.quartier_choice_4 },
    { city: project.city_choice_5, q: project.quartier_choice_5 },
  ]
    .filter((l) => l.city)
    .map((l, i) => (
      <div key={i}>
        📍 {l.city} {l.q ? `(${l.q})` : ""}
      </div>
    ));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Détails du Projet : {project.title || project.project_title || "Sans titre"}
          </DialogTitle>
          <DialogDescription>ID: {project.id}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="border rounded-lg p-4 bg-slate-50">
            <h3 className="text-sm font-semibold mb-2 text-slate-700 uppercase tracking-wider">
              Propriétaire
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">Nom:</span> {owner?.first_name}{" "}
                {owner?.last_name}
              </div>
              <div>
                <span className="font-medium">Email:</span> {owner?.email}
              </div>
              <div>
                <span className="font-medium">Type:</span> {project.owner_type}
              </div>
              {owner?.company_name && (
                <div>
                  <span className="font-medium">Société:</span> {owner.company_name}
                </div>
              )}
              {owner?.phone && (
                <div>
                  <span className="font-medium">Tél:</span> {owner.phone}
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-2 text-slate-700 uppercase tracking-wider">
                Général
              </h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Type:</span>{" "}
                  <Badge>{isBuying ? "Achat" : "Vente"}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Bien:</span>{" "}
                  <span className="font-medium capitalize">{project.type_bien}</span>
                </div>
                <div className="flex justify-between">
                  <span>Statut:</span>{" "}
                  <Badge variant="outline">{project.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Délai:</span>{" "}
                  <span>{project.delai || "Non spécifié"}</span>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-2 text-slate-700 uppercase tracking-wider">
                Critères
              </h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Budget/Prix:</span>{" "}
                  <span className="font-bold">{budget}</span>
                </div>
                <div className="flex justify-between">
                  <span>Surface:</span> <span>{surface}</span>
                </div>
                <div className="flex justify-between">
                  <span>Chambres:</span> <span>{rooms}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-2 text-slate-700 uppercase tracking-wider">
              Localisation(s)
            </h3>
            <div className="grid sm:grid-cols-2 gap-2 text-sm">
              {locations.length > 0 ? (
                locations
              ) : (
                <span className="text-muted-foreground italic">
                  Aucune localisation renseignée
                </span>
              )}
            </div>
          </div>

          {features.length > 0 && (
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-2 text-slate-700 uppercase tracking-wider">
                Atouts
              </h3>
              <div className="flex flex-wrap gap-2">
                {features.map((f) => (
                  <Badge key={f} variant="secondary">
                    {f}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {project.description && (
            <div className="border rounded-lg p-4 bg-slate-50">
              <h3 className="text-sm font-semibold mb-2 text-slate-700 uppercase tracking-wider">
                Description
              </h3>
              <p className="text-sm whitespace-pre-wrap text-slate-700">
                {project.description}
              </p>
            </div>
          )}

          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-2 text-slate-700 uppercase tracking-wider">
              Diffusion
            </h3>
            <ChannelBadges project={project} />
          </div>

          {images.length > 0 && (
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-2 text-slate-700 uppercase tracking-wider">
                Photos
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {images.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="block aspect-video bg-gray-100 rounded overflow-hidden hover:opacity-90 transition-opacity"
                  >
                    <img
                      src={url}
                      alt={`Projet ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ---------------------------------------------------------------------- */
/*  Main Page Component                                                   */
/* ---------------------------------------------------------------------- */

const AdminProjectsViewPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // ✅ IMPORTANT: admin = isAdmin (pas profile.role)
  const { user, loading: authLoading, profileLoading, isAdmin } = useAuth();

  const [allProjects, setAllProjects] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [filters, setFilters] = useState({
    ownerType: "all",
    transactionType: "all",
    status: "all",
    specificUserId: "all",
    channels: { public: false, inter: false, showcase: false },
  });

  const resetFilters = () => {
    setFilters({
      ownerType: "all",
      transactionType: "all",
      status: "all",
      specificUserId: "all",
      channels: { public: false, inter: false, showcase: false },
    });
  };

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const [bpPart, spPart, bpPro, spPro] = await Promise.all([
        supabase
          .from("buying_projects_particulier")
          .select(
            "*, owner:particuliers!buying_projects_particulier_particulier_id_fkey(id,first_name,last_name,email)"
          ),
        supabase
          .from("selling_projects_particulier")
          .select(
            "*, owner:particuliers!selling_projects_particulier_particulier_id_fkey(id,first_name,last_name,email)"
          ),
        supabase
          .from("buying_projects_professionnel")
          .select("*, owner:professionnels(id,first_name,last_name,email)"),
        supabase
          .from("selling_projects_professionnel")
          .select("*, owner:professionnels(id,first_name,last_name,email)"),
      ]);

      const errors = [bpPart.error, spPart.error, bpPro.error, spPro.error].filter(Boolean);
      if (errors.length > 0) {
        throw new Error(errors.map((e) => e.message).join(", "));
      }

      const norm = (rows, isBuying, isPro) =>
        (rows.data ?? []).map((p) => ({
          ...p,
          project_type: isBuying ? "achat" : "vente",
          owner: p.owner,
          owner_type: isPro ? "Professionnel" : "Particulier",
        }));

      const all = [
        ...norm(bpPart, true, false),
        ...norm(spPart, false, false),
        ...norm(bpPro, true, true),
        ...norm(spPro, false, true),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setAllProjects(all);

      // Users list for filter
      const usersMap = new Map();
      all.forEach((p) => {
        if (p.owner && p.owner.id) {
          if (!usersMap.has(p.owner.id)) {
            usersMap.set(p.owner.id, {
              id: p.owner.id,
              first_name: p.owner.first_name || "Inconnu",
              last_name: p.owner.last_name || "",
              role: p.owner_type === "Professionnel" ? "professionnel" : "particulier",
            });
          }
        }
      });

      const usersList = Array.from(usersMap.values()).sort((a, b) =>
        (a.first_name + a.last_name).localeCompare(b.first_name + b.last_name)
      );
      setAllUsers(usersList);
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: e?.message || "Impossible de charger les projets.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // Attendre auth + identité admin
    if (authLoading || profileLoading) return;

    // Pas connecté -> connexion
    if (!user) {
      navigate("/connexion", { replace: true });
      return;
    }

    // Pas admin -> home
    if (!isAdmin) {
      toast({ variant: "destructive", title: "Accès non autorisé" });
      navigate("/", { replace: true });
      return;
    }

    fetchProjects();
  }, [authLoading, profileLoading, user, isAdmin, navigate, toast, fetchProjects]);

  const filteredProjects = useMemo(() => {
    return allProjects.filter((p) => {
      if (filters.ownerType !== "all" && p.owner_type !== filters.ownerType) return false;
      if (filters.transactionType !== "all" && p.project_type !== filters.transactionType) return false;

      const isActive = p.status === "active";
      if (filters.status === "active" && !isActive) return false;
      if (filters.status === "inactive" && isActive) return false;

      if (filters.specificUserId !== "all" && p.owner?.id !== filters.specificUserId) return false;

      const hasChannelFilter =
        filters.channels.public || filters.channels.inter || filters.channels.showcase;
      if (hasChannelFilter) {
        const matchesPublic = filters.channels.public && p.visibility_public;
        const matchesInter = filters.channels.inter && p.visibility_inter_agent;
        const matchesShowcase = filters.channels.showcase && p.visibility_showcase;
        if (!matchesPublic && !matchesInter && !matchesShowcase) return false;
      }

      return true;
    });
  }, [allProjects, filters]);

  const handleShowProjectDetails = (project) => {
    setSelectedProject(project);
    setDetailOpen(true);
  };

  if (authLoading || profileLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-brand-blue" />
      </div>
    );
  }

  // Redirection déjà faite, on évite un flash
  if (!isAdmin) return null;

  return (
    <div className="container mx-auto px-4 py-10">
      <SEO
        title="Vue d'Ensemble des Projets"
        description="Consultez tous les projets de la plateforme."
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <h1 className="text-3xl font-bold mb-2 text-brand-blue flex items-center justify-center">
          <Briefcase className="mr-3 h-8 w-8" /> Vue d'Ensemble des Projets
        </h1>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto">
          Consultez et filtrez tous les projets de la plateforme.
        </p>
      </motion.div>

      <Filters
        filters={filters}
        setFilters={setFilters}
        resetFilters={resetFilters}
        users={allUsers}
      />

      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-brand-blue">Liste des Projets</CardTitle>
              <CardDescription>
                {filteredProjects.length} résultat(s) sur {allProjects.length} projets au total.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredProjects.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Aucun projet ne correspond à vos filtres.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Compte</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Canaux</TableHead>
                    <TableHead>Bien</TableHead>
                    <TableHead>Ville</TableHead>
                    <TableHead className="text-right">Détails</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <ProjectRow
                      key={`${project.project_type}-${project.id}`}
                      project={project}
                      onShowDetails={handleShowProjectDetails}
                    />
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

      <ProjectDetailDialog
        project={selectedProject}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
};

export default AdminProjectsViewPage;