// src/pages/AdminParticuliersViewPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/lib/customSupabaseClient";
import SEO from "@/components/SEO";

const ParticulierRow = ({ particulier }) => {
  const buyingProjectsCount = particulier.buying_projects_particulier?.[0]?.count ?? 0;
  const sellingProjectsCount = particulier.selling_projects_particulier?.[0]?.count ?? 0;

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">
          {particulier.first_name} {particulier.last_name}
        </div>
        <div className="text-xs text-muted-foreground">{particulier.email}</div>
      </TableCell>
      <TableCell>{particulier.phone || "N/A"}</TableCell>
      <TableCell>{new Date(particulier.created_at).toLocaleDateString("fr-FR")}</TableCell>
      <TableCell className="text-center">
        <Badge variant="secondary" className="justify-center w-12">
          {buyingProjectsCount}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <Badge variant="outline" className="justify-center w-12">
          {sellingProjectsCount}
        </Badge>
      </TableCell>
    </TableRow>
  );
};

const AdminParticuliersViewPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // ✅ IMPORTANT: admin = isAdmin (pas profile.role)
  const { user, loading: authLoading, profileLoading, isAdmin } = useAuth();

  const [particuliers, setParticuliers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchParticuliers = useCallback(async () => {
    setLoading(true);

    try {
      // 1) récupérer les ids admin (source of truth)
      const { data: admins, error: adminsError } = await supabase
        .from("administrator")
        .select("id");

      if (adminsError) {
        console.error("[AdminParticuliers] SELECT administrator error:", adminsError);
        // on ne bloque pas l'écran admin si ça rate, mais on prévient
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de vérifier la liste des administrateurs.",
        });
      }

      const adminIds = (admins || []).map((a) => a.id).filter(Boolean);

      // 2) query particuliers en excluant les admins
      let q = supabase
        .from("particuliers")
        .select(`
          id, first_name, last_name, email, phone, created_at,
          buying_projects_particulier!buying_projects_particulier_particulier_id_fkey(count),
          selling_projects_particulier!selling_projects_particulier_particulier_id_fkey(count)
        `)
        .order("created_at", { ascending: false });

      if (adminIds.length > 0) {
        // format attendu: "(id1,id2,...)"
        const inList = `(${adminIds.join(",")})`;
        q = q.not("id", "in", inList);
      }

      const { data, error } = await q;

      if (error) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les particuliers.",
        });
        console.error("[AdminParticuliers] SELECT particuliers error:", error);
        setParticuliers([]);
      } else {
        setParticuliers(data || []);
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (authLoading || profileLoading) return;

    if (!user) {
      navigate("/connexion", { replace: true });
      return;
    }

    if (!isAdmin) {
      toast({ variant: "destructive", title: "Accès non autorisé" });
      navigate("/", { replace: true });
      return;
    }

    fetchParticuliers();
  }, [authLoading, profileLoading, user, isAdmin, navigate, toast, fetchParticuliers]);

  if (authLoading || profileLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-brand-blue" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="container mx-auto px-4 py-10">
      <SEO
        title="Gestion des Particuliers"
        description="Consultez la liste des particuliers et leurs projets."
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <h1 className="text-3xl font-bold mb-2 text-brand-blue flex items-center justify-center">
          <Users className="mr-3 h-8 w-8" /> Gestion des Particuliers
        </h1>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto">
          Consultez la liste des particuliers et leurs activités sur la plateforme.
        </p>
      </motion.div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-brand-blue">
            Liste des Particuliers ({particuliers.length})
          </CardTitle>
          <CardDescription>Nombre de projets par particulier (achat/vente).</CardDescription>
        </CardHeader>

        <CardContent>
          {particuliers.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Aucun particulier trouvé.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Inscrit le</TableHead>
                    <TableHead className="text-center">Achat</TableHead>
                    <TableHead className="text-center">Vente</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {particuliers.map((particulier) => (
                    <ParticulierRow key={particulier.id} particulier={particulier} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 text-center">
        <Button
          onClick={() => navigate("/admin/dashboard")}
          className="bg-brand-blue text-white hover:bg-opacity-90"
        >
          Retour au tableau de bord
        </Button>
      </div>
    </div>
  );
};

export default AdminParticuliersViewPage;