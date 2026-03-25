import React, { useEffect, useState } from 'react';
import { supabase } from "../../../lib/customSupabaseClient";
import { useAgencyData } from '@/hooks/useAgencyData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function DirectLeadsManagement() {
  const { agencyId } = useAgencyData();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (agencyId) fetchLeads();
  }, [agencyId]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('direct_leads')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (err) {
      console.error("Error fetching leads:", err);
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

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-brand-blue" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Leads Directs ({leads.length})</h2>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher..." 
            className="pl-8" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Projet</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Budget / Prix</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  Aucun lead trouvé.
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
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
                    <Badge variant="outline" className="capitalize">{lead.type_projet} {lead.type_bien}</Badge>
                  </TableCell>
                  <TableCell>
                    {lead.budget_max || lead.prix_demande 
                      ? `${(lead.budget_max || lead.prix_demande).toLocaleString()} €`
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    <LeadStatusBadge status={lead.status} />
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

function LeadStatusBadge({ status }) {
  const styles = {
    active: "bg-green-100 text-green-800 border-green-200",
    processed: "bg-blue-100 text-blue-800 border-blue-200",
    archived: "bg-gray-100 text-gray-800 border-gray-200",
  };
  
  const labels = {
    active: "Nouveau",
    processed: "Traité",
    archived: "Archivé",
  };

  return (
    <Badge variant="outline" className={styles[status] || styles.archived}>
      {labels[status] || status}
    </Badge>
  );
}