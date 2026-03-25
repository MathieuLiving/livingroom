import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, FolderOpen, UserPlus, Bell, MessageSquare, Briefcase } from "lucide-react";

// Reuse existing components or placeholders if they are complex/managed elsewhere
import ProfessionnelProfilePage from "@/pages/ProfessionnelProfilePage"; // Reusing the profile edit logic
import ProfessionnelSharedProjectsPage from "@/pages/ProfessionnelSharedProjectsPage"; // Reusing projects
import ProfessionnelConnectionsPage from "@/pages/ProfessionnelConnectionsPage"; // Reusing connections
import ProfessionnelDirectLeadsPage from "@/pages/ProfessionnelDirectLeadsPage"; // Reusing leads
import ProfessionnelAlertsPage from "@/pages/ProfessionnelAlertsPage"; // Reusing alerts
import ProfessionnelProfessionalMarketplacePage from "@/pages/ProfessionnelProfessionalMarketplacePage"; // Reusing marketplace

// Note: These pages usually have their own Layout/Header. 
// Since we are embedding them in a tab, we might need to ensure they don't double render headers or we accept that for now.
// Ideally, we'd extract the "content" part of these pages into components.
// For this task, assuming we can mount them or their main content containers here.

const TabWrapper = ({ children }) => (
  <div className="mt-6 min-h-[500px]">
    {children}
  </div>
);

export default function DirectorPersonalProfileTab({ directorProId }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Mon Espace Personnel</h2>
        <p className="text-muted-foreground">Gérez votre activité propre (projets, leads, réseau) en tant que mandataire.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="w-full justify-start h-auto p-1 bg-slate-100 flex-wrap overflow-x-auto">
          <TabsTrigger value="profile" className="flex items-center gap-2"><User className="w-4 h-4" /> Profil</TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2"><FolderOpen className="w-4 h-4" /> Mes Projets</TabsTrigger>
          <TabsTrigger value="leads" className="flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Leads Directs</TabsTrigger>
          <TabsTrigger value="connections" className="flex items-center gap-2"><UserPlus className="w-4 h-4" /> Mises en relation</TabsTrigger>
          <TabsTrigger value="marketplace" className="flex items-center gap-2"><Briefcase className="w-4 h-4" /> Marché Inter-pro</TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2"><Bell className="w-4 h-4" /> Alertes</TabsTrigger>
        </TabsList>

        <TabWrapper>
          <TabsContent value="profile">
            {/* Embedding the Profile Page Logic - usually this expects full page, here used as component */}
            <ProfessionnelProfilePage embedded={true} />
          </TabsContent>
          
          <TabsContent value="projects">
            <ProfessionnelSharedProjectsPage embedded={true} />
          </TabsContent>
          
          <TabsContent value="leads">
            <ProfessionnelDirectLeadsPage embedded={true} />
          </TabsContent>
          
          <TabsContent value="connections">
            <ProfessionnelConnectionsPage embedded={true} />
          </TabsContent>
          
          <TabsContent value="marketplace">
            <ProfessionnelProfessionalMarketplacePage embedded={true} />
          </TabsContent>
          
          <TabsContent value="alerts">
            <ProfessionnelAlertsPage embedded={true} />
          </TabsContent>
        </TabWrapper>
      </Tabs>
    </div>
  );
}