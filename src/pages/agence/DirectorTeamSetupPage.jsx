import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../../lib/customSupabaseClient";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useToast } from "@/components/ui/use-toast";
import {
  Users,
  Crown,
  Shield,
  ShieldCheck,
  Search,
  MoreVertical,
  Loader2,
  AlertCircle,
  Mail,
  Settings,
  ArrowRight,
  Plus,
  RefreshCw,
  XCircle,
  Link as LinkIcon,
  Copy,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* -----------------------
   Helpers
------------------------ */

const norm = (v) => String(v ?? "").trim().toLowerCase();
const normEmail = (v) => String(v ?? "").trim().toLowerCase();

const safeName = (pro) => {
  if (!pro) return "Membre inconnu";
  const full = `${pro.first_name || ""} ${pro.last_name || ""}`.trim();
  return full || pro.email || "Sans nom";
};

const shortId = (id) => (id ? `${id.substring(0, 8)}` : "");

const roleLabel = (role) => {
  switch (norm(role)) {
    case "director":
      return "Directeur";
    case "team_leader":
      return "Chef d'équipe";
    case "agent_affiliate":
      return "Agent affilié";
    case "agent":
      return "Agent";
    default:
      return role || "—";
  }
};

const RoleIcon = ({ role, className }) => {
  switch (norm(role)) {
    case "director":
      return <Crown className={className} />;
    case "team_leader":
      return <ShieldCheck className={className} />;
    case "agent_affiliate":
    case "agent":
      return <Shield className={className} />;
    default:
      return <Users className={className} />;
  }
};

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Failed to copy:", err);
    return false;
  }
};

const isExpired = (expiresAt) => {
  if (!expiresAt) return false;
  const t = new Date(expiresAt).getTime();
  return Number.isFinite(t) ? t < Date.now() : false;
};

const inviteRefFromToken = (token) => {
  if (!token) return "—";
  return String(token).replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
};

const statusLabel = (status) => {
  switch (norm(status)) {
    case "accepted":
      return "Acceptée";
    case "revoked":
      return "Révoquée";
    case "expired":
      return "Expirée";
    case "pending":
      return "En attente";
    default:
      return status || "—";
  }
};

