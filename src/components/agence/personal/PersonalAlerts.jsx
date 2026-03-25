import React, { useEffect, useState } from 'react';
import { supabase } from "../../../../lib/customSupabaseClient";
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bell, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export default function PersonalAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) fetchAlerts();
  }, [user]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const { data: pro } = await supabase.from('professionnels').select('id').eq('user_id', user.id).single();
      if (!pro) return;

      const { data, error } = await supabase
        .from('project_alerts')
        .select('*')
        .eq('professionnel_id', pro.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (err) {
      console.error("Error fetching alerts:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger vos alertes."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase.from('project_alerts').update({ is_active: false }).eq('id', id);
      if (error) throw error;
      setAlerts(alerts.filter(a => a.id !== id));
      toast({ title: "Alerte supprimée" });
    } catch (err) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer l'alerte." });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-brand-blue" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Mes Alertes</h2>
        <Button>
          <Bell className="mr-2 h-4 w-4" /> Créer une alerte
        </Button>
      </div>

      {alerts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Bell className="h-12 w-12 mb-4 opacity-20" />
            <p>Aucune alerte active pour le moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {alerts.map((alert) => (
            <Card key={alert.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {alert.alert_name || "Alerte sans nom"}
                    <Badge variant="outline">{alert.type_projet || "Tout type"}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {alert.city_choice_1 || "Toute la France"} 
                    {alert.budget_max ? ` • Max ${alert.budget_max.toLocaleString()}€` : ""}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(alert.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}