import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "../../../lib/customSupabaseClient";
import { useToast } from "@/components/ui/use-toast";
import { useAgencyPermissions } from "@/hooks/useAgencyPermissions";
import {
  Loader2,
  RefreshCw,
  Star,
  StarOff,
  ExternalLink,
  AlertCircle,
  Building2,
  Users,
  Search,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FEATURED_SCOPE_AGENCY = "agency";
const FEATURED_SCOPE_TEAM = "team";
const MAX_FEATURED = 10;

const ACTIVE_PROJECT_STATUSES = new Set(["active", "published", "open"]);

const normalize = (v) => String(v || "").trim().toLowerCase();

const formatDate = (value) => {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "—";
  }
};

const formatCount = (n) =>
  new Intl.NumberFormat("fr-FR").format(Number(n || 0));

function buildProjectKey(projectKind, projectId) {
  return `${projectKind}:${projectId}`;
}

function buildDisplayName(row) {
  return (
    String(row?.professionnel_full_name || "").trim() ||
    "Professionnel inconnu"
  );
}

function buildTeamName(row) {
  return String(row?.team_leader_full_name || "").trim() || "Sans équipe";
}

function isProjectActive(row) {
  return ACTIVE_PROJECT_STATUSES.has(normalize(row?.status));
}

function statusBadgeVariant(status) {
  const s = normalize(status);
  if (s === "active" || s === "published" || s === "open") return "default";
  if (s === "suspended" || s === "paused") return "secondary";
  if (
    s === "deleted" ||
    s === "archived" ||
    s === "closed" ||
    s === "inactive"
  ) {
    return "destructive";
  }
  return "outline";
}

function featuredTypeToProjectKind(value) {
  const v = normalize(value);
  if (v === "selling" || v === "vente") return "selling";
  return "buying";
}

function rowTypeToProjectKind(row) {
  return normalize(row?.type_projet) === "vente" ? "selling" : "buying";
}

/**
 * Pour la table legacy featured_projects
 * => ENUM attendu : buying / selling
 */
function rowTypeToLegacyFeaturedType(row) {
  return normalize(row?.type_projet) === "vente" ? "selling" : "buying";
}

/**
 * Pour la table featured_projects_professionnel
 * => texte attendu : achat / vente
 */
function rowTypeToProfessionalFeaturedType(row) {
  return normalize(row?.type_projet) === "vente" ? "vente" : "achat";
}

function toLegacyFeaturedScope(scope) {
  return scope === FEATURED_SCOPE_TEAM ? "team" : "agency";
}

function toProfessionalScopeType(scope) {
  return scope === FEATURED_SCOPE_TEAM ? "team" : "agency_director";
}

function toOriginRole({ isDirector, isTeamLeader }) {
  if (isDirector) return "director";
  if (isTeamLeader) return "team_leader";
  return "independent";
}

async function fetchTargetProfessionnels({
  agencyId,
  myProId,
  isDirector,
  isTeamLeader,
}) {
  if (!agencyId || !myProId) return [];

  if (isDirector) {
    const { data, error } = await supabase
      .from("professionnels")
      .select(
        "id, agency_id, agency_role, is_active, is_archived, validation_status, team_leader_pro_id"
      )
      .eq("agency_id", agencyId)
      .eq("is_active", true)
      .or("is_archived.is.null,is_archived.eq.false");

    if (error) throw error;

    return Array.from(
      new Map((Array.isArray(data) ? data : []).map((item) => [item.id, item]))
        .values()
    );
  }

  if (isTeamLeader) {
    const { data, error } = await supabase
      .from("professionnels")
      .select(
        "id, agency_id, agency_role, is_active, is_archived, validation_status, team_leader_pro_id"
      )
      .eq("agency_id", agencyId)
      .eq("is_active", true)
      .or("is_archived.is.null,is_archived.eq.false")
      .or(`id.eq.${myProId},team_leader_pro_id.eq.${myProId}`);

    if (error) throw error;

    return Array.from(
      new Map((Array.isArray(data) ? data : []).map((item) => [item.id, item]))
        .values()
    );
  }

  return [];
}

