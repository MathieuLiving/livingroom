import React, { useEffect, useState } from 'react';
import { supabase } from "../../../../lib/customSupabaseClient";
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function PersonalLeads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) fetchLeads();
  }, [user]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      // Fetch pro ID
      const { data: pro } = await supabase.from('professionnels').select('id').eq('user_id', user.id).single();
      if (!pro) throw new Error("Profil pro introuvable");

      const { data, error } = await supabase
        .from('direct_leads')
        .select('*')
        .eq('professionnel_id', pro.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (err) {
      console.error("Error fetching personal leads:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(lead => 
    (lead.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lead.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lead.project_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-purple-900">Mes Leads Directs ({leads.length})</h2>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher..." 
            className="pl-8 border-purple-100 focus:ring-purple-500" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-purple-50/50 hover:bg-purple-50/50">
              <TableHead className="text-purple-900">Date</TableHead>
              <TableHead className="text-purple-900">Contact</TableHead>
              <TableHead className="text-purple-900">Projet</TableHead>
              <TableHead className="text-purple-900">Type</TableHead>
              <TableHead className="text-purple-900">Budget / Prix</TableHead>
              <TableHead className="text-purple-900">Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  Aucun lead personnel trouvé.
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => (
                <TableRow key={lead.id} className="hover:bg-purple-50/10 transition-colors">
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(lead.created_at), 'dd MMM yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{lead.first_name} {lead.last_name}</div>
                    <div className="text-xs text-muted-foreground">{lead.email}</div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={lead.project_title}>
                    {lead.project_title || "Projet sans titre"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize border-purple-200 text-purple-700">{lead.type_projet} {lead.type_bien}</Badge>
                  </TableCell>
                  <TableCell>
                    {lead.budget_max || lead.prix_demande 
                      ? `${(lead.budget_max || lead.prix_demande).toLocaleString()} €`
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                      {lead.status || 'Nouveau'}
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