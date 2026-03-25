import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageCircle, ArrowLeft } from 'lucide-react';
import SEO from '@/components/SEO';

const ProjectOwnerConnectionsPage = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchConnections = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('connections')
        .select(`
          *,
          requester_pro:professionnels!requesting_user_id(id, first_name, last_name, avatar_url, company_name),
          target_pro:professionnels!target_user_id(id, first_name, last_name, avatar_url, company_name)
        `)
        .or(`requesting_user_id.eq.${profile.id},target_user_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setConnections(data);

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les mises en relation."
      });
      console.error("Error fetching connections:", error);
    } finally {
      setLoading(false);
    }
  }, [profile, toast]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/particuliers');
      } else if(profile) {
        fetchConnections();
      }
    }
  }, [user, profile, authLoading, navigate, fetchConnections]);

  const handleUpdateConnectionStatus = async (connectionId, newStatus) => {
    try {
      const { error } = await supabase
        .from('connections')
        .update({ status: newStatus })
        .eq('id', connectionId);

      if (error) throw error;

      setConnections(prev =>
        prev.map(conn =>
          conn.id === connectionId ? { ...conn, status: newStatus } : conn
        )
      );
      toast({
        title: "Succès",
        description: `La mise en relation a été ${newStatus === 'approved' ? 'acceptée' : 'refusée'}.`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour la mise en relation."
      });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary">En attente de votre réponse</Badge>;
      case 'approved': return <Badge variant="success">Acceptée</Badge>;
      case 'rejected': return <Badge variant="destructive">Refusée</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <>
      <SEO title="Mes Mises en Relation" description="Gérez vos mises en relation avec des professionnels de l'immobilier." />
      <div className="container mx-auto px-4 py-10">
        <Button variant="ghost" onClick={() => navigate('/dashboard-particulier')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au tableau de bord
        </Button>
        <h1 className="text-3xl font-bold text-brand-blue mb-4">Mes Mises en Relation</h1>
        <p className="text-lg text-gray-600 mb-8">
          Voici la liste des professionnels qui souhaitent vous accompagner dans votre projet.
        </p>

        {connections.length > 0 ? (
          <div className="space-y-4">
            {connections.map(conn => {
                const isUserTarget = conn.target_user_id === user.id;
                const professionalProfile = isUserTarget ? conn.requester_pro : conn.target_pro;
                
                if (!professionalProfile) return null;

                return (
              <Card key={conn.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={professionalProfile.avatar_url} />
                      <AvatarFallback>{professionalProfile.first_name?.[0]}{professionalProfile.last_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{professionalProfile.first_name} {professionalProfile.last_name}</CardTitle>
                      <CardDescription>{professionalProfile.company_name || 'Indépendant'}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                      Reçu le: {new Date(conn.created_at).toLocaleDateString('fr-FR')}
                    </p>
                    {getStatusBadge(conn.status)}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 bg-slate-50 p-3">
                  {conn.status === 'pending' && isUserTarget && (
                    <>
                      <Button variant="outline" onClick={() => handleUpdateConnectionStatus(conn.id, 'rejected')}>Refuser</Button>
                      <Button variant="success" onClick={() => handleUpdateConnectionStatus(conn.id, 'approved')}>Accepter</Button>
                    </>
                  )}
                  {conn.status === 'approved' && (
                    <Button onClick={() => navigate(`/chat/${conn.id}`)}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Contacter
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )})}
          </div>
        ) : (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <p className="text-gray-500">Aucune mise en relation pour le moment.</p>
            <p className="text-sm text-gray-400 mt-2">Dès qu'un professionnel sera intéressé par votre projet, vous le verrez ici.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default ProjectOwnerConnectionsPage;