import React, { useEffect, useState } from 'react';
import { supabase } from "../../../../lib/customSupabaseClient";
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function PersonalProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data: pro } = await supabase.from('professionnels').select('id').eq('user_id', user.id).single();
      if (!pro) throw new Error("Profil pro introuvable");

      const [buyRes, sellRes] = await Promise.all([
        supabase
          .from('buying_projects_professionnel')
          .select('id, title, status, created_at, type_projet, visibility_public')
          .eq('professionnel_id', pro.id),
        supabase
          .from('selling_projects_professionnel')
          .select('id, title, status, created_at, type_projet, visibility_public')
          .eq('professionnel_id', pro.id)
      ]);

      const all = [...(buyRes.data || []), ...(sellRes.data || [])];
      all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setProjects(all);
    } catch (err) {
      console.error("Error fetching personal projects:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-purple-900">Mes Projets Personnels ({projects.length})</h2>
      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-purple-50/50 hover:bg-purple-50/50">
              <TableHead className="text-purple-900">Date</TableHead>
              <TableHead className="text-purple-900">Titre</TableHead>
              <TableHead className="text-purple-900">Type</TableHead>
              <TableHead className="text-purple-900">Visibilité</TableHead>
              <TableHead className="text-purple-900">Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  Aucun projet personnel.
                </TableCell>
              </TableRow>
            ) : (
              projects.map((proj) => (
                <TableRow key={proj.id} className="hover:bg-purple-50/10 transition-colors">
                  <TableCell className="whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(proj.created_at), 'dd MMM yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell className="font-medium">{proj.title || "Projet sans titre"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize border-purple-200 text-purple-700">{proj.type_projet}</Badge>
                  </TableCell>
                  <TableCell>
                    {proj.visibility_public ? (
                      <div className="flex items-center text-green-600 text-xs font-medium">
                        <Eye className="w-3 h-3 mr-1" /> Public
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-400 text-xs">
                        <EyeOff className="w-3 h-3 mr-1" /> Privé
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={proj.status === 'active' ? 'default' : 'secondary'} className={proj.status === 'active' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-100 text-gray-600'}>
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