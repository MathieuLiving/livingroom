// src/pages/AdminDashboardPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, UserCheck, Briefcase, Link as LinkIcon, UserPlus, Loader2, Mail, QrCode } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import SEO from '@/components/SEO';

const TABLE_PROS = 'professionnels';
const TABLE_PARTS = 'particuliers';
const VIEW_PROJECTS = 'projects_marketplace_unified_all';

/**
 * Compteur exact ultra-robuste :
 *  - 1er essai: HEAD + count=exact (rapide)
 *  - fallback: SELECT (range minimal) + count=exact si le count est null
 */
async function countExact(table, label, builder = (q) => q) {
  try {
    // Essai 1 : HEAD
    {
      let q = supabase.from(table).select('*', { head: true, count: 'exact' });
      q = builder(q);
      const { count, error } = await q;
      if (error) throw error;
      if (typeof count === 'number') {
        console.log(`[AdminDashboard] ${label} -> ${count}`);
        return count;
      }
    }

    // Fallback : SELECT (retourne 1 ligne max) + count
    {
      let q2 = supabase.from(table).select('id', { count: 'exact' }).range(0, 0);
      q2 = builder(q2);
      const { count: count2, error: error2 } = await q2;
      if (error2) throw error2;
      console.log(`[AdminDashboard] ${label} (fallback) -> ${count2 ?? 0}`);
      return count2 ?? 0;
    }
  } catch (e) {
    console.error(`[AdminDashboard] ${label} ERROR:`, e?.message || e);
    return 0;
  }
}

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, loading } = useAuth();

  const [stats, setStats] = useState({
    particuliers: 0,
    professionnels: 0,
    newParticuliers30d: 0,
    newProfessionnels30d: 0,
    prosPending: 0,
    prosValidated: 0,
    projectsTotal: 0,
    projectsLast30d: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Evite de setState si le composant est démonté
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const fetchStats = useCallback(async () => {
    if (!mountedRef.current) return;
    setStatsLoading(true);

    const thirtyDaysAgoISO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    try {
      const [
        particuliers,
        professionnels,
        newParticuliers30d,
        newProfessionnels30d,
        prosPending,
        prosValidated,
        projectsTotal,
        projectsLast30d,
      ] = await Promise.all([
        // Comptes
        countExact(TABLE_PARTS, 'count particuliers'),
        countExact(TABLE_PROS, 'count professionnels'),
        countExact(TABLE_PARTS, 'new particuliers 30d', (q) => q.gte('created_at', thirtyDaysAgoISO)),
        countExact(TABLE_PROS, 'new professionnels 30d', (q) => q.gte('created_at', thirtyDaysAgoISO)),
        // Pros: validation
        countExact(TABLE_PROS, 'pros en attente (validation_status = pending)', (q) =>
          q.eq('validation_status', 'pending')
        ),
        countExact(TABLE_PROS, 'pros validés (is_validated_by_administrator = true)', (q) =>
          q.eq('is_validated_by_administrator', true)
        ),
        // Projets (vue unifiée)
        countExact(VIEW_PROJECTS, 'projects total'),
        countExact(VIEW_PROJECTS, 'projects last 30d', (q) => q.gte('created_at', thirtyDaysAgoISO)),
      ]);

      if (!mountedRef.current) return;
      setStats({
        particuliers,
        professionnels,
        newParticuliers30d,
        newProfessionnels30d,
        prosPending,
        prosValidated,
        projectsTotal,
        projectsLast30d,
      });
    } catch (e) {
      console.error('AdminDashboard fetchStats fatal:', e);
      if (mountedRef.current) {
        toast({
          variant: 'destructive',
          title: 'Erreur lors du chargement',
          description:
            "Vérifiez RLS/permissions sur 'professionnels', 'particuliers' et la vue 'projects_marketplace_unified_all'.",
        });
      }
    } finally {
      if (mountedRef.current) setStatsLoading(false);
    }
  }, [toast]);

  /**
   * Déclenchement simple et fiable :
   * - on attend la fin du chargement auth
   * - si l'utilisateur existe, on tente le fetch (pas de dépendance à un 'authReady')
   * - on garde une vérification UI d'admin, mais on ne bloque pas le fetch au cas où 'profile.role' tarde
   */
  useEffect(() => {
    if (loading) return;

    // Gate UI léger (ne bloque pas le fetch au cas où le profil traîne à arriver)
    const role = profile?.role?.toLowerCase?.();
    const seemsAdmin = role === 'admin' || role === 'administrator';

    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Accès non autorisé',
        description: 'Connectez-vous avec un compte administrateur.',
      });
      navigate('/');
      return;
    }

    if (!seemsAdmin) {
      // On ne redirige plus immédiatement : on laisse le fetch s’exécuter (profil parfois en retard)
      console.warn('[AdminDashboard] Profile role non admin ou indisponible, tentative de fetch quand même.');
    }

    fetchStats();
  }, [loading, user, profile?.role, navigate, toast, fetchStats]);

  const actions = [
    { title: 'Validation des Professionnels', description: 'Approuver ou rejeter les profils des professionnels.', icon: <UserCheck className="w-8 h-8 text-brand-orange" />, path: '/admin/validation-professionnels' },
    { title: 'Gestion des Projets', description: 'Consulter tous les projets de la plateforme.', icon: <Briefcase className="w-8 h-8 text-brand-orange" />, path: '/admin/projets' },
    { title: 'Suivi Mises en Relation', description: 'Suivre toutes les demandes de mise en relation.', icon: <LinkIcon className="w-8 h-8 text-brand-orange" />, path: '/admin/connexions' },
    { title: 'Gestion des Particuliers', description: 'Consulter la liste des particuliers et leurs projets.', icon: <Users className="w-8 h-8 text-brand-orange" />, path: '/admin/particuliers' },
    { title: 'Logs des Notifications', description: "Consulter l'historique des e-mails envoyés.", icon: <Mail className="w-8 h-8 text-brand-orange" />, path: '/admin/notifications' },
    { title: 'Leads Directs par Pro', description: "Suivre l'activité des cartes de visite digitales.", icon: <QrCode className="w-8 h-8 text-brand-orange" />, path: '/admin/leads-directs' },
    { title: 'Créer un Administrateur', description: 'Ajouter un nouvel administrateur à la plateforme.', icon: <UserPlus className="w-8 h-8 text-brand-orange" />, path: '/admin/creation-admin' },
  ];

  const StatCard = ({ title, value }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {statsLoading ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <div className="text-3xl font-bold text-brand-blue">{value}</div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-10">
      <SEO
        title="Tableau de Bord Administrateur"
        description="Gérez les professionnels, les particuliers, les projets et les mises en relation sur la plateforme."
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <h1 className="text-3xl font-bold mb-2 text-brand-blue">Tableau de Bord Administrateur</h1>
        <p className="text-lg text-gray-700 max-w-2xl">
          Bienvenue, {profile?.first_name ?? 'Admin'}. Voici une vue d&apos;ensemble de la plateforme.
        </p>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <StatCard title="Comptes Particuliers (total)" value={stats.particuliers} />
        <StatCard title="Comptes Professionnels (total)" value={stats.professionnels} />
        <StatCard title="Pros validés" value={stats.prosValidated} />
        <StatCard title="Pros en attente (validation)" value={stats.prosPending} />
        <StatCard title="Nouveaux Particuliers (30 j)" value={stats.newParticuliers30d} />
        <StatCard title="Nouveaux Pros (30 j)" value={stats.newProfessionnels30d} />
        <StatCard title="Projets (total, unified)" value={stats.projectsTotal} />
        <StatCard title="Projets créés (30 j)" value={stats.projectsLast30d} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <h2 className="text-2xl font-semibold text-brand-blue mb-4">Actions Rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {actions.map((action, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
            >
              <Card className="hover:shadow-xl transition-shadow h-full flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-semibold text-brand-blue">{action.title}</CardTitle>
                  {action.icon}
                </CardHeader>
                <CardContent className="flex-grow">
                  <CardDescription>{action.description}</CardDescription>
                </CardContent>
                <CardContent>
                  <Button className="w-full" onClick={() => navigate(action.path)}>
                    Accéder <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboardPage;