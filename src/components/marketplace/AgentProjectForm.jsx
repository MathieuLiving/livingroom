import React, { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import { supabase } from "../../../lib/customSupabaseClient";
import { useAuth } from '@/contexts/SupabaseAuthContext';
import ProjectDetailsSection from './form-sections/ProjectDetailsSection';
import LocationSection from './form-sections/LocationSection';
import AdditionalCriteriaSection from './form-sections/AdditionalCriteriaSection';
import SubmissionSection from './form-sections/SubmissionSection';
import PhotoUploader from '@/components/project/PhotoUploader';
import { useLocation } from '@/hooks/useLocation';
import { v4 as uuidv4 } from 'uuid';

const AgentProjectForm = ({ projectToEdit = null, onSuccess }) => {
    const { toast } = useToast();
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [photos, setPhotos] = useState([]);

    const initialFormData = {
        type_projet: 'achat',
        type_bien: '',
        budget_max: '',
        prix_demande: '',
        locations: [{ id: Date.now(), city: '', quartier: '', department: '', region: '' }],
        surface: '',
        surface_min: '',
        surface_max: '',
        bedrooms: '',
        bedrooms_min: '',
        has_garden: false, has_terrace: false, has_balcony: false, has_pool: false,
        has_elevator: false, has_cellar: false, has_parking: false, has_caretaker: false,
        has_clear_view: false, is_last_floor: false,
        configuration: '',
        delai: '',
        visibility: []
    };

    const [formData, setFormData] = useState(initialFormData);
    const locationHook = useLocation(formData, setFormData);

    useEffect(() => {
        if (projectToEdit) {
            const locations = [];
            if (projectToEdit.type_projet === 'achat') {
                for (let i = 1; i <= 5; i++) {
                    if (projectToEdit[`city_choice_${i}`]) {
                        locations.push({
                            id: Date.now() + i,
                            city: projectToEdit[`city_choice_${i}`],
                            quartier: projectToEdit[`quartier_choice_${i}`] || '',
                            department: projectToEdit[`department_choice_${i}`] || '',
                            region: projectToEdit[`region_choice_${i}`] || ''
                        });
                    }
                }
            } else {
                locations.push({
                    id: Date.now(),
                    city: projectToEdit.city || '',
                    quartier: projectToEdit.quartier || '',
                    department: projectToEdit.department || '',
                    region: projectToEdit.region || ''
                });
            }
            if(locations.length === 0) {
                 locations.push({ id: Date.now(), city: '', quartier: '', department: '', region: '' })
            }

            setFormData({ ...initialFormData, ...projectToEdit, locations });
            const photoUrls = [projectToEdit.photo_url_1, projectToEdit.photo_url_2, projectToEdit.photo_url_3].filter(Boolean);
            setPhotos(photoUrls);
        }
    }, [projectToEdit]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (name, checked) => {
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleVisibilityChange = (value) => {
        setFormData(prev => {
            const currentVisibility = prev.visibility || [];
            const newVisibility = currentVisibility.includes(value)
                ? currentVisibility.filter(v => v !== value)
                : [...currentVisibility, value];
            return { ...prev, visibility: newVisibility };
        });
    };
    
    const uploadPhoto = async (photoFile) => {
        if (!photoFile || !(photoFile instanceof File)) return null;
        const fileName = `${profile.id}/${uuidv4()}`;
        const { data, error } = await supabase.storage.from('project-photos').upload(fileName, photoFile);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('project-photos').getPublicUrl(fileName);
        return publicUrl;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const isBuying = formData.type_projet === 'achat';
        const tableName = isBuying ? 'buying_projects_professionnel' : 'selling_projects_professionnel';
        
        const { locations, ...restOfData } = formData;
        
        let projectData = {
            ...restOfData,
            professionnel_id: profile.id,
            status: 'pending_match',
            visibility: formData.visibility,
        };
        
        if (isBuying) {
            locations.forEach((loc, index) => {
                projectData[`city_choice_${index + 1}`] = loc.city || null;
                projectData[`quartier_choice_${index + 1}`] = loc.quartier || null;
                projectData[`department_choice_${index + 1}`] = loc.department || null;
                projectData[`region_choice_${index + 1}`] = loc.region || null;
            });
             delete projectData.prix_demande;
             delete projectData.surface;
             delete projectData.bedrooms;
        } else {
            projectData.city = locations[0]?.city || null;
            projectData.quartier = locations[0]?.quartier || null;
            projectData.department = locations[0]?.department || null;
            projectData.region = locations[0]?.region || null;
            delete projectData.budget_max;
            delete projectData.surface_min;
            delete projectData.surface_max;
            delete projectData.bedrooms_min;
            
            const photoUrls = await Promise.all(
                photos.map(p => (p instanceof File) ? uploadPhoto(p) : Promise.resolve(p))
            );
            projectData.photo_url_1 = photoUrls[0] || null;
            projectData.photo_url_2 = photoUrls[1] || null;
            projectData.photo_url_3 = photoUrls[2] || null;
        }
        
        delete projectData.id;
        delete projectData.created_at;
        delete projectData.updated_at;
        delete projectData.professional;
        delete projectData.typeProjet;

        try {
            let error;
            if (projectToEdit) {
                const { error: updateError } = await supabase.from(tableName).update(projectData).eq('id', projectToEdit.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase.from(tableName).insert([projectData]);
                error = insertError;
            }

            if (error) throw error;
            
            toast({
                title: "Succès !",
                description: `Projet ${projectToEdit ? 'mis à jour' : 'créé'} avec succès.`
            });
            if (onSuccess) onSuccess();

        } catch (error) {
            console.error('Error submitting project', error);
            toast({
                variant: "destructive",
                title: "Erreur",
                description: `Une erreur est survenue: ${error.message}`
            });
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <ProjectDetailsSection
                formData={formData}
                handleChange={handleChange}
                handleSelectChange={handleSelectChange}
            />

            <LocationSection
                formData={formData}
                locationHook={locationHook}
                setFormData={setFormData}
            />

            {formData.type_projet === 'vente' && (
                <PhotoUploader photos={photos} setPhotos={setPhotos} />
            )}

            <AdditionalCriteriaSection
                formData={formData}
                handleCheckboxChange={handleCheckboxChange}
            />
            
            <SubmissionSection
                formData={formData}
                handleChange={handleChange}
                handleVisibilityChange={handleVisibilityChange}
                handleSelectChange={handleSelectChange}
                loading={loading}
                isEditing={!!projectToEdit}
            />

            <div className="flex justify-end">
                <Button type="submit" disabled={loading} className="w-full sm:w-auto bg-brand-orange hover:bg-orange-600">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {loading ? (projectToEdit ? 'Mise à jour...' : 'Création...') : (projectToEdit ? 'Mettre à jour le projet' : 'Créer le projet')}
                </Button>
            </div>
        </form>
    );
};

export default AgentProjectForm;