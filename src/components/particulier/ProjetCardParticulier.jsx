import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Home, Euro, Ruler, Bed } from 'lucide-react';
import { supabase } from "../../../lib/customSupabaseClient";

/* ===== Helpers ===== */
const isFilled = (v) => v !== undefined && v !== null && String(v).trim() !== '';
const pick = (...vals) => vals.find(isFilled);

const toNumber = (v) => {
  if (!isFilled(v)) return null;
  const s = String(v).replace(/\s/g, '').replace(/\u00A0/g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const fmtMoney = (n) => {
  const v = toNumber(n);
  return v === null ? null : v.toLocaleString('fr-FR') + ' €';
};

const fmtSurface = (min, max) => {
  const a = toNumber(min);
  const b = toNumber(max);
  if (a && b) return `${a}–${b} m²`;
  if (a) return `${a} m²`;
  if (b) return `${b} m²`;
  return 'N/A';
};

// essaie d’agréger “délai” provenant de plusieurs clés et formats
const computeDelai = (p) => {
  const moisNum = pick(p.delai_mois, p.delai_en_mois, p.moving_delay_months, p.move_in_delay_months);
  const mois = toNumber(moisNum);
  if (mois) return `${mois} mois`;
  if (p.urgent === true) return 'Urgent';
  if (String(p.asap || '').toLowerCase() === 'true') return 'Immédiat';
  const txt = pick(p.delai, p.timeline, p.horizon, p.horizon_temps, p.when);
  return isFilled(txt) ? String(txt) : 'N/A';
};

const firstLocation = (p) => {
  const city = pick(
    p.city_choice_1, p.ville_choice_1, p.city1, p.ville1,
    p.city, p.ville
  );
  const quartier = pick(
    p.quartier_choice_1, p.district_choice_1, p.quartier1, p.district1,
    p.quartier, p.district
  );
  return { city, quartier };
};

/**
 * Props:
 * - project: objet projet déjà complet (optionnel)
 * - projectId: id dans projects_marketplace_unified_all (optionnel)
 * - marketplaceId: alias de projectId (optionnel)
 * - onClick, isOwner: inchangés
 *
 * Le composant va:
 * - utiliser `project` tel quel si suffisamment renseigné
 * - sinon, si `projectId`/`marketplaceId` fourni → fetch dans `projects_marketplace_unified_all`
 */
const ProjectCardParticulier = ({ project: inputProject, projectId, marketplaceId, onClick, isOwner }) => {
  const [project, setProject] = React.useState(inputProject || null);
  const [loading, setLoading] = React.useState(false);

  // Détermine si l'objet courant est “plein” ou s’il faut aller chercher la source unifiée
  const needsFetch = React.useMemo(() => {
    // si on a déjà type_projet + au moins un des champs clés, on considère que c'est bon
    if (project && (project.type_projet || project.type_bien || project.city_choice_1 || project.budget_max != null || project.prix_demande != null)) {
      return false;
    }
    // si un id de la vue unifiée est fourni → on peut fetch
    return isFilled(projectId) || isFilled(marketplaceId) || (project && isFilled(project.id));
  }, [project, projectId, marketplaceId]);

  React.useEffect(() => {
    let cancelled = false;

    const load = async (id) => {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects_marketplace_unified_all')
        .select(`
          id, source, role, status, created_at, updated_at,
          type_projet, type_bien,
          budget_max, surface_min, surface_max, bedrooms_min,
          surface, bedrooms, prix_demande,
          delai, description,
          city_choice_1, quartier_choice_1, department_choice_1, region_choice_1,
          project_title, title
        `)
        .eq('id', id)
        .maybeSingle();

      if (!cancelled) {
        if (!error && data) {
          // fusion légère si on avait un snapshot partiel
          setProject(prev => ({ ...(prev || {}), ...data }));
        } else {
          // au pire on garde ce qu’on a déjà
          setProject(prev => prev || null);
        }
        setLoading(false);
      }
    };

    if (needsFetch) {
      const id = projectId || marketplaceId || (project && project.id);
      if (isFilled(id)) load(id);
    } else {
      // sync si inputProject change
      setProject(inputProject || project || null);
    }

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsFetch, projectId, marketplaceId, inputProject?.id]);

  // Sécurité: si on n’a vraiment rien
  const p = project || inputProject || {};

  // Typage
  const typeProjet = (p.type_projet || '').toLowerCase(); // 'achat' / 'vente'
  const isAchat = typeProjet === 'achat';

  // Champs communs
  const title = pick(p.title, p.project_title, 'Projet');
  const typeBien = pick(p.type_bien, '—');

  // Localisation
  const { city, quartier } = firstLocation(p);

  // Achat — valeurs possibles selon vue / anciennes tables
  const budget = pick(p.budget_max, p.budget);

  // Surfaces
  const surfaceMin = pick(p.surface_min);
  const surfaceMax = pick(p.surface_max);
  const surfaceVente = pick(p.surface);

  // Chambres
  const chambresMin = pick(p.bedrooms_min);
  const chambresVente = pick(p.bedrooms);

  // Délai
  const delaiLabel = computeDelai(p);

  // Vente
  const prixDemande = pick(p.prix_demande);

  // Description
  const description = pick(p.description, '');

  const budgetLabel = fmtMoney(budget);
  const surfaceLabel = isAchat ? fmtSurface(surfaceMin, surfaceMax) : (isFilled(surfaceVente) ? `${toNumber(surfaceVente)} m²` : 'N/A');

  return (
    <Card className={`border-2 ${isAchat ? 'border-blue-500' : 'border-red-500'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant={isAchat ? 'default' : 'destructive'}>
            {typeProjet ? typeProjet.charAt(0).toUpperCase() + typeProjet.slice(1) : 'Projet'}
          </Badge>
        </div>

        <CardTitle className="text-xl leading-snug">
          {loading ? 'Chargement…' : title}
        </CardTitle>

        {isFilled(description) && !loading && (
          <CardDescription className="mt-1 line-clamp-2">{description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-3 text-gray-700">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span>
            {loading ? 'Chargement…' : (city ? city : 'Localisation N/A')}
            {!loading && quartier ? ` — ${quartier}` : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>Délai : {loading ? 'Chargement…' : delaiLabel}</span>
        </div>

        <div className="flex items-center gap-2">
          <Home className="h-4 w-4" />
          <span>{loading ? 'Chargement…' : typeBien}</span>
        </div>

        {isAchat ? (
          <div className="flex items-center gap-2">
            <Euro className="h-4 w-4" />
            <span>Budget : {loading ? 'Chargement…' : (budgetLabel ?? 'N/A')}</span>
          </div>
        ) : (
          isFilled(prixDemande) && (
            <div className="flex items-center gap-2">
              <Euro className="h-4 w-4" />
              <span>Prix demandé : {loading ? 'Chargement…' : (fmtMoney(prixDemande) ?? 'N/A')}</span>
            </div>
          )
        )}

        <div className="flex items-center gap-2">
          <Ruler className="h-4 w-4" />
          <span>Surface : {loading ? 'Chargement…' : surfaceLabel}</span>
        </div>

        {isAchat ? (
          <div className="flex items-center gap-2">
            <Bed className="h-4 w-4" />
            <span>Chambres min : {loading ? 'Chargement…' : (isFilled(chambresMin) ? (toNumber(chambresMin) ?? chambresMin) : 'N/A')}</span>
          </div>
        ) : (
          isFilled(chambresVente) && (
            <div className="flex items-center gap-2">
              <Bed className="h-4 w-4" />
              <span>Chambres : {loading ? 'Chargement…' : (toNumber(chambresVente) ?? chambresVente)}</span>
            </div>
          )
        )}
      </CardContent>

      {onClick && (
        <CardFooter className="flex justify-end items-center">
          <Button variant="secondary" onClick={onClick} disabled={isOwner || loading}>
            {isOwner ? "C’est votre projet" : (loading ? 'Chargement…' : 'Contacter')}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default ProjectCardParticulier;