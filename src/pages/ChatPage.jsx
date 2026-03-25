import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/customSupabaseClient";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  Loader2,
  User,
  Building,
  X,
  UserX,
  UserCheck,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import ProjectCard from "@/components/marketplace/ProjectCard";

const CONNECTION_STATUS_BADGE = (status) => {
  switch (String(status || "").toLowerCase()) {
    case "approved":
      return <Badge variant="success">Approuvée</Badge>;
    case "pending":
      return <Badge variant="warning">En attente</Badge>;
    case "rejected":
      return <Badge variant="destructive">Refusée</Badge>;
    case "suspended":
      return <Badge variant="destructive">Suspendue</Badge>;
    default:
      return <Badge variant="secondary">{status || "Inconnu"}</Badge>;
  }
};

const ALLOWED_PROJECT_KEYS = [
  "buying_project_particulier_id",
  "selling_project_particulier_id",
  "buying_project_professionnel_id",
  "selling_project_professionnel_id",
];

const ChatPage = ({
  connectionId: propConnectionId,
  isModal = false,
  closeModal,
  onConnectionUpdate,
  showProjectContext = true,
  hideProjectPanel,
  managedByParentUI = false,
}) => {
  const params = useParams();
  const connectionId = propConnectionId || params.connectionId;

  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connection, setConnection] = useState(null);

  const messagesEndRef = useRef(null);

  const isNewChat = connectionId === "new";
  const newChatState = location.state?.chatState || null;

  const shouldShowProject = useMemo(() => {
    if (typeof hideProjectPanel === "boolean") return !hideProjectPanel;
    return !!showProjectContext;
  }, [hideProjectPanel, showProjectContext]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleCloseOrBack = useCallback(() => {
    if (isModal) {
      closeModal?.();
    } else {
      navigate(-1);
    }
  }, [isModal, closeModal, navigate]);

  const buildFallbackSnapshot = useCallback((state) => {
    const nowIso = new Date().toISOString();

    return {
      id: state?.project_marketplace_id ?? state?.projectId ?? null,
      captured_at: nowIso,
      source: state?.project_origin || state?.source || "unknown",
      title: state?.project_title || state?.title || "Projet",
      project_title: state?.project_title || state?.title || "Projet",
      type_projet: state?.type_projet || null,
      type_bien: state?.type_bien || null,
      city_choice_1: state?.city_choice_1 || null,
      quartier_choice_1: state?.quartier_choice_1 || null,
      budget_max: state?.budget_max || null,
      prix_demande: state?.prix_demande || null,
      surface: state?.surface || null,
      surface_min: state?.surface_min || null,
      surface_max: state?.surface_max || null,
      bedrooms: state?.bedrooms || null,
      bedrooms_min: state?.bedrooms_min || null,
      image_1_url: state?.image_1_url || null,
      image_2_url: state?.image_2_url || null,
      image_3_url: state?.image_3_url || null,
      description: state?.description || null,
    };
  }, []);

  const normalizeSnapshotForProjectCard = useCallback((snapshot) => {
    if (!snapshot || typeof snapshot !== "object") return null;

    return {
      id: snapshot.id || snapshot.project_marketplace_id || null,
      slug: snapshot.slug || null,
      source: snapshot.source || snapshot.project_origin || "unknown",
      project_origin: snapshot.project_origin || snapshot.source || "unknown",
      type_projet: snapshot.type_projet || snapshot.project_type || null,
      type_bien: snapshot.type_bien || snapshot.property_type || null,
      project_title: snapshot.project_title || snapshot.title || "Projet",
      title: snapshot.title || snapshot.project_title || "Projet",
      description: snapshot.description || snapshot.project_description || null,
      city_choice_1: snapshot.city_choice_1 || snapshot.city || snapshot.ville || null,
      quartier_choice_1: snapshot.quartier_choice_1 || snapshot.quartier || null,
      budget_max: snapshot.budget_max || snapshot.budget || null,
      prix_demande: snapshot.prix_demande || null,
      surface: snapshot.surface || null,
      surface_min: snapshot.surface_min || null,
      surface_max: snapshot.surface_max || null,
      bedrooms: snapshot.bedrooms || null,
      bedrooms_min: snapshot.bedrooms_min || null,
      image_1_url: snapshot.image_1_url || null,
      image_2_url: snapshot.image_2_url || null,
      image_3_url: snapshot.image_3_url || null,
      images: [
        snapshot.image_1_url,
        snapshot.image_2_url,
        snapshot.image_3_url,
      ].filter(Boolean),
      has_garden: snapshot.has_garden || false,
      has_terrace: snapshot.has_terrace || false,
      has_balcony: snapshot.has_balcony || false,
      has_pool: snapshot.has_pool || false,
      has_elevator: snapshot.has_elevator || false,
      has_cellar: snapshot.has_cellar || false,
      has_parking: snapshot.has_parking || false,
      has_caretaker: snapshot.has_caretaker || false,
      has_clear_view: snapshot.has_clear_view || false,
      is_last_floor: snapshot.is_last_floor || false,
      energy_consumption: snapshot.energy_consumption || null,
      co2_emission: snapshot.co2_emission || null,
      delai: snapshot.delai || snapshot.timeline || null,
      property_ad_link: snapshot.property_ad_link || null,
      pro_property_ad_link: snapshot.pro_property_ad_link || null,
      part_property_ad_link: snapshot.part_property_ad_link || null,
    };
  }, []);

  const createConnectionAndSendMessage = useCallback(async () => {
    if (!isNewChat || !newChatState || !user) return;

    setLoading(true);

    try {
      const {
        targetUserId,
        projectId,
        projectKey,
        connectionType,
        initialMessage,
        project_marketplace_id,
        projectSnapshot,
        project_type,
        project_type_bien,
        project_city_choice_1,
        city_choice_1,
        project_origin,
      } = newChatState;

      if (!targetUserId) {
        throw new Error("Utilisateur cible introuvable.");
      }

      if (!projectKey || !ALLOWED_PROJECT_KEYS.includes(projectKey)) {
        throw new Error("Clé projet invalide pour la mise en relation.");
      }

      const safeSnapshot = projectSnapshot || buildFallbackSnapshot(newChatState);

      const payload = {
        user_id: user.id,
        requesting_user_id: user.id,
        target_user_id: targetUserId,
        status: "pending",
        connection_type: connectionType || "direct",
        [projectKey]: projectId,
        project_marketplace_id: project_marketplace_id || projectId || null,
        project_snapshot: safeSnapshot,
        project_type: project_type || safeSnapshot?.type_projet || null,
        project_type_bien: project_type_bien || safeSnapshot?.type_bien || null,
        project_city_choice_1:
          project_city_choice_1 ||
          safeSnapshot?.city_choice_1 ||
          safeSnapshot?.city ||
          null,
        city_choice_1:
          city_choice_1 ||
          project_city_choice_1 ||
          safeSnapshot?.city_choice_1 ||
          safeSnapshot?.city ||
          null,
        project_origin: project_origin || safeSnapshot?.source || null,
        first_message: initialMessage?.trim() || null,
        is_active: true,
      };

      const { error: connError } = await supabase.from("connections").insert(payload);

      if (connError) {
        throw connError;
      }

      const { data: insertedRow, error: insertedRowError } = await supabase
        .from("connections")
        .select("id")
        .eq("user_id", user.id)
        .eq("requesting_user_id", user.id)
        .eq("target_user_id", targetUserId)
        .eq(projectKey, projectId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (insertedRowError) {
        throw insertedRowError;
      }

      if (!insertedRow?.id) {
        throw new Error("Connexion créée mais introuvable après insertion.");
      }

      if (initialMessage?.trim()) {
        const { error: messageError } = await supabase.from("messages").insert({
          connection_id: insertedRow.id,
          sender_id: user.id,
          content: initialMessage.trim(),
        });

        if (messageError) {
          throw messageError;
        }
      }

      toast({
        title: "Succès",
        description: "Votre demande de mise en relation a été envoyée.",
      });

      if (isModal) {
        onConnectionUpdate?.();
      } else {
        navigate(`/chat/${insertedRow.id}`, { replace: true });
      }
    } catch (err) {
      console.error("[ChatPage] createConnectionAndSendMessage error:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          err?.message || "Impossible de créer la mise en relation.",
      });
      handleCloseOrBack();
    } finally {
      setLoading(false);
    }
  }, [
    isNewChat,
    newChatState,
    user,
    toast,
    navigate,
    isModal,
    onConnectionUpdate,
    buildFallbackSnapshot,
    handleCloseOrBack,
  ]);

  const fetchConnectionDetails = useCallback(async () => {
    if (isNewChat || !connectionId || !user) return;

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("connections_enriched_safe")
        .select("*")
        .eq("id", connectionId)
        .single();

      if (error) {
        throw error;
      }

      const isParticipant =
        user.id === data.requesting_user_id || user.id === data.target_user_id;

      if (!isParticipant) {
        throw new Error("Vous ne faites pas partie de cette conversation.");
      }

      setConnection(data);
    } catch (err) {
      console.error("[ChatPage] fetchConnectionDetails error:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          err?.message || "Impossible de charger la connexion.",
      });
      handleCloseOrBack();
    } finally {
      setLoading(false);
    }
  }, [connectionId, user, toast, isNewChat, handleCloseOrBack]);

  const fetchMessages = useCallback(async () => {
    if (isNewChat || !connectionId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("connection_id", connectionId)
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[ChatPage] fetchMessages error:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les messages.",
      });
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [connectionId, toast, isNewChat]);

  useEffect(() => {
    if (!user) return;

    if (isNewChat) {
      createConnectionAndSendMessage();
    } else if (connectionId) {
      fetchConnectionDetails();
    }
  }, [user, connectionId, isNewChat, createConnectionAndSendMessage, fetchConnectionDetails]);

  useEffect(() => {
    if (!isNewChat && connection?.id) {
      fetchMessages();
    }
  }, [isNewChat, connection?.id, fetchMessages]);

  useEffect(() => {
    if (isNewChat || !connectionId) return;

    const channel = supabase
      .channel(`chat:${connectionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `connection_id=eq.${connectionId}`,
        },
        (payload) => {
          setMessages((current) => {
            if (current.some((m) => m.id === payload.new.id)) return current;
            return [...current, payload.new];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [connectionId, isNewChat]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !connection || !user || sending) return;

    setSending(true);

    const optimistic = {
      id: `temp-${Date.now()}`,
      connection_id: connectionId,
      sender_id: user.id,
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
      _optimistic: true,
    };

    setMessages((curr) => [...curr, optimistic]);
    setNewMessage("");
    scrollToBottom();

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          connection_id: connectionId,
          sender_id: user.id,
          content: optimistic.content,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setMessages((curr) => {
        const withoutTemp = curr.filter((m) => m.id !== optimistic.id);
        if (withoutTemp.some((m) => m.id === data.id)) return withoutTemp;
        return [...withoutTemp, data];
      });

      scrollToBottom();
    } catch (err) {
      console.error("[ChatPage] handleSendMessage error:", err);
      setMessages((curr) => curr.filter((m) => m.id !== optimistic.id));
      setNewMessage(optimistic.content);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Le message n'a pas pu être envoyé.",
      });
    } finally {
      setSending(false);
    }
  };

  const handleConnectionResponse = async (newStatus) => {
    if (!connectionId || !user?.id) return;

    try {
      const { error } = await supabase
        .from("connections")
        .update({ status: newStatus })
        .eq("id", connectionId)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      setConnection((prev) => (prev ? { ...prev, status: newStatus } : prev));

      toast({
        title: "Succès",
        description: `Connexion ${newStatus === "approved" ? "approuvée" : "refusée"
          }.`,
      });

      onConnectionUpdate?.();
    } catch (err) {
      console.error("[ChatPage] handleConnectionResponse error:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Impossible de ${newStatus === "approved" ? "approuver" : "refuser"
          } la connexion.`,
      });
    }
  };

  const projectSnapshot = useMemo(() => {
    const raw = connection?.project_snapshot;
    if (!raw) return null;
    if (typeof raw === "object") return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, [connection]);

  const projectForCard = useMemo(() => {
    return normalizeSnapshotForProjectCard(projectSnapshot);
  }, [projectSnapshot, normalizeSnapshotForProjectCard]);

  if (loading || !user || (!connection && !isNewChat)) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (isNewChat) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue mb-4" />
        <p className="text-lg font-semibold">Création de la mise en relation...</p>
      </div>
    );
  }

  const otherUser =
    user.id === connection.requesting_user_id
      ? {
        id: connection.target_user_id,
        first_name: connection.target_first_name,
        last_name: connection.target_last_name,
        company: connection.target_company,
        role: connection.target_role,
        avatar_url: connection.target_avatar_url || null,
      }
      : {
        id: connection.requesting_user_id,
        first_name: connection.requesting_first_name,
        last_name: connection.requesting_last_name,
        company: connection.requesting_company,
        role: connection.requesting_role,
        avatar_url: connection.requesting_avatar_url || null,
      };

  const amITheTarget = user.id === connection.target_user_id;

  const renderHeader = () => {
    if (managedByParentUI) return null;

    const statusLower = String(connection.status || "").toLowerCase();

    const otherName =
      statusLower === "approved" || amITheTarget
        ? `${otherUser.first_name || ""} ${otherUser.last_name || ""}`.trim() ||
        (otherUser.role === "professionnel"
          ? "Professionnel"
          : "Utilisateur")
        : otherUser.role === "professionnel"
          ? "Un Professionnel Partenaire"
          : "Un Particulier";

    const otherDetail =
      statusLower === "approved" || amITheTarget
        ? otherUser.company || otherUser.role || ""
        : "";

    return (
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={otherUser.avatar_url} />
            <AvatarFallback>
              {otherUser.role === "professionnel" ? <Building /> : <User />}
            </AvatarFallback>
          </Avatar>

          <div>
            <h2 className="font-semibold text-lg">{otherName}</h2>
            <p className="text-sm text-muted-foreground">{otherDetail}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {CONNECTION_STATUS_BADGE(connection.status)}
          {isModal && !managedByParentUI && (
            <Button variant="ghost" size="icon" onClick={closeModal}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderActionButtons = () => {
    if (managedByParentUI) return null;
    if (connection.status !== "pending" || !amITheTarget) return null;

    return (
      <div className="p-3 border-t bg-gray-50">
        <p className="text-center text-sm text-muted-foreground mb-3">
          Vous avez reçu une demande de mise en relation.
        </p>

        <div className="flex justify-center gap-3">
          <Button
            variant="success"
            size="sm"
            onClick={() => handleConnectionResponse("approved")}
          >
            <UserCheck className="mr-2 h-4 w-4" />
            Accepter
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleConnectionResponse("rejected")}
          >
            <UserX className="mr-2 h-4 w-4" />
            Refuser
          </Button>
        </div>
      </div>
    );
  };

  const renderInputField = () => {
    if (connection.status === "rejected") {
      return (
        <div className="p-4 border-t text-center text-muted-foreground bg-gray-50">
          Cette mise en relation a été refusée.
        </div>
      );
    }

    if (connection.status === "suspended") {
      return (
        <div className="p-4 border-t text-center text-muted-foreground bg-gray-50">
          Cette mise en relation est suspendue.
        </div>
      );
    }

    if (connection.status === "pending" && !amITheTarget) {
      return (
        <div className="p-4 border-t text-center text-muted-foreground bg-gray-50">
          Votre demande est en attente d&apos;approbation.
        </div>
      );
    }

    return (
      <form onSubmit={handleSendMessage} className="p-4 border-t flex items-center gap-3">
        <Textarea
          placeholder="Tapez votre message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          rows={1}
          className="flex-grow resize-none"
          disabled={sending}
        />
        <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    );
  };

  return (
    <div className={`flex flex-col h-full ${isModal ? "" : "w-full max-w-4xl mx-auto py-8"}`}>
      <Card className="flex flex-col h-full w-full">
        {renderHeader()}

        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {shouldShowProject && projectForCard && (
            <div className="pb-4 mb-4 border-b">
              <h3 className="font-semibold text-center mb-2">
                Projet concerné par la mise en relation
              </h3>
              <ProjectCard
                project={projectForCard}
                hideOwnership
                hideRoleIcon={false}
                standalone
              />
            </div>
          )}

          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                layout
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className={`flex ${msg.sender_id === user.id ? "justify-end" : "justify-start"
                  }`}
              >
                <div
                  className={`max-w-lg p-3 rounded-lg ${msg.sender_id === user.id
                      ? "bg-brand-blue text-white"
                      : "bg-gray-200"
                    }`}
                >
                  <p>{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${msg.sender_id === user.id ? "text-blue-200" : "text-gray-500"
                      }`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </CardContent>

        {renderActionButtons()}
        {renderInputField()}
      </Card>
    </div>
  );
};

export default ChatPage;