async function syncProfessionalFeaturedRows({
  sourceProfessionnelId,
  targetProfessionnelIds,
  row,
  currentScope,
  isDirector,
  isTeamLeader,
  activate,
}) {
  if (
    !sourceProfessionnelId ||
    !Array.isArray(targetProfessionnelIds) ||
    !targetProfessionnelIds.length
  ) {
    return;
  }

  const projectType = rowTypeToProfessionalFeaturedType(row); // achat / vente
  const projectId = row?.project_id;
  const scopeType = toProfessionalScopeType(currentScope);
  const originRole = toOriginRole({ isDirector, isTeamLeader });

  if (!projectId) return;

  if (activate) {
    const payload = targetProfessionnelIds.map((targetId) => ({
      project_type: projectType,
      project_id: projectId,
      source_professionnel_id: sourceProfessionnelId,
      target_professionnel_id: targetId,
      scope_type: scopeType,
      origin_role: originRole,
      is_active: true,
    }));

    const { error } = await supabase
      .from("featured_projects_professionnel")
      .upsert(payload, {
        onConflict:
          "project_type,project_id,target_professionnel_id,scope_type",
      });

    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from("featured_projects_professionnel")
    .update({
      is_active: false,
    })
    .eq("project_type", projectType)
    .eq("project_id", projectId)
    .eq("scope_type", scopeType)
    .in("target_professionnel_id", targetProfessionnelIds);

  if (error) throw error;
}

export default function AgencyProjectsPilotPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const {
    loading: permissionsLoading,
    isDirector,
    isTeamLeader,
    agency,
    professionnel,
    error: permissionsError,
  } = useAgencyPermissions();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [featuredRows, setFeaturedRows] = useState([]);
  const [actionKey, setActionKey] = useState(null);

  const [projectTab, setProjectTab] = useState("achat");
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [proFilter, setProFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const agencyId = agency?.id || professionnel?.agency_id || null;
  const myProId = professionnel?.id || null;

  const currentScope = isDirector
    ? FEATURED_SCOPE_AGENCY
    : FEATURED_SCOPE_TEAM;

  const fetchAll = useCallback(async () => {
    if (!agencyId || !myProId || (!isDirector && !isTeamLeader)) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      let projectsQuery = supabase
        .from("agency_projects_pilot_v1")
        .select("*")
        .eq("agency_id", agencyId)
        .order("updated_at", { ascending: false });

      if (isTeamLeader) {
        projectsQuery = projectsQuery.or(
          `team_leader_id.eq.${myProId},professionnel_id.eq.${myProId}`
        );
      }

      const featuredQuery = supabase
        .from("featured_projects")
        .select("*")
        .eq("agency_id", agencyId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      const [
        { data: projectsData, error: projectsError },
        { data: featuredData, error: featuredError },
      ] = await Promise.all([projectsQuery, featuredQuery]);

      if (projectsError) throw projectsError;
      if (featuredError) throw featuredError;

      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setFeaturedRows(Array.isArray(featuredData) ? featuredData : []);
    } catch (err) {
      console.error("[AgencyProjectsPilotPage] fetchAll error:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          err?.message || "Impossible de charger les projets agence.",
      });
    } finally {
      setLoading(false);
    }
  }, [agencyId, myProId, isDirector, isTeamLeader, toast]);

  useEffect(() => {
    if (authLoading || permissionsLoading) return;
    fetchAll();
  }, [authLoading, permissionsLoading, fetchAll]);

  const featuredAgency = useMemo(
    () =>
      featuredRows.filter(
        (row) =>
          normalize(row?.scope) === FEATURED_SCOPE_AGENCY &&
          !row?.team_leader_id
      ),
    [featuredRows]
  );

  const featuredTeam = useMemo(
    () =>
      featuredRows.filter(
        (row) =>
          normalize(row?.scope) === FEATURED_SCOPE_TEAM &&
          String(row?.team_leader_id || "") === String(myProId || "")
      ),
    [featuredRows, myProId]
  );

  const featuredForCurrentScope = useMemo(() => {
    return currentScope === FEATURED_SCOPE_AGENCY
      ? featuredAgency
      : featuredTeam;
  }, [currentScope, featuredAgency, featuredTeam]);

  const featuredCurrentMap = useMemo(() => {
    const map = new Map();

    featuredForCurrentScope.forEach((row) => {
      const projectKind = featuredTypeToProjectKind(row?.project_type);
      const projectId =
        projectKind === "selling"
          ? row?.selling_project_id
          : row?.buying_project_id;

      if (projectId) {
        map.set(buildProjectKey(projectKind, projectId), row);
      }
    });

    return map;
  }, [featuredForCurrentScope]);

  const featuredAgencyMap = useMemo(() => {
    const map = new Map();

    featuredAgency.forEach((row) => {
      const projectKind = featuredTypeToProjectKind(row?.project_type);
      const projectId =
        projectKind === "selling"
          ? row?.selling_project_id
          : row?.buying_project_id;

      if (projectId) {
        map.set(buildProjectKey(projectKind, projectId), row);
      }
    });

    return map;
  }, [featuredAgency]);

  const options = useMemo(() => {
    const rows = Array.isArray(projects) ? projects : [];
    const uniq = (arr) =>
      [...new Set(arr.filter(Boolean))].sort((a, b) =>
        String(a).localeCompare(String(b), "fr")
      );

    return {
      cities: uniq(rows.map((r) => r.city)),
      pros: uniq(rows.map((r) => buildDisplayName(r))),
      teams: uniq(rows.map((r) => buildTeamName(r))),
      statuses: uniq(rows.map((r) => r.status)),
    };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const q = normalize(search);

    return projects.filter((row) => {
      const isBuying = normalize(row?.type_projet) === "achat";
      const isSelling = normalize(row?.type_projet) === "vente";

      if (projectTab === "achat" && !isBuying) return false;
      if (projectTab === "vente" && !isSelling) return false;

      if (cityFilter !== "all" && String(row?.city || "") !== cityFilter) {
        return false;
      }
      if (proFilter !== "all" && buildDisplayName(row) !== proFilter) {
        return false;
      }
      if (teamFilter !== "all" && buildTeamName(row) !== teamFilter) {
        return false;
      }
      if (
        statusFilter !== "all" &&
        String(row?.status || "") !== statusFilter
      ) {
        return false;
      }

      if (!q) return true;

      const haystack = [
        row?.project_title,
        row?.city,
        row?.property_type,
        row?.budget_label,
        buildDisplayName(row),
        buildTeamName(row),
        row?.status,
      ]
        .map((v) => String(v || ""))
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [
    projects,
    projectTab,
    cityFilter,
    proFilter,
    teamFilter,
    statusFilter,
    search,
  ]);

  const summary = useMemo(() => {
    const rows = filteredProjects;
    const byPro = new Map();
    const byTeam = new Map();

    rows.forEach((row) => {
      const proName = buildDisplayName(row);
      const teamName = buildTeamName(row);

      byPro.set(proName, (byPro.get(proName) || 0) + 1);
      byTeam.set(teamName, (byTeam.get(teamName) || 0) + 1);
    });

    return {
      total: rows.length,
      featuredCurrentCount: featuredForCurrentScope.length,
      byPro: [...byPro.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8),
      byTeam: [...byTeam.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8),
    };
  }, [filteredProjects, featuredForCurrentScope.length]);

  const toggleFeatured = useCallback(
    async (row) => {
      if (!agencyId || !myProId || !user?.id) return;

      const projectKind = rowTypeToProjectKind(row);
      const key = buildProjectKey(projectKind, row.project_id);
      const existing = featuredCurrentMap.get(key);

      if (!isProjectActive(row)) {
        toast({
          variant: "destructive",
          title: "Projet non éligible",
          description: "Seuls les projets actifs peuvent être mis à la une.",
        });
        return;
      }

      setActionKey(key);

      try {
        const targets = await fetchTargetProfessionnels({
          agencyId,
          myProId,
          isDirector,
          isTeamLeader,
        });

        const targetIds = targets.map((item) => item.id).filter(Boolean);

        if (!targetIds.length) {
          throw new Error(
            "Aucun professionnel cible trouvé pour propager cette sélection."
          );
        }

        if (existing?.id) {
          const { error: legacyDeleteError } = await supabase
            .from("featured_projects")
            .delete()
            .eq("id", existing.id);

          if (legacyDeleteError) throw legacyDeleteError;

          await syncProfessionalFeaturedRows({
            sourceProfessionnelId: myProId,
            targetProfessionnelIds: targetIds,
            row,
            currentScope,
            isDirector,
            isTeamLeader,
            activate: false,
          });

          toast({
            title: "Projet retiré",
            description: "Le projet a été retiré de la sélection à la une.",
          });
        } else {
          if (featuredForCurrentScope.length >= MAX_FEATURED) {
            toast({
              variant: "destructive",
              title: "Limite atteinte",
              description: `Vous pouvez sélectionner ${MAX_FEATURED} projets maximum.`,
            });
            return;
          }

          const maxOrder = featuredForCurrentScope.reduce(
            (acc, item) => Math.max(acc, Number(item?.sort_order || 0)),
            0
          );

          const legacyPayload = {
            agency_id: agencyId,
            created_by_user_id: user.id,
            scope: toLegacyFeaturedScope(currentScope),
            team_leader_id:
              currentScope === FEATURED_SCOPE_TEAM ? myProId : null,
            project_type: rowTypeToLegacyFeaturedType(row), // buying / selling
            buying_project_id:
              normalize(row?.type_projet) === "achat" ? row.project_id : null,
            selling_project_id:
              normalize(row?.type_projet) === "vente" ? row.project_id : null,
            title_override: null,
            sort_order: maxOrder + 1,
            is_active: true,
          };

          const { error: legacyInsertError } = await supabase
            .from("featured_projects")
            .insert(legacyPayload);

          if (legacyInsertError) throw legacyInsertError;

          await syncProfessionalFeaturedRows({
            sourceProfessionnelId: myProId,
            targetProfessionnelIds: targetIds,
            row,
            currentScope,
            isDirector,
            isTeamLeader,
            activate: true,
          });

          toast({
            title: "Projet ajouté",
            description: "Le projet a été ajouté à la sélection à la une.",
          });
        }

        await fetchAll();
      } catch (err) {
        console.error("[AgencyProjectsPilotPage] toggleFeatured error:", err);
        toast({
          variant: "destructive",
          title: "Erreur",
          description:
            err?.message ||
            "Impossible de mettre à jour la sélection à la une.",
        });
      } finally {
        setActionKey(null);
      }
    },
    [
      agencyId,
      myProId,
      user?.id,
      featuredCurrentMap,
      featuredForCurrentScope,
      currentScope,
      isDirector,
      isTeamLeader,
      fetchAll,
      toast,
    ]
  );

  if (authLoading || permissionsLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-brand-blue" />
          <p className="text-sm text-gray-500">
            Chargement du pilotage projets…
          </p>
        </div>
      </div>
    );
  }

  if (!user?.id) {
    return (
      <Navigate
        to="/connexion?role=professionnel&next=/agence/projets"
        replace
      />
    );
  }

  if (permissionsError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Card className="max-w-3xl mx-auto border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Impossible de charger le pilotage projets
            </CardTitle>
            <CardDescription>
              {permissionsError?.message || "Erreur de permissions."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button onClick={fetchAll}>Réessayer</Button>
            <Button variant="outline" onClick={() => navigate("/mon-espace")}>
              Retour
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isDirector && !isTeamLeader) {
    return <Navigate to="/professionnel-dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <SEO
        title="Pilotage projets agence | LivingRoom"
        description="Suivi des projets achat et vente de votre agence."
      />

      <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="container mx-auto max-w-7xl px-4 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              {isDirector ? (
                <Building2 className="h-5 w-5 text-brand-blue" />
              ) : (
                <Users className="h-5 w-5 text-brand-blue" />
              )}
              <h1 className="text-xl font-bold text-gray-900">
                {isDirector
                  ? "Pilotage des projets de l’agence"
                  : "Pilotage des projets de l’équipe"}
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {agency?.name || "Agence"} —{" "}
              {isDirector ? "vue direction" : "vue chef d’équipe"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={fetchAll} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                navigate(
                  isDirector ? "/agence/dashboard" : "/agence/team-leader"
                )
              }
            >
              Retour au dashboard
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total affiché</CardDescription>
              <CardTitle>{formatCount(summary.total)}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>
                À la une (
                {currentScope === FEATURED_SCOPE_AGENCY ? "agence" : "équipe"})
              </CardDescription>
              <CardTitle>
                {formatCount(summary.featuredCurrentCount)} / {MAX_FEATURED}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>À la une direction</CardDescription>
              <CardTitle>{formatCount(featuredAgency.length)}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>À la une équipe</CardDescription>
              <CardTitle>{formatCount(featuredTeam.length)}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pilotage</CardTitle>
            <CardDescription>
              Sépare les projets achat / vente, filtre par ville,
              professionnel, équipe et gère les projets à la une.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={projectTab} onValueChange={setProjectTab}>
              <TabsList className="grid w-full max-w-sm grid-cols-2">
                <TabsTrigger value="achat">Achat</TabsTrigger>
                <TabsTrigger value="vente">Vente</TabsTrigger>
              </TabsList>
            </Tabs>

            {isTeamLeader && featuredAgency.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Des projets “à la une” définis par la direction sont actifs.
                Ils écrasent l’affichage de la sélection équipe sur les cartes
                de visite digitales.
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-5">
              <div className="md:col-span-2 relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un projet, une ville, un professionnel…"
                  className="pl-9"
                />
              </div>

              <select
                className="h-10 rounded-md border bg-white px-3 text-sm"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              >
                <option value="all">Toutes les villes</option>
                {options.cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>

              <select
                className="h-10 rounded-md border bg-white px-3 text-sm"
                value={proFilter}
                onChange={(e) => setProFilter(e.target.value)}
              >
                <option value="all">Tous les professionnels</option>
                {options.pros.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                className="h-10 rounded-md border bg-white px-3 text-sm"
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
              >
                <option value="all">Toutes les équipes</option>
                {options.teams.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>

              <select
                className="h-10 rounded-md border bg-white px-3 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tous les statuts</option>
                {options.statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Card>
            <CardHeader>
              <CardTitle>Liste des projets</CardTitle>
              <CardDescription>
                {filteredProjects.length} projet(s) dans la vue courante.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-3 pr-4 font-medium">Ville</th>
                    <th className="py-3 pr-4 font-medium">Type de bien</th>
                    <th className="py-3 pr-4 font-medium">Budget / Prix</th>
                    <th className="py-3 pr-4 font-medium">Professionnel</th>
                    <th className="py-3 pr-4 font-medium">Équipe</th>
                    <th className="py-3 pr-4 font-medium">Statut</th>
                    <th className="py-3 pr-4 font-medium">Mis à jour</th>
                    <th className="py-3 pr-4 font-medium">Fiche</th>
                    <th className="py-3 pr-0 font-medium">À la une</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((row) => {
                    const key = buildProjectKey(
                      row.project_kind,
                      row.project_id
                    );
                    const currentFeatured = featuredCurrentMap.get(key);
                    const agencyFeatured = featuredAgencyMap.get(key);
                    const disabledByStatus = !isProjectActive(row);
                    const isBusy = actionKey === key;

                    return (
                      <tr
                        key={key}
                        className="border-b last:border-b-0 align-top"
                      >
                        <td className="py-3 pr-4">
                          <div className="font-medium text-gray-900">
                            {row.city || "—"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {row.project_title || "Projet"}
                          </div>
                        </td>

                        <td className="py-3 pr-4">
                          {row.property_type || "—"}
                        </td>

                        <td className="py-3 pr-4">
                          {row.budget_label || "—"}
                        </td>

                        <td className="py-3 pr-4">{buildDisplayName(row)}</td>

                        <td className="py-3 pr-4">{buildTeamName(row)}</td>

                        <td className="py-3 pr-4">
                          <Badge variant={statusBadgeVariant(row.status)}>
                            {row.status || "—"}
                          </Badge>
                        </td>

                        <td className="py-3 pr-4">
                          {formatDate(row.updated_at || row.created_at)}
                        </td>

                        <td className="py-3 pr-4">
                          {row.project_url ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2"
                              onClick={() => navigate(row.project_url)}
                            >
                              <ExternalLink className="h-4 w-4" />
                              Ouvrir
                            </Button>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td className="py-3 pr-0">
                          <div className="flex flex-col gap-2 items-start">
                            <Button
                              variant={currentFeatured ? "default" : "outline"}
                              size="sm"
                              className="gap-2"
                              disabled={disabledByStatus || isBusy}
                              onClick={() => toggleFeatured(row)}
                            >
                              {isBusy ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : currentFeatured ? (
                                <StarOff className="h-4 w-4" />
                              ) : (
                                <Star className="h-4 w-4" />
                              )}
                              {currentFeatured
                                ? "Retirer"
                                : "Mettre à la une"}
                            </Button>

                            {isTeamLeader && agencyFeatured && (
                              <span className="text-xs text-amber-700">
                                Piloté par la direction
                              </span>
                            )}

                            {disabledByStatus && (
                              <span className="text-xs text-red-600">
                                Projet non actif
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredProjects.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="py-10 text-center text-gray-500"
                      >
                        Aucun projet ne correspond aux filtres actuels.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Par professionnel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {summary.byPro.length ? (
                  summary.byPro.map(([name, count]) => (
                    <div
                      key={name}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-700">{name}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Aucune donnée.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Par équipe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {summary.byTeam.length ? (
                  summary.byTeam.map(([name, count]) => (
                    <div
                      key={name}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-700">{name}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Aucune donnée.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Règles “à la une”</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <p>• 10 projets maximum par sélection.</p>
                <p>
                  • La direction écrase la sélection du team leader sur les
                  cartes digitales.
                </p>
                <p>
                  • Les projets non actifs ne peuvent pas être ajoutés à la une.
                </p>
                <p>
                  • Les cartes doivent afficher en priorité la sélection agence,
                  sinon la sélection équipe.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}