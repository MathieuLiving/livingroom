// src/pages/ParticulierAlertsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import {
  Loader2, Bell, PlusCircle, Edit, Trash2, MapPin, Euro, Home, BedDouble,
  ThumbsUp, ToggleLeft, ToggleRight, Save, Eye, Building, CalendarDays
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import SEO from '@/components/SEO';
import { Badge } from '@/components/ui/badge';
import ProjectsBoard from '@/components/marketplace/ProjectsBoard';
import { validateSelectValue } from "@/lib/utils.jsx";

/* ---------- Options d'équipements ---------- */
const featureOptions = [
  { id: 'has_garden', label: 'Jardin' },
  { id: 'has_terrace', label: 'Terrasse' },
  { id: 'has_balcony', label: 'Balcon' },
  { id: 'has_pool', label: 'Piscine' },
  { id: 'has_elevator', label: 'Ascenseur' },
  { id: 'has_cellar', label: 'Cave' },
  { id: 'has_parking', label: 'Parking' },
  { id: 'has_caretaker', label: 'Gardien' },
  { id: 'has_clear_view', label: 'Vue dégagée' },
  { id: 'is_last_floor', label: 'Dernier étage' },
];

/* ---------- Types de bien ---------- */
const propertyTypeOptions = [
  'Appartement',
  'Maison/Villa',
  'Loft',
  'Hôtel particulier',
  'Parking',
  'Autre surface',
];

/* ---------- Échéance ---------- */
const delaiOptions = [
  { value: 'now', label: 'Tout de suite' },
  { value: 'lt3', label: '< 3 mois' },
  { value: '3to6', label: '3 à 6 mois' },
  { value: 'gt6', label: '+ 6 mois' },
];

const norm = (s) => (s ?? '').toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

/* =========================================================
   Helpers stg_geo (schéma: ville, departement, region, quartier)
   ========================================================= */
const fetchCitiesLike = async (q) => {
  const term = (q || '').trim();
  if (term.length < 2) return { options: [] };

  const { data, error } = await supabase
    .from('stg_geo')
    .select('ville, departement, region')
    .not('ville', 'is', null)
    .ilike('ville', `%${term}%`)
    .limit(50);

  if (error) {
    console.error('fetchCitiesLike error', error);
    return { options: [] };
  }

  const seen = new Set();
  const options = [];
  (data || []).forEach(r => {
    const v = r.ville;
    if (v && !seen.has(v)) {
      seen.add(v);
      options.push({
        city: v,
        department: r.departement || '',
        region: r.region || '',
      });
    }
  });

  options.sort((a, b) => a.city.localeCompare(b.city, 'fr'));
  return { options };
};

const fetchQuartiersForCity = async (city, quartierPrefix) => {
  if (!city) return { options: [] };

  let qb = supabase
    .from('stg_geo')
    .select('quartier')
    .eq('ville', city)
    .not('quartier', 'is', null)
    .limit(100);

  const term = (quartierPrefix || '').trim();
  if (term.length >= 2) qb = qb.ilike('quartier', `%${term}%`);

  const { data, error } = await qb;
  if (error) {
    console.error('fetchQuartiersForCity error', error);
    return { options: [] };
  }

  const seen = new Set();
  const opts = [];
  (data || []).forEach(r => {
    const q = r.quartier;
    if (q && !seen.has(q)) {
      seen.add(q);
      opts.push(q);
    }
  });

  opts.sort((a, b) => a.localeCompare(b, 'fr'));
  return { options: opts };
};

/* =========================================================
   Sélecteurs Ville / Quartier reliés à stg_geo
   ========================================================= */
