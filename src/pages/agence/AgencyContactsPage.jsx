// src/pages/agence/AgencyContactsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/customSupabaseClient";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowRight,
  Users,
  Loader2,
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
  MessageSquare,
  User,
  Building2,
  Clock,
  Copy,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useToast } from "@/components/ui/use-toast";

/* ---------------------------
   Top nav (Agents / Contacts)
---------------------------- */
function AgencyTopNav() {
  const location = useLocation();
  const isAgents = location.pathname.startsWith("/agence/agents");
  const isContacts = location.pathname.startsWith("/agence/contacts");

  return (
    <div className="flex items-center gap-2 border-b pb-3">
      <Link
        to="/agence/agents"
        className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${isAgents ? "bg-muted" : "hover:bg-muted/60"
          }`}
      >
        <Users className="h-4 w-4" />
        Agents
      </Link>
      <Link
        to="/agence/contacts"
        className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${isContacts ? "bg-muted" : "hover:bg-muted/60"
          }`}
      >
        <ArrowRight className="h-4 w-4" />
        Contacts
      </Link>
    </div>
  );
}

/* ---------------------------
   Helpers
---------------------------- */
function shortId(id) {
  if (!id) return "—";
  return `${String(id).slice(0, 6)}…${String(id).slice(-4)}`;
}

function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadgeVariant(status) {
  const s = (status || "").toLowerCase();
  if (["accepted", "in_contact", "approved"].includes(s)) return "outline";
  if (["pending"].includes(s)) return "secondary";
  if (["declined", "rejected", "closed", "archived"].includes(s)) return "destructive";
  return "outline";
}

function prettifyStatus(status) {
  const s = (status || "").toLowerCase();
  if (s === "pending") return "En attente";
  if (s === "accepted") return "Accepté";
  if (s === "approved") return "Accepté";
  if (s === "in_contact") return "En contact";
  if (s === "declined") return "Refusé";
  if (s === "rejected") return "Refusé";
  if (s === "closed") return "Clos";
  if (s === "archived") return "Archivé";
  return status || "—";
}

function computeProjectType(conn) {
  if (conn?.project_type) return conn.project_type;
  if (conn?.buying_project_particulier_id || conn?.buying_project_professionnel_id) return "achat";
  if (conn?.selling_project_particulier_id || conn?.selling_project_professionnel_id) return "vente";
  return null;
}

function computeProjectOrigin(conn) {
  if (conn?.project_origin) return conn.project_origin;
  if (conn?.buying_project_professionnel_id || conn?.selling_project_professionnel_id) return "professionnel";
  if (conn?.buying_project_particulier_id || conn?.selling_project_particulier_id) return "particulier";
  return null;
}

/**
 * Normalise un row quel que soit son origine:
 * - RPC agency_contacts(): peut renvoyer connection_id, pro_target..., etc.
 * - table connections: renvoie id, pro_id, particulier_id...
 */
