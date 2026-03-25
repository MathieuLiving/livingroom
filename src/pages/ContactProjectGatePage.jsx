import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { supabase } from "@/lib/customSupabaseClient";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  Lock,
  AlertTriangle,
  User,
  Briefcase,
  ArrowRight,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { upsertConnection } from "@/lib/connection";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import RgpdNotice from "@/components/legal/RgpdNotice";

/**
 * Déduit la vraie colonne de projet dans `connections`
 */
function inferProjectKeyFromUnified(role, type_projet) {
  const r = String(role || "").toLowerCase().trim();
  const t = String(type_projet || "").toLowerCase().trim();

  if (r === "particulier" && t === "achat") {
    return "buying_project_particulier_id";
  }
  if (r === "particulier" && t === "vente") {
    return "selling_project_particulier_id";
  }
  if (r === "professionnel" && t === "achat") {
    return "buying_project_professionnel_id";
  }
  if (r === "professionnel" && t === "vente") {
    return "selling_project_professionnel_id";
  }

  return null;
}

/**
 * Détermine les cibles depuis la vue unifiée
 */
const resolveTargetsFromUnified = (project) => {
  if (!project) {
    return { targetUserId: null, targetProfessionnelId: null };
  }

  const role = String(project.role || "").toLowerCase().trim();

  if (role === "particulier") {
    return {
      targetUserId: project.particulier_id || null,
      targetProfessionnelId: null,
    };
  }

  if (role === "professionnel") {
    return {
      targetUserId: null,
      targetProfessionnelId: project.professionnel_id || null,
    };
  }

  return { targetUserId: null, targetProfessionnelId: null };
};

const BackLink = () => (
  <div className="mb-6">
    <Link
      to="/place-des-projets"
      className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-brand-blue transition-colors"
    >
      <ArrowRight className="h-4 w-4 mr-1 rotate-180" />
      Retour à la Place des projets
    </Link>
  </div>
);

