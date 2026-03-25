import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import {
  Loader2,
  PlusCircle,
  Edit,
  Trash2,
  Copy,
  Pause,
  Play,
  CheckCircle2,
  XCircle,
  Users,
  Globe,
  Contact2,
  Filter,
  X,
  Star,
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import SEO from '@/components/SEO';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import ProjectCard from '@/components/marketplace/ProjectCard';

// Lazy load the complex form component
const NewProjectFormPro = lazy(() =>
  import('@/components/project/NewProjectFormPro').then(module => ({ default: module.default }))
);

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
    console.error('Dashboard Pro error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto px-4 py-10">
          <h1 className="text-2xl font-semibold mb-2">Une erreur est survenue</h1>
          <pre className="p-4 bg-red-50 text-red-700 rounded border border-red-200 overflow-auto">
            {String(this.state.error?.message || this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ----------------------------- Helpers ----------------------------- */

const makeFeaturedKey = (projectType, projectId) => `${projectType}:${projectId}`;

/* ----------------------------- Petits composants ----------------------------- */

const ActiveOverlay = ({ isActive }) => (
  <div className="flex items-center">
    {isActive ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 shadow-sm border border-green-100">
        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
        <span className="text-xs font-medium text-green-700">Actif</span>
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 shadow-sm border border-red-100">
        <XCircle className="w-3.5 h-3.5 text-red-600" />
        <span className="text-xs font-medium text-red-700">Suspendu</span>
      </span>
    )}
  </div>
);

const Supports = ({ project }) => {
  const chips = [];

  if (project?.visibility_public) {
    chips.push(
      <span
        key="public"
        className="inline-flex items-center gap-1 text-xs rounded-full bg-blue-50 text-blue-700 px-2.5 py-1"
      >
        <Globe className="w-3.5 h-3.5" /> Place des projets
      </span>
    );
  }

  if (project?.visibility_inter_agent) {
    chips.push(
      <span
        key="interpro"
        className="inline-flex items-center gap-1 text-xs rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1"
      >
        <Users className="w-3.5 h-3.5" /> Marché inter-pro
      </span>
    );
  }

  if (project?.visibility_showcase) {
    chips.push(
      <span
        key="card"
        className="inline-flex items-center gap-1 text-xs rounded-full bg-purple-50 text-purple-700 px-2.5 py-1"
      >
        <Contact2 className="w-3.5 h-3.5" /> Carte de visite digitale
      </span>
    );
  }

  if (chips.length === 0) {
    chips.push(
      <span
        key="aucun"
        className="inline-flex items-center gap-1 text-xs rounded-full bg-gray-100 text-gray-600 px-2.5 py-1"
      >
        Non publié
      </span>
    );
  }

  return <div className="flex flex-wrap gap-2">{chips}</div>;
};

const ProjectsFilter = ({ filters, setFilters, onReset }) => {
  return (
    <div className="bg-white p-4 rounded-xl border shadow-sm mb-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-brand-blue" />
          <h3 className="font-medium text-sm text-gray-700">Filtrer les projets</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-gray-500 hover:text-gray-900 h-8 px-2"
        >
          <X className="w-3 h-3 mr-1" /> Réinitialiser
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="space-y-1">
          <Label className="text-xs text-gray-500">Type de projet</Label>
          <Select value={filters.type} onValueChange={(v) => setFilters(prev => ({ ...prev, type: v }))}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Type de projet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tout type</SelectItem>
              <SelectItem value="achat">Achat (Recherche)</SelectItem>
              <SelectItem value="vente">Vente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-gray-500">Type de bien</Label>
          <Select value={filters.propertyType} onValueChange={(v) => setFilters(prev => ({ ...prev, propertyType: v }))}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Type de bien" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tout bien</SelectItem>
              <SelectItem value="appartement">Appartement</SelectItem>
              <SelectItem value="maison_villa">Maison / Villa</SelectItem>
              <SelectItem value="terrain">Terrain</SelectItem>
              <SelectItem value="parking_box">Parking / Box</SelectItem>
              <SelectItem value="loft_atelier_surface">Loft / Atelier</SelectItem>
              <SelectItem value="autre">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-gray-500">Ville</Label>
          <Input
            className="h-9"
            placeholder="Ex: Paris"
            value={filters.city}
            onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-gray-500">Surface min (m²)</Label>
          <Input
            className="h-9"
            type="number"
            placeholder="0"
            min="0"
            value={filters.minSurface}
            onChange={(e) => setFilters(prev => ({ ...prev, minSurface: e.target.value }))}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-gray-500">Surface max (m²)</Label>
          <Input
            className="h-9"
            type="number"
            placeholder="∞"
            min="0"
            value={filters.maxSurface}
            onChange={(e) => setFilters(prev => ({ ...prev, maxSurface: e.target.value }))}
          />
        </div>
      </div>
    </div>
  );
};

/* ----------------------------- Page principale ----------------------------- */

const ProfessionnelSharedProjectsPageInner = ({ isPublicShowcase = false, professionnelId }) => {
  const { user } = useAuth() || {};
  const { toast } = useToast();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const [filters, setFilters] = useState({
    type: 'all',
    propertyType: 'all',
    city: '',
    minSurface: '',
    maxSurface: ''
  });

  const [featuredKeys, setFeaturedKeys] = useState(new Set());
  const [featureLoadingKeys, setFeatureLoadingKeys] = useState(new Set());

  const resetFilters = () => {
    setFilters({
      type: 'all',
      propertyType: 'all',
      city: '',
      minSurface: '',
      maxSurface: ''
    });
  };

  const [professionnelIdDb, setProfessionnelIdDb] = useState(
    isPublicShowcase ? (professionnelId || null) : null
  );

  useEffect(() => {
    if (isPublicShowcase) return;
    if (!user?.id) return;

    let cancelled = false;

    async function loadProfessionnel() {
      try {
        const { data, error } = await supabase
          .from('professionnels')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Erreur récupération professionnel depuis Mes Projets:', error);
          return;
        }

        if (!cancelled) {
          setProfessionnelIdDb(data?.id || null);
        }
      } catch (e) {
        if (!cancelled) {
          console.error('Exception récupération professionnel:', e);
        }
      }
    }

    loadProfessionnel();

    return () => {
      cancelled = true;
    };
  }, [user?.id, isPublicShowcase]);

  const targetProfessionnelId = isPublicShowcase ? professionnelId : professionnelIdDb;

  const loadFeaturedKeys = useCallback(async () => {
    if (!targetProfessionnelId || isPublicShowcase) {
      setFeaturedKeys(new Set());
      return;
    }

    try {
      const { data, error } = await supabase.rpc('list_my_featured_project_keys', {
        p_source_professionnel_id: targetProfessionnelId,
      });

      if (error) throw error;

      const next = new Set(
        (data || []).map((row) => makeFeaturedKey(row.project_type, row.project_id))
      );
      setFeaturedKeys(next);
    } catch (error) {
      console.error('Erreur chargement projets à la une :', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les opportunités à la une.',
      });
      setFeaturedKeys(new Set());
    }
  }, [targetProfessionnelId, isPublicShowcase, toast]);

  const fetchProjects = useCallback(async () => {
    if (!targetProfessionnelId) {
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const buyingQuery = supabase
        .from('buying_projects_professionnel')
        .select('*')
        .eq('professionnel_id', targetProfessionnelId);

      const sellingQuery = supabase
        .from('selling_projects_professionnel')
        .select('*')
        .eq('professionnel_id', targetProfessionnelId);

      if (isPublicShowcase) {
        buyingQuery.eq('visibility_showcase', true).eq('status', 'active');
        sellingQuery.eq('visibility_showcase', true).eq('status', 'active');
      }

      const [
        { data: buyingData, error: buyingError },
        { data: sellingData, error: sellingError },
      ] = await Promise.all([buyingQuery, sellingQuery]);

      if (buyingError) throw buyingError;
      if (sellingError) throw sellingError;

      const combined = [
        ...(buyingData || []).map((p) => ({
          ...p,
          type_projet: 'achat',
          source: 'professionnel',
          professionnel_id: p.professionnel_id,
        })),
        ...(sellingData || []).map((p) => ({
          ...p,
          type_projet: 'vente',
          source: 'professionnel',
          professionnel_id: p.professionnel_id,
        })),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setProjects(combined);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les projets.',
      });
    } finally {
      setLoading(false);
    }
  }, [targetProfessionnelId, isPublicShowcase, toast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    loadFeaturedKeys();
  }, [loadFeaturedKeys]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (filters.type !== 'all') {
        if (filters.type === 'achat' && p.type_projet !== 'achat') return false;
        if (filters.type === 'vente' && p.type_projet !== 'vente') return false;
      }

      if (filters.propertyType !== 'all') {
        if (p.type_bien !== filters.propertyType) return false;
      }

      if (filters.city.trim()) {
        const searchCity = filters.city.toLowerCase().trim();
        const city1 = (p.city_choice_1 || '').toLowerCase();
        const city2 = (p.city_choice_2 || '').toLowerCase();
        const city3 = (p.city_choice_3 || '').toLowerCase();
        const city4 = (p.city_choice_4 || '').toLowerCase();
        const city5 = (p.city_choice_5 || '').toLowerCase();

        if (
          !city1.includes(searchCity) &&
          !city2.includes(searchCity) &&
          !city3.includes(searchCity) &&
          !city4.includes(searchCity) &&
          !city5.includes(searchCity)
        ) {
          return false;
        }
      }

      const minS = parseInt(filters.minSurface);
      const maxS = parseInt(filters.maxSurface);

      if (!isNaN(minS)) {
        if (p.type_projet === 'vente') {
          if (!p.surface || p.surface < minS) return false;
        } else {
          if (p.surface_min && p.surface_min < minS) return false;
        }
      }

      if (!isNaN(maxS)) {
        if (p.type_projet === 'vente') {
          if (!p.surface || p.surface > maxS) return false;
        } else {
          if (p.surface_max && p.surface_max > maxS) return false;
        }
      }

      return true;
    });
  }, [projects, filters]);

  const openCreate = () => {
    setEditingProject(null);
    setIsFormOpen(true);
  };

  const startEdit = (project) => {
    setEditingProject(project);
    setIsFormOpen(true);
  };

  const handleFormSuccess = (message) => {
    toast({ title: 'Succès', description: message });
    setIsFormOpen(false);
    setEditingProject(null);
    fetchProjects();
  };

  const handleDuplicate = async (project) => {
    const { id, created_at, updated_at, source, ...newProjectData } = project;

    newProjectData.title = `${project.title || 'Projet'} (Copie)`;
    newProjectData.status = 'active';

    const tableName =
      project.type_projet === 'achat'
        ? 'buying_projects_professionnel'
        : 'selling_projects_professionnel';

    const { error } = await supabase.from(tableName).insert(newProjectData);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'La duplication a échoué.',
      });
      console.error('Duplication error:', error);
    } else {
      toast({ title: 'Succès', description: 'Projet dupliqué.' });
      fetchProjects();
      loadFeaturedKeys();
    }
  };

  const handleDelete = async (project) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) return;

    const tableName =
      project.type_projet === 'achat'
        ? 'buying_projects_professionnel'
        : 'selling_projects_professionnel';

    const { error } = await supabase.from(tableName).delete().eq('id', project.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'La suppression a échoué.',
      });
    } else {
      toast({ title: 'Succès', description: 'Projet supprimé.' });
      fetchProjects();
      loadFeaturedKeys();
    }
  };

  const handleToggleStatus = async (project) => {
    const tableName =
      project.type_projet === 'achat'
        ? 'buying_projects_professionnel'
        : 'selling_projects_professionnel';

    const newStatus = project.status === 'suspended' ? 'active' : 'suspended';

    const { error } = await supabase
      .from(tableName)
      .update({ status: newStatus })
      .eq('id', project.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Le changement de statut a échoué.',
      });
    } else {
      toast({
        title: 'Succès',
        description: `Projet ${newStatus === 'suspended' ? 'suspendu' : 'activé'}.`,
      });
      fetchProjects();
    }
  };

  const handleFeatureOpportunity = async (project) => {
    if (!targetProfessionnelId) return;

    const featureKey = makeFeaturedKey(project.type_projet, project.id);
    const isFeatured = featuredKeys.has(featureKey);

    setFeatureLoadingKeys((prev) => {
      const next = new Set(prev);
      next.add(featureKey);
      return next;
    });

    try {
      const { data, error } = await supabase.rpc('toggle_featured_project', {
        p_project_type: project.type_projet,
        p_project_id: project.id,
        p_source_professionnel_id: targetProfessionnelId,
        p_enabled: !isFeatured,
      });

      if (error) throw error;
      if (data?.ok !== true) {
        throw new Error("La mise à jour de l'opportunité à la une a échoué.");
      }

      setFeaturedKeys((prev) => {
        const next = new Set(prev);
        if (isFeatured) next.delete(featureKey);
        else next.add(featureKey);
        return next;
      });

      toast({
        title: !isFeatured ? 'Projet mis à la une' : 'Projet retiré de la une',
        description: `"${project?.project_title || project?.title || 'Projet'}" a bien été ${!isFeatured ? 'ajouté aux' : 'retiré des'} opportunités à la une.`,
      });
    } catch (error) {
      console.error('Erreur toggle featured:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description:
          error?.message || "Impossible de mettre à jour l'opportunité à la une.",
      });
    } finally {
      setFeatureLoadingKeys((prev) => {
        const next = new Set(prev);
        next.delete(featureKey);
        return next;
      });
    }
  };

  const { buyingProjects, sellingProjects } = useMemo(
    () => ({
      buyingProjects: filteredProjects.filter((p) => p.type_projet === 'achat'),
      sellingProjects: filteredProjects.filter((p) => p.type_projet === 'vente'),
    }),
    [filteredProjects]
  );

  const formInitialData = useMemo(() => {
    if (editingProject) {
      const isSell = editingProject.type_projet === 'vente';

      const locations = isSell
        ? [
            {
              city: editingProject.city_choice_1 || '',
              quartier: editingProject.quartier_choice_1 || '',
              department: editingProject.department_choice_1 || '',
              region: editingProject.region_choice_1 || '',
            },
          ]
        : [1, 2, 3, 4, 5]
            .map((i) => ({
              city: editingProject[`city_choice_${i}`] || '',
              quartier: editingProject[`quartier_choice_${i}`] || '',
              department: editingProject[`department_choice_${i}`] || '',
              region: editingProject[`region_choice_${i}`] || '',
            }))
            .filter((l) => l.city);

      return {
        ...editingProject,
        intent: isSell ? 'sell' : 'buy',
        locations: locations.length > 0
          ? locations
          : [{ city: '', quartier: '', department: '', region: '' }],
      };
    }

    return { professionnel_id: targetProfessionnelId || null };
  }, [editingProject, targetProfessionnelId]);

  if (!targetProfessionnelId && !isPublicShowcase) {
    return (
      <div className="container mx-auto px-4 py-10">
        <Loader2 className="h-6 w-6 mr-2 inline animate-spin" />
        Chargement de votre session…
      </div>
    );
  }

  const PageTitle = () => {
    if (isPublicShowcase) {
      return (
        <h1 className="text-3xl font-bold text-brand-blue mb-6">
          Biens recherchés et proposés
        </h1>
      );
    }

    return (
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-brand-blue">Mes Projets Partagés</h1>
        <Button onClick={openCreate}>
          <PlusCircle className="mr-2 h-4 w-4" /> Ajouter un projet
        </Button>
      </div>
    );
  };

  const ProjectList = ({ title, projects, isPublicShowcase }) => (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
        {title}
        <span className="text-base font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
          {projects.length}
        </span>
      </h2>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {projects.map((p) => {
            const isActive = p.status !== 'suspended';
            const featureKey = makeFeaturedKey(p.type_projet, p.id);
            const isFeatured = featuredKeys.has(featureKey);
            const isFeatureLoading = featureLoadingKeys.has(featureKey);

            // Extract up to 3 available images
            let extractedImages = [];
            if (p.image_1_url) extractedImages.push(p.image_1_url);
            if (p.image_2_url) extractedImages.push(p.image_2_url);
            if (p.image_3_url) extractedImages.push(p.image_3_url);

            if (extractedImages.length === 0) {
              if (Array.isArray(p.images) && p.images.length > 0) {
                extractedImages = p.images.slice(0, 3);
              } else if (typeof p.images === 'string') {
                try {
                  const parsed = JSON.parse(p.images);
                  if (Array.isArray(parsed)) extractedImages = parsed.slice(0, 3);
                } catch (e) {
                  // Ignore
                }
              } else if (Array.isArray(p.photos) && p.photos.length > 0) {
                extractedImages = p.photos.slice(0, 3);
              }
            }
            
            // Clean up and ensure max 3 items
            extractedImages = extractedImages.filter(img => typeof img === 'string' && img.trim() !== '').slice(0, 3);

            return (
              <div
                key={p.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-300 relative"
              >
                {/* Status Header */}
                <div className="flex justify-between items-center w-full">
                   <div className="flex items-center gap-2">
                     <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider border border-slate-200 bg-slate-50 text-slate-600">
                       {p.type_projet === 'achat' ? 'Recherche' : 'À Vendre'}
                     </span>
                     <span className="text-sm text-slate-500 font-medium">
                       {p.property_type || p.type_bien || 'Bien immobilier'}
                     </span>
                   </div>
                   <ActiveOverlay isActive={isActive} />
                </div>

                {/* Horizontal Image Gallery */}
                {extractedImages.length > 0 && (
                  <div 
                    className="flex gap-3 overflow-x-auto pb-2 snap-x" 
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {extractedImages.map((img, idx) => (
                      <div 
                        key={idx} 
                        className="relative aspect-[4/3] w-[220px] sm:w-[260px] shrink-0 rounded-xl overflow-hidden shadow-sm snap-start border border-slate-100 group bg-slate-50"
                      >
                        <img
                          src={img}
                          alt={`${p.project_title || p.title || 'Aperçu'} - Photo ${idx + 1}`}
                          title={p.project_title || p.title || 'Aperçu du projet'}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="relative">
                  <ProjectCard
                    project={p}
                    hideOwnership={true}
                    hideRoleIcon={true}
                    compact={true}
                    hideFooterCta={true}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Supports project={p} />
                  {isFeatured && !isPublicShowcase && (
                    <span className="inline-flex items-center gap-1 text-xs rounded-full bg-amber-50 text-amber-700 px-2.5 py-1 border border-amber-200">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      Opportunité à la une
                    </span>
                  )}
                </div>

                {!isPublicShowcase && (
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 w-full mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-10"
                      onClick={() => startEdit(p)}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1.5" /> Éditer
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-10"
                      onClick={() => handleDuplicate(p)}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1.5" /> Copier
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className={[
                        'w-full h-10',
                        isFeatured
                          ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                          : 'border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800'
                      ].join(' ')}
                      onClick={() => handleFeatureOpportunity(p)}
                      disabled={isFeatureLoading}
                    >
                      {isFeatureLoading ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Star className={`h-3.5 w-3.5 mr-1.5 ${isFeatured ? 'fill-current' : ''}`} />
                      )}
                      {isFeatured ? 'Retirer' : 'À la une'}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-10"
                      onClick={() => handleToggleStatus(p)}
                    >
                      {isActive ? (
                        <Pause className="h-3.5 w-3.5 mr-1.5" />
                      ) : (
                        <Play className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      {isActive ? 'Pause' : 'Activer'}
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full h-10"
                      onClick={() => handleDelete(p)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Suppr.
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <p className="text-gray-500">Aucun projet ne correspond à vos critères.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className={!isPublicShowcase ? 'container mx-auto px-4 py-10' : ''}>
      <style>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .overflow-x-auto::-webkit-scrollbar {
          display: none;
        }
        .overflow-x-auto {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
      {!isPublicShowcase && (
        <SEO
          title="Mes Projets Partagés"
          description="Gérez les projets d'achat et de vente que vous partagez sur la plateforme."
        />
      )}

      <PageTitle />

      <ProjectsFilter filters={filters} setFilters={setFilters} onReset={resetFilters} />

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-12 w-12 animate-spin text-brand-blue" />
        </div>
      ) : (
        <div className="space-y-12">
          {(filters.type === 'all' || filters.type === 'achat') && (
            <ProjectList
              title="Biens recherchés"
              projects={buyingProjects}
              isPublicShowcase={isPublicShowcase}
            />
          )}

          {(filters.type === 'all' || filters.type === 'vente') && (
            <ProjectList
              title="Biens en vente"
              projects={sellingProjects}
              isPublicShowcase={isPublicShowcase}
            />
          )}
        </div>
      )}

      {!isPublicShowcase && (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {editingProject ? 'Modifier le projet' : 'Nouveau projet'}
              </DialogTitle>
              <DialogDescription>
                {editingProject
                  ? 'Mettez à jour les détails de votre projet.'
                  : 'Ajoutez un nouveau projet à votre portefeuille.'}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 max-h-[70vh] overflow-y-auto pr-2">
              <Suspense
                fallback={
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
                  </div>
                }
              >
                <NewProjectFormPro
                  key={editingProject?.id || 'new'}
                  initial={formInitialData}
                  isEdit={!!editingProject}
                  projectId={editingProject?.id}
                  onCreated={() => handleFormSuccess('Projet créé avec succès.')}
                  onUpdated={() => handleFormSuccess('Projet mis à jour avec succès.')}
                />
              </Suspense>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

const ProfessionnelSharedProjectsPage = ({ isPublicShowcase, professionnelId }) => (
  <PageErrorBoundary>
    <ProfessionnelSharedProjectsPageInner
      isPublicShowcase={isPublicShowcase}
      professionnelId={professionnelId}
    />
  </PageErrorBoundary>
);

export default ProfessionnelSharedProjectsPage;