import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, User, Briefcase, MapPin } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const MatchingPage = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [project, setProject] = useState(null);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjectAndProfessionals = async () => {
      try {
        setLoading(true);
        
        // Fetch project details
        const { data: projectData, error: projectError } = await supabase
          .from('projects_marketplace_unified')
          .select('*')
          .eq('id', projectId)
          .single();

        if (projectError) throw projectError;
        setProject(projectData);

        // Fetch matching professionals
        // This is a simplified matching logic. In a real app, this would be a complex query or a call to a Supabase function.
        const { data: professionalsData, error: professionalsError } = await supabase
          .from('professionnels')
          .select('*')
          .eq('is_validated_by_administrator', true)
          .limit(5);

        if (professionalsError) throw professionalsError;
        setProfessionals(professionalsData);

      } catch (err) {
        setError(err.message);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les informations du projet et des professionnels.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProjectAndProfessionals();
    }
  }, [projectId, toast]);

  const handleConnectionRequest = async (professionalId) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour envoyer une demande de mise en relation.",
        action: <Button onClick={() => navigate('/connexion')}>Se connecter</Button>,
      });
      return;
    }

    try {
      const { error } = await supabase.from('connections').insert({
        requesting_user_id: user.id,
        target_user_id: professionalId,
        status: 'pending',
        connection_type: 'particulier_to_professionnel',
        // Assuming the project is from a particulier
        buying_project_particulier_id: project.source === 'particulier' && project.type_projet === 'achat' ? project.id : null,
        selling_project_particulier_id: project.source === 'particulier' && project.type_projet === 'vente' ? project.id : null,
      });

      if (error) throw error;

      toast({
        title: "Demande envoyée !",
        description: "Votre demande de mise en relation a été envoyée avec succès.",
      });

    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi de la demande.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-4">Projet et Professionnels compatibles</h1>
      
      {project && (
        <Card className="mb-8 bg-gray-50">
          <CardHeader>
            <CardTitle>{project.title || 'Détails du projet'}</CardTitle>
            <CardDescription>Votre projet de {project.type_projet} pour un bien de type {project.type_bien}.</CardDescription>
          </CardHeader>
          <CardContent>
            <p><MapPin className="inline-block h-4 w-4 mr-2" />Localisation: {project.city_choice_1}</p>
            <p>Budget max: {project.budget_max ? `${project.budget_max} €` : 'N/A'}</p>
            <p>Surface min: {project.surface_min ? `${project.surface_min} m²` : 'N/A'}</p>
          </CardContent>
        </Card>
      )}

      <h2 className="text-2xl font-semibold text-center mb-6">Nos agents recommandés pour vous</h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {professionals.map((pro) => (
          <Card key={pro.id} className="flex flex-col">
            <CardHeader className="flex-row items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={pro.avatar_url} alt={`${pro.first_name} ${pro.last_name}`} />
                <AvatarFallback><User /></AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{pro.first_name} {pro.last_name}</CardTitle>
                <CardDescription>{pro.company_name}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-gray-600 line-clamp-3">{pro.professionnal_presentation || 'Aucune présentation disponible.'}</p>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => handleConnectionRequest(pro.id)}>
                <Briefcase className="mr-2 h-4 w-4" />
                Demander une mise en relation
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MatchingPage;