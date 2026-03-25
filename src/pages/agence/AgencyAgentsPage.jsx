import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/lib/customSupabaseClient";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useAgencyData } from "@/hooks/useAgencyData";
import SEO from "@/components/SEO";
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  Phone,
  Mail,
  Loader2,
  AlertCircle,
  Crown,
  Shield,
  ArrowRight,
  CheckCircle2,
  Copy,
  RefreshCw,
  ExternalLink,
  Ban,
  Trash2,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// New Component imports
import CardDistributionTools from "@/components/pro/CardDistributionTools";

/* ---------------------------
   Helpers
---------------------------- */
function safeInitials(firstName, lastName, email) {
  const a = (firstName || "").trim()[0] || (email || "").trim()[0] || "?";
  const b = (lastName || "").trim()[0] || "";
  return `${a}${b}`.toUpperCase();
}

function formatName(firstName, lastName, email) {
  const full = `${firstName || ""} ${lastName || ""}`.trim();
  return full || email || "Utilisateur";
}

function roleLabel(role) {
  if (role === "director") return "Directeur";
  if (role === "team_leader") return "Team Leader";
  return "Agent";
}

function roleBadgeVariant(role) {
  if (role === "director") return "default";
  if (role === "team_leader") return "secondary";
  return "outline";
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function generateAlphaCode(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function fmtDateShort(d) {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd MMM yyyy", { locale: fr });
  } catch {
    return "—";
  }
}

// ✅ NEW: avatar resolver for PRIVATE storage
const isHttpUrl = (v) => /^https?:\/\//i.test(String(v || "").trim());
const looksLikeStoragePath = (v) => {
  const s = String(v || "").trim();
  if (!s) return false;
  if (isHttpUrl(s)) return false;
  // paths like: avatars/<uid>/..., logos/<uid>/..., misc/<uid>/...
  return s.startsWith("avatars/") || s.startsWith("logos/") || s.startsWith("misc/");
};

/* ---------------------------
   Components
---------------------------- */

function AgencyTopNav() {
  const isAgents = true;
  return (
    <div className="flex items-center gap-2 border-b pb-3 mb-6">
      <Link
        to="/agence/agents"
        className={cn(
          "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition",
          isAgents
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:bg-muted/60"
        )}
      >
        <Users className="h-4 w-4" />
        Agents
      </Link>
      <Link
        to="/agence/contacts"
        className={cn(
          "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition text-muted-foreground hover:bg-muted/60"
        )}
      >
        <ArrowRight className="h-4 w-4" />
        Contacts
      </Link>
    </div>
  );
}

/**
 * Row unifiée pour table :
 * - type: "pro" | "invite"
 */
function buildInviteRow(inv) {
  return {
    type: "invite",
    id: inv.id,
    created_at: inv.created_at,
    email: inv.email,
    first_name: inv.first_name,
    last_name: inv.last_name,
    phone: null,
    avatar_url: null,
    agency_role: (inv.role || "agent").toLowerCase(),
    status: "invite_pending",
    invite_status: inv.status,
    team_leader: inv.team_leader || null,
    team_leader_id: inv.team_leader_pro_id || null,
    digital_card_livingroom_url: null,
    is_active: null,
  };
}

function buildProRow(p) {
  return {
    type: "pro",
    id: p.id,
    created_at: p.created_at,
    email: p.email,
    first_name: p.first_name,
    last_name: p.last_name,
    phone: p.phone,
    avatar_url: p.avatar_url, // can be http URL OR storage path like "avatars/<uid>/..."
    agency_role: (p.agency_role || "agent").toLowerCase(),
    status: p.is_active ? "active" : "inactive",
    team_leader: p.team_leader || null,
    team_leader_id: p.team_leader_id || null,
    digital_card_livingroom_url: p.digital_card_livingroom_url,
    is_active: !!p.is_active,
  };
}

export default function AgencyAgentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { agency, permissions } = useAgencyData();
  const { isDirector } = permissions || {};

  // Data State
  const [me, setMe] = useState(null);

  const [proRows, setProRows] = useState([]);
  const [inviteRows, setInviteRows] = useState([]);

  const [teamLeaders, setTeamLeaders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [tlFilter, setTlFilter] = useState("all");

  // IMPORTANT: cache anti “réapparition” après suppression
  const [deletedInviteIds, setDeletedInviteIds] = useState(() => new Set());

  // Dialog State (existing)
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedAgentForAssign, setSelectedAgentForAssign] = useState(null);
  const [selectedTlId, setSelectedTlId] = useState("none");

  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [selectedAgentForCode, setSelectedAgentForCode] = useState(null);
  const [generatedCode, setGeneratedCode] = useState(null);

  // Card Distribution Modal
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [selectedAgentForCard, setSelectedAgentForCard] = useState(null);

  // ✅ NEW: signed URL cache (path -> signedUrl)
  const avatarSignedCacheRef = useRef(new Map());
  const [avatarUrlMap, setAvatarUrlMap] = useState({}); // row.id -> signedUrl

  const signProfessionalAsset = useCallback(async (path, expiresInSeconds = 60 * 60) => {
    if (!path) return null;

    const cache = avatarSignedCacheRef.current;
    if (cache.has(path)) return cache.get(path);

    const { data, error } = await supabase
      .storage
      .from("professional-assets")
      .createSignedUrl(path, expiresInSeconds);

    if (error) {
      console.warn("[AgencyAgentsPage] createSignedUrl failed for:", path, error);
      return null;
    }

    const signedUrl = data?.signedUrl || null;
    if (signedUrl) cache.set(path, signedUrl);
    return signedUrl;
  }, []);

  // ✅ NEW: resolve avatar URLs for pro rows when needed (private bucket)
  const hydrateAvatarUrls = useCallback(async (rows) => {
    const proRowsNeedingSign = (rows || [])
      .filter((r) => r.type === "pro" && looksLikeStoragePath(r.avatar_url))
      .slice(0, 200); // safety

    if (proRowsNeedingSign.length === 0) return;

    // Build updates in parallel
    const updates = await Promise.all(
      proRowsNeedingSign.map(async (r) => {
        const signed = await signProfessionalAsset(String(r.avatar_url).trim(), 60 * 60);
        return { id: r.id, signed };
      })
    );

    setAvatarUrlMap((prev) => {
      const next = { ...prev };
      for (const u of updates) {
        if (u?.id && u?.signed) next[u.id] = u.signed;
      }
      return next;
    });
  }, [signProfessionalAsset]);

  const fetchData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // 1) Me
      const { data: meRes, error: meErr } = await supabase.rpc("agency_me");
      if (meErr) throw meErr;
      const myProfile = Array.isArray(meRes) ? meRes[0] : meRes;

      if (!myProfile || !myProfile.agency_id) {
        throw new Error("Impossible de récupérer les informations de l'agence.");
      }
      setMe(myProfile);

      // 2) Pros
      const { data: pros, error: prosErr } = await supabase
        .from("professionnels")
        .select(
          `
          id,
          created_at,
          email,
          first_name,
          last_name,
          phone,
          avatar_url,
          digital_card_livingroom_url,
          agency_id,
          agency_role,
          is_active,
          team_leader_id,
          team_leader:team_leader_id ( id, first_name, last_name, email )
        `
        )
        .eq("agency_id", myProfile.agency_id)
        .order("created_at", { ascending: false });

      if (prosErr) throw prosErr;

      const normalizedPros = (pros || []).map(buildProRow);
      setProRows(normalizedPros);

      // ✅ hydrate avatars (private storage path -> signed url)
      hydrateAvatarUrls(normalizedPros);

      // 3) Invitations
      const { data: invs, error: invErr } = await supabase
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
          team_leader_pro_id,
          team_leader:team_leader_pro_id ( id, first_name, last_name, email )
        `
        )
        .eq("agency_id", myProfile.agency_id)
        .order("created_at", { ascending: false });

      if (invErr) throw invErr;

      const normalizedInvs = (invs || [])
        .filter((inv) => !deletedInviteIds.has(inv.id))
        .map(buildInviteRow);

      setInviteRows(normalizedInvs);

      // 4) TL list (uniquement pros actifs)
      const leaders = normalizedPros.filter(
        (p) => p.agency_role === "team_leader" && p.is_active
      );
      setTeamLeaders(leaders);
    } catch (err) {
      console.error(err);
      setError(err.message);
      toast({
        title: "Erreur",
        description: "Impossible de charger la liste des membres.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast, deletedInviteIds, hydrateAvatarUrls]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---------------------------
     Actions
  ---------------------------- */

  const handleToggleActive = async (row) => {
    if (!isDirector) return;
    if (row.type !== "pro") return;

    const newStatus = !row.is_active;

    setProRows((prev) =>
      prev.map((a) =>
        a.id === row.id
          ? {
              ...a,
              is_active: newStatus,
              status: newStatus ? "active" : "inactive",
            }
          : a
      )
    );

    try {
      const { error } = await supabase.rpc("director_set_professionnel_active", {
        p_professionnel_id: row.id,
        p_is_active: newStatus,
      });
      if (error) throw error;

      toast({
        title: "Statut mis à jour",
        description: `${formatName(
          row.first_name,
          row.last_name,
          row.email
        )} est maintenant ${newStatus ? "actif" : "suspendu"}.`,
      });
    } catch (err) {
      setProRows((prev) =>
        prev.map((a) =>
          a.id === row.id
            ? {
                ...a,
                is_active: !newStatus,
                status: !newStatus ? "active" : "inactive",
              }
            : a
        )
      );
      toast({
        title: "Erreur",
        description: "La mise à jour a échoué.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteInvitation = async (invRow) => {
    if (!isDirector) return;
    if (!invRow || invRow.type !== "invite") return;

    setDeletedInviteIds((prev) => {
      const next = new Set(prev);
      next.add(invRow.id);
      return next;
    });
    setInviteRows((prev) => prev.filter((r) => r.id !== invRow.id));

    try {
      const { error } = await supabase.rpc("director_delete_invitation", {
        p_invitation_id: invRow.id,
      });
      if (error) throw error;

      toast({
        title: "Invitation supprimée",
        description: `Invitation supprimée pour ${invRow.email}.`,
      });

      await fetchData();
    } catch (e) {
      console.error(e);
      toast({
        title: "Erreur",
        description: e?.message || "Impossible de supprimer l'invitation.",
        variant: "destructive",
      });
      await fetchData();
    }
  };

  const openAssignModal = (agentRow) => {
    setSelectedAgentForAssign(agentRow);
    setSelectedTlId(agentRow.team_leader_id || "none");
    setAssignModalOpen(true);
  };

  const handleAssignSubmit = async () => {
    if (!selectedAgentForAssign) return;
    const tlId = selectedTlId === "none" ? null : selectedTlId;

    try {
      const { error } = await supabase.rpc("director_set_agent_team_leader", {
        p_agent_id: selectedAgentForAssign.id,
        p_team_leader_id: tlId,
      });

      if (error) throw error;

      toast({
        title: "Rattachement mis à jour",
        description: "L'organisation de l'équipe a été mise à jour.",
      });

      setAssignModalOpen(false);
      fetchData();
    } catch (err) {
      toast({
        title: "Erreur",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const openCodeModal = (agent) => {
    setSelectedAgentForCode(agent);
    setGeneratedCode(agent.latestCode || null);
    setCodeModalOpen(true);
  };

  const handleGenerateCode = async () => {
    if (!selectedAgentForCode) return;

    const newCode = generateAlphaCode(6);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    try {
      await supabase
        .from("agent_temp_codes")
        .delete()
        .eq("agent_id", selectedAgentForCode.id);

      const { data, error } = await supabase
        .from("agent_temp_codes")
        .insert({
          agent_id: selectedAgentForCode.id,
          code: newCode,
          expires_at: expiresAt.toISOString(),
          created_by: me.user_id,
        })
        .select()
        .single();

      if (error) throw error;

      setGeneratedCode(data);

      toast({
        title: "Code généré",
        description: "Le code d'invitation est actif pour 7 jours.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de générer le code.",
      });
    }
  };

  const handleCopyCode = async () => {
    if (!generatedCode?.code) return;
    const ok = await copyToClipboard(generatedCode.code);
    if (ok)
      toast({ title: "Copié !", description: "Code copié dans le presse-papier." });
  };

  const openCardModal = (agent) => {
    setSelectedAgentForCard(agent);
    setCardModalOpen(true);
  };

  /* ---------------------------
     Derived & Render
  ---------------------------- */

  const allRows = useMemo(() => {
    const merged = [...proRows, ...inviteRows];
    merged.sort((a, b) => {
      const da = a.created_at ? new Date(a.created_at).getTime() : 0;
      const db = b.created_at ? new Date(b.created_at).getTime() : 0;
      return db - da;
    });
    return merged;
  }, [proRows, inviteRows]);

  const filteredRows = useMemo(() => {
    let filtered = allRows;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((r) => {
        const name = formatName(r.first_name, r.last_name, r.email).toLowerCase();
        return (
          name.includes(q) ||
          (r.email || "").toLowerCase().includes(q) ||
          (r.phone || "").toLowerCase().includes(q)
        );
      });
    }

    if (isDirector && tlFilter !== "all") {
      if (tlFilter === "none") {
        filtered = filtered.filter((r) => !r.team_leader_id);
      } else if (tlFilter === "assigned") {
        filtered = filtered.filter((r) => !!r.team_leader_id);
      } else {
        filtered = filtered.filter((r) => r.team_leader_id === tlFilter);
      }
    }

    return filtered;
  }, [allRows, searchQuery, tlFilter, isDirector]);

  const stats = useMemo(() => {
    const prosTL = proRows.filter((r) => r.agency_role === "team_leader");
    const prosAgent = proRows.filter((r) => r.agency_role === "agent");

    const invTL = inviteRows.filter((r) => r.agency_role === "team_leader" && r.invite_status === "pending");
    const invAgent = inviteRows.filter((r) => r.agency_role === "agent" && r.invite_status === "pending");

    const activeTL = prosTL.filter((r) => r.is_active).length;
    const activeAgent = prosAgent.filter((r) => r.is_active).length;

    return {
      tl: { created: prosTL.length, invited: invTL.length, active: activeTL },
      agent: { created: prosAgent.length, invited: invAgent.length, active: activeAgent },
    };
  }, [proRows, inviteRows]);

  const directorName = useMemo(() => {
    if (!me) return "Directeur";
    return formatName(me.first_name, me.last_name, me.email);
  }, [me]);

  const attachedTo = useCallback(
    (row) => {
      if (row.team_leader) {
        return formatName(row.team_leader.first_name, row.team_leader.last_name, row.team_leader.email);
      }
      return directorName;
    },
    [directorName]
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h3 className="text-lg font-semibold">Erreur de chargement</h3>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={fetchData}>Réessayer</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <SEO title="Membres de l'équipe | Agence" description="Gestion des membres de l'équipe et des accès." />

      <AgencyTopNav />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            Gestion de l’équipe
            {isDirector && (
              <Badge variant="default" className="ml-2">
                <Crown className="w-3 h-3 mr-1" /> Directeur
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">{filteredRows.length} entrées (comptes + invitations).</p>
        </div>

        <Button onClick={fetchData} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-4 h-4" /> Actualiser
        </Button>
      </div>

      {/* Stats */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Card className="flex-1">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">TEAM LEADERS</div>
            <div className="mt-2 grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-muted/40 p-3">
                <div className="text-[11px] text-muted-foreground">Comptes créés</div>
                <div className="text-xl font-bold">{stats.tl.created}</div>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <div className="text-[11px] text-muted-foreground">Invitations envoyées</div>
                <div className="text-xl font-bold">{stats.tl.invited}</div>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <div className="text-[11px] text-muted-foreground">Comptes actifs</div>
                <div className="text-xl font-bold">{stats.tl.active}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">AGENTS</div>
            <div className="mt-2 grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-muted/40 p-3">
                <div className="text-[11px] text-muted-foreground">Comptes créés</div>
                <div className="text-xl font-bold">{stats.agent.created}</div>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <div className="text-[11px] text-muted-foreground">Invitations envoyées</div>
                <div className="text-xl font-bold">{stats.agent.invited}</div>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <div className="text-[11px] text-muted-foreground">Comptes actifs</div>
                <div className="text-xl font-bold">{stats.agent.active}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Filtrer par nom ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {isDirector && (
            <div className="w-full md:w-[250px]">
              <Select value={tlFilter} onValueChange={setTlFilter}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Filtrer par équipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toute l’agence</SelectItem>
                  <SelectItem value="assigned">Avec Team Leader</SelectItem>
                  <SelectItem value="none">Rattaché au directeur</SelectItem>
                  {teamLeaders.map((tl) => (
                    <SelectItem key={tl.id} value={tl.id}>
                      Équipe {formatName(tl.first_name, tl.last_name, tl.email)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(searchQuery || tlFilter !== "all") && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearchQuery("");
                setTlFilter("all");
              }}
              className="px-3"
            >
              Effacer
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead className="min-w-[250px]">Membre</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rattaché à</TableHead>
                <TableHead className="min-w-[180px]">Contact</TableHead>
                <TableHead>Carte</TableHead>
                <TableHead>Date de création du compte</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    Aucun membre trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => {
                  const name = formatName(row.first_name, row.last_name, row.email);
                  const cardUrl = row.digital_card_livingroom_url;

                  // ✅ Avatar display logic:
                  const avatarSrc =
                    row.type === "pro"
                      ? (isHttpUrl(row.avatar_url) ? row.avatar_url : avatarUrlMap[row.id] || undefined)
                      : undefined;

                  return (
                    <TableRow key={`${row.type}-${row.id}`} className="hover:bg-gray-50/40">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border bg-gray-50">
                            <AvatarImage src={avatarSrc} />
                            <AvatarFallback className="font-semibold text-primary/80">
                              {safeInitials(row.first_name, row.last_name, row.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-gray-900 truncate">{name}</span>
                            <span className="text-xs text-muted-foreground truncate">{row.email}</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant={roleBadgeVariant(row.agency_role)}>{roleLabel(row.agency_role)}</Badge>
                      </TableCell>

                      <TableCell>
                        {row.type === "invite" ? (
                          <Badge className="bg-orange-500 text-white hover:bg-orange-600">
                            Invitation envoyée – en attente
                          </Badge>
                        ) : isDirector ? (
                          <div className="flex items-center gap-3">
                            <Badge
                              className={cn(
                                "gap-1",
                                row.is_active
                                  ? "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200"
                                  : "bg-red-100 text-red-700 hover:bg-red-200 border border-red-200"
                              )}
                            >
                              {row.is_active ? <CheckCircle2 className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                              {row.is_active ? "Actif" : "Suspendu"}
                            </Badge>

                            <Switch checked={row.is_active} onCheckedChange={() => handleToggleActive(row)} disabled={me?.id === row.id} />
                          </div>
                        ) : (
                          <Badge
                            className={cn(
                              "gap-1",
                              row.is_active
                                ? "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200"
                                : "bg-red-100 text-red-700 hover:bg-red-200 border border-red-200"
                            )}
                          >
                            {row.is_active ? <CheckCircle2 className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                            {row.is_active ? "Actif" : "Suspendu"}
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-sm text-gray-700">{attachedTo(row)}</TableCell>

                      <TableCell>
                        <div className="flex flex-col text-sm gap-1">
                          <div className="flex items-center gap-1.5 text-gray-600 truncate max-w-[180px]">
                            <Mail className="w-3 h-3" />
                            {row.email}
                          </div>
                          {row.type === "pro" && row.phone ? (
                            <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                              <Phone className="w-3 h-3" />
                              {row.phone}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                              <Phone className="w-3 h-3" /> —
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {cardUrl ? (
                          <a
                            href={cardUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            Voir <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">Après validation</span>
                        )}
                      </TableCell>

                      <TableCell className="text-sm text-gray-500">{fmtDateShort(row.created_at)}</TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 h-4 text-gray-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {row.type === "invite" ? (
                              <DropdownMenuItem
                                onClick={() => handleDeleteInvitation(row)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Supprimer l’invitation
                              </DropdownMenuItem>
                            ) : (
                              <>
                                <DropdownMenuItem onClick={() => openCardModal(row)}>
                                  <Users className="w-4 h-4 mr-2" />
                                  Outils diffusion
                                </DropdownMenuItem>

                                <DropdownMenuItem onClick={() => openCodeModal(row)}>
                                  <Shield className="w-4 h-4 mr-2" />
                                  Code d'invitation
                                </DropdownMenuItem>

                                {isDirector && row.agency_role === "agent" && (
                                  <DropdownMenuItem onClick={() => openAssignModal(row)}>
                                    <Shield className="w-4 h-4 mr-2" />
                                    Assigner Team Leader
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Assign Team Leader Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assigner un Team Leader</DialogTitle>
            <DialogDescription>
              Sélectionnez le Team Leader pour{" "}
              <strong>
                {selectedAgentForAssign &&
                  formatName(
                    selectedAgentForAssign.first_name,
                    selectedAgentForAssign.last_name,
                    selectedAgentForAssign.email
                  )}
              </strong>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedTlId} onValueChange={setSelectedTlId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un Team Leader" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun (Rattaché au Directeur)</SelectItem>
                {teamLeaders
                  .filter((tl) => tl.id !== selectedAgentForAssign?.id)
                  .map((tl) => (
                    <SelectItem key={tl.id} value={tl.id}>
                      {formatName(tl.first_name, tl.last_name, tl.email)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAssignSubmit}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Code Generation Modal */}
      <Dialog open={codeModalOpen} onOpenChange={setCodeModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Code d'invitation Temporaire</DialogTitle>
            <DialogDescription>
              Ce code permet à l'agent de se connecter ou d'accéder à des fonctions restreintes.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 flex flex-col items-center gap-4">
            {generatedCode ? (
              <div className="w-full space-y-4">
                <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center relative">
                  <span className="text-4xl font-mono font-bold tracking-widest text-gray-800">
                    {generatedCode.code}
                  </span>
                  <p className="text-xs text-muted-foreground mt-2">
                    Expire le {new Date(generatedCode.expires_at).toLocaleDateString()}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 h-8 w-8 p-0"
                    onClick={handleCopyCode}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex justify-center">
                  <Button onClick={handleCopyCode} className="w-full">
                    <Copy className="mr-2 h-4 w-4" /> Copier le code
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Aucun code actif pour cet agent.
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-between">
            {isDirector && (
              <Button
                variant={generatedCode ? "destructive" : "default"}
                onClick={handleGenerateCode}
                className="w-full sm:w-auto"
              >
                {generatedCode ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" /> Régénérer
                  </>
                ) : (
                  "Générer un code"
                )}
              </Button>
            )}
            <Button variant="outline" onClick={() => setCodeModalOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Card Distribution Modal */}
      <Dialog open={cardModalOpen} onOpenChange={setCardModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Outils de diffusion -{" "}
              {selectedAgentForCard
                ? formatName(
                    selectedAgentForCard.first_name,
                    selectedAgentForCard.last_name,
                    selectedAgentForCard.email
                  )
                : ""}
            </DialogTitle>
            <DialogDescription>Liens et QR Code pour la carte de visite.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            {selectedAgentForCard && (
              <CardDistributionTools
                profile={selectedAgentForCard}
                agency={agency}
                saving={false}
                setProfile={() => {}}
                proId={selectedAgentForCard.id}
                onCountClick={() => {}}
                onCountScan={() => {}}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCardModalOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}