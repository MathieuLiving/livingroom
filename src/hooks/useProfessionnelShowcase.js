import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/lib/customSupabaseClient";
import { useToast } from "@/components/ui/use-toast";

export const useProfessionnelShowcase = (professionnelId) => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [professionnel, setProfessionnel] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchProfessionnelAndProjects = useCallback(async () => {
        setLoading(true);

        if (!supabase) {
            console.error("Supabase client not initialized");
            toast({
                variant: "destructive",
                title: "Erreur système",
                description: "Impossible de charger les données (Configuration manquante).",
            });
            setLoading(false);
            return;
        }

        try {
            const { data: professionnelData, error: professionnelError } = await supabase
                .from('professionnels')
                .select('*')
                .eq('id', professionnelId)
                .eq('is_validated_by_administrator', true)
                .single();

            if (professionnelError) throw professionnelError;
            setProfessionnel(professionnelData);

            if (professionnelData) {
                const { data: projectsData, error: projectsError } = await supabase
                    .rpc('get_showcase_projects_for_professionnels', { professionnel_ids: [professionnelId] });

                if (projectsError) throw projectsError;
                
                const formattedProjects = projectsData.map(p => ({
                    ...p,
                    source: 'professionnel',
                    professionnel_id: p.professional_id,
                    owner_first_name: p.first_name,
                    owner_last_name: p.last_name,
                    owner_company_name: p.company_name,
                }));

                setProjects(formattedProjects || []);
            }
        } catch (error) {
            console.error('Error fetching showcase data:', error);
            navigate('/nos-professionnels-partenaires');
        } finally {
            setLoading(false);
        }
    }, [professionnelId, navigate, toast]);

    useEffect(() => {
        fetchProfessionnelAndProjects();
    }, [fetchProfessionnelAndProjects]);
    
    return { professionnel, projects, loading };
};