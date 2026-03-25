import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/customSupabaseClient";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  Loader2,
  Search,
  RefreshCw,
  Trash2,
  Ban,
  CheckCircle2,
  UserPlus,
  Send,
  Link as LinkIcon,
  Users,
  ShieldCheck,
  Shuffle,
  Pencil,
  Clock3,
  Eye,
  EyeOff,
} from "lucide-react";

/* ---------------------------
   Helpers
---------------------------- */
function pickFirstRow(data) {
  if (!data) return null;
  return Array.isArray(data) ? data[0] : data;
}
function normEmail(s) {
  return String(s || "").trim().toLowerCase();
}
function safeInitials(firstName, lastName, email) {
  const a = (firstName || "").trim()[0] || (email || "").trim()[0] || "?";
  const b = (lastName || "").trim()[0] || "";
  return `${a}${b}`.toUpperCase();
}
function displayName(firstName, lastName, email) {
  const n = `${firstName || ""} ${lastName || ""}`.trim();
  return n || email || "Utilisateur";
}
function hasName(firstName, lastName) {
  return Boolean(String(firstName || "").trim() || String(lastName || "").trim());
}

function roleLabel(role) {
  const r = String(role || "agent").toLowerCase();
  if (r === "director") return "Directeur";
  if (r === "team_leader") return "Team Leader";
  if (r === "agent_affiliate") return "Agent affilié";
  if (r === "agent_independent") return "Agent indépendant";
  if (r === "agent") return "Agent";
  return "Collaborateur";
}
function roleVariant(role) {
  const r = String(role || "agent").toLowerCase();
  if (r === "director") return "default";
  if (r === "team_leader") return "secondary";
  return "outline";
}
function fmtDate(d) {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd MMM yyyy", { locale: fr });
  } catch {
    return "—";
  }
}
function inviteStatusLabel(status) {
  const s = String(status || "").toLowerCase();
  if (s === "pending" || !s) return "Invitation envoyée – en attente";
  if (s === "accepted") return "Invitation acceptée";
  if (s === "expired") return "Invitation expirée";
  if (s === "revoked" || s === "cancelled") return "Invitation annulée";
  return `Invitation (${s})`;
}
function inviteStatusClass(status) {
  const s = String(status || "").toLowerCase();
  if (s === "accepted") return "bg-green-100 text-green-700 border border-green-200";
  if (s === "expired" || s === "revoked" || s === "cancelled")
    return "bg-red-100 text-red-700 border border-red-200";
  return "bg-orange-500 text-white hover:bg-orange-600";
}
function activeBadge(isActive) {
  return isActive
    ? "bg-green-100 text-green-700 border border-green-200"
    : "bg-red-100 text-red-700 border border-red-200";
}
function adminValidationBadge(isValidated) {
  return isValidated
    ? "bg-green-100 text-green-700 border border-green-200"
    : "bg-amber-100 text-amber-700 border border-amber-200";
}

function proRoleKey(proRow) {
  return proRow?.effective_role || proRow?.member_role || proRow?.agency_role || "agent";
}

export default function TeamManagementTab({ agency }) {
  const { toast } = useToast();

  const [agencyId, setAgencyId] = useState(agency?.id || null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [me, setMe] = useState(null);
  const [isDirector, setIsDirector] = useState(false);

  const [pros, setPros] = useState([]);
  const [invites, setInvites] = useState([]);

  const [visibilitySavingId, setVisibilitySavingId] = useState(null);

  const [deletedInviteIds, setDeletedInviteIds] = useState(() => new Set());
  const [deletedProIds, setDeletedProIds] = useState(() => new Set());

  const [q, setQ] = useState("");

  const [confirm, setConfirm] = useState({ open: false, type: null, row: null });
  const openConfirm = (type, row) => setConfirm({ open: true, type, row });
  const closeConfirm = () => setConfirm({ open: false, type: null, row: null });

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    role: "agent",
    team_leader_pro_id: "",
  });

  const [attachOpen, setAttachOpen] = useState(false);
  const [attachSaving, setAttachSaving] = useState(false);
  const [attachRow, setAttachRow] = useState(null);
  const [attachChoice, setAttachChoice] = useState("director");

  const [idOpen, setIdOpen] = useState(false);
  const [idSaving, setIdSaving] = useState(false);
  const [idRow, setIdRow] = useState(null);
  const [idForm, setIdForm] = useState({ first_name: "", last_name: "" });

  const resetCreateForm = useCallback(() => {
    setForm({
      email: "",
      first_name: "",
      last_name: "",
      role: "agent",
      team_leader_pro_id: "",
    });
  }, []);

  const fetchAll = useCallback(
    async (opts = { silent: false }) => {
      if (opts.silent) setRefreshing(true);
      else setLoading(true);

      try {
        const { data: meRes, error: meErr } = await supabase.rpc("agency_me");
        if (meErr) throw meErr;
        const meRow = pickFirstRow(meRes);

        setMe(meRow || null);
        const myRole = String(meRow?.agency_role || "").toLowerCase();
        setIsDirector(myRole === "director");

        const resolvedAgencyId = agency?.id || meRow?.agency_id || null;
        setAgencyId(resolvedAgencyId);

        if (!resolvedAgencyId) {
          setPros([]);
          setInvites([]);
          return;
        }

        const { data: prosRes, error: prosErr } = await supabase
          .from("professionnels_with_effective_role")
          .select(
            `
            id,
            user_id,
            created_at,
            updated_at,
            email,
            first_name,
            last_name,
            avatar_url,
            is_active,
            is_archived,
            is_validated_by_administrator,
            visibility_pro_partner_page,
            digital_card_livingroom_url,

            agency_role,
            director_id,
            team_leader_pro_id,

            member_agency_id,
            member_manager_user_id,
            member_role,
            effective_role
          `
          )
          .eq("member_agency_id", resolvedAgencyId)
          .or("is_archived.is.null,is_archived.eq.false")
          .order("created_at", { ascending: false });

        if (prosErr) throw prosErr;

        setPros((prosRes || []).filter((p) => !deletedProIds.has(p.id)));

        const { data: invRes, error: invErr } = await supabase
          .from("agency_invitations")
          .select(
            `
            id,
            created_at,
            email,
            first_name,
            last_name,
            role,
            status,
            accepted_at,
            user_id,
            team_leader_pro_id
          `
          )
          .eq("agency_id", resolvedAgencyId)
          .order("created_at", { ascending: false });

        if (invErr) throw invErr;
        setInvites((invRes || []).filter((i) => !deletedInviteIds.has(i.id)));
      } catch (e) {
        console.error(e);
        toast({
          title: "Erreur",
          description: e?.message || "Impossible de charger l'équipe.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [agency?.id, deletedInviteIds, deletedProIds, toast]
  );

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const prosById = useMemo(() => {
    const m = new Map();
    (pros || []).forEach((p) => {
      if (p?.id) m.set(p.id, p);
    });
    return m;
  }, [pros]);

  const directorPro = useMemo(() => {
    return (pros || []).find((p) => proRoleKey(p) === "director") || null;
  }, [pros]);

  const teamLeaderOptions = useMemo(() => {
    return (pros || [])
      .filter((p) => proRoleKey(p) === "team_leader")
      .filter((p) => !!p.id)
      .map((p) => ({
        id: p.id,
        user_id: p.user_id,
        label: displayName(p.first_name, p.last_name, p.email),
        is_active: !!p.is_active,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "fr"));
  }, [pros]);

  const directorUserId = directorPro?.user_id || null;

  const deleteInvitation = useCallback(
    async (inv) => {
      if (!isDirector) return;

      setDeletedInviteIds((prev) => new Set(prev).add(inv.id));
      setInvites((prev) => prev.filter((x) => x.id !== inv.id));

      try {
        const { error } = await supabase.rpc("director_delete_invitation", {
          p_invitation_id: inv.id,
        });
        if (error) throw error;

        toast({ title: "Invitation supprimée", description: inv.email });
        await fetchAll({ silent: true });
      } catch (e) {
        console.error(e);
        toast({
          title: "Erreur",
          description: e?.message || "Suppression impossible.",
          variant: "destructive",
        });

        setDeletedInviteIds((prev) => {
          const next = new Set(prev);
          next.delete(inv.id);
          return next;
        });
        await fetchAll({ silent: true });
      }
    },
    [isDirector, toast, fetchAll]
  );

  const archiveProfessionnel = useCallback(
    async (pro) => {
      if (!isDirector) return;

      setDeletedProIds((prev) => new Set(prev).add(pro.id));
      setPros((prev) => prev.filter((x) => x.id !== pro.id));

      try {
        const { error } = await supabase.rpc("director_archive_professionnel", {
          p_professionnel_id: pro.id,
        });
        if (error) throw error;

        toast({ title: "Compte supprimé", description: pro.email });
        await fetchAll({ silent: true });
      } catch (e) {
        console.error(e);
        toast({
          title: "Erreur",
          description: e?.message || "Suppression impossible.",
          variant: "destructive",
        });

        setDeletedProIds((prev) => {
          const next = new Set(prev);
          next.delete(pro.id);
          return next;
        });
        await fetchAll({ silent: true });
      }
    },
    [isDirector, toast, fetchAll]
  );

  const toggleActive = useCallback(
    async (pro) => {
      if (!isDirector) return;

      const next = !pro.is_active;
      setPros((prev) => prev.map((x) => (x.id === pro.id ? { ...x, is_active: next } : x)));

      try {
        const { error } = await supabase.rpc("director_set_professionnel_active", {
          p_professionnel_id: pro.id,
          p_is_active: next,
        });
        if (error) throw error;

        toast({
          title: "Statut mis à jour",
          description: `${displayName(pro.first_name, pro.last_name, pro.email)} : ${next ? "Actif" : "Suspendu"}`,
        });
      } catch (e) {
        console.error(e);
        setPros((prev) => prev.map((x) => (x.id === pro.id ? { ...x, is_active: !next } : x)));
        toast({
          title: "Erreur",
          description: e?.message || "Impossible de changer le statut.",
          variant: "destructive",
        });
      }
    },
    [isDirector, toast]
  );

  const togglePartnerVisibility = useCallback(
    async (pro) => {
      if (!isDirector) return;
      if (!pro?.id) return;

      if (pro.is_validated_by_administrator !== true) {
        toast({
          title: "Validation administrateur requise",
          description:
            "Ce collaborateur doit d’abord être validé par l’administrateur de la plateforme.",
          variant: "destructive",
        });
        return;
      }

      const next = !Boolean(pro.visibility_pro_partner_page);
      const previous = Boolean(pro.visibility_pro_partner_page);

      setVisibilitySavingId(pro.id);
      setPros((prev) =>
        prev.map((x) =>
          x.id === pro.id ? { ...x, visibility_pro_partner_page: next } : x
        )
      );

      try {
        const { error } = await supabase
          .from("professionnels")
          .update({
            visibility_pro_partner_page: next,
            updated_at: new Date().toISOString(),
          })
          .eq("id", pro.id);

        if (error) throw error;

        toast({
          title: "Visibilité mise à jour",
          description: next
            ? "Le collaborateur apparaîtra sur la page partenaires."
            : "Le collaborateur n’apparaîtra plus sur la page partenaires.",
        });
      } catch (e) {
        console.error(e);
        setPros((prev) =>
          prev.map((x) =>
            x.id === pro.id ? { ...x, visibility_pro_partner_page: previous } : x
          )
        );
        toast({
          title: "Erreur",
          description:
            e?.message || "Impossible de mettre à jour la visibilité sur la page partenaires.",
          variant: "destructive",
        });
      } finally {
        setVisibilitySavingId(null);
      }
    },
    [isDirector, toast]
  );

  const createInvitation = useCallback(async () => {
    if (!isDirector) return;

    const email = normEmail(form.email);
    const first_name = String(form.first_name || "").trim();
    const last_name = String(form.last_name || "").trim();
    const role = String(form.role || "agent").toLowerCase();
    const team_leader_pro_id = role === "agent" ? String(form.team_leader_pro_id || "").trim() : "";

    if (!email) {
      toast({ title: "Email requis", variant: "destructive" });
      return;
    }
    if (role !== "agent" && role !== "team_leader") {
      toast({ title: "Rôle invalide", variant: "destructive" });
      return;
    }
    if (role === "agent" && teamLeaderOptions.length > 0 && !team_leader_pro_id) {
      toast({
        title: "Team leader requis",
        description: "Sélectionne un team leader pour rattacher l’agent.",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("agency-invite-create", {
        body: {
          email,
          first_name: first_name || null,
          last_name: last_name || null,
          role,
          team_leader_pro_id: role === "agent" ? team_leader_pro_id || null : null,
        },
      });

      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Création impossible.");

      toast({
        title: "Invitation envoyée",
        description: `${email} (${roleLabel(role)})`,
      });

      setCreateOpen(false);
      resetCreateForm();
      await fetchAll({ silent: true });
    } catch (e) {
      console.error(e);
      toast({
        title: "Erreur",
        description: e?.message || "Impossible d’envoyer l’invitation.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  }, [isDirector, form, toast, fetchAll, resetCreateForm, teamLeaderOptions.length]);

  const resendInvitation = useCallback(
    async (inv) => {
      if (!isDirector) return;

      try {
        const { data, error } = await supabase.functions.invoke("agency-invite-resend", {
          body: { invite_id: inv.id },
        });
        if (error) throw error;
        if (!data?.ok) throw new Error(data?.error || "Renvoi impossible.");

        toast({ title: "Invitation renvoyée", description: inv.email });
      } catch (e) {
        console.error(e);
        toast({
          title: "Erreur",
          description: e?.message || "Impossible de renvoyer l’invitation.",
          variant: "destructive",
        });
      }
    },
    [isDirector, toast]
  );

  const openAttachDialog = useCallback(
    (proRow) => {
      if (!proRow?.id) return;
      setAttachRow(proRow);

      const currentRole = proRoleKey(proRow);

      if (currentRole === "agent_affiliate") {
        if (proRow.team_leader_pro_id) {
          setAttachChoice(String(proRow.team_leader_pro_id));
        } else {
          setAttachChoice("director");
        }
      } else if (currentRole === "team_leader") {
        setAttachChoice("director");
      } else {
        setAttachChoice("director");
      }

      setAttachOpen(true);
    },
    []
  );

  const saveAttach = useCallback(async () => {
    if (!isDirector || !attachRow?.id) return;

    setAttachSaving(true);
    try {
      const proId = attachRow.id;
      const tlProId = attachChoice === "director" ? null : attachChoice;

      const { error } = await supabase.rpc("director_change_professionnel_rattachement", {
        p_professionnel_id: proId,
        p_team_leader_pro_id: tlProId,
      });
      if (error) throw error;

      toast({
        title: "Rattachement mis à jour",
        description: attachChoice === "director" ? "Rattaché au Directeur." : "Rattaché au Team Leader.",
      });

      setAttachOpen(false);
      setAttachRow(null);
      await fetchAll({ silent: true });
    } catch (e) {
      console.error(e);
      toast({
        title: "Erreur",
        description: e?.message || "Impossible de changer le rattachement.",
        variant: "destructive",
      });
    } finally {
      setAttachSaving(false);
    }
  }, [isDirector, attachRow, attachChoice, toast, fetchAll]);

  const openIdentityDialog = useCallback((proRow) => {
    setIdRow(proRow);
    setIdForm({
      first_name: String(proRow?.first_name || ""),
      last_name: String(proRow?.last_name || ""),
    });
    setIdOpen(true);
  }, []);

  const saveIdentity = useCallback(async () => {
    if (!isDirector || !idRow?.id) return;
    setIdSaving(true);
    try {
      const { error } = await supabase.rpc("director_set_professionnel_identity", {
        p_professionnel_id: idRow.id,
        p_first_name: idForm.first_name || null,
        p_last_name: idForm.last_name || null,
      });
      if (error) throw error;

      toast({ title: "Identité mise à jour" });
      setIdOpen(false);
      setIdRow(null);
      await fetchAll({ silent: true });
    } catch (e) {
      console.error(e);
      toast({
        title: "Erreur",
        description: e?.message || "Impossible de modifier l’identité.",
        variant: "destructive",
      });
    } finally {
      setIdSaving(false);
    }
  }, [isDirector, idRow, idForm, toast, fetchAll]);

  const tableRows = useMemo(() => {
    const proRows = (pros || []).map((p) => ({
      type: "pro",
      ...p,
      key: `pro-${p.id}`,
    }));

    const pendingInvites = (invites || [])
      .filter((i) => String(i.status) === "pending")
      .map((i) => ({
        type: "invite",
        id: i.id,
        created_at: i.created_at,
        email: i.email,
        first_name: i.first_name,
        last_name: i.last_name,
        role: i.role,
        status: i.status,
        key: `inv-${i.id}`,
      }));

    const merged = [...proRows, ...pendingInvites];
    merged.sort((a, b) => (new Date(b.created_at).getTime() || 0) - (new Date(a.created_at).getTime() || 0));
    return merged;
  }, [pros, invites]);

  const filtered = useMemo(() => {
    if (!q) return tableRows;
    const qq = q.toLowerCase();
    return tableRows.filter((r) => {
      const name = displayName(r.first_name, r.last_name, r.email).toLowerCase();
      return name.includes(qq) || normEmail(r.email).includes(qq);
    });
  }, [tableRows, q]);

  const stats = useMemo(() => {
    const invTL = invites.filter((i) => String(i.role) === "team_leader" && String(i.status) === "pending").length;
    const invAG = invites.filter((i) => String(i.role) === "agent" && String(i.status) === "pending").length;

    const proTL = pros.filter((p) => proRoleKey(p) === "team_leader").length;
    const proAG = pros.filter((p) => ["agent", "agent_affiliate", "agent_independent"].includes(proRoleKey(p))).length;

    return {
      tl: { invitations_sent: invTL, confirmed_accounts: proTL },
      agent: { invitations_sent: invAG, confirmed_accounts: proAG },
    };
  }, [invites, pros]);

  const attachedToLabel = useCallback(
    (pro) => {
      const role = proRoleKey(pro);

      if (role === "director") {
        return { label: "—", isActive: true };
      }

      if (role === "team_leader") {
        const director = pro?.director_id ? prosById.get(pro.director_id) : null;
        if (director) {
          return {
            label: `Directeur — ${displayName(director.first_name, director.last_name, director.email)}`,
            isActive: !!director.is_active,
          };
        }
        return { label: "Directeur — (introuvable)", isActive: false };
      }

      if (role === "agent_affiliate") {
        const teamLeader = pro?.team_leader_pro_id ? prosById.get(pro.team_leader_pro_id) : null;
        if (teamLeader) {
          return {
            label: `Team Leader — ${displayName(teamLeader.first_name, teamLeader.last_name, teamLeader.email)}`,
            isActive: !!teamLeader.is_active,
          };
        }

        const director = pro?.director_id ? prosById.get(pro.director_id) : null;
        if (director) {
          return {
            label: `Directeur — ${displayName(director.first_name, director.last_name, director.email)}`,
            isActive: !!director.is_active,
          };
        }

        return { label: "—", isActive: false };
      }

      if (role === "agent" || role === "agent_independent") {
        return { label: "Indépendant", isActive: true };
      }

      return { label: "—", isActive: false };
    },
    [prosById]
  );

  const onConfirm = async () => {
    const { type, row } = confirm;
    closeConfirm();
    if (!row) return;

    if (type === "delete_invite") return deleteInvitation(row);
    if (type === "delete_pro") return archiveProfessionnel(row);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (!agencyId) {
    return (
      <div className="py-10 text-sm text-muted-foreground">
        Impossible d’afficher l’équipe : votre compte n’est pas rattaché à une agence.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4" />
              TEAM LEADERS
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/40 p-3">
                <div className="text-[11px] text-muted-foreground">Invitations envoyées</div>
                <div className="text-xl font-bold">{stats.tl.invitations_sent}</div>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <div className="text-[11px] text-muted-foreground">Comptes confirmés</div>
                <div className="text-xl font-bold">{stats.tl.confirmed_accounts}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="w-4 h-4" />
              AGENTS
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/40 p-3">
                <div className="text-[11px] text-muted-foreground">Invitations envoyées</div>
                <div className="text-xl font-bold">{stats.agent.invitations_sent}</div>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <div className="text-[11px] text-muted-foreground">Comptes confirmés</div>
                <div className="text-xl font-bold">{stats.agent.confirmed_accounts}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrer par nom ou email..." className="pl-9" />
        </div>

        <div className="flex gap-2 md:justify-end">
          {isDirector && (
            <Button
              onClick={() => {
                resetCreateForm();
                setCreateOpen(true);
              }}
              className="gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Créer un membre
            </Button>
          )}

          <Button variant="outline" onClick={() => fetchAll({ silent: true })} disabled={refreshing} className="gap-2">
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Actualiser
          </Button>
        </div>
      </div>

      <div className="border rounded-xl bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="min-w-[340px]">Membre</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Validation admin</TableHead>
              <TableHead>Page partenaires</TableHead>
              <TableHead className="min-w-[280px]">Rattaché à</TableHead>
              <TableHead>Carte</TableHead>
              <TableHead>Date création</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  Aucun membre trouvé.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => {
                const name = displayName(row.first_name, row.last_name, row.email);
                const isPro = row.type === "pro";

                const canShowCard =
                  isPro && row.is_validated_by_administrator === true && !!row.digital_card_livingroom_url;

                const attach = isPro ? attachedToLabel(row) : null;
                const roleKey = isPro ? proRoleKey(row) : row.role;
                const isValidated = isPro && row.is_validated_by_administrator === true;
                const isPartnerVisible = isPro && row.visibility_pro_partner_page === true;
                const isSavingVisibility = visibilitySavingId === row.id;

                return (
                  <TableRow key={row.key}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border bg-gray-50">
                          <AvatarImage src={row.avatar_url || undefined} />
                          <AvatarFallback>{safeInitials(row.first_name, row.last_name, row.email)}</AvatarFallback>
                        </Avatar>

                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate">{name}</div>
                          <div className="text-xs text-muted-foreground truncate">{row.email}</div>
                          {isPro && !hasName(row.first_name, row.last_name) && (
                            <div className="text-[11px] text-orange-600">Identité manquante — à compléter</div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant={roleVariant(roleKey)}>{roleLabel(roleKey)}</Badge>
                    </TableCell>

                    <TableCell>
                      {row.type === "invite" ? (
                        <Badge className={inviteStatusClass(row.status)}>{inviteStatusLabel(row.status)}</Badge>
                      ) : (
                        <div className="flex items-center gap-3">
                          <Badge className={activeBadge(!!row.is_active)}>
                            {!!row.is_active ? (
                              <span className="inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Actif
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1">
                                <Ban className="w-3 h-3" /> Suspendu
                              </span>
                            )}
                          </Badge>

                          {isDirector && (
                            <Switch checked={!!row.is_active} onCheckedChange={() => toggleActive(row)} disabled={row.id === me?.id} />
                          )}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      {row.type !== "pro" ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <Badge className={adminValidationBadge(isValidated)} variant="outline">
                            {isValidated ? (
                              <span className="inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Validé
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1">
                                <Clock3 className="w-3 h-3" /> En attente
                              </span>
                            )}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            {isValidated
                              ? "Validé par l’administrateur"
                              : "En attente de validation administrateur"}
                          </span>
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      {row.type !== "pro" ? (
                        <span className="text-xs text-muted-foreground">Après validation</span>
                      ) : (
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={!!isPartnerVisible}
                            disabled={!isDirector || !isValidated || isSavingVisibility}
                            onCheckedChange={() => togglePartnerVisibility(row)}
                          />

                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {isPartnerVisible ? "Affiché" : "Masqué"}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {!isValidated
                                ? "Validation admin requise"
                                : isPartnerVisible
                                  ? "Visible sur PartnerProfessionnelPage"
                                  : "Non visible sur PartnerProfessionnelPage"}
                            </span>
                          </div>

                          {isSavingVisibility ? (
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          ) : isPartnerVisible ? (
                            <Eye className="w-4 h-4 text-green-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      {row.type !== "pro" ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-900">{attach.label}</span>
                          <Badge className={activeBadge(attach.isActive)} variant="outline">
                            {attach.isActive ? "Actif" : "Suspendu"}
                          </Badge>
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="text-sm">
                      {row.type === "invite" ? (
                        <span className="text-muted-foreground">Après création</span>
                      ) : canShowCard ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => window.open(row.digital_card_livingroom_url, "_blank", "noreferrer")}
                        >
                          <LinkIcon className="w-4 h-4" />
                          Voir la carte
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">Après validation</span>
                      )}
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">{fmtDate(row.created_at)}</TableCell>

                    <TableCell className="text-right">
                      {!isDirector ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : row.type === "invite" ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resendInvitation(row)}
                            className="gap-2"
                            title="Renvoyer l’invitation"
                          >
                            <Send className="w-4 h-4" />
                            Renvoyer
                          </Button>

                          <Button variant="destructive" size="sm" onClick={() => openConfirm("delete_invite", row)} className="gap-2">
                            <Trash2 className="w-4 h-4" />
                            Supprimer
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" className="gap-2" onClick={() => openAttachDialog(row)}>
                            <Shuffle className="w-4 h-4" />
                            Changer rattachement
                          </Button>

                          <Button variant="outline" size="sm" className="gap-2" onClick={() => openIdentityDialog(row)}>
                            <Pencil className="w-4 h-4" />
                            Modifier identité
                          </Button>

                          <Button variant="destructive" size="sm" onClick={() => openConfirm("delete_pro", row)} className="gap-2">
                            <Trash2 className="w-4 h-4" />
                            Supprimer le compte
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) resetCreateForm();
        }}
      >
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Créer un membre</DialogTitle>
            <DialogDescription>
              Le directeur envoie une invitation. Le membre choisit son mot de passe et confirme le compte via le lien reçu par email.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Email *</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="email@exemple.com"
                autoComplete="off"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Prénom</Label>
                <Input
                  value={form.first_name}
                  onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
                  placeholder="Prénom"
                  autoComplete="off"
                />
              </div>
              <div className="grid gap-2">
                <Label>Nom</Label>
                <Input
                  value={form.last_name}
                  onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))}
                  placeholder="Nom"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Rôle</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) =>
                    setForm((p) => ({
                      ...p,
                      role: v,
                      team_leader_pro_id: v === "agent" ? p.team_leader_pro_id : "",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="team_leader">Team Leader</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Rattaché à (Team leader)</Label>
                <Select
                  value={form.team_leader_pro_id || ""}
                  onValueChange={(v) => setForm((p) => ({ ...p, team_leader_pro_id: v }))}
                  disabled={form.role !== "agent" || teamLeaderOptions.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        form.role !== "agent" ? "—" : teamLeaderOptions.length === 0 ? "Aucun team leader" : "Choisir…"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {teamLeaderOptions.map((tl) => (
                      <SelectItem key={tl.id} value={tl.id}>
                        Team Leader — {tl.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="text-xs text-muted-foreground">
                  Le rattachement d’un agent affilié est piloté par <code>professionnels.team_leader_pro_id</code> ou, à défaut,
                  par <code>professionnels.director_id</code>.
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
              Annuler
            </Button>
            <Button onClick={createInvitation} disabled={creating} className="gap-2">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Envoyer l’invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={attachOpen}
        onOpenChange={(o) => {
          setAttachOpen(o);
          if (!o) {
            setAttachRow(null);
            setAttachChoice("director");
          }
        }}
      >
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Changer le rattachement</DialogTitle>
            <DialogDescription>
              Choisis à qui rattacher ce professionnel : <strong>Directeur</strong> ou <strong>Team Leader</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="rounded-lg border bg-muted/20 p-3">
              <div className="text-xs text-muted-foreground">Compte concerné</div>
              <div className="mt-1 font-medium">
                {attachRow ? displayName(attachRow.first_name, attachRow.last_name, attachRow.email) : "—"}
              </div>
              <div className="text-xs text-muted-foreground">{attachRow?.email || ""}</div>
            </div>

            <div className="grid gap-2">
              <Label>Nouveau rattachement</Label>
              <Select value={attachChoice} onValueChange={setAttachChoice}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="director">
                    Directeur{directorPro ? ` — ${displayName(directorPro.first_name, directorPro.last_name, directorPro.email)}` : ""}
                  </SelectItem>

                  {teamLeaderOptions.map((tl) => (
                    <SelectItem key={tl.id} value={tl.id}>
                      Team Leader — {tl.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="text-xs text-muted-foreground">
                Important : le rattachement effectif est désormais piloté par <code>professionnels.director_id</code> et
                <code> professionels.team_leader_pro_id</code>. Le RPC <code>director_change_professionnel_rattachement</code>
                synchronise ces champs.
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setAttachOpen(false)} disabled={attachSaving}>
              Annuler
            </Button>
            <Button onClick={saveAttach} disabled={attachSaving} className="gap-2">
              {attachSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shuffle className="w-4 h-4" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={idOpen}
        onOpenChange={(o) => {
          setIdOpen(o);
          if (!o) {
            setIdRow(null);
            setIdForm({ first_name: "", last_name: "" });
          }
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Modifier l’identité</DialogTitle>
            <DialogDescription>
              Les comptes invités n’ont pas de “Display name” dans Auth. Le directeur doit renseigner prénom/nom ici pour l’affichage.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label>Prénom</Label>
              <Input value={idForm.first_name} onChange={(e) => setIdForm((p) => ({ ...p, first_name: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Nom</Label>
              <Input value={idForm.last_name} onChange={(e) => setIdForm((p) => ({ ...p, last_name: e.target.value }))} />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIdOpen(false)} disabled={idSaving}>
              Annuler
            </Button>
            <Button onClick={saveIdentity} disabled={idSaving} className="gap-2">
              {idSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirm.open} onOpenChange={(o) => !o && closeConfirm()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm.type === "delete_invite" ? "Supprimer l’invitation ?" : "Supprimer le compte ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm.type === "delete_invite"
                ? "Cette action retire l’invitation et le collaborateur ne pourra plus valider son accès avec ce lien."
                : "Cette action archive le compte (suppression logique)."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}