import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Loader2, Eye } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/lib/customSupabaseClient";
import SEO from "@/components/SEO";

const ClientRow = ({ client, onShowDetails }) => {
  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{client.first_name} {client.last_name}</div>
        <div className="text-xs text-muted-foreground">{client.email}</div>
      </TableCell>
      <TableCell>{client.phone || 'N/A'}</TableCell>
      <TableCell>
        {new Date(client.created_at).toLocaleDateString('fr-FR')}
      </TableCell>
      <TableCell>
        <Badge variant="outline">{client.buying_projects_particulier.length + client.selling_projects_particulier.length}</Badge>
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm" onClick={() => onShowDetails(client)}>
          <Eye className="h-4 w-4 mr-1" />
          Détails
        </Button>
      </TableCell>
    </TableRow>
  );
};

const AdminClientsViewPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { profile: adminProfile, loading: authLoading } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('particuliers')
      .select(`
        *,
        buying_projects_particulier!fk_buying_project(*),
        selling_projects_particulier!fk_selling_project(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les clients." });
      console.error(error);
    } else {
      setClients(data);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    if (!authLoading) {
      if (!adminProfile || adminProfile.role !== 'admin') {
        toast({ variant: "destructive", title: "Accès non autorisé" });
        navigate("/");
        return;
      }
      fetchClients();
    }
  }, [adminProfile, authLoading, navigate, toast, fetchClients]);

  const handleShowDetails = (client) => {
    let details = `Client: ${client.first_name} ${client.last_name}\n`;
    details += `Email: ${client.email}\n`;
    details += `Téléphone: ${client.phone || 'N/A'}\n\n`;
    
    details += `PROJETS D'ACHAT (${client.buying_projects_particulier.length}):\n`;
    client.buying_projects_particulier.forEach(p => {
        details += `  - ${p.type_bien} à ${p.city_choice_1 || 'N/A'}, Budget: ${p.budget_max}€\n`;
    });
    if(client.buying_projects_particulier.length === 0) details += `  (aucun)\n`;

    details += `\nPROJETS DE VENTE (${client.selling_projects_particulier.length}):\n`;
    client.selling_projects_particulier.forEach(p => {
        details += `  - ${p.type_bien} à ${p.city || 'N/A'}, Prix: ${p.prix_demande}€\n`;
    });
    if(client.selling_projects_particulier.length === 0) details += `  (aucun)\n`;

    toast({
      title: `Détails pour ${client.first_name}`,
      description: <pre className="whitespace-pre-wrap text-xs max-h-96 overflow-y-auto">{details}</pre>,
      duration: 20000,
    });
  };

  if (loading || authLoading) {
    return <div className="container mx-auto px-4 py-10 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-brand-blue" /></div>;
  }
  if (!adminProfile || adminProfile.role !== 'admin') return null;

  return (
    <div className="container mx-auto px-4 py-10">
      <SEO
        title="Gestion des Clients"
        description="Consultez la liste des particuliers et leurs projets."
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <h1 className="text-3xl font-bold mb-2 text-brand-blue flex items-center justify-center">
          <Users className="mr-3 h-8 w-8" /> Gestion des Clients
        </h1>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto">
          Consultez la liste des particuliers et leurs activités sur la plateforme.
        </p>
      </motion.div>
      
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-brand-blue">Liste des Particuliers ({clients.length})</CardTitle>
          <CardDescription>Cliquez sur <Eye className="inline h-4 w-4" /> voir les détails des projets.</CardDescription>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Aucun particulier trouvé.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Inscrit le</TableHead>
                    <TableHead>Projets</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map(client => (
                    <ClientRow key={client.id} client={client} onShowDetails={handleShowDetails} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="mt-8 text-center">
        <Button onClick={() => navigate("/admin/dashboard")} className="bg-brand-blue text-white hover:bg-opacity-90">
          Retour au tableau de bord
        </Button>
      </div>
    </div>
  );
};

export default AdminClientsViewPage;