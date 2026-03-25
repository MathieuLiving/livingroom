import React, { useEffect, useState } from 'react';
import { supabase } from "../../../lib/customSupabaseClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, Briefcase, Users, LayoutDashboard, Bell, HeartHandshake, Star } from "lucide-react";
import DirectorProfileForm from './DirectorProfileForm';

export default function DirectorProfileSection() {
  const [director, setDirector] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    async function fetchDirector() {
      try {
        setLoading(true);
        // Get the current professional ID
        const { data: proId, error: rpcError } = await supabase.rpc('current_professionnel_id');
        if (rpcError) throw rpcError;

        if (proId) {
          const { data: proData, error: proError } = await supabase
            .from('professionnels')
            .select('*')
            .eq('id', proId)
            .single();
          
          if (proError) throw proError;
          setDirector(proData);
        }
      } catch (err) {
        console.error("Error fetching director profile:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDirector();
  }, []);

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-brand-blue" /></div>;
  }

  if (!director) {
    return <div className="p-8 text-center">Profil introuvable.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Profile */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-lg border shadow-sm">
        <Avatar className="h-20 w-20 border-2 border-gray-100">
          <AvatarImage src={director.avatar_url} />
          <AvatarFallback className="text-lg bg-brand-blue/10 text-brand-blue">
            {director.first_name?.[0]}{director.last_name?.[0]}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{director.first_name} {director.last_name}</h2>
          <p className="text-gray-500 flex items-center gap-2">
            {director.email} • {director.phone || "Pas de téléphone"}
          </p>
          <div className="mt-2 flex gap-2">
             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
               Directeur d'Agence
             </span>
          </div>
        </div>
        <div className="ml-auto">
           {/* Edit button logic usually handles switching to edit mode, here integrated in tabs */}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b rounded-none space-x-4 overflow-x-auto no-scrollbar">
          <TabTriggerItem value="overview" icon={LayoutDashboard} label="Vue d'ensemble" />
          <TabTriggerItem value="projects" icon={Briefcase} label="Mes Projets" />
          <TabTriggerItem value="marketplace" icon={HeartHandshake} label="Marché Inter-pro" />
          <TabTriggerItem value="connections" icon={Users} label="Relations" />
          <TabTriggerItem value="leads" icon={Star} label="Leads Directs" />
          <TabTriggerItem value="alerts" icon={Bell} label="Alertes" />
          <TabTriggerItem value="settings" icon={Users} label="Modifier Profil" />
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
               <PlaceholderCard title="Activité Récente" icon={LayoutDashboard} />
               <PlaceholderCard title="Statistiques Personnelles" icon={Briefcase} />
               <PlaceholderCard title="Notifications" icon={Bell} />
            </div>
          </TabsContent>

          <TabsContent value="projects">
            <PlaceholderSection title="Mes Projets Personnels" description="Gérez ici les projets dont vous êtes le mandataire direct." />
          </TabsContent>

          <TabsContent value="marketplace">
            <PlaceholderSection title="Marché Inter-pro" description="Accédez aux opportunités de partage de mandat avec d'autres professionnels." />
          </TabsContent>

          <TabsContent value="connections">
            <PlaceholderSection title="Mes Relations" description="Vos demandes de mise en relation et votre réseau personnel." />
          </TabsContent>

          <TabsContent value="leads">
            <PlaceholderSection title="Leads Directs" description="Les prospects qui vous ont contacté directement via votre profil ou vos projets." />
          </TabsContent>

          <TabsContent value="alerts">
            <PlaceholderSection title="Mes Alertes" description="Configurez vos alertes de recherche de biens." />
          </TabsContent>

          <TabsContent value="settings">
            <DirectorProfileForm />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function TabTriggerItem({ value, icon: Icon, label }) {
  return (
    <TabsTrigger 
      value={value} 
      className="data-[state=active]:border-brand-blue data-[state=active]:text-brand-blue data-[state=active]:shadow-none border-b-2 border-transparent rounded-none px-2 py-3 bg-transparent h-auto font-medium text-gray-500 hover:text-gray-700"
    >
      <Icon className="w-4 h-4 mr-2" />
      {label}
    </TabsTrigger>
  );
}

function PlaceholderCard({ title, icon: Icon }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">-</div>
        <p className="text-xs text-muted-foreground">Données indisponibles</p>
      </CardContent>
    </Card>
  );
}

function PlaceholderSection({ title, description }) {
  return (
    <Card className="border-dashed bg-gray-50/50">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="py-10 text-center text-muted-foreground">
        <p>Cette section est en cours de construction.</p>
        <p className="text-sm mt-2">Bientôt disponible dans votre espace directeur.</p>
      </CardContent>
    </Card>
  );
}