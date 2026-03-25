import React, { useState, lazy, Suspense } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UserCheck, Briefcase, HeartHandshake, Users, Megaphone, Bell, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from '@/contexts/SupabaseAuthContext';

// Lazy load personal components
const DirectorPersonalProfileTab = lazy(() => import("@/components/agence/DirectorPersonalProfileTab"));
const ProfessionnelSharedProjectsPage = lazy(() => import("@/pages/ProfessionnelSharedProjectsPage"));
const ProfessionnelDirectLeadsPage = lazy(() => import("@/pages/ProfessionnelDirectLeadsPage"));
const ProfessionnelProfessionalMarketplacePage = lazy(() => import("@/pages/ProfessionnelProfessionalMarketplacePage"));
const ProfessionnelConnectionsPage = lazy(() => import("@/pages/ProfessionnelConnectionsPage"));
const ProfessionnelAlertsPage = lazy(() => import("@/pages/ProfessionnelAlertsPage"));

export default function PersonalSpaceContainer() {
  const [activeTab, setActiveTab] = useState("profile");
  const { user } = useAuth();

  return (
    <div className="bg-white min-h-[calc(100vh-200px)] rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center gap-3 bg-white">
        <div className="p-2 bg-purple-50 rounded-lg text-purple-700">
          <UserCheck className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Espace Personnel</h2>
          <p className="text-sm text-muted-foreground">Vos activités et votre profil directeur.</p>
        </div>
      </div>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          
          <div className="mb-8 overflow-x-auto pb-2">
            <TabsList className="bg-slate-50 border h-auto p-1.5 space-x-2 rounded-xl inline-flex min-w-max shadow-sm">
              <TabTriggerItem value="profile" icon={UserCheck} label="Mon Profil" activeColor="text-purple-700" bgActive="bg-white" />
              <TabTriggerItem value="projects" icon={Briefcase} label="Mes Projets" activeColor="text-purple-700" bgActive="bg-white" />
              <TabTriggerItem value="leads" icon={Megaphone} label="Leads Directs" activeColor="text-purple-700" bgActive="bg-white" />
              <TabTriggerItem value="marketplace" icon={HeartHandshake} label="Marché Inter-pro" activeColor="text-purple-700" bgActive="bg-white" />
              <TabTriggerItem value="connections" icon={Users} label="Relations" activeColor="text-purple-700" bgActive="bg-white" />
              <TabTriggerItem value="alerts" icon={Bell} label="Alertes" activeColor="text-purple-700" bgActive="bg-white" />
            </TabsList>
          </div>

          <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-purple-600" /></div>}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <TabsContent value="profile" className="mt-0 focus-visible:ring-0">
                <DirectorPersonalProfileTab />
              </TabsContent>

              <TabsContent value="projects" className="mt-0 focus-visible:ring-0">
                {/* Reusing existing shared projects page logic */}
                <ProfessionnelSharedProjectsPage isPublicShowcase={false} professionnelId={null} />
              </TabsContent>

              <TabsContent value="leads" className="mt-0 focus-visible:ring-0">
                <ProfessionnelDirectLeadsPage />
              </TabsContent>

              <TabsContent value="marketplace" className="mt-0 focus-visible:ring-0">
                <ProfessionnelProfessionalMarketplacePage />
              </TabsContent>

              <TabsContent value="connections" className="mt-0 focus-visible:ring-0">
                <ProfessionnelConnectionsPage />
              </TabsContent>

              <TabsContent value="alerts" className="mt-0 focus-visible:ring-0">
                <ProfessionnelAlertsPage />
              </TabsContent>
            </motion.div>
          </Suspense>
        </Tabs>
      </div>
    </div>
  );
}

function TabTriggerItem({ value, icon: Icon, label, activeColor, bgActive }) {
  return (
    <TabsTrigger 
      value={value} 
      className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all data-[state=active]:${bgActive} data-[state=active]:${activeColor} data-[state=active]:shadow-sm hover:bg-gray-100 hover:text-gray-900 text-gray-500`}
    >
      <Icon className="w-4 h-4 mr-2" />
      {label}
    </TabsTrigger>
  );
}