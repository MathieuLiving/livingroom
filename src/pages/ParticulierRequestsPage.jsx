import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "../../lib/customSupabaseClient";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

import {
  Loader2,
  Mail,
  Phone,
  Edit,
  PauseCircle,
  Send,
  PlayCircle,
  Trash2,
  ExternalLink,
  MapPin,
  CheckCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import ProjectCard from "@/components/marketplace/ProjectCard";

const PRO_PUBLIC_TABLE = "professionnels_public";

/* ─────────────────────────────────────────────────────────────
   Helpers
────────────────────────────────────────────────────────────── */
const initials = (first, last) =>
  [first?.[0], last?.[0]].filter(Boolean).join("").toUpperCase() || "P";

const buildDigitalCardUrl = (pro) => {
  const origin =
    import.meta?.env?.VITE_PUBLIC_CARD_ORIGIN ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const base = String(origin || "").replace(/\/+$/, "");

  if (pro?.card_slug) return `${base}/cvd/${pro.card_slug}`;
  if (pro?.id) return `${base}/carte-visite-digitale/${pro.id}`;
  return null;
};

/* ─────────────────────────────────────────────────────────────
   Composants
────────────────────────────────────────────────────────────── */

const ProContactCard = ({ pro, leadStatus, onToggleSuspend, onDelete }) => {
  if (!pro) return null;
  const cardUrl = buildDigitalCardUrl(pro);
  const isSuspended = leadStatus === "suspended";

  return (
    <div
      className={`relative flex flex-col gap-4 p-5 rounded-xl border transition-all duration-300 shadow-sm hover:shadow-md ${
        isSuspended ? "bg-slate-50 border-slate-200 opacity-75" : "bg-white border-slate-200"
      }`}
    >
      {isSuspended && (
        <div className="absolute inset-0 bg-white/40 z-10 rounded-xl pointer-events-none"></div>
      )}

      <div className="flex items-start gap-4">
        <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border-2 border-white shadow-sm shrink-0">
          <AvatarImage
            src={pro.avatar_url}
            alt={`${pro.first_name || ""} ${pro.last_name || ""}`}
          />
          <AvatarFallback className="bg-brand-blue/10 text-brand-blue font-semibold">
            {initials(pro.first_name, pro.last_name)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              {cardUrl ? (
                <a
                  href={cardUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-base sm:text-lg text-slate-900 hover:text-brand-blue transition-colors truncate block cursor-pointer"
                  title="Voir la carte de visite"
                >
                  {pro.first_name} {pro.last_name}
                </a>
              ) : (
                <h4 className="font-bold text-base sm:text-lg text-slate-900 truncate">
                  {pro.first_name} {pro.last_name}
                </h4>
              )}
              <p className="text-xs sm:text-sm text-slate-500 font-medium truncate mb-3">
                {pro.company_name || "Professionnel indépendant"}
              </p>
            </div>
            
            {cardUrl && (
              <Button
                size="icon"
                variant="ghost"
                asChild
                className="h-8 w-8 shrink-0 text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10"
                title="Voir la carte de visite digitale"
              >
                <a href={cardUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>

          {(pro.email || pro.phone) && (
            <div className="space-y-2.5 mt-1">
              {pro.phone && (
                <a
                  href={`tel:${pro.phone}`}
                  className="flex items-center gap-2.5 text-sm text-slate-600 hover:text-brand-blue transition-colors group w-fit"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 group-hover:bg-brand-blue/10 transition-colors">
                    <Phone className="h-3.5 w-3.5 text-slate-500 group-hover:text-brand-blue" />
                  </div>
                  <span className="font-medium tracking-wide">{pro.phone}</span>
                </a>
              )}
              {pro.email && (
                <a
                  href={`mailto:${pro.email}`}
                  className="flex items-center gap-2.5 text-sm text-slate-600 hover:text-brand-blue transition-colors group w-fit"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 group-hover:bg-brand-blue/10 transition-colors">
                    <Mail className="h-3.5 w-3.5 text-slate-500 group-hover:text-brand-blue" />
                  </div>
                  <span className="truncate max-w-[200px] sm:max-w-xs">{pro.email}</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 pt-3 border-t border-slate-100 mt-auto">
        <Button
          variant="outline"
          size="sm"
          className={`flex-1 text-xs h-8 ${
            isSuspended 
              ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200" 
              : "text-slate-600 hover:text-slate-900"
          }`}
          onClick={() => onToggleSuspend(pro.lead_id, pro.lead_status)}
        >
          {isSuspended ? (
            <><PlayCircle className="mr-1.5 h-3.5 w-3.5" /> Réactiver</>
          ) : (
            <><PauseCircle className="mr-1.5 h-3.5 w-3.5" /> Suspendre</>
          )}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Retirer
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Retirer cette demande ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est définitive. Le professionnel ne verra
                plus votre projet dans son tableau de bord.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={() => onDelete(pro.lead_id)}
              >
                Confirmer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

const SelectProfessionalsDialog = ({
  lead,
  onSend,
  professionals,
  loading: loadingPros,
}) => {
  const [selectedProIds, setSelectedProIds] = useState([]);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleTogglePro = (proId) => {
    setSelectedProIds((prev) =>
      prev.includes(proId) ? prev.filter((id) => id !== proId) : [...prev, proId]
    );
  };

  const handleSend = async () => {
    if (selectedProIds.length === 0) return;
    setSending(true);
    await onSend(selectedProIds);
    setSending(false);
    setSelectedProIds([]);
  };

  const filteredPros = useMemo(() => {
    const search = (searchTerm || "").toLowerCase().trim();
    if (!search) return professionals;
    return professionals.filter((pro) => {
      return (
        pro.first_name?.toLowerCase().includes(search) ||
        pro.last_name?.toLowerCase().includes(search) ||
        pro.company_name?.toLowerCase().includes(search)
      );
    });
  }, [professionals, searchTerm]);

  return (
    <DialogContent className="sm:max-w-[625px] flex flex-col h-[80vh] sm:h-auto">
      <DialogHeader>
        <DialogTitle>Adresser à d&apos;autres professionnels</DialogTitle>
        <DialogDescription>
          Sélectionnez les professionnels à qui vous souhaitez envoyer une copie de
          votre projet.
        </DialogDescription>
      </DialogHeader>

      <div className="py-2">
        <input
          type="text"
          placeholder="Rechercher par nom ou agence..."
          className="w-full p-3 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loadingPros ? (
        <div className="flex justify-center items-center h-48 flex-1">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 space-y-2 min-h-[200px] sm:max-h-[50vh]">
          {filteredPros.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              Aucun professionnel trouvé.
            </p>
          ) : (
            filteredPros.map((pro) => (
              <div
                key={pro.id}
                onClick={() => handleTogglePro(pro.id)}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedProIds.includes(pro.id)
                    ? "bg-blue-50 border-brand-blue ring-1 ring-brand-blue"
                    : "hover:bg-slate-50 border-slate-200"
                }`}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={pro.avatar_url}
                    alt={`${pro.first_name || ""} ${pro.last_name || ""}`}
                  />
                  <AvatarFallback>{initials(pro.first_name, pro.last_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate text-slate-900">
                    {pro.first_name} {pro.last_name}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{pro.company_name}</p>
                </div>
                {pro.scope_intervention_choice_1 && (
                  <Badge variant="secondary" className="text-[10px] shrink-0 bg-slate-100 text-slate-600">
                    <MapPin className="w-3 h-3 mr-1" />
                    {pro.scope_intervention_choice_1}
                  </Badge>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <div className="flex justify-between items-center pt-4 mt-auto border-t border-slate-100">
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          {selectedProIds.length} sélectionné(s)
        </span>
        <Button onClick={handleSend} disabled={selectedProIds.length === 0 || sending} className="bg-brand-blue hover:bg-brand-blue/90">
          {sending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Envoyer ({selectedProIds.length})
        </Button>
      </div>
    </DialogContent>
  );
};

/* ─────────────────────────────────────────────────────────────
   Page
────────────────────────────────────────────────────────────── */
export default function ParticulierRequestsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);

  const [professionals, setProfessionals] = useState([]);
  const [loadingPros, setLoadingPros] = useState(true);

  const fetchLeads = useCallback(async () => {
    if (!user?.id) {
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: leads, error: err } = await supabase
        .from("direct_leads")
        .select("*")
        .eq("particulier_id", user.id)
        .order("created_at", { ascending: false });

      if (err) throw err;

      const rows = leads ?? [];
      const proIds = Array.from(
        new Set(rows.map((l) => l.professionnel_id).filter(Boolean))
      );

      let prosMap = {};
      if (proIds.length > 0) {
        const { data: prosData, error: prosErr } = await supabase
          .from(PRO_PUBLIC_TABLE)
          .select(
            "id, first_name, last_name, company_name, email, phone, avatar_url, card_slug"
          )
          .in("id", proIds);

        if (prosErr) throw prosErr;

        prosMap = (prosData ?? []).reduce((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {});
      }

      // Group leads by project parameters to group multiple pros for the same request
      const grouped = rows.reduce((acc, lead) => {
        const groupingKey = `${lead.type_projet || lead.project_type || ""}__${
          lead.type_bien || ""
        }__${lead.city_choice_1 || ""}__${lead.budget_max || lead.prix_demande || ""}`;

        if (!acc[groupingKey]) {
          acc[groupingKey] = { project: lead, professionals: [] };
        }

        const pro = lead.professionnel_id ? prosMap[lead.professionnel_id] : null;
        if (pro) {
          acc[groupingKey].professionals.push({
            ...pro,
            lead_id: lead.id,
            lead_status: lead.status,
          });
        } else if (lead.professionnel_id) {
          acc[groupingKey].professionals.push({
            id: lead.professionnel_id,
            first_name: "Professionnel",
            last_name: "",
            company_name: "",
            email: null,
            phone: null,
            avatar_url: null,
            card_slug: null,
            lead_id: lead.id,
            lead_status: lead.status,
          });
        }

        return acc;
      }, {});

      setProjects(Object.values(grouped));
    } catch (e) {
      console.error(e);
      setError(e?.message || "Une erreur est survenue.");
      toast({
        title: "Erreur",
        description: "Impossible de charger vos demandes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  const fetchAllPros = useCallback(async () => {
    setLoadingPros(true);
    try {
      const { data, error } = await supabase
        .from(PRO_PUBLIC_TABLE)
        .select(
          "id, first_name, last_name, company_name, avatar_url, scope_intervention_choice_1"
        )
        .eq("validation_status", "validated");

      if (error) throw error;
      setProfessionals(data || []);
    } catch (e) {
      console.error("Error fetching all professionals:", e);
      setProfessionals([]);
    } finally {
      setLoadingPros(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    fetchAllPros();
  }, [fetchLeads, fetchAllPros]);

  const handleToggleSuspend = async (leadId, currentStatus) => {
    if (!user?.id) return;

    const newStatus = currentStatus === "suspended" ? "active" : "suspended";
    const { error } = await supabase
      .from("direct_leads")
      .update({ status: newStatus })
      .eq("id", leadId)
      .eq("particulier_id", user.id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Statut mis à jour",
        description: `La demande est maintenant ${
          newStatus === "active" ? "active" : "suspendue"
        }.`,
      });
      fetchLeads();
    }
  };

  const handleDelete = async (leadId) => {
    if (!user?.id) return;

    const { error } = await supabase
      .from("direct_leads")
      .delete()
      .eq("id", leadId)
      .eq("particulier_id", user.id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la demande.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Demande supprimée", description: "Votre demande a bien été retirée." });
      fetchLeads();
    }
  };

  const handleSendToOthers = async (lead, proIds) => {
    const { data, error } = await supabase.rpc("clone_direct_lead_to_pros", {
      p_lead_id: lead.id,
      p_target_pro_ids: proIds,
    });

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'adresser le projet.",
        variant: "destructive",
      });
    } else {
      const count = typeof data === "number" ? data : 0;
      toast({
        title: "Projet envoyé !",
        description: `Votre projet a été adressé à ${count} nouveau(x) professionnel(s).`,
      });
      fetchLeads();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[50vh] space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-brand-blue" />
        <span className="text-slate-500 font-medium">
          Chargement de vos demandes directes...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center bg-red-50 rounded-xl mx-4 mt-8 border border-red-100">
        <p className="text-sm text-red-600 font-medium">
          {error || "Une erreur inattendue est survenue."}
        </p>
        <div className="mt-6">
          <Button
            onClick={fetchLeads}
            variant="outline"
            className="bg-white hover:bg-slate-50 shadow-sm"
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="py-20 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 mt-8 mx-4">
        <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
          <Send className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-3">
          Aucune demande directe
        </h3>
        <p className="text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
          Vous n’avez pas encore adressé de demande de projet à un professionnel partenaire. 
          Découvrez notre réseau et confiez votre projet aux meilleurs experts.
        </p>
        <Button onClick={() => navigate("/nos-professionnels-partenaires")} size="lg" className="bg-brand-blue hover:bg-brand-blue/90 shadow-md">
          Trouver un professionnel
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16 pt-4 px-2 sm:px-4 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Mes demandes directes
        </h1>
        <p className="text-slate-500 mt-2 text-base max-w-2xl">
          Suivez les demandes de projet que vous avez envoyées directement aux professionnels de l'immobilier.
        </p>
      </div>

      <div className="space-y-12">
        {projects.map(({ project, professionals: projectPros }) => (
          <div
            key={`${project.id}-group`}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Colonne gauche : Projet + Actions ("Place des projets" style) */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-full bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-slate-200 overflow-hidden">
              <div className="flex-1">
                {/* We use the ProjectCard component to match "Place des projets" design precisely.
                    Passing hideFooterCta=true so we can add our custom actions at the bottom. */}
                <ProjectCard 
                  project={{ ...project, particulier_id: user?.id }} 
                  hideFooterCta={true}
                  hideRoleIcon={true}
                  standalone={false}
                />
              </div>

              {/* Custom "C'est votre projet" section tailored for Requests Page */}
              <div className="bg-slate-50 p-4 sm:p-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200 w-fit">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  C'est votre projet
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white hover:bg-slate-50 border-slate-200 shadow-sm font-medium"
                    onClick={() =>
                      navigate(
                        `/direct-lead-form/${project.professionnel_id}?lead_id=${project.id}`
                      )
                    }
                  >
                    <Edit className="mr-2 h-4 w-4 text-slate-500" /> Modifier le projet
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-brand-blue hover:bg-brand-blue/90 shadow-sm font-medium"
                      >
                        <Send className="mr-2 h-4 w-4" /> Transmettre à d'autres pros
                      </Button>
                    </DialogTrigger>

                    <SelectProfessionalsDialog
                      lead={project}
                      professionals={professionals.filter(
                        (p) => !projectPros.some((pp) => pp.id === p.id)
                      )}
                      loading={loadingPros}
                      onSend={(proIds) => handleSendToOthers(project, proIds)}
                    />
                  </Dialog>
                </div>
              </div>
            </div>

            {/* Colonne droite : Liste des professionnels contactés */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
              <div className="flex items-center gap-2 px-1">
                <h3 className="text-lg font-bold text-slate-900">
                  Professionnels contactés
                </h3>
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold">
                  {projectPros.length}
                </Badge>
              </div>

              <div className="space-y-4">
                {projectPros.length === 0 && (
                  <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-200 text-center">
                    <p className="text-sm text-slate-500 italic">
                      Aucun professionnel assigné à cette demande.
                    </p>
                  </div>
                )}

                {projectPros.map((pro) => (
                  <ProContactCard 
                    key={pro.lead_id} 
                    pro={pro} 
                    leadStatus={pro.lead_status}
                    onToggleSuspend={handleToggleSuspend}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}