const GeoRow = ({ row, onChange, onRemove, disableRemove }) => {
  const [cityQuery, setCityQuery] = useState(row.city || '');
  const [cityOptions, setCityOptions] = useState([]);
  const [quartierQuery, setQuartierQuery] = useState(row.quartier || '');
  const [quartierOptions, setQuartierOptions] = useState([]);
  const [loadingCity, setLoadingCity] = useState(false);
  const [loadingQuartier, setLoadingQuartier] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const term = cityQuery.trim();
      if (term.length < 2) { setCityOptions([]); return; }
      setLoadingCity(true);
      const { options } = await fetchCitiesLike(term);
      setLoadingCity(false);
      if (!cancelled) setCityOptions(options);
    };
    run();
    return () => { cancelled = true; };
  }, [cityQuery]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!row.city) { setQuartierOptions([]); return; }
      setLoadingQuartier(true);
      const { options } = await fetchQuartiersForCity(row.city, quartierQuery);
      setLoadingQuartier(false);
      if (!cancelled) setQuartierOptions(options);
    };
    run();
    return () => { cancelled = true; };
  }, [row.city, quartierQuery]);

  const handlePickCity = (value) => {
    const found = cityOptions.find(o => o.city === value);
    onChange({
      ...row,
      city: value,
      department: found?.department || '',
      region: found?.region || '',
      quartier: '',
    });
    setCityQuery(value);
    setQuartierQuery('');
  };

  const handlePickQuartier = (value) => {
    onChange({ ...row, quartier: value });
    setQuartierQuery(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
      <div className="md:col-span-5 space-y-1">
        <Label className="flex items-center"><MapPin className="mr-2 h-4 w-4" /> Ville</Label>
        <Input
          list={`cities-${row.id}`}
          placeholder="Ex : Paris"
          value={cityQuery}
          onChange={(e) => setCityQuery(e.target.value)}
          onBlur={(e) => handlePickCity(e.target.value)}
        />
        <datalist id={`cities-${row.id}`}>
          {cityOptions.map((opt) => (
            <option key={opt.city} value={opt.city}>
              {opt.city} {opt.department ? `(${opt.department})` : ''}
            </option>
          ))}
        </datalist>
        {loadingCity && <p className="text-xs text-muted-foreground">Recherche des villes…</p>}
      </div>

      <div className="md:col-span-5 space-y-1">
        <Label>Quartier (optionnel)</Label>
        <Input
          list={`quartiers-${row.id}`}
          placeholder={row.city ? `Quartier à ${row.city}` : 'Choisissez d’abord une ville'}
          value={quartierQuery}
          onChange={(e) => setQuartierQuery(e.target.value)}
          onBlur={(e) => handlePickQuartier(e.target.value)}
          disabled={!row.city}
        />
        <datalist id={`quartiers-${row.id}`}>
          {quartierOptions.map((q) => (
            <option key={q} value={q}>{q}</option>
          ))}
        </datalist>
        {loadingQuartier && !!row.city && <p className="text-xs text-muted-foreground">Recherche des quartiers…</p>}
      </div>

      <div className="md:col-span-2 flex items-end">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => onRemove(row.id)}
          disabled={disableRemove}
        >
          Supprimer
        </Button>
      </div>
    </div>
  );
};

/* =========================================================
   Helpers pour colonnes *_choice_* (1..5)
   ========================================================= */
const toChoiceColumns = (locations = []) => {
  const top5 = locations.slice(0, 5);
  const pad = (arr) => [...arr, '', '', '', '', ''].slice(0, 5);
  const cities = pad(top5.map(l => l.city || ''));
  const quartiers = pad(top5.map(l => l.quartier || ''));
  const depts = pad(top5.map(l => l.department || ''));
  const regions = pad(top5.map(l => l.region || ''));
  return {
    city_choice_1: cities[0], city_choice_2: cities[1], city_choice_3: cities[2], city_choice_4: cities[3], city_choice_5: cities[4],
    quartier_choice_1: quartiers[0], quartier_choice_2: quartiers[1], quartier_choice_3: quartiers[2], quartier_choice_4: quartiers[3], quartier_choice_5: quartiers[4],
    department_choice_1: depts[0], department_choice_2: depts[1], department_choice_3: depts[2], department_choice_4: depts[3], department_choice_5: depts[4],
    region_choice_1: regions[0], region_choice_2: regions[1], region_choice_3: regions[2], region_choice_4: regions[3], region_choice_5: regions[4],
  };
};

const fromChoiceColumnsToLocations = (a = {}) => {
  const rows = [];
  for (let i = 1; i <= 5; i++) {
    const city = a[`city_choice_${i}`];
    const quartier = a[`quartier_choice_${i}`];
    const department = a[`department_choice_${i}`];
    const region = a[`region_choice_${i}`];
    if (city || quartier || department || region) {
      rows.push({ id: Date.now() + i, city: city || '', quartier: quartier || '', department: department || '', region: region || '' });
    }
  }
  return rows.length ? rows : [{ id: Date.now(), city: '', quartier: '', department: '', region: '' }];
};

/* =========================================================
   Formulaire
   ========================================================= */
