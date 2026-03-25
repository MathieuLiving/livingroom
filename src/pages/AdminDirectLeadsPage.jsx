import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, QrCode, Link as LinkIcon, User, Search, Briefcase } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import ProjectVignette from '@/components/project/ProjectVignette';
import SEO from '@/components/SEO';

const AdminDirectLeadsPage = () => {
  const { toast } = useToast();
  const [professionals, setProfessionals] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: proData, error: proError } = await supabase
        .from('professionnels')
        .select('id, first_name, last_name, company_name, email, card_url_clicks, card_qr_scans')
        .order('last_name', { ascending: true });

      if (proError) throw proError;

      const { data: leadData, error: leadError } = await supabase
        .from('direct_leads')
        .select('id, professionnel_id, created_at, payload, project_title, type_projet, type_bien, city_choice_1, budget_max, prix_demande, surface_min, surface_max, surface, bedrooms_min, delai, description');

      if (leadError) throw leadError;

      setProfessionals(proData || []);
      setLeads(leadData || []);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur de chargement',
        description: 'Impossible de charger les données. Vérifiez les RLS.',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const professionalsWithLeads = useMemo(() => {
    return professionals.map(pro => ({
      ...pro,
      direct_leads: leads.filter(lead => lead.professionnel_id === pro.id),
    }));
  }, [professionals, leads]);

  const filteredProfessionals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return professionalsWithLeads;
    return professionalsWithLeads.filter(p => {
      const hay = `${p.first_name ?? ''} ${p.last_name ?? ''} ${p.company_name ?? ''} ${p.email ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [professionalsWithLeads, searchQuery]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <SEO
        title="Suivi des Leads Directs"
        description="Suivez les performances des cartes de visite digitales des professionnels."
      />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
        <h1 className="text-3xl font-bold text-brand-blue">Suivi des Leads Directs</h1>
        <p className="text-lg text-gray-700">
          Suivez les performances des cartes de visite digitales et les leads captés par chaque professionnel.
        </p>
      </motion.div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Rechercher un professionnel..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Accordion type="multiple" className="space-y-4">
        {filteredProfessionals.map(pro => (
          <motion.div key={pro.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card>
              <AccordionItem value={pro.id} className="border-b-0">
                <AccordionTrigger className="p-4 hover:no-underline">
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-brand-blue" />
                      <p className="font-semibold text-lg">{pro.first_name} {pro.last_name}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{pro.company_name || pro.email}</p>
                    <div className="flex items-center gap-6 mt-2 text-sm">
                      <div className="flex items-center gap-2" title="Scans du QR Code">
                        <QrCode className="h-4 w-4 text-gray-600" />
                        <span>{pro.card_qr_scans || 0}</span>
                      </div>
                      <div className="flex items-center gap-2" title="Clics sur l'URL">
                        <LinkIcon className="h-4 w-4 text-gray-600" />
                        <span>{pro.card_url_clicks || 0}</span>
                      </div>
                      <div className="flex items-center gap-2" title="Leads captés">
                        <Briefcase className="h-4 w-4 text-gray-600" />
                        <span>{pro.direct_leads.length}</span>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0">
                  {pro.direct_leads.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pro.direct_leads.map(lead => (
                        <ProjectVignette key={lead.id} project={lead} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">Aucun lead direct capté pour ce professionnel.</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Card>
          </motion.div>
        ))}
      </Accordion>
      {filteredProfessionals.length === 0 && !loading && (
        <div className="text-center py-16 text-muted-foreground">
          Aucun professionnel ne correspond à votre recherche.
        </div>
      )}
    </div>
  );
};

export default AdminDirectLeadsPage;