// src/components/agence/DirectorTeamSetUpPage.jsx
import React, { useMemo, useEffect, useState, useCallback } from "react";

// ✅ IMPORTANT : client Supabase UNIQUE à la racine /lib (pas dans src/lib)
import { supabase } from "../../../lib/customSupabaseClient";

import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Loader2,
  UserPlus,
  Trash2,
  Search,
  Users,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

/**
 * ✅ DirectorTeamSetupPage (component)
 * Fixes :
 * - Charge members via RPC director_list_agency_members_enriched (source de vérité = agency_members)
 * - Affiche le N+1 via manager_user_id (pas team_leader_id)
 * - Fallback prénom/nom via invitations (par email) si pro first/last sont null
 * - KPI par rôle : comptes créés / invitations envoyées / comptes confirmés
 */

const norm = (v) => String(v ?? "").trim().toLowerCase();
const normEmail = (v) => String(v ?? "").trim().toLowerCase();

const safeFullName = (p) => {
  const first = String(p?.first_name ?? "").trim();
  const last = String(p?.last_name ?? "").trim();
  const full = `${first} ${last}`.trim();
  return full || String(p?.email ?? "").trim() || "—";
};

const isInviteCountedAsSent = (inv) => norm(inv?.status) !== "revoked";
const isInviteAccepted = (inv) => norm(inv?.status) === "accepted";

