import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Loader2, FilterX } from "lucide-react";
import MarketplaceFilters from "@/components/marketplace/MarketplaceFilters";
import ProjectCard from "@/components/marketplace/ProjectCard";
import ConnectionRequestDialog from "@/components/marketplace/ConnectionRequestDialog";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "../../../lib/customSupabaseClient";

const safeLower = (v) => String(v ?? "").toLowerCase().trim();

/**
 * Normalise les localisations d'un projet, quel que soit son format.
 * Retourne [{ city, quartier }]
 */
const getProjectLocations = (project) => {
  const locs = [];

  if (Array.isArray(project?.locations)) {
    for (const l of project.locations) {
      const city = l?.city ?? l?.ville ?? "";
      const quartier = l?.quartier ?? l?.district ?? "";
      if (city || quartier) locs.push({ city, quartier });
    }
  }

  if (project?.location) {
    if (Array.isArray(project.location.choices)) {
      for (const l of project.location.choices) {
        const city = l?.city ?? l?.ville ?? "";
        const quartier = l?.quartier ?? l?.district ?? "";
        if (city || quartier) locs.push({ city, quartier });
      }
    } else {
      const city = project.location.city ?? project.location.ville ?? "";
      const quartier = project.location.quartier ?? project.location.district ?? "";
      if (city || quartier) locs.push({ city, quartier });
    }
  }

  for (let i = 1; i <= 5; i++) {
    const city = project?.[`city_choice_${i}`];
    const quartier = project?.[`quartier_choice_${i}`];
    if (city || quartier) locs.push({ city, quartier });
  }

  const seen = new Set();
  const out = [];

  for (const l of locs) {
    const key = `${safeLower(l.city)}|${safeLower(l.quartier)}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(l);
    }
  }

  return out;
};

const buildProjectKey = (project) => {
  if (!project?.id) return null;
  return `${project?.source ?? "unknown"}-${project.id}`;
};

const ProjectsBoard = ({ projects, loading, showSourceFilter = false }) => {
  const { user } = useAuth();

  const [filters, setFilters] = useState({
    searchTerm: "",
    projectType: "all",
    propertyType: "all",
    sourceType: "all",
  });

  const [selectedProject, setSelectedProject] = useState(null);
  const [isConnectionDialogOpen, setIsConnectionDialogOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({});

  const fetchConnectionStatus = useCallback(async () => {
    if (!user || !Array.isArray(projects) || projects.length === 0) {
      setConnectionStatus({});
      return;
    }

    const validProjects = projects.filter((p) => p?.id);
    if (validProjects.length === 0) {
      setConnectionStatus({});
      return;
    }

    const projectIds = validProjects.map((p) => p.id);

    try {
      const { data, error } = await supabase
        .from("connections")
        .select("project_marketplace_id, status, requesting_user_id, target_user_id")
        .in("project_marketplace_id", projectIds)
        .or(`requesting_user_id.eq.${user.id},target_user_id.eq.${user.id}`);

      if (error) throw error;

      const statusMap = {};

      validProjects.forEach((project) => {
        const key = buildProjectKey(project);
        if (key) {
          statusMap[key] = {
            hasRequested: false,
            isConnected: false,
          };
        }
      });

      (data || []).forEach((conn) => {
        const matchingProject = validProjects.find(
          (project) => project?.id === conn?.project_marketplace_id
        );

        if (!matchingProject) return;

        const projectKey = buildProjectKey(matchingProject);
        if (!projectKey) return;

        const previous = statusMap[projectKey] || {
          hasRequested: false,
          isConnected: false,
        };

        statusMap[projectKey] = {
          hasRequested:
            previous.hasRequested ||
            (conn.requesting_user_id === user.id && conn.status === "pending"),
          isConnected: previous.isConnected || conn.status === "approved",
        };
      });

      setConnectionStatus(statusMap);
    } catch (err) {
      console.error("[ProjectsBoard] Error fetching connection status:", err);
      setConnectionStatus({});
    }
  }, [user, projects]);

  useEffect(() => {
    fetchConnectionStatus();
  }, [fetchConnectionStatus]);

  const filteredProjects = useMemo(() => {
    if (!Array.isArray(projects)) return [];

    const q = safeLower(filters.searchTerm);

    return projects.filter((project) => {
      let locationMatch = true;

      if (q) {
        const locs = getProjectLocations(project);

        locationMatch =
          locs.length > 0 &&
          locs.some((l) => {
            const city = safeLower(l.city);
            const quartier = safeLower(l.quartier);
            return city.includes(q) || quartier.includes(q);
          });

        if (!locationMatch) {
          const title = safeLower(project?.project_title ?? project?.title);
          if (title && title.includes(q)) {
            locationMatch = true;
          }
        }
      }

      const projectTypeMatch =
        filters.projectType === "all" || project?.type_projet === filters.projectType;

      const propertyTypeMatch =
        filters.propertyType === "all" || project?.type_bien === filters.propertyType;

      const sourceTypeMatch =
        !showSourceFilter ||
        filters.sourceType === "all" ||
        project?.source === filters.sourceType;

      return locationMatch && projectTypeMatch && propertyTypeMatch && sourceTypeMatch;
    });
  }, [projects, filters, showSourceFilter]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleConnectClick = (project) => {
    setSelectedProject(project);
    setIsConnectionDialogOpen(true);
  };

  const handleConnectionCreated = async () => {
    await fetchConnectionStatus();
  };

  const handleDialogOpenChange = (open) => {
    setIsConnectionDialogOpen(open);
    if (!open) {
      setSelectedProject(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div>
      <MarketplaceFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        showSourceFilter={showSourceFilter}
      />

      {filteredProjects.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg mt-8">
          <FilterX className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <p className="text-gray-500">
            Aucun projet ne correspond à vos critères pour le moment.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-8">
          {filteredProjects.map((project) => {
            const projectKey = buildProjectKey(project);
            const status = connectionStatus[projectKey] || {
              hasRequested: false,
              isConnected: false,
            };

            return (
              <ProjectCard
                key={projectKey || project.id}
                project={project}
                onConnectionRequest={handleConnectClick}
                hasRequested={status.hasRequested}
                isConnected={status.isConnected}
              />
            );
          })}
        </div>
      )}

      <ConnectionRequestDialog
        project={selectedProject}
        open={isConnectionDialogOpen}
        onOpenChange={handleDialogOpenChange}
        onConnect={handleConnectionCreated}
      />
    </div>
  );
};

export default ProjectsBoard;