export default function ContactProjectGatePage() {
  const params = useParams();
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const navState = location.state || {};
  const projectFromState = navState.project || null;
  const projectIdFromState = navState.projectId || (projectFromState && projectFromState.id);

  const originParam = params.origin;
  const idParam = params.id;

  const resolvedOrigin =
    String(originParam || projectFromState?.role || "").toLowerCase().trim() || null;
  const resolvedProjectId = idParam || projectIdFromState || null;

  const [project, setProject] = useState(projectFromState || null);
  const [loading, setLoading] = useState(!projectFromState);
  const [message, setMessage] = useState("");
  const [chars, setChars] = useState(0);

  const nextParam = encodeURIComponent(location.pathname + location.search);

  const role = String(profile?.role || "").toLowerCase().trim();
  const isPro = role === "professionnel";

  useEffect(() => {
    let ignore = false;

    if (projectFromState) {
      setProject(projectFromState);
      setLoading(false);
      return () => {
        ignore = true;
      };
    }

    if (!resolvedProjectId) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Projet introuvable",
        description: "Aucun identifiant de projet n'a été fourni.",
      });
      return () => {
        ignore = true;
      };
    }

    (async () => {
      try {
        let query = supabase
          .from("projects_marketplace_unified_all")
          .select("*")
          .eq("id", resolvedProjectId)
          .maybeSingle();

        if (resolvedOrigin) {
          query = query.eq("role", resolvedOrigin);
        }

        const { data, error } = await query;

        if (error) throw error;
        if (!ignore) setProject(data);
      } catch (e) {
        console.error("[ContactProjectGatePage] fetch project error:", e);
        if (!ignore) {
          toast({
            variant: "destructive",
            title: "Erreur",
            description: "Impossible de charger ce projet.",
          });
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [projectFromState, resolvedProjectId, resolvedOrigin, toast]);

  const { targetUserId, targetProfessionnelId } = useMemo(
    () => resolveTargetsFromUnified(project),
    [project]
  );

  const canContact = useMemo(() => {
    if (!user || !project) return false;

    if (targetProfessionnelId) return true;

    if (targetUserId && isPro) return true;

    return false;
  }, [user, project, targetUserId, targetProfessionnelId, isPro]);

  const title =
    String(project?.project_title || project?.title || "").trim() ||
    (project?.type_projet === "achat" ? "Projet d'achat" : "Projet de vente");

  const isParticulierProject = project?.role === "particulier";

  const onSendRequest = async () => {
    try {
      if (!user) return;

      if (!canContact) {
        toast({
          variant: "destructive",
          title: "Accès refusé",
          description: "Vous n'êtes pas autorisé à contacter ce projet.",
        });
        return;
      }

      let resolvedTargetUserId = targetUserId;

      if (!resolvedTargetUserId && targetProfessionnelId) {
        const { data: pro, error: proError } = await supabase
          .from("professionnels")
          .select("user_id")
          .eq("id", targetProfessionnelId)
          .maybeSingle();

        if (proError) {
          console.error("[ContactProjectGatePage] proError:", proError);
          throw new Error("Impossible de récupérer le compte utilisateur du professionnel.");
        }

        if (!pro?.user_id) {
          throw new Error("Aucun utilisateur lié à ce professionnel n'a été trouvé.");
        }

        resolvedTargetUserId = pro.user_id;
      }

      if (!resolvedTargetUserId) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Destinataire introuvable.",
        });
        return;
      }

      const projectKey = inferProjectKeyFromUnified(project?.role, project?.type_projet);

      if (!projectKey) {
        throw new Error("Impossible de déterminer le type de projet à relier.");
      }

      const connectionType = (() => {
        if (isPro && targetProfessionnelId) return "professionnel_to_professionnel";
        if (isPro && !targetProfessionnelId) return "professionnel_to_particulier";
        if (!isPro && targetProfessionnelId) return "particulier_to_professionnel";
        return "direct";
      })();

      const { error } = await upsertConnection({
        requesting_user_id: user.id,
        target_user_id: resolvedTargetUserId,
        projectKey,
        project_id: resolvedProjectId,
        connection_type: connectionType,
        message: message?.trim() || "",
        target_professionnel_id: targetProfessionnelId ?? null,
        project_marketplace_id: resolvedProjectId,
        project_type: project?.type_projet || null,
        project_type_bien: project?.type_bien || null,
        project_city_choice_1: project?.city_choice_1 || null,
        city_choice_1: project?.city_choice_1 || null,
        project_origin: project?.role || project?.source || null,
      });

      if (error) throw error;

      toast({
        title: "Demande envoyée",
        description: "Votre demande de mise en relation a bien été transmise.",
      });

      navigate("/place-des-projets");
    } catch (e) {
      console.error("[ContactProjectGatePage] erreur :", e);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: e?.message || "Impossible d'envoyer la demande.",
      });
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-brand-blue mb-4" />
        <p className="text-slate-500 text-sm animate-pulse">Chargement du projet...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto p-6 min-h-screen flex flex-col justify-center items-center">
        <div className="w-full max-w-md text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Projet introuvable</h1>
          <p className="text-slate-600 mb-6">Ce projet n'existe plus ou a été retiré.</p>
          <Button asChild>
            <Link to="/place-des-projets">Retour à la liste</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        <div className="w-full max-w-4xl">
          <BackLink />

          <div className="text-center mb-10">
            <Badge
              variant="outline"
              className="mb-4 bg-white text-slate-600 border-slate-200 px-3 py-1"
            >
              Mise en relation
            </Badge>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Identifiez-vous pour continuer
            </h1>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Vous souhaitez contacter le porteur du projet{" "}
              <span className="font-semibold text-slate-900">"{title}"</span>.
              <br />
              Veuillez sélectionner votre profil pour accéder au formulaire de contact.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card
              className={`relative overflow-hidden transition-all duration-300 ${
                isParticulierProject
                  ? "opacity-60 bg-slate-50 border-slate-200"
                  : "hover:shadow-lg hover:border-brand-orange/30 bg-white"
              }`}
            >
              {isParticulierProject && (
                <div className="absolute inset-0 bg-slate-100/50 z-10 flex items-center justify-center backdrop-blur-[1px]">
                  <div className="bg-white/90 px-4 py-2 rounded-full shadow-sm border border-slate-200 text-xs font-medium text-slate-500 flex items-center">
                    <Lock className="h-3 w-3 mr-2" />
                    Réservé aux professionnels
                  </div>
                </div>
              )}

              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                  <User className="h-6 w-6 text-brand-orange" />
                </div>
                <CardTitle className="text-xl">Je suis un Particulier</CardTitle>
                <CardDescription>Vous cherchez à acheter ou vendre un bien</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 pb-6 px-6">
                <Button
                  asChild
                  className="w-full bg-brand-orange hover:bg-brand-orange/90"
                  disabled={isParticulierProject}
                >
                  <Link to={`/connexion?role=particulier&next=${nextParam}`}>Se connecter</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                  disabled={isParticulierProject}
                >
                  <Link to={`/inscription?role=particulier&next=${nextParam}`}>Créer un compte</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-brand-blue/30 bg-white">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <Building2 className="h-6 w-6 text-brand-blue" />
                </div>
                <CardTitle className="text-xl">Je suis un Professionnel</CardTitle>
                <CardDescription>Agent immobilier, chasseur, mandataire...</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 pb-6 px-6">
                <Button
                  asChild
                  className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white"
                >
                  <Link to={`/connexion?role=professionnel&next=${nextParam}`}>
                    Se connecter (Pro)
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                >
                  <Link to={`/inscription?role=professionnel&next=${nextParam}`}>
                    Créer un compte Pro
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {isParticulierProject && (
            <div className="mt-8 text-center">
              <p className="text-sm text-amber-600 bg-amber-50 inline-block px-4 py-2 rounded-md border border-amber-100">
                <AlertTriangle className="h-4 w-4 inline-block mr-2 mb-0.5" />
                Ce projet est publié par un particulier. Seuls les professionnels
                de l'immobilier peuvent le contacter.
              </p>
            </div>
          )}

          <div className="mt-10 max-w-3xl mx-auto">
            <div className="rounded-xl border bg-white p-5">
              <RgpdNotice variant="short" context="contact-gate" />
              <div className="mt-2 text-xs text-gray-500">
                En vous connectant / créant un compte, vous acceptez que vos informations soient utilisées
                pour traiter votre demande de mise en relation et prévenir les abus (spam/fraude).
                <br />
                Liens utiles :{" "}
                <Link to="/confidentialite" className="underline hover:text-gray-700">
                  Confidentialité
                </Link>{" "}
                ·{" "}
                <Link to="/cgu" className="underline hover:text-gray-700">
                  CGU
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!canContact) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-lg">
          <Card className="border-red-100 shadow-md">
            <CardHeader className="bg-red-50/50 border-b border-red-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Lock className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-lg text-red-900">Accès restreint</CardTitle>
                  <CardDescription className="text-red-700">
                    Action non autorisée pour votre profil
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-slate-700">
                Ce projet appartient à un <strong>particulier</strong>. Sur LivingRoom, les particuliers ne
                peuvent pas se contacter directement entre eux pour des raisons de confidentialité.
              </p>
              <div className="bg-slate-100 p-4 rounded-md text-sm text-slate-600">
                Seuls les <strong>professionnels de l'immobilier</strong> vérifiés peuvent entrer en contact
                avec les porteurs de projet particuliers.
              </div>

              <p className="text-xs text-slate-500">
                Pour comprendre le traitement des données et vos droits :{" "}
                <Link to="/confidentialite" className="underline hover:text-slate-700">
                  politique de confidentialité
                </Link>
                .
              </p>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t border-slate-100 pt-4 flex justify-between">
              <Button variant="ghost" onClick={() => navigate("/place-des-projets")}>
                Annuler
              </Button>
              <Button
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-50"
                onClick={() => {
                  supabase.auth.signOut().then(() => window.location.reload());
                }}
              >
                Me connecter avec un autre compte
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <BackLink />

        <Card className="shadow-lg border-slate-200 overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-100 pb-6">
            <div className="flex items-center justify-between mb-2">
              <Badge
                variant="outline"
                className={
                  isPro
                    ? "bg-brand-blue/5 text-brand-blue border-brand-blue/20"
                    : "bg-brand-orange/5 text-brand-orange border-brand-orange/20"
                }
              >
                Nouvelle demande
              </Badge>
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                {isParticulierProject ? "Projet Particulier" : "Projet Pro"}
              </span>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              Contacter ce projet
            </CardTitle>
            <CardDescription className="text-base mt-1">
              Vous allez envoyer une demande de mise en relation pour :{" "}
              <span className="font-semibold text-slate-800">{title}</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-8 space-y-6">
            <div
              className={`rounded-lg p-4 flex gap-3 items-start ${
                isPro
                  ? "bg-blue-50/50 border border-blue-100"
                  : "bg-orange-50/50 border border-orange-100"
              }`}
            >
              <div className="shrink-0 mt-0.5">
                <Briefcase
                  className={`h-5 w-5 ${isPro ? "text-brand-blue" : "text-brand-orange"}`}
                />
              </div>
              <div className="text-sm text-slate-700">
                <p className={`font-medium mb-1 ${isPro ? "text-brand-blue" : "text-brand-orange"}`}>
                  Fonctionnement
                </p>
                En envoyant cette demande, le porteur du projet recevra une notification. S'il accepte votre
                demande, ses coordonnées complètes vous seront révélées et vous pourrez échanger via la messagerie.
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex justify-between">
                <span>Votre message d'introduction (optionnel)</span>
                <span className="text-xs font-normal text-slate-400">{chars}/500</span>
              </label>
              <Textarea
                value={message}
                onChange={(e) => {
                  const val = e.target.value.slice(0, 500);
                  setMessage(val);
                  setChars(val.length);
                }}
                placeholder="Bonjour, je suis intéressé par votre projet et souhaiterais en discuter..."
                className={`min-h-[120px] resize-none ${
                  isPro ? "focus-visible:ring-brand-blue" : "focus-visible:ring-brand-orange"
                }`}
              />

              <p className="text-xs text-slate-500">
                Conseil : évitez d’indiquer des informations sensibles (santé, données très personnelles…).
              </p>
            </div>

            <div className="rounded-xl border bg-white p-4">
              <RgpdNotice variant="short" context="contact-project" />
              <div className="mt-2 text-xs text-gray-500">
                Liens utiles :{" "}
                <Link to="/confidentialite" className="underline hover:text-gray-700">
                  Confidentialité
                </Link>{" "}
                ·{" "}
                <Link to="/cgu" className="underline hover:text-gray-700">
                  CGU
                </Link>
              </div>
            </div>
          </CardContent>

          <CardFooter className="bg-slate-50 border-t border-slate-100 py-4 px-6 flex justify-between items-center">
            <Button variant="ghost" asChild>
              <Link to="/place-des-projets">Annuler</Link>
            </Button>
            <Button
              onClick={onSendRequest}
              className={`px-8 shadow-sm text-white ${
                isPro ? "bg-brand-blue hover:bg-brand-blue/90" : "bg-brand-orange hover:bg-brand-orange/90"
              }`}
            >
              Envoyer la demande
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}