const statusBadgeClass = (status) => {
  switch (norm(status)) {
    case "accepted":
      return "bg-green-50 text-green-700 border-green-200";
    case "revoked":
      return "bg-red-50 text-red-700 border-red-200";
    case "expired":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

const roleBadgeClass = (role) => {
  switch (norm(role)) {
    case "director":
      return "bg-black text-white border-black";
    case "team_leader":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "agent_affiliate":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "agent":
      return "bg-slate-50 text-slate-700 border-slate-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

const adminValidationLabel = (value) =>
  value ? "Validé par l’administrateur" : "En attente de validation";

function AgencyTopNav({ current = "setup" }) {
  return (
    <div className="flex items-center gap-2 border-b pb-3 mb-6 overflow-x-auto">
      <Link
        to="/agence/agents"
        className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/60 transition"
      >
        <Users className="h-4 w-4" />
        Agents
      </Link>
      <Link
        to="/agence/contacts"
        className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/60 transition"
      >
        <ArrowRight className="h-4 w-4" />
        Contacts
      </Link>
      <Link
        to="/agence/configuration"
        className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
          current === "setup"
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted/60"
        }`}
      >
        <Settings className="h-4 w-4" />
        Configuration
      </Link>
    </div>
  );
}

/* -----------------------
   Page
------------------------ */

export default function DirectorTeamSetupPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [me, setMe] = useState(null);

  const [members, setMembers] = useState([]);
  const [filterQuery, setFilterQuery] = useState("");

  const [invites, setInvites] = useState([]);
  const [invitesLoading, setInvitesLoading] = useState(false);

  const [inviteForm, setInviteForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    role: "agent_affiliate",
    team_leader_pro_id: null,
  });
  const [creatingInvite, setCreatingInvite] = useState(false);

  const [sendingInviteId, setSendingInviteId] = useState(null);
  const [roleSavingUserId, setRoleSavingUserId] = useState(null);
  const [visibilitySavingUserId, setVisibilitySavingUserId] = useState(null);

  const publicInviteLink = useCallback((token) => {
    if (!token) return "";
    return `${window.location.origin}/agence-lead?token=${encodeURIComponent(token)}`;
  }, []);

  const fetchInvitations = useCallback(
    async ({ silent = false, returnData = false } = {}) => {
      if (!silent) setInvitesLoading(true);
      try {
        const { data, error } = await supabase.rpc("director_list_agency_invitations");
        if (error) throw error;

        const normalized = (data || []).map((r) => ({
          ...r,
          email: r.email ? String(r.email).trim() : r.email,
          role: r.role ? String(r.role).trim() : r.role,
          status: r.status ? String(r.status).trim() : r.status,
          first_name: r.first_name ?? null,
          last_name: r.last_name ?? null,
          one_time_code_expires_at: r.one_time_code_expires_at ?? null,
          one_time_code_used_at: r.one_time_code_used_at ?? null,
        }));

        setInvites(normalized);
        return returnData ? normalized : undefined;
      } catch (e) {
        console.error("fetchInvitations error:", e);
        toast({
          title: "Erreur",
          description: e?.message || "Impossible de charger les invitations.",
          variant: "destructive",
        });
        setInvites([]);
        return returnData ? [] : undefined;
      } finally {
        if (!silent) setInvitesLoading(false);
      }
    },
    [toast]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: meRows, error: meErr } = await supabase.rpc("agency_me");
      if (meErr) throw meErr;

      const myProfile = Array.isArray(meRows) ? meRows[0] : null;
      if (!myProfile) {
        throw new Error("Impossible de récupérer votre profil d'agence.");
      }

      setMe(myProfile);

      if (norm(myProfile.agency_role) !== "director") {
        navigate("/agence/agents", { replace: true });
        return;
      }

      const { data: memberRows, error: memErr } = await supabase
        .from("agency_members")
        .select("user_id, role, is_active, created_at")
        .eq("agency_id", myProfile.agency_id)
        .order("created_at", { ascending: false });

      if (memErr) throw memErr;

      const rows = memberRows || [];
      const userIds = rows.map((m) => m.user_id).filter(Boolean);

      let prosByUserId = {};
      if (userIds.length > 0) {
        const { data: proRows, error: proErr } = await supabase
          .from("professionnels")
          .select(
            [
              "id",
              "user_id",
              "first_name",
              "last_name",
              "email",
              "phone",
              "avatar_url",
              "avatar_path",
              "agency_role",
              "agency_id",
              "agency_name",
              "team_leader_id",
              "team_leader_pro_id",
              "director_id",
              "is_validated_by_administrator",
              "visibility_pro_partner_page",
              "is_active",
              "is_archived",
            ].join(", ")
          )
          .in("user_id", userIds);

        if (proErr) throw proErr;

        prosByUserId = Object.fromEntries((proRows || []).map((p) => [p.user_id, p]));
      }

      const invData = await fetchInvitations({ silent: true, returnData: true });

      const invByEmail = new Map(
        (invData || []).filter((i) => i?.email).map((i) => [normEmail(i.email), i])
      );

      const flattened = rows.map((m) => {
        const pro = prosByUserId[m.user_id] || {};
        const email = pro?.email || null;
        const inv = email ? invByEmail.get(normEmail(email)) : null;

        const mergedPro = {
          ...pro,
          first_name: pro?.first_name || inv?.first_name || null,
          last_name: pro?.last_name || inv?.last_name || null,
          email: pro?.email || inv?.email || null,
          is_validated_by_administrator:
            typeof pro?.is_validated_by_administrator === "boolean"
              ? pro.is_validated_by_administrator
              : false,
          visibility_pro_partner_page:
            typeof pro?.visibility_pro_partner_page === "boolean"
              ? pro.visibility_pro_partner_page
              : false,
        };

        return {
          ...m,
          pro: mergedPro,
          _invite: inv || null,
        };
      });

      setMembers(flattened);
    } catch (err) {
      console.error("DirectorTeamSetupPage fetch error:", err);
      const msg = err?.message || "Erreur de chargement.";
      setError(msg);
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
      setInvitesLoading(false);
    }
  }, [navigate, toast, fetchInvitations]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  /* -----------------------
     Actions (Members)
  ------------------------ */

  const handleToggleActive = async (targetUserId, currentStatus) => {
    if (targetUserId === user?.id) {
      toast({
        title: "Action refusée",
        description: "Vous ne pouvez pas modifier votre propre statut.",
        variant: "destructive",
      });
      return;
    }

    const newStatus = !currentStatus;
    setMembers((prev) =>
      prev.map((m) => (m.user_id === targetUserId ? { ...m, is_active: newStatus } : m))
    );

    try {
      const { error } = await supabase.rpc("director_set_member_active", {
        p_user_id: targetUserId,
        p_is_active: newStatus,
      });

      if (error) throw error;

      toast({
        title: "Statut mis à jour",
        description: `Membre ${newStatus ? "activé" : "désactivé"} avec succès.`,
      });
    } catch (err) {
      setMembers((prev) =>
        prev.map((m) => (m.user_id === targetUserId ? { ...m, is_active: currentStatus } : m))
      );
      toast({
        title: "Erreur",
        description: err?.message || "Impossible de modifier le statut.",
        variant: "destructive",
      });
    }
  };

  const handleChangeRole = async (targetUserId, currentRole, newRole) => {
    if (targetUserId === user?.id) {
      toast({
        title: "Action refusée",
        description: "Vous ne pouvez pas modifier votre propre rôle ici.",
        variant: "destructive",
      });
      return;
    }

    const roleNorm = norm(newRole);
    if (!["team_leader", "agent_affiliate"].includes(roleNorm)) {
      toast({
        title: "Rôle invalide",
        description: "Seuls les rôles Chef d'équipe et Agent affilié sont autorisés ici.",
        variant: "destructive",
      });
      return;
    }

    setRoleSavingUserId(targetUserId);

    setMembers((prev) =>
      prev.map((m) =>
        m.user_id === targetUserId
          ? {
              ...m,
              role: roleNorm,
              pro: {
                ...(m.pro || {}),
                agency_role: roleNorm,
              },
            }
          : m
      )
    );

    try {
      const { error: agencyMemberError } = await supabase
        .from("agency_members")
        .update({ role: roleNorm })
        .eq("user_id", targetUserId)
        .eq("agency_id", me?.agency_id);

      if (agencyMemberError) throw agencyMemberError;

      const { error: proError } = await supabase
        .from("professionnels")
        .update({
          agency_role: roleNorm,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", targetUserId)
        .eq("agency_id", me?.agency_id);

      if (proError) throw proError;

      toast({
        title: "Rôle mis à jour",
        description: `Le membre est maintenant ${roleLabel(roleNorm)}.`,
      });

      await fetchData();
    } catch (err) {
      console.error("handleChangeRole error:", err);

      setMembers((prev) =>
        prev.map((m) =>
          m.user_id === targetUserId
            ? {
                ...m,
                role: currentRole,
                pro: {
                  ...(m.pro || {}),
                  agency_role: currentRole,
                },
              }
            : m
        )
      );

      toast({
        title: "Erreur",
        description:
          err?.message ||
          "Impossible de modifier le rôle. agency_members et professionnels doivent rester synchronisés.",
        variant: "destructive",
      });
    } finally {
      setRoleSavingUserId(null);
    }
  };

  const handleTogglePartnerVisibility = async (member, checked) => {
    const targetUserId = member?.user_id;
    const proId = member?.pro?.id;

    if (!targetUserId || !proId) {
      toast({
        title: "Erreur",
        description: "Impossible d’identifier ce collaborateur.",
        variant: "destructive",
      });
      return;
    }

    if (!member?.pro?.is_validated_by_administrator) {
      toast({
        title: "Validation requise",
        description:
          "Ce collaborateur doit d’abord être validé par l’administrateur de la plateforme.",
        variant: "destructive",
      });
      return;
    }

    const previousValue = Boolean(member?.pro?.visibility_pro_partner_page);
    setVisibilitySavingUserId(targetUserId);

    setMembers((prev) =>
      prev.map((m) =>
        m.user_id === targetUserId
          ? {
              ...m,
              pro: {
                ...(m.pro || {}),
                visibility_pro_partner_page: checked,
              },
            }
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
        .eq("id", proId)
        .eq("agency_id", me?.agency_id);

      if (error) throw error;

      toast({
        title: "Visibilité mise à jour",
        description: checked
          ? "Le collaborateur apparaîtra sur la page partenaires."
          : "Le collaborateur n’apparaîtra plus sur la page partenaires.",
      });
    } catch (err) {
      console.error("handleTogglePartnerVisibility error:", err);

      setMembers((prev) =>
        prev.map((m) =>
          m.user_id === targetUserId
            ? {
                ...m,
                pro: {
                  ...(m.pro || {}),
                  visibility_pro_partner_page: previousValue,
                },
              }
            : m
        )
      );

      toast({
        title: "Erreur",
        description: err?.message || "Impossible de mettre à jour la visibilité.",
        variant: "destructive",
      });
    } finally {
      setVisibilitySavingUserId(null);
    }
  };

  /* -----------------------
     Actions (Invitations)
  ------------------------ */

  const handleCreateInvitation = async () => {
    if (!me?.agency_id) return;

    const email = normEmail(inviteForm.email);
    if (!email) {
      toast({
        title: "Email requis",
        description: "Veuillez renseigner une adresse email.",
        variant: "destructive",
      });
      return;
    }

    const role = norm(inviteForm.role || "agent_affiliate");
    const teamLeaderProId = role === "agent_affiliate" ? inviteForm.team_leader_pro_id || null : null;

    setCreatingInvite(true);
    try {
      const { data, error } = await supabase.functions.invoke("agency-invite-create", {
        body: {
          email,
          first_name: (inviteForm.first_name || "").trim() || null,
          last_name: (inviteForm.last_name || "").trim() || null,
          role,
          team_leader_pro_id: teamLeaderProId,
        },
      });

      if (error) throw error;
      if (!data?.ok) {
        throw new Error(data?.error || "Impossible de créer l’invitation.");
      }

      toast({
        title: "Invitation créée",
        description: "Un email a été envoyé avec un code à usage unique.",
      });

      setInviteForm((prev) => ({
        email: "",
        first_name: "",
        last_name: "",
        role: prev.role || "agent_affiliate",
        team_leader_pro_id: null,
      }));

      await fetchData();
    } catch (e) {
      console.error("create invitation error:", e);
      const msg = e?.message || "Impossible de créer l’invitation.";
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    } finally {
      setCreatingInvite(false);
    }
  };

  const handleSendInviteEmail = async (inv) => {
    if (!inv?.id) return;

    setSendingInviteId(inv.id);
    try {
      const { data, error } = await supabase.functions.invoke("agency-invite-resend", {
        body: { invite_id: inv.id },
      });

      if (error) throw error;
      if (!data?.ok) {
        throw new Error(data?.error || "Impossible de reprogrammer l’email.");
      }

      toast({
        title: "Email programmé",
        description: `Invitation reprogrammée pour ${inv.email}.`,
      });

      await fetchData();
    } catch (e) {
      console.error("resend invite error:", e);
      toast({
        title: "Erreur",
        description: e?.message || "Impossible de programmer l’email.",
        variant: "destructive",
      });
    } finally {
      setSendingInviteId(null);
    }
  };

  const handleCopyInvite = async (token) => {
    const url = publicInviteLink(token);
    const ok = await copyToClipboard(url);
    toast({
      title: ok ? "Lien copié !" : "Erreur",
      description: ok
        ? "Le lien d'invitation est dans votre presse-papier."
        : "Impossible de copier le lien.",
      variant: ok ? "default" : "destructive",
    });
  };

  const handleCancelInvite = async (inviteId) => {
    if (!inviteId) return;

    try {
      const { error } = await supabase.rpc("director_cancel_invitation", {
        p_invitation_id: inviteId,
      });

      if (error) throw error;

      toast({
        title: "Invitation révoquée",
        description: "Le lien n’est plus utilisable.",
      });

      await fetchInvitations();
    } catch (e) {
      console.error("cancel invite error:", e);
      toast({
        title: "Erreur",
        description: e?.message || "Impossible de révoquer l’invitation.",
        variant: "destructive",
      });
    }
  };

  /* -----------------------
     Derived
  ------------------------ */

  const filteredMembers = useMemo(() => {
    const q = norm(filterQuery);
    if (!q) return members;

    return (members || []).filter((m) => {
      const name = safeName(m.pro).toLowerCase();
      const email = normEmail(m.pro?.email || "");
      const adminLabel = adminValidationLabel(Boolean(m?.pro?.is_validated_by_administrator)).toLowerCase();
      const partnerLabel = Boolean(m?.pro?.visibility_pro_partner_page)
        ? "visible partenaires"
        : "masqué partenaires";

      return (
        name.includes(q) ||
        email.includes(q) ||
        adminLabel.includes(q) ||
        partnerLabel.includes(q)
      );
    });
  }, [members, filterQuery]);

  const isInviteCountedAsSent = (inv) => norm(inv?.status) !== "revoked";

  const roleStats = useMemo(() => {
    const membersByRole = (role) => (members || []).filter((m) => norm(m?.role) === role);
    const invitesByRole = (role) => (invites || []).filter((i) => norm(i?.role) === role);

    const make = (role) => {
      const mem = membersByRole(role);
      const inv = invitesByRole(role);

      const created_accounts = mem.length;
      const invitations_sent = inv.filter(isInviteCountedAsSent).length;
      const accepted = inv.filter((i) => norm(i?.status) === "accepted").length;
      const confirmed_accounts = Math.max(accepted, created_accounts);

      return { created_accounts, invitations_sent, confirmed_accounts };
    };

    return {
      team_leader: make("team_leader"),
      agent_affiliate: make("agent_affiliate"),
    };
  }, [members, invites]);

  const teamLeaderOptions = useMemo(() => {
    return (members || [])
      .filter((m) => norm(m?.role) === "team_leader" && Boolean(m?.is_active) && m?.pro?.id)
      .map((m) => ({
        pro_id: m.pro.id,
        label: `${safeName(m.pro)} (${m.pro.email || "—"})`,
      }));
  }, [members]);

  const pendingInvites = useMemo(() => {
    return (invites || []).filter((i) => norm(i.status) === "pending");
  }, [invites]);

  const historyInvites = useMemo(() => {
    return (invites || [])
      .filter((i) => norm(i.status) !== "pending")
      .sort((a, b) => {
        const ta = new Date(a?.updated_at || a?.created_at || 0).getTime();
        const tb = new Date(b?.updated_at || b?.created_at || 0).getTime();
        return tb - ta;
      });
  }, [invites]);

  /* -----------------------
     UI states
  ------------------------ */

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">
          Chargement de la configuration...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center px-4">
        <div className="rounded-full bg-red-100 p-4">
          <AlertCircle className="w-10 h-10 text-destructive" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Accès Impossible</h2>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">{error}</p>
        </div>
        <Button onClick={() => fetchData()} variant="outline">
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      <AgencyTopNav current="setup" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Configuration d&apos;Équipe
            </h1>
            <Badge
              variant="default"
              className="gap-1 bg-black text-white hover:bg-gray-800"
            >
              <Crown className="h-3 w-3" />
              Espace Directeur
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Gérez les accès, la hiérarchie, la validation administrateur et la visibilité sur la page partenaires.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchData()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Inviter un nouveau collaborateur
              </h3>
              <p className="text-sm text-blue-700 max-w-2xl">
                Créez une invitation (email + rôle). Le collaborateur recevra un{" "}
                <b>code à usage unique</b> et un lien d’accès.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-3">
              <label className="text-xs font-medium text-blue-900">Email</label>
              <Input
                value={inviteForm.email}
                onChange={(e) =>
                  setInviteForm((p) => ({ ...p, email: e.target.value }))
                }
                placeholder="agent@agence.com"
                className="bg-white/80 border-blue-200"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-medium text-blue-900">Prénom</label>
              <Input
                value={inviteForm.first_name}
                onChange={(e) =>
                  setInviteForm((p) => ({ ...p, first_name: e.target.value }))
                }
                placeholder="Prénom"
                className="bg-white/80 border-blue-200"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-medium text-blue-900">Nom</label>
              <Input
                value={inviteForm.last_name}
                onChange={(e) =>
                  setInviteForm((p) => ({ ...p, last_name: e.target.value }))
                }
                placeholder="Nom"
                className="bg-white/80 border-blue-200"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-medium text-blue-900">Rôle</label>
              <Select
                value={inviteForm.role}
                onValueChange={(v) =>
                  setInviteForm((p) => ({
                    ...p,
                    role: v,
                    team_leader_pro_id:
                      norm(v) === "agent_affiliate" ? p.team_leader_pro_id : null,
                  }))
                }
              >
                <SelectTrigger className="bg-white/80 border-blue-200">
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent_affiliate">Agent affilié</SelectItem>
                  <SelectItem value="team_leader">Chef d&apos;équipe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-medium text-blue-900">
                Chef d&apos;équipe (option)
              </label>
              <Select
                value={inviteForm.team_leader_pro_id || "none"}
                onValueChange={(v) =>
                  setInviteForm((p) => ({
                    ...p,
                    team_leader_pro_id: v === "none" ? null : v,
                  }))
                }
                disabled={norm(inviteForm.role) !== "agent_affiliate"}
              >
                <SelectTrigger className="bg-white/80 border-blue-200">
                  <SelectValue placeholder="Aucun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {teamLeaderOptions.map((opt) => (
                    <SelectItem key={opt.pro_id} value={opt.pro_id}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-1">
              <Button
                onClick={handleCreateInvitation}
                className="w-full gap-2 bg-brand-orange hover:bg-orange-600"
                disabled={creatingInvite}
              >
                {creatingInvite ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Créer
              </Button>
            </div>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-blue-900">
                Invitations en attente{" "}
                <span className="text-xs text-blue-700">({pendingInvites.length})</span>
              </p>
              {invitesLoading && (
                <div className="flex items-center gap-2 text-xs text-blue-700">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Chargement…
                </div>
              )}
            </div>

            {pendingInvites.length === 0 ? (
              <p className="text-xs text-blue-700 mt-2">
                Aucune invitation en attente.
              </p>
            ) : (
              <div className="mt-2 space-y-2">
                {pendingInvites.slice(0, 4).map((inv) => {
                  const link = publicInviteLink(inv.token);
                  const expired = isExpired(inv.expires_at);
                  const otpExpired =
                    inv.one_time_code_expires_at &&
                    isExpired(inv.one_time_code_expires_at) &&
                    !inv.one_time_code_used_at;
                  const ref = inviteRefFromToken(inv.token);

                  return (
                    <div
                      key={inv.id}
                      className="flex flex-col md:flex-row md:items-center gap-2 rounded-md border border-blue-100 bg-white/70 p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={`gap-1.5 ${roleBadgeClass(inv.role)}`}
                          >
                            <RoleIcon role={inv.role} className="h-3.5 w-3.5" />
                            {roleLabel(inv.role)}
                          </Badge>

                          <span className="text-sm font-medium text-gray-900 truncate">
                            {inv.email}
                          </span>

                          {expired && (
                            <Badge
                              variant="outline"
                              className="bg-red-50 text-red-700 border-red-200"
                            >
                              expirée
                            </Badge>
                          )}

                          {otpExpired && (
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700 border-amber-200"
                            >
                              code expiré
                            </Badge>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2 min-w-0">
                            <LinkIcon className="h-3.5 w-3.5" />
                            <span className="truncate">{link}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span>Réf :</span>
                            <span className="font-mono text-gray-900">{ref}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          className="gap-2"
                          onClick={() => handleSendInviteEmail(inv)}
                          disabled={sendingInviteId === inv.id}
                        >
                          {sendingInviteId === inv.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Mail className="h-4 w-4" />
                          )}
                          Envoyer
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Invitation</DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem onClick={() => handleCopyInvite(inv.token)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Copier le lien
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() => handleCancelInvite(inv.id)}
                              className="text-red-600"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Révoquer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-blue-900">
                Historique des invitations{" "}
                <span className="text-xs text-blue-700">({historyInvites.length})</span>
              </p>
            </div>

            {historyInvites.length === 0 ? (
              <p className="text-xs text-blue-700 mt-2">
                Aucune invitation dans l’historique.
              </p>
            ) : (
              <div className="mt-2 space-y-2">
                {historyInvites.slice(0, 8).map((inv) => {
                  const link = publicInviteLink(inv.token);
                  const ref = inviteRefFromToken(inv.token);

                  return (
                    <div
                      key={inv.id}
                      className="flex flex-col md:flex-row md:items-center gap-2 rounded-md border border-blue-100 bg-white/60 p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={`gap-1.5 ${statusBadgeClass(inv.status)}`}
                          >
                            {statusLabel(inv.status)}
                          </Badge>

                          <Badge
                            variant="outline"
                            className={`gap-1.5 ${roleBadgeClass(inv.role)}`}
                          >
                            <RoleIcon role={inv.role} className="h-3.5 w-3.5" />
                            {roleLabel(inv.role)}
                          </Badge>

                          <span className="text-sm font-medium text-gray-900 truncate">
                            {inv.email}
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2 min-w-0">
                            <LinkIcon className="h-3.5 w-3.5" />
                            <span className="truncate">{link}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span>Réf :</span>
                            <span className="font-mono text-gray-900">{ref}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span>MAJ :</span>
                            <span className="font-mono text-gray-900">
                              {inv.updated_at
                                ? new Date(inv.updated_at).toLocaleString()
                                : inv.created_at
                                ? new Date(inv.created_at).toLocaleString()
                                : "—"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={() => handleCopyInvite(inv.token)}
                        >
                          <Copy className="h-4 w-4" />
                          Copier
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {historyInvites.length > 8 && (
              <p className="text-xs text-muted-foreground mt-2">
                Affichage limité aux 8 dernières invitations.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
              <p className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Team Leaders
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-gray-50 border p-3">
                <p className="text-xs text-muted-foreground">Comptes créés</p>
                <p className="text-2xl font-bold mt-1">
                  {roleStats.team_leader.created_accounts}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 border p-3">
                <p className="text-xs text-muted-foreground">Invitations envoyées</p>
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
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Agents affiliés
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-gray-50 border p-3">
                <p className="text-xs text-muted-foreground">Comptes créés</p>
                <p className="text-2xl font-bold mt-1">
                  {roleStats.agent_affiliate.created_accounts}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 border p-3">
                <p className="text-xs text-muted-foreground">Invitations envoyées</p>
                <p className="text-2xl font-bold mt-1">
                  {roleStats.agent_affiliate.invitations_sent}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 border p-3">
                <p className="text-xs text-muted-foreground">Comptes confirmés</p>
                <p className="text-2xl font-bold mt-1">
                  {roleStats.agent_affiliate.confirmed_accounts}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-gray-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              Liste des collaborateurs
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Le collaborateur doit être validé par l’administrateur avant de pouvoir être affiché sur la page partenaires.
            </p>
          </div>

          <div className="relative w-full md:w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, email, statut..."
              className="pl-9 bg-white"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/30">
                <TableHead className="w-[280px]">Collaborateur</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut compte</TableHead>
                <TableHead>Validation admin</TableHead>
                <TableHead>Page partenaires</TableHead>
                <TableHead>ID (Debug)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    Aucun membre trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => {
                  const isSelf = member.user_id === user?.id;
                  const isDirector = norm(member.role) === "director";
                  const savingRole = roleSavingUserId === member.user_id;
                  const savingVisibility = visibilitySavingUserId === member.user_id;
                  const isAdminValidated = Boolean(member?.pro?.is_validated_by_administrator);
                  const isPartnerVisible = Boolean(member?.pro?.visibility_pro_partner_page);

                  return (
                    <TableRow key={member.user_id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border bg-white">
                            <AvatarImage
                              src={member?.pro?.avatar_url || ""}
                              alt={safeName(member.pro)}
                            />
                            <AvatarFallback>
                              {safeName(member.pro).slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex flex-col">
                            <span className="font-medium text-sm text-gray-900">
                              {safeName(member.pro)}
                              {isSelf && (
                                <span className="ml-2 text-xs text-muted-foreground">(Vous)</span>
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {member?.pro?.email || "—"}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`gap-1.5 pl-1.5 pr-2.5 py-1 ${roleBadgeClass(member.role)}`}
                        >
                          <RoleIcon role={member.role} className="w-3.5 h-3.5" />
                          {roleLabel(member.role)}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={Boolean(member.is_active)}
                            onCheckedChange={() =>
                              handleToggleActive(member.user_id, Boolean(member.is_active))
                            }
                            disabled={isSelf}
                          />
                          <span
                            className={`text-xs font-medium ${
                              member.is_active ? "text-green-600" : "text-gray-400"
                            }`}
                          >
                            {member.is_active ? "Actif" : "Inactif"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            isAdminValidated
                              ? "gap-1.5 bg-green-50 text-green-700 border-green-200"
                              : "gap-1.5 bg-amber-50 text-amber-700 border-amber-200"
                          }
                        >
                          {isAdminValidated ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <Clock3 className="h-3.5 w-3.5" />
                          )}
                          {isAdminValidated ? "Validé" : "En attente"}
                        </Badge>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {adminValidationLabel(isAdminValidated)}
                        </p>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={isPartnerVisible}
                            disabled={!isAdminValidated || savingVisibility}
                            onCheckedChange={(checked) =>
                              handleTogglePartnerVisibility(member, checked)
                            }
                          />

                          <div className="flex flex-col">
                            <span
                              className={`text-xs font-medium ${
                                isPartnerVisible ? "text-green-600" : "text-gray-500"
                              }`}
                            >
                              {isPartnerVisible ? "Affiché" : "Masqué"}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {!isAdminValidated
                                ? "Validation admin requise"
                                : isPartnerVisible
                                ? "Visible sur PartnerProfessionnelPage"
                                : "Non visible sur PartnerProfessionnelPage"}
                            </span>
                          </div>

                          {savingVisibility ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : isPartnerVisible ? (
                            <Eye className="h-4 w-4 text-green-600" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {shortId(member.user_id)}
                      </TableCell>

                      <TableCell className="text-right">
                        {!isSelf && !isDirector && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={savingRole}
                              >
                                {savingRole ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                ) : (
                                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Modifier le rôle</DropdownMenuLabel>
                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                disabled={norm(member.role) === "agent_affiliate" || savingRole}
                                onClick={() =>
                                  handleChangeRole(
                                    member.user_id,
                                    member.role,
                                    "agent_affiliate"
                                  )
                                }
                              >
                                <Shield className="w-4 h-4 mr-2" />
                                Passer Agent affilié
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                disabled={norm(member.role) === "team_leader" || savingRole}
                                onClick={() =>
                                  handleChangeRole(
                                    member.user_id,
                                    member.role,
                                    "team_leader"
                                  )
                                }
                              >
                                <ShieldCheck className="w-4 h-4 mr-2" />
                                Promouvoir Chef d&apos;équipe
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}