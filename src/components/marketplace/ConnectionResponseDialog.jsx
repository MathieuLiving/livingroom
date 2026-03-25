import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "../../../lib/customSupabaseClient";
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from "@/components/ui/badge";

import {
  Loader2,
  UserCheck,
  UserX,
  MessageSquare,
  Building,
  User
} from 'lucide-react';

/* ------------------- Utils ------------------- */
const getStatusBadge = (status) => {
  switch (status) {
    case 'approved':
      return <Badge variant="success">Approuvé</Badge>;
    case 'pending':
      return <Badge variant="warning">En attente</Badge>;
    case 'rejected':
      return <Badge variant="destructive">Refusé</Badge>;
    default:
      return <Badge variant="secondary">{status || 'Inconnu'}</Badge>;
  }
};

/* ------------------- Component ------------------- */
const ConnectionResponseDialog = ({
  connection,
  open,
  onOpenChange,
  onStatusChange
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");

  if (!connection) return null;

  const otherUser = connection.other_user;
  const isProToPro = connection.connection_type === 'professionnel_to_professionnel';
  const status = connection.status || 'pending';

  // 🔐 On ne montre l'identité que si la mise en relation est approuvée
  const canShowIdentity = status === 'approved';
  const displayName =
    canShowIdentity && (otherUser?.first_name || otherUser?.last_name)
      ? `${otherUser.first_name || ""} ${otherUser.last_name || ""}`.trim()
      : "Interlocuteur";

  const closeAndReset = () => {
    setResponseMessage("");
    onOpenChange(false);
  };

  const handleResponse = async (newStatus) => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // 1️⃣ Met à jour le statut dans la base
      const { error } = await supabase
        .from('connections')
        .update({ status: newStatus })
        .eq('id', connection.id);

      if (error) throw error;

      // 2️⃣ Ajoute un message si renseigné
      if (responseMessage.trim()) {
        const { error: msgErr } = await supabase.from('messages').insert({
          connection_id: connection.id,
          sender_id: user.id,
          content: responseMessage.trim(),
        });
        if (msgErr) throw msgErr;
      }

      // 3️⃣ Met à jour l'état local et ferme la modale
      onStatusChange?.(connection.id, newStatus);
      closeAndReset();

      // 4️⃣ Redirection auto si approuvé
      if (newStatus === 'approved') {
        navigate(`/chat/${connection.id}`);
      }
    } catch (e) {
      console.error('Error responding to connection:', e);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de traiter votre réponse.'
      });
    } finally {
      setLoading(false);
    }
  };

  const openChat = () => {
    closeAndReset();
    navigate(`/chat/${connection.id}`);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) closeAndReset();
        else onOpenChange(true);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Répondre à la demande</DialogTitle>
          <DialogDescription>
            Acceptez, refusez, ou discutez avant de prendre votre décision.
          </DialogDescription>
        </DialogHeader>

        {/* -------- Interlocuteur + Statut -------- */}
        <div className="py-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-100 p-3 rounded-md">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={otherUser?.avatar_url || ''} alt="" />
                <AvatarFallback>
                  {isProToPro ? (
                    <Building className="h-6 w-6 text-gray-500" />
                  ) : (
                    <User className="h-6 w-6 text-gray-500" />
                  )}
                </AvatarFallback>
              </Avatar>

              <div>
                <p className="font-semibold">
                  {displayName}
                </p>
                <p className="text-sm text-gray-500">
                  {isProToPro
                    ? otherUser?.company_name || 'Professionnel'
                    : 'Particulier'}
                </p>
              </div>
            </div>

            <div className="mt-2 sm:mt-0">{getStatusBadge(status)}</div>
          </div>

          {/* -------- Zone de message -------- */}
          <Textarea
            placeholder="Ajouter un message (optionnel)…"
            value={responseMessage}
            onChange={(e) => setResponseMessage(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* -------- Boutons d’action -------- */}
        <DialogFooter className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Button
            variant="destructive"
            onClick={() => handleResponse('rejected')}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserX className="mr-2 h-4 w-4" />
            )}
            Refuser
          </Button>

          <Button variant="outline" onClick={openChat} disabled={loading}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Discuter
          </Button>

          <Button
            variant="success"
            onClick={() => handleResponse('approved')}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserCheck className="mr-2 h-4 w-4" />
            )}
            Accepter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectionResponseDialog;