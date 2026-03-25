import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/customSupabaseClient";
import { useAgencyData } from "@/hooks/useAgencyData";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  Plus,
  Ban,
  CheckCircle,
  Clock3,
  Eye,
  EyeOff,
} from "lucide-react";

const normalizeRole = (role) => String(role || "").trim().toLowerCase();

export default function AgencyTeamManagement() {
  const { agencyId, loading: agencyLoading } = useAgencyData();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibilitySavingUserId, setVisibilitySavingUserId] = useState(null);
  const { toast } = useToast();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    role: "agent_affiliate",
    team_leader: null,
  });
  const [isInviting, setIsInviting] = useState(false);

  const teamLeaders = useMemo(
    () =>
      members.filter((m) => {
        const role = normalizeRole(m.role);
        return role === "team_leader" || role === "director";
      }),
    [members]
  );

  useEffect(() => {
    if (agencyId) fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agencyId]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data: memberships, error: memError } = await supabase
        .from("agency_members")
        .select(
          `
          user_id,
          role,
          is_active,
          created_at,
          user:user_id ( email )
        `
        )
        .eq("agency_id", agencyId)
        .order("created_at", { ascending: true });

      if (memError) throw memError;

      const safeMemberships = memberships || [];
      const userIds = safeMemberships.map((m) => m.user_id).filter(Boolean);

      let pros = [];
      if (userIds.length > 0) {
        const { data: prosData, error: proError } = await supabase
          .from("professionnels")
          .select(
            `
            id,
            user_id,
            first_name,
            last_name,
            avatar_url,
            team_leader_id,
            team_leader_pro_id,
            agency_role,
            is_validated_by_administrator,
            visibility_pro_partner_page
          `
          )
          .in("user_id", userIds);

        if (proError) throw proError;
        pros = prosData || [];
      }

      const proByUserId = new Map(pros.map((p) => [p.user_id, p]));

      const merged = safeMemberships.map((mem) => {
        const pro = proByUserId.get(mem.user_id) || {};
        return {
          user_id: mem.user_id,
          role: mem.role,
          is_active: Boolean(mem.is_active),
          created_at: mem.created_at,
          email: mem.user?.email || "N/A",

          pro_id: pro.id || null,
          first_name: pro.first_name || "",
          last_name: pro.last_name || "",
          avatar_url: pro.avatar_url || null,
          team_leader_id: pro.team_leader_id || null,
          team_leader_pro_id: pro.team_leader_pro_id || null,
          agency_role: pro.agency_role || mem.role || null,
          is_validated_by_administrator: Boolean(pro.is_validated_by_administrator),
          visibility_pro_partner_page: Boolean(pro.visibility_pro_partner_page),
        };
      });

      setMembers(merged);
    } catch (err) {
      console.error("Fetch members error:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger l'équipe.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setIsInviting(true);

    try {
      const { error } = await supabase.rpc("director_create_invitation", {
        p_email: inviteData.email,
        p_first_name: inviteData.first_name,
        p_last_name: inviteData.last_name,
        p_role: inviteData.role,
        p_team_leader_pro_id: inviteData.team_leader,
      });

      if (error) throw error;

      toast({
        title: "Invitation envoyée",
        description: `Un email a été envoyé à ${inviteData.email}.`,
      });

      setInviteOpen(false);
      setInviteData({
        email: "",
        first_name: "",
        last_name: "",
        role: "agent_affiliate",
        team_leader: null,
      });

      await fetchMembers();
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err.message || "Échec de l'invitation.",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const toggleActive = async (userId, currentState) => {
    try {
      const { error } = await supabase.rpc("director_set_member_active", {
        p_user_id: userId,
        p_is_active: !currentState,
      });

      if (error) throw error;

      setMembers((prev) =>
        prev.map((m) =>
          m.user_id === userId ? { ...m, is_active: !currentState } : m
        )
      );

      toast({
        title: !currentState ? "Membre activé" : "Membre désactivé",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err.message,
      });
    }
  };

  const updateTeamLeader = async (userId, newLeaderId) => {
    try {
      const member = members.find((m) => m.user_id === userId);
      if (!member?.pro_id) throw new Error("Profil professionnel introuvable");

      const { error } = await supabase.rpc("director_set_agent_team_leader", {
        p_agent_id: member.pro_id,
        p_team_leader_id: newLeaderId === "none" ? null : newLeaderId,
      });

      if (error) throw error;

      setMembers((prev) =>
        prev.map((m) =>
          m.user_id === userId
            ? {
                ...m,
                team_leader_pro_id: newLeaderId === "none" ? null : newLeaderId,
              }
            : m
        )
      );

      toast({ title: "Rattachement mis à jour" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err.message,
      });
    }
  };

  const togglePartnerVisibility = async (member, checked) => {
    if (!member?.pro_id) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Profil professionnel introuvable.",
      });
      return;
    }

    if (!member.is_validated_by_administrator) {
      toast({
        variant: "destructive",
        title: "Validation requise",
        description:
          "Ce collaborateur doit d’abord être validé par l’administrateur de la plateforme.",
      });
      return;
    }

    const previousValue = Boolean(member.visibility_pro_partner_page);
    setVisibilitySavingUserId(member.user_id);

    setMembers((prev) =>
      prev.map((m) =>
        m.user_id === member.user_id
          ? { ...m, visibility_pro_partner_page: checked }
          : m
      )
    );

    try {
      const { error } = await supabase
        .from("professionnels")
        .update({
          visibility_pro_partner_page: checked,
          updated_at: new Date().toISOString(),
        })
        .eq("id", member.pro_id);

      if (error) throw error;

      toast({
        title: "Visibilité mise à jour",
        description: checked
          ? "Le collaborateur apparaîtra sur la page partenaires."
          : "Le collaborateur n’apparaîtra plus sur la page partenaires.",
      });
    } catch (err) {
      console.error("togglePartnerVisibility error:", err);

      setMembers((prev) =>
        prev.map((m) =>
          m.user_id === member.user_id
            ? { ...m, visibility_pro_partner_page: previousValue }
            : m
        )
      );

      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          err.message ||
          "Impossible de mettre à jour la visibilité sur la page partenaires.",
      });
    } finally {
      setVisibilitySavingUserId(null);
    }
  };

  if (agencyLoading || loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Membres de l'équipe ({members.length})</h2>

        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Inviter un membre
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Inviter un nouveau collaborateur</DialogTitle>
              <DialogDescription>
                Envoyez une invitation par email pour rejoindre l'agence.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleInvite} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prénom</Label>
                  <Input
                    value={inviteData.first_name}
                    onChange={(e) =>
                      setInviteData({ ...inviteData, first_name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input
                    value={inviteData.last_name}
                    onChange={(e) =>
                      setInviteData({ ...inviteData, last_name: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={inviteData.email}
                  onChange={(e) =>
                    setInviteData({ ...inviteData, email: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select
                  value={inviteData.role}
                  onValueChange={(v) =>
                    setInviteData({
                      ...inviteData,
                      role: v,
                      team_leader: v === "agent_affiliate" ? inviteData.team_leader : null,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent_affiliate">Agent affilié</SelectItem>
                    <SelectItem value="team_leader">Team Leader</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {inviteData.role === "agent_affiliate" && teamLeaders.length > 0 && (
                <div className="space-y-2">
                  <Label>Rattaché à</Label>
                  <Select
                    value={inviteData.team_leader || "none"}
                    onValueChange={(v) =>
                      setInviteData({
                        ...inviteData,
                        team_leader: v === "none" ? null : v,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Aucun (Rattaché au Directeur)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun (Rattaché au Directeur)</SelectItem>
                      {teamLeaders
                        .filter((tl) => tl.pro_id)
                        .map((tl) => (
                          <SelectItem key={tl.user_id} value={tl.pro_id}>
                            {tl.first_name} {tl.last_name} —{" "}
                            {normalizeRole(tl.role) === "director"
                              ? "Directeur"
                              : "Team Leader"}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Optionnel.</p>
                </div>
              )}

              <DialogFooter>
                <Button type="submit" disabled={isInviting}>
                  {isInviting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Envoyer l'invitation"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Avatar</TableHead>
              <TableHead>Identité</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Statut compte</TableHead>
              <TableHead>Validation admin</TableHead>
              <TableHead>Page partenaires</TableHead>
              <TableHead>Rattaché à</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {members.map((member) => {
              const savingVisibility = visibilitySavingUserId === member.user_id;
              const currentLeader = members.find(
                (m) => m.pro_id && m.pro_id === member.team_leader_pro_id
              );

              return (
                <TableRow key={member.user_id}>
                  <TableCell>
                    <Avatar>
                      <AvatarImage src={member.avatar_url || ""} />
                      <AvatarFallback>
                        {(member.first_name?.[0] || member.email?.[0] || "?").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>

                  <TableCell>
                    <div className="font-medium">
                      {[member.first_name, member.last_name].filter(Boolean).join(" ") || "Sans nom"}
                    </div>
                    <div className="text-sm text-muted-foreground">{member.email}</div>
                  </TableCell>

                  <TableCell>
                    <RoleBadge role={member.role} />
                  </TableCell>

                  <TableCell>
                    {member.is_active ? (
                      <div className="flex items-center text-green-600 text-sm font-medium">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Actif
                      </div>
                    ) : (
                      <div className="flex items-center text-red-500 text-sm font-medium">
                        <Ban className="w-4 h-4 mr-1" />
                        Inactif
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    {member.is_validated_by_administrator ? (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        Validé
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-amber-50 text-amber-700 border-amber-200"
                      >
                        <Clock3 className="w-3.5 h-3.5 mr-1" />
                        En attente
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={Boolean(member.visibility_pro_partner_page)}
                        disabled={!member.is_validated_by_administrator || savingVisibility}
                        onCheckedChange={(checked) =>
                          togglePartnerVisibility(member, checked)
                        }
                      />

                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {member.visibility_pro_partner_page ? "Affiché" : "Masqué"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {!member.is_validated_by_administrator
                            ? "Validation admin requise"
                            : member.visibility_pro_partner_page
                            ? "Visible sur PartnerProfessionnelPage"
                            : "Non visible sur PartnerProfessionnelPage"}
                        </span>
                      </div>

                      {savingVisibility ? (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      ) : member.visibility_pro_partner_page ? (
                        <Eye className="w-4 h-4 text-green-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    {normalizeRole(member.role) === "agent_affiliate" ? (
                      <div className="space-y-2 min-w-[220px]">
                        <div className="text-sm text-muted-foreground">
                          {currentLeader
                            ? `${currentLeader.first_name} ${currentLeader.last_name}`
                            : "Directeur"}
                        </div>

                        <Select
                          value={member.team_leader_pro_id || "none"}
                          onValueChange={(v) => updateTeamLeader(member.user_id, v)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Choisir un rattachement" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Directeur</SelectItem>
                            {teamLeaders
                              .filter((tl) => tl.pro_id)
                              .map((tl) => (
                                <SelectItem key={tl.user_id} value={tl.pro_id}>
                                  {tl.first_name} {tl.last_name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Switch
                        checked={member.is_active}
                        onCheckedChange={() =>
                          toggleActive(member.user_id, member.is_active)
                        }
                        disabled={normalizeRole(member.role) === "director"}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {members.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Aucun membre trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function RoleBadge({ role }) {
  switch (normalizeRole(role)) {
    case "director":
      return (
        <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">
          Directeur
        </Badge>
      );

    case "team_leader":
      return (
        <Badge
          variant="secondary"
          className="bg-blue-100 text-blue-800 hover:bg-blue-200"
        >
          Team Leader
        </Badge>
      );

    case "agent_affiliate":
      return (
        <Badge variant="outline" className="text-gray-700 border-gray-300">
          Agent affilié
        </Badge>
      );

    default:
      return (
        <Badge variant="outline" className="text-gray-600">
          {role || "—"}
        </Badge>
      );
  }
}