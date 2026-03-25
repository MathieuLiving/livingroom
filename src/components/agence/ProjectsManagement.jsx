import React, { useEffect, useState } from 'react';
import { supabase } from "../../../lib/customSupabaseClient";
import { useAgencyData } from '@/hooks/useAgencyData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ProjectsManagement() {
  const { agencyId } = useAgencyData();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (agencyId) fetchProjects();
  }, [agencyId]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      // Combine buying and selling projects for the agency
      const [buyRes, sellRes] = await Promise.all([
        supabase
          .from('buying_projects_professionnel')
          .select('id, title, status, created_at, type_projet, visibility_public, assigned_to')
          .eq('agency_id', agencyId),
        supabase
          .from('selling_projects_professionnel')
          .select('id, title, status, created_at, type_projet, visibility_public, assigned_to')
          .eq('agency_id', agencyId)
      ]);

      if (buyRes.error) throw buyRes.error;
      if (sellRes.error) throw sellRes.error;

      const all = [...(buyRes.data || []), ...(sellRes.data || [])];
      // Sort by date desc
      all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setProjects(all);
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-brand-blue" /></div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Projets de l'agence ({projects.length})</h2>
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Titre</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Visibilité</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  Aucun projet trouvé.
                </TableCell>
              </TableRow>
            ) : (
              projects.map((proj) => (
                <TableRow key={proj.id}>
                  <TableCell className="whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(proj.created_at), 'dd MMM yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell className="font-medium">{proj.title || "Projet sans titre"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{proj.type_projet}</Badge>
                  </TableCell>
                  <TableCell>
                    {proj.visibility_public ? (
                      <div className="flex items-center text-green-600 text-xs">
                        <Eye className="w-3 h-3 mr-1" /> Public
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-400 text-xs">
                        <EyeOff className="w-3 h-3 mr-1" /> Privé
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={proj.status === 'active' ? 'default' : 'secondary'} className={proj.status === 'active' ? 'bg-brand-blue' : ''}>
                      {proj.status === 'active' ? 'Actif' : proj.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}