const AlertForm = ({ alertToEdit, onSave, onCancel }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    alert_name: '',
    type_projet: 'achat',
    type_bien: [],
    delai: '',
    locations: [{ id: Date.now(), city: '', quartier: '', department: '', region: '' }],
    budget_min: '',
    budget_max: '',
    prix_demande_min: '',
    prix_demande_max: '',
    surface_min: '',
    surface_max: '',
    bedrooms_min: '',
    required_features: [],
  });
  const [loading, setLoading] = useState(false);

  const isAchat = formData.type_projet === 'achat';

  useEffect(() => {
    if (alertToEdit) {
      const locations =
        (Array.isArray(alertToEdit.locations) && alertToEdit.locations.length)
          ? alertToEdit.locations.map((loc, i) => ({ id: Date.now() + i, city: '', quartier: '', department: '', region: '', ...loc }))
          : fromChoiceColumnsToLocations(alertToEdit);

      setFormData({
        id: alertToEdit.id,
        alert_name: alertToEdit.alert_name || '',
        type_projet: alertToEdit.type_projet || 'achat',
        type_bien: Array.isArray(alertToEdit.type_bien)
          ? alertToEdit.type_bien
          : (alertToEdit.type_bien ? [alertToEdit.type_bien] : []),
        delai: alertToEdit.delai || '',
        locations,
        budget_min: alertToEdit.budget_min ?? '',
        budget_max: alertToEdit.budget_max ?? '',
        prix_demande_min: alertToEdit.prix_demande_min ?? '',
        prix_demande_max: alertToEdit.prix_demande_max ?? '',
        surface_min: alertToEdit.surface_min ?? '',
        surface_max: alertToEdit.surface_max ?? '',
        bedrooms_min: alertToEdit.bedrooms_min ?? '',
        required_features: alertToEdit.required_features || [],
      });
    }
  }, [alertToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePropertyTypeChange = (propertyType) => {
    setFormData(prev => {
      const newTypes = prev.type_bien.includes(propertyType)
        ? prev.type_bien.filter(t => t !== propertyType)
        : [...prev.type_bien, propertyType];
      return { ...prev, type_bien: newTypes };
    });
  };

  const handleFeatureChange = (featureId) => {
    setFormData(prev => {
      const newFeatures = prev.required_features.includes(featureId)
        ? prev.required_features.filter(id => id !== featureId)
        : [...prev.required_features, featureId];
      return { ...prev, required_features: newFeatures };
    });
  };

  // locations handlers
  const addLocationRow = () => {
    setFormData(prev => ({
      ...prev,
      locations: [...prev.locations, { id: Date.now(), city: '', quartier: '', department: '', region: '' }],
    }));
  };

  const removeLocationRow = (id) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.filter(l => l.id !== id),
    }));
  };

  const changeLocationRow = (updatedRow) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.map(l => (l.id === updatedRow.id ? updatedRow : l)),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const choiceCols = toChoiceColumns(formData.locations);

    const base = {
      alert_name: formData.alert_name || null,
      type_projet: formData.type_projet || null,
      type_bien: formData.type_bien?.length ? formData.type_bien : null,
      delai: formData.delai || null,
      locations: formData.locations?.length ? formData.locations.map(({ id, ...rest }) => rest) : null,
      surface_min: formData.surface_min || null,
      surface_max: formData.surface_max || null,
      bedrooms_min: formData.bedrooms_min || null,
      required_features: formData.required_features?.length ? formData.required_features : null,
      ...choiceCols,
    };

    const pricePart = (formData.type_projet === 'vente')
      ? {
        prix_demande_min: formData.prix_demande_min || null,
        prix_demande_max: formData.prix_demande_max || null,
        budget_min: null,
        budget_max: null,
      }
      : {
        budget_min: formData.budget_min || null,
        budget_max: formData.budget_max || null,
        prix_demande_min: null,
        prix_demande_max: null,
      };

    const payload = {
      ...base,
      ...pricePart,
      particulier_id: user?.id ?? null,           // côté particulier
      professionnel_id: null,                     // non utilisé ici
    };

    let error;
    if (formData.id) {
      const { error: updateError } = await supabase
        .from('project_alerts')
        .update(payload)
        .eq('id', formData.id);
      error = updateError;
    } else {
      const { id, ...toInsert } = payload;
      const { error: insertError } = await supabase
        .from('project_alerts')
        .insert(toInsert);
      error = insertError;
    }

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: `Échec de la sauvegarde de l'alerte : ${error.message}`,
      });
    } else {
      toast({ title: 'Succès', description: 'Alerte sauvegardée avec succès.' });
      onSave();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="alert_name">Nom de l'alerte</Label>
        <Input
          id="alert_name"
          name="alert_name"
          value={formData.alert_name}
          onChange={handleChange}
          placeholder="Ex: Appartements Paris 16ème"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type de projet</Label>
          <Select
            value={validateSelectValue(formData.type_projet)}
            onValueChange={(value) => setFormData(p => ({ ...p, type_projet: value }))}
          >
            <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="achat">Achat</SelectItem>
              <SelectItem value="vente">Vente</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {isAchat ? 'Recherche d’un bien à acheter' : 'Mise en vente d’un bien (plage de prix attendue)'}
          </p>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center"><CalendarDays className="mr-2 h-4 w-4" /> Échéance</Label>
          <Select
            value={validateSelectValue(formData.delai)}
            onValueChange={(value) => setFormData(p => ({ ...p, delai: value }))}
          >
            <SelectTrigger><SelectValue placeholder="Sélectionner une échéance" /></SelectTrigger>
            <SelectContent>
              {delaiOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="flex items-center"><Building className="mr-2 h-4 w-4" /> Type de bien</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {propertyTypeOptions.map(type => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox
                id={`type_bien-${type}`}
                checked={formData.type_bien.includes(type)}
                onCheckedChange={() => handlePropertyTypeChange(type)}
              />
              <Label htmlFor={`type_bien-${type}`} className="font-normal cursor-pointer">{type}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* Localisations (Ville + Quartier) */}
      <div className="space-y-2">
        <Label className="flex items-center"><MapPin className="mr-2 h-4 w-4" /> Localisations</Label>
        <div className="space-y-3">
          {formData.locations.map((loc) => (
            <GeoRow
              key={loc.id}
              row={loc}
              onChange={changeLocationRow}
              onRemove={removeLocationRow}
              disableRemove={formData.locations.length === 1}
            />
          ))}
        </div>
        <div className="pt-2">
          <Button type="button" variant="outline" onClick={addLocationRow}>
            Ajouter une ville/quartier
          </Button>
        </div>
      </div>

      {/* Prix : achat => budget_*, vente => prix_demande_* */}
      {formData.type_projet === 'vente' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="prix_demande_min">Prix Min (€)</Label>
            <Input
              id="prix_demande_min"
              name="prix_demande_min"
              type="number"
              value={formData.prix_demande_min}
              onChange={handleChange}
              placeholder="Ex: 450000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prix_demande_max">Prix Max (€)</Label>
            <Input
              id="prix_demande_max"
              name="prix_demande_max"
              type="number"
              value={formData.prix_demande_max}
              onChange={handleChange}
              placeholder="Ex: 700000"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="budget_min">Prix Min (€)</Label>
            <Input
              id="budget_min"
              name="budget_min"
              type="number"
              value={formData.budget_min}
              onChange={handleChange}
              placeholder="Ex: 300000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget_max">Prix Max (€)</Label>
            <Input
              id="budget_max"
              name="budget_max"
              type="number"
              value={formData.budget_max}
              onChange={handleChange}
              placeholder="Ex: 600000"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="surface_min">Surface Min (m²)</Label>
          <Input id="surface_min" name="surface_min" type="number" value={formData.surface_min} onChange={handleChange} placeholder="Ex: 50" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="surface_max">Surface Max (m²)</Label>
          <Input id="surface_max" name="surface_max" type="number" value={formData.surface_max} onChange={handleChange} placeholder="Ex: 80" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bedrooms_min">Chambres Min</Label>
        <Input id="bedrooms_min" name="bedrooms_min" type="number" value={formData.bedrooms_min} onChange={handleChange} placeholder="Ex: 2" />
      </div>

      <div className="space-y-3">
        <Label className="flex items-center"><ThumbsUp className="mr-2 h-4 w-4" /> Caractéristiques obligatoires</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {featureOptions.map(feature => (
            <div key={feature.id} className="flex items-center space-x-2">
              <Checkbox
                id={`feature-${feature.id}`}
                checked={formData.required_features.includes(feature.id)}
                onCheckedChange={() => handleFeatureChange(feature.id)}
              />
              <Label htmlFor={`feature-${feature.id}`} className="font-normal cursor-pointer">{feature.label}</Label>
            </div>
          ))}
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Sauvegarder
        </Button>
      </DialogFooter>
    </form>
  );
};

/* =========================================================
   Carte Alerte + affichage critères
   ========================================================= */
const AlertCard = ({ alert, onEdit, onDelete, onToggleStatus, matchingProjectsCount, onViewMatchingProjects }) => {
  const delaiLabel = delaiOptions.find(d => d.value === alert.delai)?.label || null;

  const locs = Array.isArray(alert.locations) && alert.locations.length
    ? alert.locations
    : fromChoiceColumnsToLocations(alert);

  const locDisplay = locs
    .map(l => [l.city, l.quartier].filter(Boolean).join(' - '))
    .filter(Boolean)
    .join(', ');

  const priceDisplay = alert.type_projet === 'vente'
    ? [alert.prix_demande_min, alert.prix_demande_max].filter(Boolean).join(' - ') + ' €'
    : [alert.budget_min, alert.budget_max].filter(Boolean).join(' - ') + ' €';

  const criteria = [
    { icon: Building, value: Array.isArray(alert.type_bien) ? alert.type_bien.join(', ') : alert.type_bien },
    { icon: CalendarDays, value: delaiLabel },
    { icon: MapPin, value: locDisplay },
    { icon: Euro, value: priceDisplay },
    { icon: Home, value: [alert.surface_min, alert.surface_max].filter(Boolean).join(' - ') + ' m²' },
    { icon: BedDouble, value: alert.bedrooms_min ? `${alert.bedrooms_min}+ ch` : null },
  ].filter(c =>
    c.value &&
    c.value !== ' €' &&
    c.value !== ' m²' &&
    String(c.value).trim() !== '-' &&
    String(c.value).trim() !== ''
  );

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{alert.alert_name}</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => onToggleStatus(alert)}>
            {alert.is_active ? <ToggleRight className="h-6 w-6 text-green-500" /> : <ToggleLeft className="h-6 w-6 text-gray-400" />}
          </Button>
        </div>
        <CardDescription className="capitalize">{alert.type_projet}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        {criteria.map((c, i) => (
          <div key={i} className="flex items-center text-sm text-muted-foreground">
            <c.icon className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">{c.value}</span>
          </div>
        ))}
        {alert.required_features?.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {alert.required_features.map(f => (
              <Badge key={f} variant="secondary">{featureOptions.find(opt => opt.id === f)?.label || f}</Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4 flex-col items-stretch space-y-2">
        <Button onClick={() => onViewMatchingProjects(alert)} disabled={matchingProjectsCount === 0}>
          <Eye className="mr-2 h-4 w-4" />
          Voir les {matchingProjectsCount} projets
        </Button>
        <div className="flex w-full justify-end space-x-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(alert)}><Edit className="h-4 w-4 mr-1" /> Modifier</Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(alert.id)}><Trash2 className="h-4 w-4 mr-1" /> Supprimer</Button>
        </div>
      </CardFooter>
    </Card>
  );
};

/* =========================================================
   Matching
   ========================================================= */
const projectMatchesAlert = (project, alert) => {
  if (!alert.is_active) return false;

  const isNumber = (v) => typeof v === 'number' && !Number.isNaN(v);
  const toNum = (v) => (v === null || v === undefined || v === '' ? null : Number(v));

  // Type de projet
  if (alert.type_projet && norm(alert.type_projet) !== norm(project.type_projet)) return false;

  // Type de bien
  const alertTypesArray = Array.isArray(alert.type_bien) ? alert.type_bien.filter(Boolean) : (alert.type_bien ? [alert.type_bien] : []);
  if (alertTypesArray.length > 0) {
    const projectTypeBien = norm(project.type_bien);
    if (!projectTypeBien || !alertTypesArray.map(norm).includes(projectTypeBien)) return false;
  }

  // Localisations (depuis jsonb ou *_choice_*)
  const locs = Array.isArray(alert.locations) && alert.locations.length
    ? alert.locations
    : fromChoiceColumnsToLocations(alert);

  const alertCities = locs.map(l => l?.city).filter(Boolean).map(norm);
  const alertQuartiers = locs.map(l => l?.quartier).filter(Boolean).map(norm);

  if (alertCities.length > 0) {
    const projectCity = norm(project?.location?.city) || norm(project?.city_choice_1) || '';
    if (!projectCity || !alertCities.includes(projectCity)) return false;
  }
  if (alertQuartiers.length > 0) {
    const projectQuartier = norm(project?.location?.quartier) || norm(project?.quartier) || '';
    if (projectQuartier && !alertQuartiers.includes(projectQuartier)) return false;
  }

  // Prix — utiliser colonnes adaptées au type de projet
  if (alert.type_projet === 'vente') {
    const aMin = toNum(alert.prix_demande_min);
    const aMax = toNum(alert.prix_demande_max);
    const p = toNum(project.prix_demande);
    if (isNumber(p)) {
      if (isNumber(aMin) && p < aMin) return false;
      if (isNumber(aMax) && p > aMax) return false;
    }
  } else {
    const aMin = toNum(alert.budget_min);
    const aMax = toNum(alert.budget_max);
    const pMin = toNum(project.budget_min);
    const pMax = toNum(project.budget_max);
    if (isNumber(aMin) && isNumber(pMax) && pMax < aMin) return false;
    if (isNumber(aMax) && isNumber(pMin) && pMin > aMax) return false;
  }

  // Caractéristiques requises
  const reqFeatures = Array.isArray(alert.required_features) ? alert.required_features : [];
  for (const feat of reqFeatures) {
    if (!project?.[feat]) return false;
  }

  return true;
};

/* =========================================================
   Page
   ========================================================= */
const ParticulierAlertsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [matchingProjects, setMatchingProjects] = useState([]);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
  const [selectedAlertName, setSelectedAlertName] = useState('');

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const alertsPromise = supabase
        .from('project_alerts')
        .select('*')
        .eq('particulier_id', user.id)
        .order('created_at', { ascending: false });

      // On réutilise la même source de projets que côté pro (projets publics du marché)
      const projectsPromise = supabase.rpc('get_all_public_projects');

      const [{ data: alertsData, error: alertsError }, { data: projectsData, error: projectsError }] =
        await Promise.all([alertsPromise, projectsPromise]);

      if (alertsError) throw alertsError;
      if (projectsError) throw projectsError;

      setAlerts(alertsData || []);
      setAllProjects(projectsData || []);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les données.' });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenForm = (alert = null) => {
    setEditingAlert(alert);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingAlert(null);
  };

  const handleSave = () => {
    handleCloseForm();
    fetchData();
  };

  const handleDelete = async (alertId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette alerte ?')) return;
    const { error } = await supabase.from('project_alerts').delete().eq('id', alertId);
    if (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'La suppression a échoué.' });
    } else {
      toast({ title: 'Succès', description: 'Alerte supprimée.' });
      fetchData();
    }
  };

  const handleToggleStatus = async (alert) => {
    const newStatus = !alert.is_active;
    const { error } = await supabase.from('project_alerts').update({ is_active: newStatus }).eq('id', alert.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Le changement de statut a échoué.' });
    } else {
      toast({ title: 'Succès', description: `Alerte ${newStatus ? 'activée' : 'désactivée'}.` });
      fetchData();
    }
  };

  const handleViewMatchingProjects = (alert) => {
    const matches = allProjects.filter(p => projectMatchesAlert(p, alert));
    setMatchingProjects(matches);
    setSelectedAlertName(alert.alert_name);
    setIsProjectsModalOpen(true);
  };

  return (
    <>
      <SEO title="Mes Alertes (Particulier)" description="Paramétrez des alertes et soyez averti des projets correspondant à vos critères." />
      <div className="container mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-brand-blue flex items-center"><Bell className="mr-3 h-8 w-8" />Mes Alertes</h1>
          <Button onClick={() => handleOpenForm()}><PlusCircle className="mr-2 h-4 w-4" /> Créer une alerte</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-12 w-12 animate-spin text-brand-blue" /></div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <p className="text-lg text-muted-foreground">Vous n'avez aucune alerte pour le moment.</p>
            <Button onClick={() => handleOpenForm()} className="mt-4">Créer ma première alerte</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alerts.map(alert => {
              const matchingCount = allProjects.filter(p => projectMatchesAlert(p, alert)).length;
              return (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onEdit={handleOpenForm}
                  onDelete={handleDelete}
                  onToggleStatus={handleToggleStatus}
                  matchingProjectsCount={matchingCount}
                  onViewMatchingProjects={handleViewMatchingProjects}
                />
              );
            })}
          </div>
        )}

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAlert ? 'Modifier' : 'Créer'} une alerte</DialogTitle>
              <DialogDescription>Définissez vos critères pour recevoir des notifications sur les nouveaux projets.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <AlertForm alertToEdit={editingAlert} onSave={handleSave} onCancel={handleCloseForm} />
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isProjectsModalOpen} onOpenChange={setIsProjectsModalOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Projets correspondants à "{selectedAlertName}"</DialogTitle>
              <DialogDescription>Voici les projets qui correspondent aux critères de votre alerte.</DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto -mx-6 px-6">
              <ProjectsBoard projects={matchingProjects} loading={false} showSourceFilter={false} />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default ParticulierAlertsPage;