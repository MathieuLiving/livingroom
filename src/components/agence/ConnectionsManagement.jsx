import React, { useEffect, useState } from 'react';
import { supabase } from "../../../lib/customSupabaseClient";
import { useAgencyData } from '@/hooks/useAgencyData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight } from "lucide-react";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ConnectionsManagement() {
  const { agencyId } = useAgencyData();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (agencyId) fetchConnections();
  }, [agencyId]);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      // Use the RPC that returns all connections for the agency scope
      const { data, error } = await supabase.rpc('agency_contacts');
      if (error) throw error;
      setConnections(data || []);
    } catch (err) {
      console.error("Error fetching connections:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-brand-blue" /></div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Mises en relation ({connections.length})</h2>
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Demandeur</TableHead>
              <TableHead></TableHead>
              <TableHead>Destinataire</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {connections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  Aucune mise en relation trouvée.
                </TableCell>
              </TableRow>
            ) : (
              connections.map((conn) => (
                <TableRow key={conn.connection_id}>
                  <TableCell className="whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(conn.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">
                      {conn.pro_requesting_first_name} {conn.pro_requesting_last_name}
                    </div>
                    <div className="text-xs text-muted-foreground">{conn.pro_requesting_email}</div>
                  </TableCell>
                  <TableCell>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">
                      {conn.pro_target_first_name} {conn.pro_target_last_name}
                    </div>
                    <div className="text-xs text-muted-foreground">{conn.pro_target_email}</div>
                  </TableCell>
                  <TableCell>
                    <ConnectionStatusBadge status={conn.status} />
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

function ConnectionStatusBadge({ status }) {
  const styles = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    approved: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
  };
  
  const labels = {
    pending: "En attente",
    approved: "Acceptée",
    rejected: "Refusée",
  };

  return (
    <Badge variant="outline" className={styles[status] || styles.pending}>
      {labels[status] || status}
    </Badge>
  );
}