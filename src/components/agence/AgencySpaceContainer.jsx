import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Settings, UserCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/customSupabaseClient";
import { useAuth } from "@/contexts/SupabaseAuthContext";

// Components
import AgencyConfigurationContainer from "@/components/agence/AgencyConfigurationContainer";
import DirectorPersonalProfileTab from "@/components/agence/DirectorPersonalProfileTab";

export default function AgencySpaceContainer() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("agency");
  const [agency, setAgency] = useState(null);
  const [viewerProfessionnelId, setViewerProfessionnelId] = useState(null);
  const [viewerAgencyRole, setViewerAgencyRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchContext();
  }, [user]);

  const fetchContext = async () => {
    try {
      const { data: pro, error: proError } = await supabase
        .from("professionnels")
        .select("id, agency_id, agency_role")
        .eq("user_id", user.id)
        .single();

      if (proError) throw proError;

      setViewerProfessionnelId(pro.id);
      setViewerAgencyRole(pro.agency_role);

      if (pro.agency_id) {
        const { data: agencyData, error: agencyError } = await supabase
          .from("agencies")
          .select("*")
          .eq("id", pro.agency_id)
          .single();

        if (agencyError) throw agencyError;
        setAgency(agencyData);
      }
    } catch (err) {
      console.error("Error loading agency context:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="p-8 text-center">
        Aucune agence trouvée pour ce compte.
      </div>
    );
  }

  const spaceLabel =
    viewerAgencyRole === "director"
      ? "Espace Directeur"
      : viewerAgencyRole === "team_leader"
        ? "Espace Team Leader"
        : "Espace Agence";

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{agency.name}</h1>
            <p className="text-gray-500">{spaceLabel}</p>
          </div>

          <div className="bg-white px-4 py-2 rounded-full shadow-sm text-sm font-medium text-brand-blue border">
            Agence: {agency.name}
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full space-y-6"
        >
          <div className="w-full flex justify-center md:justify-start">
            <TabsList className="bg-white border h-14 p-1.5 space-x-2 rounded-2xl shadow-sm w-full md:w-auto grid grid-cols-2 md:inline-flex">
              <TabsTrigger
                value="agency"
                className="h-full px-6 text-base rounded-xl data-[state=active]:bg-brand-blue data-[state=active]:text-white"
              >
                <Settings className="w-5 h-5 mr-2" />
                Gestion Agence
              </TabsTrigger>

              <TabsTrigger
                value="personal"
                className="h-full px-6 text-base rounded-xl data-[state=active]:bg-brand-blue data-[state=active]:text-white"
              >
                <UserCircle className="w-5 h-5 mr-2" />
                Mon Espace Perso
              </TabsTrigger>
            </TabsList>
          </div>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <TabsContent value="agency" className="mt-0">
              <AgencyConfigurationContainer
                agencyId={agency.id}
                viewerProfessionnelId={viewerProfessionnelId}
                viewerAgencyRole={viewerAgencyRole}
              />
            </TabsContent>

            <TabsContent value="personal" className="mt-0">
              <DirectorPersonalProfileTab
                directorProId={viewerProfessionnelId}
              />
            </TabsContent>
          </motion.div>
        </Tabs>
      </div>
    </div>
  );
}