function normalizeConnectionRow(r) {
  const id = r?.connection_id || r?.id || null;

  // champs “agent / particulier” : différentes conventions possibles
  const proId =
    r?.pro_id ||
    r?.requesting_professionnel_id ||
    r?.target_professionnel_id ||
    r?.requesting_pro_id ||
    r?.target_pro_id ||
    null;

  const particulierId =
    r?.particulier_id ||
    r?.requesting_particulier_id ||
    r?.target_particulier_id ||
    r?.requesting_user_id ||
    r?.target_user_id ||
    null;

  // “villes” : plusieurs colonnes possibles
  const city = r?.project_city_choice_1 || r?.city_choice_1 || r?.city || r?.project_city || null;

  // noms/email “best effort” (si RPC enrichit)
  const proFirst = r?.pro_first_name || r?.pro_requesting_first_name || r?.pro_target_first_name || null;
  const proLast = r?.pro_last_name || r?.pro_requesting_last_name || r?.pro_target_last_name || null;
  const proEmail = r?.pro_email || r?.pro_requesting_email || r?.pro_target_email || null;

  const partFirst = r?.particulier_first_name || r?.part_first_name || r?.part_target_first_name || null;
  const partLast = r?.particulier_last_name || r?.part_last_name || r?.part_target_last_name || null;
  const partEmail = r?.particulier_email || r?.part_email || null;

  // scope agence + hiérarchie (dans connections)
  const proAgencyId = r?.pro_agency_id || r?.pro1_agency_id || r?.pro2_agency_id || null;

  // ✅ Assignation
  const ownerId = r?.owner_id || null;
  const proTeamLeaderId = r?.pro_team_leader_id || r?.pro1_team_leader_id || r?.pro2_team_leader_id || null;

  return {
    ...r,
    _id: id,
    _pro_id: proId,
    _particulier_id: particulierId,
    _city: city,
    _pro_first_name: proFirst,
    _pro_last_name: proLast,
    _pro_email: proEmail,
    _part_first_name: partFirst,
    _part_last_name: partLast,
    _part_email: partEmail,
    _pro_agency_id: proAgencyId,
    _owner_id: ownerId,
    _pro_team_leader_id: proTeamLeaderId,
  };
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

/* ---------------------------
   Page
---------------------------- */
export default function AgencyContactsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [savingConnId, setSavingConnId] = useState(null);
  const [error, setError] = useState(null);

  const [me, setMe] = useState(null);

  // data affichée
  const [connections, setConnections] = useState([]);

  // People agence (dropdown assignation + filtres)
  const [agencyPeople, setAgencyPeople] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [originFilter, setOriginFilter] = useState("all");

  // ✅ nouveaux filtres assignation
  const [ownerFilter, setOwnerFilter] = useState("all"); // owner_id
  const [teamLeaderScopeFilter, setTeamLeaderScopeFilter] = useState("all"); // pro_team_leader_id

  const isDirector = me?.agency_role === "director";
  const isTeamLeader = me?.agency_role === "team_leader";

  useEffect(() => {
    if (!user) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1) Me (agency_role + agency_id) via RPC (auth.uid())
      const { data: meRows, error: meErr } = await supabase.rpc("agency_me");
      if (meErr) throw meErr;

      const meRow = Array.isArray(meRows) ? meRows[0] : null;
      if (!meRow) throw new Error("Profil agence introuvable (agency_me).");

      if (meRow.agency_role !== "director" && meRow.agency_role !== "team_leader") {
        throw new Error("Accès non autorisé. Réservé aux directeurs et chefs d’équipe.");
      }
      setMe(meRow);

      // 2) Connexions via RPC agency_contacts() (recommandé)
      //    Fallback automatique sur table connections si la RPC n'est pas dispo.
      let rows = [];
      let usedRpc = true;

      const { data: rpcData, error: rpcErr } = await supabase.rpc("agency_contacts");
      if (rpcErr) {
        console.warn("agency_contacts() failed, fallback to connections table:", rpcErr);
        usedRpc = false;
      } else {
        rows = rpcData || [];
      }

      if (!usedRpc) {
        // Fallback: connections — IMPORTANT : inclure owner_id + pro_team_leader_id
        const { data: connData, error: connErr } = await supabase
          .from("connections")
          .select(
            `
            id,
            status,
            created_at,
            project_type,
            project_origin,
            project_city_choice_1,
            city_choice_1,
            first_message,
            requesting_user_id,
            target_user_id,
            requesting_professionnel_id,
            target_professionnel_id,
            buying_project_particulier_id,
            selling_project_particulier_id,
            buying_project_professionnel_id,
            selling_project_professionnel_id,
            pro_id,
            particulier_id,
            pro_agency_id,
            pro1_agency_id,
            pro2_agency_id,
            owner_id,
            pro_team_leader_id,
            pro1_team_leader_id,
            pro2_team_leader_id
          `
          )
          .order("created_at", { ascending: false })
          .limit(500);

        if (connErr) throw connErr;
        rows = connData || [];
      }

      const normalizedAll = (rows || []).map(normalizeConnectionRow);

      // Scope agence best-effort (si row fournit l'info)
      const scopedByAgency =
        meRow?.agency_id && normalizedAll.length > 0
          ? normalizedAll.filter((r) => {
            if (!r._pro_agency_id) return true; // RLS doit protéger
            return r._pro_agency_id === meRow.agency_id;
          })
          : normalizedAll;

      // ✅ Scope TL : uniquement son scope (pro_team_leader_id = me.id) ou ses propres contacts (owner_id = me.id)
      const scopedByRole =
        meRow.agency_role === "team_leader"
          ? scopedByAgency.filter((r) => r._pro_team_leader_id === meRow.id || r._owner_id === meRow.id)
          : scopedByAgency;

      setConnections(scopedByRole);

      // 3) People agence (dropdown + labels + filtres)
      const { data: ppl, error: pplErr } = await supabase
        .from("professionnels")
        .select("id, first_name, last_name, agency_role, team_leader_id, is_active, agency_id")
        .eq("agency_id", meRow.agency_id)
        .order("created_at", { ascending: true });

      if (pplErr) throw pplErr;

      setAgencyPeople(ppl || []);
    } catch (e) {
      console.error("AgencyContactsPage fetchData error:", e);
      const msg = e?.message || "Une erreur est survenue.";
      setError(msg);
      toast({
        title: "Erreur de chargement",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const peopleById = useMemo(() => {
    const m = new Map();
    (agencyPeople || []).forEach((p) => m.set(p.id, p));
    return m;
  }, [agencyPeople]);

  const activeAssignablePeople = useMemo(() => {
    // assignation vers n'importe quel pro actif de l'agence (director/tl/agent)
    return (agencyPeople || []).filter((p) => p.is_active !== false);
  }, [agencyPeople]);

  const teamLeaderPeople = useMemo(() => {
    // pour filtre "Équipe ..."
    return (agencyPeople || []).filter((p) => p.is_active !== false && (p.agency_role === "team_leader" || p.agency_role === "director"));
  }, [agencyPeople]);

  const kpis = useMemo(() => {
    const total = connections.length;
    const pending = connections.filter((c) => (c.status || "").toLowerCase() === "pending").length;
    const active = connections.filter((c) =>
      ["pending", "accepted", "approved", "in_contact"].includes((c.status || "").toLowerCase())
    ).length;
    const proPro = connections.filter((c) => c.requesting_professionnel_id && c.target_professionnel_id).length;

    return { total, pending, active, proPro };
  }, [connections]);

  const filteredConnections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return connections.filter((c) => {
      const type = computeProjectType(c);
      const origin = computeProjectOrigin(c);

      const statusOk = statusFilter === "all" || (c.status || "").toLowerCase() === statusFilter;
      const typeOk = typeFilter === "all" || (type || "").toLowerCase() === typeFilter;
      const originOk = originFilter === "all" || (origin || "").toLowerCase() === originFilter;

      // ✅ filtre assigné à
      const ownerOk = ownerFilter === "all" || (c._owner_id || null) === ownerFilter;

      // ✅ filtre équipe (scope TL/directeur)
      const tlOk =
        teamLeaderScopeFilter === "all" ||
        (teamLeaderScopeFilter === "unassigned"
          ? !c._pro_team_leader_id
          : (c._pro_team_leader_id || null) === teamLeaderScopeFilter);

      const haystack = [
        c._id,
        c.first_message,
        c._city,
        c.status,
        type,
        origin,
        c._pro_first_name,
        c._pro_last_name,
        c._pro_email,
        c._part_first_name,
        c._part_last_name,
        c._part_email,
        c._pro_id,
        c._particulier_id,
        c._owner_id,
        c._pro_team_leader_id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const searchOk = !q || haystack.includes(q);

      return statusOk && typeOk && originOk && ownerOk && tlOk && searchOk;
    });
  }, [
    connections,
    searchQuery,
    statusFilter,
    typeFilter,
    originFilter,
    ownerFilter,
    teamLeaderScopeFilter,
  ]);

  const formatPerson = (p) => {
    if (!p) return "—";
    const name = `${p.first_name || ""} ${p.last_name || ""}`.trim();
    return name || shortId(p.id);
  };

  // ✅ Assignation (director seulement pour l’instant)
  const handleAssignOwner = async (connId, newOwnerId) => {
    if (!connId) return;
    if (!isDirector) {
      toast({
        title: "Non autorisé",
        description: "Seul le directeur peut assigner pour le moment.",
        variant: "destructive",
      });
      return;
    }

    const ownerUuid = newOwnerId === "none" ? null : newOwnerId;

    // optimistic
    setSavingConnId(connId);
    const prev = connections.find((x) => x._id === connId) || null;

    setConnections((prevList) =>
      prevList.map((x) => (x._id === connId ? { ...x, owner_id: ownerUuid, _owner_id: ownerUuid } : x))
    );

    try {
      // ta fonction SQL : public.assign_connection_owner(connection_id, owner_id)
      const { error: rpcErr } = await supabase.rpc("assign_connection_owner", {
        p_connection_id: connId,
        p_owner_id: ownerUuid,
      });
      if (rpcErr) throw rpcErr;

      // On recharge la ligne pour récupérer pro_team_leader_id recalculé
      const { data: refreshed, error: refErr } = await supabase
        .from("connections")
        .select("id, owner_id, pro_team_leader_id, pro_agency_id")
        .eq("id", connId)
        .maybeSingle();

      if (refErr) throw refErr;

      setConnections((prevList) =>
        prevList.map((x) => {
          if (x._id !== connId) return x;
          const next = {
            ...x,
            owner_id: refreshed?.owner_id ?? x.owner_id,
            pro_team_leader_id: refreshed?.pro_team_leader_id ?? x.pro_team_leader_id,
            pro_agency_id: refreshed?.pro_agency_id ?? x.pro_agency_id,
            _owner_id: refreshed?.owner_id ?? x._owner_id,
            _pro_team_leader_id: refreshed?.pro_team_leader_id ?? x._pro_team_leader_id,
            _pro_agency_id: refreshed?.pro_agency_id ?? x._pro_agency_id,
          };
          return next;
        })
      );

      toast({
        title: "Assignation enregistrée",
        description: ownerUuid ? "Contact assigné." : "Assignation retirée.",
      });
    } catch (e) {
      console.error(e);
      // rollback
      if (prev) {
        setConnections((prevList) => prevList.map((x) => (x._id === connId ? prev : x)));
      }
      toast({
        title: "Erreur assignation",
        description: e?.message || "Impossible d’assigner ce contact.",
        variant: "destructive",
      });
    } finally {
      setSavingConnId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Chargement des contacts…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-semibold text-gray-900">Accès refusé</h2>
        <p className="text-muted-foreground max-w-md">{error}</p>
        <Button onClick={() => fetchData()}>Réessayer</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      <AgencyTopNav />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Contacts</h1>
            {isDirector && (
              <Badge className="gap-1">
                <Building2 className="h-3.5 w-3.5" /> Directeur
              </Badge>
            )}
            {isTeamLeader && (
              <Badge variant="secondary" className="gap-1">
                <User className="h-3.5 w-3.5" /> Chef d’équipe
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            Liste des mises en relation (pro ↔ particulier aujourd’hui, pro ↔ pro ensuite).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fetchData()} className="gap-2">
            <Clock className="h-4 w-4" />
            Rafraîchir
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{kpis.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Actives</p>
            <p className="text-2xl font-bold">{kpis.active}</p>
            <p className="text-xs text-muted-foreground">(pending/accepté/en contact)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">En attente</p>
            <p className="text-2xl font-bold">{kpis.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pro ↔ Pro</p>
            <p className="text-2xl font-bold">{kpis.proPro}</p>
            <p className="text-xs text-muted-foreground">(prévu Option B)</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col gap-3">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher (id, nom agent, ville, message, statut)…"
                className="pl-9 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="w-full md:w-[200px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="accepted">Accepté</SelectItem>
                  <SelectItem value="approved">Accepté (approved)</SelectItem>
                  <SelectItem value="in_contact">En contact</SelectItem>
                  <SelectItem value="declined">Refusé</SelectItem>
                  <SelectItem value="rejected">Refusé (rejected)</SelectItem>
                  <SelectItem value="closed">Clos</SelectItem>
                  <SelectItem value="archived">Archivé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-[180px]">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Achat + Vente</SelectItem>
                  <SelectItem value="achat">Achat</SelectItem>
                  <SelectItem value="vente">Vente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-[220px]">
              <Select value={originFilter} onValueChange={setOriginFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Origine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes origines</SelectItem>
                  <SelectItem value="particulier">Particulier</SelectItem>
                  <SelectItem value="professionnel">Professionnel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ✅ Assignation filters (director) */}
          {isDirector && (
            <div className="flex flex-col md:flex-row gap-3 items-center">
              <div className="w-full md:w-[320px]">
                <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrer par assignation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous (assignés + non assignés)</SelectItem>
                    <SelectItem value={""}>Non assignés</SelectItem>
                    {(activeAssignablePeople || []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {formatPerson(p)} ({p.agency_role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-[11px] text-muted-foreground mt-1">
                  Astuce : “Non assignés” = owner_id NULL
                </div>
              </div>

              <div className="w-full md:w-[320px]">
                <Select value={teamLeaderScopeFilter} onValueChange={setTeamLeaderScopeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrer par équipe (scope)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les équipes</SelectItem>
                    <SelectItem value="unassigned">Sans team leader</SelectItem>
                    {(teamLeaderPeople || []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        Équipe {formatPerson(p)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
              <TableHead className="w-[170px]">Date</TableHead>
              <TableHead className="w-[140px]">Statut</TableHead>
              <TableHead className="w-[120px]">Type</TableHead>
              <TableHead className="w-[140px]">Origine</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Particulier</TableHead>
              <TableHead>Ville</TableHead>

              {/* ✅ Assigné à */}
              <TableHead className="w-[240px]">Assigné à</TableHead>

              <TableHead className="text-right w-[170px]">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredConnections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  Aucun contact ne correspond à vos filtres.
                </TableCell>
              </TableRow>
            ) : (
              filteredConnections.map((c) => {
                const type = computeProjectType(c);
                const origin = computeProjectOrigin(c);
                const connId = c._id;

                const agentLabel =
                  `${c._pro_first_name || ""} ${c._pro_last_name || ""}`.trim() ||
                  c._pro_email ||
                  (c._pro_id ? shortId(c._pro_id) : "—");

                const particulierLabel =
                  `${c._part_first_name || ""} ${c._part_last_name || ""}`.trim() ||
                  c._part_email ||
                  (c._particulier_id ? `Particulier ${shortId(c._particulier_id)}` : "—");

                const city = c._city || "—";

                const ownerPerson = c._owner_id ? peopleById.get(c._owner_id) : null;
                const ownerLabel = c._owner_id
                  ? formatPerson(ownerPerson) || shortId(c._owner_id)
                  : "Non assigné";

                const isSaving = savingConnId === connId;

                return (
                  <TableRow key={connId || c.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(c.created_at)}
                      <div className="text-[11px] text-muted-foreground">{shortId(connId)}</div>
                    </TableCell>

                    <TableCell>
                      <Badge variant={statusBadgeVariant(c.status)}>{prettifyStatus(c.status)}</Badge>
                    </TableCell>

                    <TableCell>
                      {type ? (
                        <Badge variant="outline">{type === "achat" ? "Achat" : "Vente"}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {origin ? (
                        <Badge variant="outline">{origin === "professionnel" ? "Pro" : "Particulier"}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="text-sm font-medium text-gray-900">{agentLabel}</div>
                      {c._pro_email ? <div className="text-xs text-muted-foreground">{c._pro_email}</div> : null}
                    </TableCell>

                    <TableCell>
                      <div className="text-sm text-gray-900">{particulierLabel}</div>
                      {c.first_message ? (
                        <div className="text-xs text-muted-foreground line-clamp-1">{c.first_message}</div>
                      ) : null}
                    </TableCell>

                    <TableCell className="text-sm">{city}</TableCell>

                    {/* ✅ Assigné à */}
                    <TableCell>
                      {isDirector ? (
                        <Select
                          value={c._owner_id || "none"}
                          onValueChange={(val) => handleAssignOwner(connId, val)}
                          disabled={!connId || isSaving}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Assigner…" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Non assigné</SelectItem>
                            {(activeAssignablePeople || []).map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {formatPerson(p)} ({p.agency_role})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="text-sm">
                          <div className="font-medium">{ownerLabel}</div>
                          {c._pro_team_leader_id ? (
                            <div className="text-xs text-muted-foreground">
                              Équipe: {formatPerson(peopleById.get(c._pro_team_leader_id)) || shortId(c._pro_team_leader_id)}
                            </div>
                          ) : null}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-2">
                        <Button asChild size="sm" variant="outline" className="gap-2" disabled={!connId}>
                          <Link to={connId ? `/chat/${connId}` : "#"}>
                            <MessageSquare className="h-4 w-4" />
                            Chat
                          </Link>
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-9 w-9 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={async () => {
                                if (!connId) return;
                                const ok = await copyToClipboard(connId);
                                toast({
                                  title: ok ? "Copié" : "Copie impossible",
                                  description: ok ? "ID de la connexion copié." : "Impossible de copier l’ID.",
                                  variant: ok ? "default" : "destructive",
                                });
                              }}
                              disabled={!connId}
                              className="gap-2"
                            >
                              <Copy className="h-4 w-4" />
                              Copier l’ID
                            </DropdownMenuItem>

                            {c._pro_email ? (
                              <DropdownMenuItem asChild>
                                <a href={`mailto:${c._pro_email}`}>Email agent</a>
                              </DropdownMenuItem>
                            ) : null}

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() => {
                                toast({
                                  title: "OK",
                                  description: "Assignation branchée via owner_id + pro_team_leader_id.",
                                });
                              }}
                            >
                              Infos
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {isTeamLeader && (
        <div className="text-xs text-muted-foreground">
          En tant que chef d’équipe, vous visualisez votre scope (pro_team_leader_id = vous) + vos propres contacts.
        </div>
      )}
    </div>
  );
}