import React, { useEffect, useState } from 'react';
import { supabase } from "../../../../lib/customSupabaseClient";
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight } from "lucide-react";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function PersonalConnections() {
  const { user } = useAuth();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchConnections();
  }, [user]);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      // Fetch personal connections (where user is requestor or target)
      // Note: This matches "Mes relations" for the individual director, not the whole agency
      const { data, error } = await supabase
        .from('connections')
        .select(`
          *,
          requesting_pro:requesting_professionnel_id(first_name, last_name, email, company_name),
          target_pro:target_professionnel_id(first_name, last_name, email, company_name)
        `)
        .or(`requesting_user_id.eq.${user.id},target_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConnections(data || []);
    } catch (err) {
      console.error("Error fetching personal connections:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-purple-900">Mes Relations ({connections.length})</h2>
      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-purple-50/50 hover:bg-purple-50/50">
              <TableHead className="text-purple-900">Date</TableHead>
              <TableHead className="text-purple-900">Autre Partie</TableHead>
              <TableHead className="text-purple-900">Type</TableHead>
              <TableHead className="text-purple-900">Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {connections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                  Aucune relation personnelle.
                </TableCell>
              </TableRow>
            ) : (
              connections.map((conn) => {
                const isRequester = conn.requesting_user_id === user.id;
                const other = isRequester ? conn.target_pro : conn.requesting_pro;
                // Fallback if other party is not a pro (e.g. particulier)
                const otherName = other ? `${other.first_name} ${other.last_name}` : "Utilisateur";
                const otherDetails = other ? (other.company_name || other.email) : "Particulier";

                return (
                  <TableRow key={conn.id} className="hover:bg-purple-50/10 transition-colors">
                    <TableCell className="whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(conn.created_at), 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{otherName}</div>
                      <div className="text-xs text-muted-foreground">{otherDetails}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {isRequester ? "Envoyée" : "Reçue"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={
                        conn.status === 'approved' ? 'bg-green-100 text-green-800' :
                        conn.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>
                        {conn.status === 'approved' ? 'Acceptée' : conn.status === 'rejected' ? 'Refusée' : 'En attente'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}