export default function DirectorTeamSetupPage({ agency }) {
  const { toast } = useToast();

  const [members, setMembers] = useState([]); // membres (hors director)
  const [invites, setInvites] = useState([]);

  const [loading, setLoading] = useState(true);
  const [invitesLoading, setInvitesLoading] = useState(false);

  const [inviting, setInviting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFirstName, setInviteFirstName] = useState("");
  const [inviteLastName, setInviteLastName] = useState("");
  const [inviteRole, setInviteRole] = useState("agent");
  const [inviteTeamLeader, setInviteTeamLeader] = useState("director"); // 'director' or pro_id
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const resetForm = () => {
    setInviteEmail("");
    setInviteFirstName("");
    setInviteLastName("");
    setInviteRole("agent");
    setInviteTeamLeader("director");
  };

  /**
   * ✅ Invitations via RPC (sinon RLS bloque)
   */
  const fetchInvitations = useCallback(async () => {
    setInvitesLoading(true);
    try {
      const { data, error } = await supabase.rpc(
        "director_list_agency_invitations"
      );
      if (error) throw error;

      const normalized = (data || []).map((r) => ({
        ...r,
        email: r.email ? String(r.email).trim() : r.email,
        role: r.role ? String(r.role).trim() : r.role,
        status: r.status ? String(r.status).trim() : r.status,
        first_name: r.first_name ?? null,
        last_name: r.last_name ?? null,
      }));

      setInvites(normalized);
      return normalized;
    } catch (err) {
      console.error("[DirectorTeamSetupPage] fetchInvitations:", err);
      setInvites([]);
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          err?.message || "Impossible de charger les invitations d'agence.",
      });
      return [];
    } finally {
      setInvitesLoading(false);
    }
  }, [toast]);

  /**
   * ✅ Members:
   * 1) RPC director_list_agency_members_enriched (recommandé) : basé sur agency_members
   * 2) fallback : lecture professionnels (peut être bloquée RLS)
   */
  const fetchMembers = useCallback(async () => {
    if (!agency?.id) return [];

    // 1) RPC
    try {
      const { data, error } = await supabase.rpc(
        "director_list_agency_members_enriched"
      );

      if (!error && Array.isArray(data)) {
        const normalized = data
          .map((r) => {
            // Champs pro (selon ton RPC)
            const first_name =
              r.first_name ?? r.pro_first_name ?? r.profirstname ?? null;
            const last_name =
              r.last_name ?? r.pro_last_name ?? r.prolastname ?? null;
            const email = r.email ?? r.pro_email ?? null;

            return {
              // pro_id pour clé stable et dropdown TL
              id: r.pro_id ?? r.professionnel_id ?? r.user_id,
              // user_id indispensable (manager_user_id est un user_id)
              user_id: r.user_id ?? r.me_user_id ?? null,

              // ✅ hiérarchie AGENCE (source de vérité)
              agency_id: r.agency_id ?? agency?.id ?? null,
              agency_role: r.role ?? r.agency_role ?? null, // agent / team_leader / director
              is_active: r.is_active ?? true,
              created_at: r.created_at ?? null,

              // ✅ N+1 AGENCE = manager_user_id
              manager_user_id: r.manager_user_id ?? null,

              // Champs pro utiles UI
              first_name,
              last_name,
              email,
              phone: r.phone ?? r.pro_phone ?? null,
              avatar_url: r.avatar_url ?? r.pro_avatar_url ?? null,

              // team_leader_id (professionnels.id) éventuellement utile ailleurs,
              // mais pas pour afficher le manager agence !
              team_leader_id: r.team_leader_id ?? null,
            };
          })
          .filter((m) => norm(m.agency_role) !== "director"); // on exclut le director de la liste

        setMembers(normalized);
        return normalized;
      }

      if (error) {
        console.warn(
          "[DirectorTeamSetupPage] RPC members error (fallback):",
          error?.message
        );
      }
    } catch (e) {
      console.warn("[DirectorTeamSetupPage] RPC members failed (fallback):", e);
    }

    // 2) fallback direct (peut être bloqué RLS)
    try {
      const { data, error } = await supabase
        .from("professionnels")
        .select(
          "id, user_id, agency_id, agency_role, first_name, last_name, email, phone, avatar_url, team_leader_id, created_at, is_active"
        )
        .eq("agency_id", agency.id)
        .neq("agency_role", "director");

      if (error) throw error;

      // Fallback : pas de manager_user_id (agency_members), donc on met null.
      const normalized = (data || []).map((p) => ({
        ...p,
        manager_user_id: null,
      }));

      setMembers(normalized);
      return normalized;
    } catch (err) {
      console.error("[DirectorTeamSetupPage] fetchMembers fallback:", err);
      setMembers([]);
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          err?.message ||
          "Impossible de charger l'équipe (RLS probable sur professionnels).",
      });
      return [];
    }
  }, [agency?.id, agency?.id, toast]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchMembers(), fetchInvitations()]);
    } finally {
      setLoading(false);
    }
  }, [fetchMembers, fetchInvitations]);

  useEffect(() => {
    if (agency?.id) refreshAll();
  }, [agency?.id, refreshAll]);

  /**
   * ✅ Map invites by email -> fallback noms/prénoms
   */
  const invByEmail = useMemo(() => {
    const m = new Map();
    (invites || [])
      .filter((i) => i?.email)
      .forEach((i) => m.set(normEmail(i.email), i));
    return m;
  }, [invites]);

  /**
   * ✅ enrich members with invite names if pro names missing
   */
  const enrichedMembers = useMemo(() => {
    return (members || []).map((m) => {
      const key = normEmail(m?.email);
      const inv = key ? invByEmail.get(key) : null;

      const first_name = String(m?.first_name || inv?.first_name || "").trim();
      const last_name = String(m?.last_name || inv?.last_name || "").trim();

      return {
        ...m,
        first_name,
        last_name,
        _invite: inv || null,
      };
    });
  }, [members, invByEmail]);

  /**
   * ✅ pour afficher le manager agence :
   * manager_user_id (user_id) -> membre TL (user_id)
   */
  const memberByUserId = useMemo(() => {
    const m = new Map();
    (enrichedMembers || []).forEach((x) => {
      if (x?.user_id) m.set(String(x.user_id), x);
    });
    return m;
  }, [enrichedMembers]);

  const filteredMembers = useMemo(() => {
    const q = norm(searchTerm);
    if (!q) return enrichedMembers;

    return enrichedMembers.filter((m) => {
      const email = norm(m?.email);
      const fn = norm(m?.first_name);
      const ln = norm(m?.last_name);
      return email.includes(q) || fn.includes(q) || ln.includes(q);
    });
  }, [enrichedMembers, searchTerm]);

  const teamLeaders = useMemo(
    () => filteredMembers.filter((m) => norm(m.agency_role) === "team_leader"),
    [filteredMembers]
  );
  const agents = useMemo(
    () => filteredMembers.filter((m) => norm(m.agency_role) === "agent"),
    [filteredMembers]
  );

  /**
   * ✅ Stats par rôle
   * - comptes créés = members réellement présents (agency_members)
   * - invitations envoyées = invites non revoked
   * - comptes confirmés = max(comptes créés, invites accepted)
   */
  const roleStats = useMemo(() => {
    const membersByRole = (role) =>
      (members || []).filter((m) => norm(m.agency_role) === role);

    const invitesByRole = (role) =>
      (invites || []).filter((i) => norm(i.role) === role);

    const make = (role) => {
      const mem = membersByRole(role);
      const inv = invitesByRole(role);

      const created_accounts = mem.length;
      const invitations_sent = inv.filter(isInviteCountedAsSent).length;
      const accepted = inv.filter(isInviteAccepted).length;

      const confirmed_accounts = Math.max(created_accounts, accepted);

      return { created_accounts, invitations_sent, confirmed_accounts };
    };

    return {
      team_leader: make("team_leader"),
      agent: make("agent"),
    };
  }, [members, invites]);

  const handleInvite = async () => {
    const email = normEmail(inviteEmail);
    if (!email || !inviteFirstName.trim() || !inviteLastName.trim()) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
      });
      return;
    }

    setInviting(true);
    try {
      const tlProId = inviteTeamLeader === "director" ? null : inviteTeamLeader;

      const { error } = await supabase.rpc("director_create_agency_invitation", {
        p_email: email,
        p_first_name: inviteFirstName.trim(),
        p_last_name: inviteLastName.trim(),
        p_role: norm(inviteRole),
        p_team_leader_pro_id: tlProId,
      });

      if (error) throw error;

      toast({
        title: "Invitation envoyée",
        description: `Un email a été envoyé à ${email}.`,
      });

      setIsInviteOpen(false);
      resetForm();
      await refreshAll();
    } catch (err) {
      console.error("[DirectorTeamSetupPage] handleInvite:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err?.message || "Échec de l'envoi de l'invitation.",
      });
    } finally {
      setInviting(false);
    }
  };

  const handleDelete = async () => {
    toast({
      title: "Fonctionnalité limitée",
      description:
        "Pour la sécurité, veuillez désactiver le membre depuis son profil ou contacter le support.",
    });
  };

  /**
   * ✅ dropdown rattachement (N+1) pour agent = team leaders existants
   * IMPORTANT : on envoie p_team_leader_pro_id => donc il faut une valeur = pro_id
   */
  const teamLeaderChoices = useMemo(() => {
    return (enrichedMembers || [])
      .filter((m) => norm(m.agency_role) === "team_leader")
      .map((m) => ({
        pro_id: m.id,
        label: safeFullName(m),
      }));
  }, [enrichedMembers]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement de l’équipe…
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestion d'Équipe</h2>
          <p className="text-muted-foreground">
            Gérez la hiérarchie, les accès et les invitations.
          </p>
          <div className="mt-2 text-xs text-muted-foreground">
            {invitesLoading ? "Synchronisation invitations…" : null}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshAll} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>

          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button className="bg-brand-blue hover:bg-blue-700">
                <UserPlus className="mr-2 h-4 w-4" /> Inviter un membre
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Inviter un nouveau collaborateur</DialogTitle>
                <DialogDescription>
                  Configurez le rôle et le rattachement hiérarchique.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prénom *</Label>
                    <Input
                      value={inviteFirstName}
                      onChange={(e) => setInviteFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nom *</Label>
                    <Input
                      value={inviteLastName}
                      onChange={(e) => setInviteLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Email professionnel *</Label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rôle</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agent">Agent / Négociateur</SelectItem>
                        <SelectItem value="team_leader">Team Leader</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Rattachement (N+1)</Label>
                    <Select
                      value={inviteTeamLeader}
                      onValueChange={setInviteTeamLeader}
                      disabled={inviteRole === "team_leader"}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="director">Directeur (Vous)</SelectItem>
                        {teamLeaderChoices.map((tl) => (
                          <SelectItem key={tl.pro_id} value={tl.pro_id}>
                            {tl.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                  Annuler
                </Button>
                <Button
                  onClick={handleInvite}
                  disabled={inviting}
                  className="bg-brand-blue"
                >
                  {inviting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Envoyer l'invitation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ✅ KPI Cards (Team Leaders / Agents) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-purple-600" />
              <CardTitle>Team Leaders</CardTitle>
            </div>
            <CardDescription>Comptes & invitations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-gray-50 border p-3">
                <p className="text-xs text-muted-foreground">Comptes créés</p>
                <p className="text-2xl font-bold mt-1">
                  {roleStats.team_leader.created_accounts}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 border p-3">
                <p className="text-xs text-muted-foreground">
                  Invitations envoyées
                </p>
                <p className="text-2xl font-bold mt-1">
                  {roleStats.team_leader.invitations_sent}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 border p-3">
                <p className="text-xs text-muted-foreground">Comptes confirmés</p>
                <p className="text-2xl font-bold mt-1">
                  {roleStats.team_leader.confirmed_accounts}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <CardTitle>Agents & Négociateurs</CardTitle>
            </div>
            <CardDescription>Comptes & invitations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-gray-50 border p-3">
                <p className="text-xs text-muted-foreground">Comptes créés</p>
                <p className="text-2xl font-bold mt-1">
                  {roleStats.agent.created_accounts}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 border p-3">
                <p className="text-xs text-muted-foreground">
                  Invitations envoyées
                </p>
                <p className="text-2xl font-bold mt-1">
                  {roleStats.agent.invitations_sent}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 border p-3">
                <p className="text-xs text-muted-foreground">Comptes confirmés</p>
                <p className="text-2xl font-bold mt-1">
                  {roleStats.agent.confirmed_accounts}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un membre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 max-w-sm"
        />
      </div>

      {/* Team Leaders Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-purple-600" />
            <CardTitle>Team Leaders</CardTitle>
          </div>
          <CardDescription>Responsables d'équipe (N+1)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Date d'arrivée</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamLeaders.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {safeFullName(member)}
                  </TableCell>
                  <TableCell>{member.email || "—"}</TableCell>
                  <TableCell>
                    {member.created_at
                      ? new Date(member.created_at).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete()}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {teamLeaders.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-6 text-muted-foreground"
                  >
                    Aucun Team Leader.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Agents Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <CardTitle>Agents & Négociateurs</CardTitle>
          </div>
          <CardDescription>Membres opérationnels</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Responsable (N+1)</TableHead>
                <TableHead>Date d'arrivée</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((member) => {
                // ✅ Manager = agency_members.manager_user_id (user_id)
                const mgrUserId = member?.manager_user_id
                  ? String(member.manager_user_id)
                  : null;

                const manager = mgrUserId ? memberByUserId.get(mgrUserId) : null;

                return (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {safeFullName(member)}
                    </TableCell>
                    <TableCell>{member.email || "—"}</TableCell>
                    <TableCell>
                      {manager ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {safeFullName(manager)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Directeur
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {member.created_at
                        ? new Date(member.created_at).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete()}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {agents.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-6 text-muted-foreground"
                  >
                    Aucun agent.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}