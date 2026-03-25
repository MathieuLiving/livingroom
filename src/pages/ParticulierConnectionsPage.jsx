import React, { useEffect, useMemo, useState, lazy, Suspense, useCallback } from "react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "../../lib/customSupabaseClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Loader2,
  Users,
  MessageSquare,
  Phone,
  Mail,
  Paperclip,
  ShieldAlert,
  ExternalLink,
  Building2,
} from "lucide-react";
import ProjectVignette from "@/components/project/ProjectVignette";
import { resolveProAvatar } from "@/utils/assets";

const ChatPage = lazy(() => import("@/pages/ChatPage"));

const initials = (first, last) =>
  [first?.[0], last?.[0]].filter(Boolean).join("").toUpperCase() || "P";

const isFilled = (v) => v !== undefined && v !== null && String(v).trim() !== "";
const normUserType = (v) => String(v || "").trim().toLowerCase();

function isMissingRelationError(err) {
  const msg = String(err?.message || "").toLowerCase();
  return msg.includes("does not exist") || msg.includes("relation") || msg.includes("42p01");
}

const StatusBadge = (s) => {
  const v = (s || "").toLowerCase();
  if (v === "approved") return <Badge variant="secondary">Approuvée</Badge>;
  if (v === "pending") return <Badge variant="outline">En attente</Badge>;
  if (v === "rejected") return <Badge variant="destructive">Refusée</Badge>;
  if (v === "suspended") return <Badge variant="destructive">Suspendue</Badge>;
  return <Badge variant="secondary">{s || "N/A"}</Badge>;
};

const Cols = () => (
  <colgroup>
    <col style={{ width: "30%" }} />
    <col style={{ width: "32%" }} />
    <col style={{ width: "10%" }} />
    <col style={{ width: "20%" }} />
    <col style={{ width: "8%" }} />
  </colgroup>
);

const toInt = (x) => {
  const n = x == null ? null : Number(String(x).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n) : null;
};

const normTypeProjet = (v) => {
  const s = String(v || "").toLowerCase().trim();
  if (!s) return null;
  if (["vente", "vendre", "seller", "sale"].includes(s)) return "vente";
  if (["achat", "acheter", "buy", "purchase"].includes(s)) return "achat";
  if (["location", "louer", "rent"].includes(s)) return "location";
  return s;
};

const buildCvdUrl = (value) => {
  const v = String(value || "").trim();
  if (!v) return "";

  if (/^https?:\/\//i.test(v)) {
    try {
      const u = new URL(v);
      u.searchParams.set("cvd", "1");
      u.searchParams.set("entry", "external");
      return u.toString();
    } catch {
      const sep = v.includes("?") ? "&" : "?";
      return `${v}${sep}cvd=1&entry=external`;
    }
  }

  const path = v.startsWith("/cvd/") ? v : v.startsWith("/") ? v : `/cvd/${v}`;
  try {
    const u = new URL(
      path,
      typeof window !== "undefined" ? window.location.origin : "https://livingroom.immo"
    );
    u.searchParams.set("cvd", "1");
    u.searchParams.set("entry", "external");
    return `${u.pathname}${u.search}`;
  } catch {
    const sep = path.includes("?") ? "&" : "?";
    return `${path}${sep}cvd=1&entry=external`;
  }
};

const formatWebsiteUrl = (url) => {
  if (!url) return "";
  return String(url).replace(/^https?:\/\//, "").replace(/\/$/, "");
};

export default function ParticulierConnectionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const actorUserId = user?.id || null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);

  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [projectToView, setProjectToView] = useState(null);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const [decisionLoadingId, setDecisionLoadingId] = useState(null);
  const [suspendingId, setSuspendingId] = useState(null);

  const [userTypeByUserId, setUserTypeByUserId] = useState({});
  const [proByKey, setProByKey] = useState({});

  const fetchConnections = useCallback(async () => {
    if (!actorUserId) {
      setRows([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: e1 } = await supabase
        .from("connections_enriched_safe")
        .select("*")
        .or(`target_user_id.eq.${actorUserId},requesting_user_id.eq.${actorUserId}`)
        .order("created_at", { ascending: false });

      if (e1) throw e1;
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("[ParticulierConnectionsPage] load connections error:", e);
      setRows([]);
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [actorUserId]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!rows?.length || !actorUserId) {
        if (alive) setUserTypeByUserId({});
        return;
      }

      const ids = new Set();
      for (const r of rows) {
        const otherId = r.target_user_id === actorUserId ? r.requesting_user_id : r.target_user_id;
        if (otherId) ids.add(otherId);
      }

      const list = Array.from(ids);
      if (!list.length) {
        if (alive) setUserTypeByUserId({});
        return;
      }

      let res = await supabase.from("user_profiles").select("id, user_type").in("id", list);

      if (res?.error && isMissingRelationError(res.error)) {
        res = await supabase.from("profiles").select("id, role").in("id", list);
        if (res?.error) {
          console.error("[ParticulierConnectionsPage] profiles read error:", res.error);
          if (alive) setUserTypeByUserId({});
          return;
        }

        const map = {};
        for (const row of res.data || []) {
          if (!row?.id) continue;
          map[row.id] = normUserType(row.role);
        }
        if (alive) setUserTypeByUserId(map);
        return;
      }

      if (res?.error) {
        console.error("[ParticulierConnectionsPage] user_profiles read error:", res.error);
        if (alive) setUserTypeByUserId({});
        return;
      }

      const map = {};
      for (const row of res.data || []) {
        if (!row?.id) continue;
        map[row.id] = normUserType(row.user_type);
      }
      if (alive) setUserTypeByUserId(map);
    })();

    return () => {
      alive = false;
    };
  }, [rows, actorUserId]);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!rows?.length || !actorUserId) {
        if (alive) setProByKey({});
        return;
      }

      const otherUserIds = new Set();
      const proIds = new Set();

      for (const r of rows) {
        const isTarget = r.target_user_id === actorUserId;
        const otherUserId = isTarget ? r.requesting_user_id : r.target_user_id;
        if (otherUserId) otherUserIds.add(otherUserId);

        const otherProId = isTarget ? r.requesting_professionnel_id : r.target_professionnel_id;
        if (otherProId) proIds.add(otherProId);

        if (r.pro1_id) proIds.add(r.pro1_id);
        if (r.pro2_id) proIds.add(r.pro2_id);
        if (r.professionnal_id) proIds.add(r.professionnal_id);
        if (r.pro_id) proIds.add(r.pro_id);
      }

      const listUser = Array.from(otherUserIds);
      const listPro = Array.from(proIds);

      if (!listUser.length && !listPro.length) {
        if (alive) setProByKey({});
        return;
      }

      const selectCols = [
        "id",
        "user_id",
        "first_name",
        "last_name",
        "email",
        "company_name",
        "function",
        "digital_card_livingroom_url",
        "card_slug",
        "phone",
        "agency_website_url",
        "avatar_path",
        "avatar_url",
        "updated_at",
      ].join(",");

      try {
        let data1 = [];
        if (listUser.length) {
          const { data, error } = await supabase
            .from("professionnels")
            .select(selectCols)
            .in("user_id", listUser);
          if (error) throw error;
          data1 = data || [];
        }

        let data2 = [];
        if (listPro.length) {
          const { data, error } = await supabase
            .from("professionnels")
            .select(selectCols)
            .in("id", listPro);
          if (error) throw error;
          data2 = data || [];
        }

        const merged = [...data1, ...data2];
        const map = {};

        for (const p of merged) {
          if (!p?.id) continue;

          const avatarResolved = resolveProAvatar(p);
          const packed = {
            id: p.id,
            user_id: p.user_id || null,
            first_name: p.first_name || null,
            last_name: p.last_name || null,
            email: p.email || null,
            company_name: p.company_name || null,
            function: p.function || null,
            avatar_url: avatarResolved || "",
            cvd_url: buildCvdUrl(
              isFilled(p.digital_card_livingroom_url) ? p.digital_card_livingroom_url : p.card_slug
            ),
            phone: p.phone || null,
            agency_website_url: p.agency_website_url || null,
          };

          map[p.id] = packed;
          if (p.user_id) map[p.user_id] = packed;
        }

        if (alive) setProByKey(map);
      } catch (e) {
        console.error("[ParticulierConnectionsPage] professionnels read error:", e);
        if (alive) setProByKey({});
      }
    })();

    return () => {
      alive = false;
    };
  }, [rows, actorUserId]);

  const handleConnectionDecision = async (id, newStatus) => {
    if (!id || !["approved", "rejected"].includes(newStatus) || !user?.id) return;

    setDecisionLoadingId(id);
    try {
      const { data, error: e1 } = await supabase
        .from("connections")
        .update({ status: newStatus })
        .eq("id", id)
        .eq("target_user_id", user.id)
        .select("id, status")
        .maybeSingle();

      if (e1) throw e1;

      if (!data) {
        throw new Error("Aucune ligne mise à jour.");
      }

      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: data.status } : r)));

      toast({
        title: newStatus === "approved" ? "Mise en relation acceptée" : "Mise en relation refusée",
      });
    } catch (e) {
      console.error("[handleConnectionDecision] update error:", e);
      toast({
        variant: "destructive",
        title: "Erreur lors de la mise à jour",
        description: "La mise en relation n'a pas pu être mise à jour.",
      });
    } finally {
      setDecisionLoadingId(null);
    }
  };

  const handleSuspendConnection = async (id) => {
    if (!id || !user?.id) return;

    const currentRow = rows.find((r) => r.id === id);
    if (!currentRow) {
      toast({
        variant: "destructive",
        title: "Connexion introuvable",
      });
      return;
    }

    const isTarget = currentRow.target_user_id === user.id;
    const ownershipColumn = isTarget ? "target_user_id" : "requesting_user_id";

    setSuspendingId(id);
    try {
      const { data, error: e1 } = await supabase
        .from("connections")
        .update({ status: "suspended" })
        .eq("id", id)
        .eq(ownershipColumn, user.id)
        .select("id, status")
        .maybeSingle();

      if (e1) throw e1;

      if (!data) {
        throw new Error("Aucune ligne mise à jour.");
      }

      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: data.status } : r)));

      toast({
        title: "Mise en relation suspendue",
        description: "Vous ne recevrez plus de messages via cette mise en relation.",
      });

      setIsChatOpen(false);
      setActiveId(null);
    } catch (e) {
      console.error("[handleSuspendConnection] update error:", e);
      toast({
        variant: "destructive",
        title: "Erreur lors de la suspension",
        description: "Impossible de suspendre la mise en relation pour le moment.",
      });
    } finally {
      setSuspendingId(null);
    }
  };

  const normalized = useMemo(() => {
    if (!actorUserId) return [];

    return (rows || []).map((r) => {
      const isTarget = r.target_user_id === actorUserId;
      const status = (r.status || "pending").toLowerCase();

      const otherUserId = isTarget ? r.requesting_user_id : r.target_user_id;
      const otherProIdFromView = isTarget ? r.requesting_professionnel_id : r.target_professionnel_id;

      const proRow =
        (otherUserId && proByKey[otherUserId]) ||
        (otherProIdFromView && proByKey[otherProIdFromView]) ||
        null;

      const resolvedUserType =
        (otherUserId && userTypeByUserId[otherUserId]) ||
        normUserType(isTarget ? r.requesting_role : r.target_role) ||
        (proRow ? "professionnel" : null) ||
        "unknown";

      const isProfessional = resolvedUserType === "professionnel" || Boolean(proRow);

      const baseShowContacts = status === "approved";
      const showContacts = isTarget && isProfessional ? true : baseShowContacts;

      const baseFirstName = isTarget ? r.requesting_first_name : r.target_first_name;
      const baseLastName = isTarget ? r.requesting_last_name : r.target_last_name;
      const baseEmail = isTarget ? r.requesting_email : r.target_email;
      const basePhone = isTarget ? r.requesting_phone : r.target_phone;
      const baseCompany = isTarget ? r.requesting_company : r.target_company;

      const otherProId = proRow?.id || otherProIdFromView || null;

      const other = {
        user_id: otherUserId || null,
        role: resolvedUserType,
        isProfessional,
        first_name: proRow?.first_name ?? baseFirstName ?? null,
        last_name: proRow?.last_name ?? baseLastName ?? null,
        company_name: baseCompany || proRow?.company_name || null,
        function: proRow?.function || null,
        avatar_url: proRow?.avatar_url || "",
        cvd_url: proRow?.cvd_url || "",
        showContacts,
        email: proRow?.email || (showContacts ? baseEmail : null),
        phone: proRow?.phone || (showContacts ? basePhone : null),
        agency_website_url: proRow?.agency_website_url || null,
        proId: otherProId,
      };

      const project = {
        title: r.ui_title || "Projet",
        description: r.ui_description || null,
        type_projet: normTypeProjet(r.ui_type_projet),
        property_type: r.ui_property_type || null,
        prix_demande: r.ui_prix_demande || null,
        budget_max: r.ui_budget_max ?? r.ui_budget ?? null,
        surface: r.ui_surface || null,
        bedrooms: toInt(r.ui_bedrooms ?? r.ui_rooms),
        location_label: [r.ui_location, r.ui_quartier].filter(Boolean).join(" — ") || null,
        image_1_url: r.ui_image_1_url || null,
        image_2_url: r.ui_image_2_url || null,
        image_3_url: r.ui_image_3_url || null,
      };

      return {
        id: r.id,
        status,
        isTarget,
        date: r.created_at,
        first_message: r.first_message,
        other,
        project,
      };
    });
  }, [rows, actorUserId, userTypeByUserId, proByKey]);

  const received = useMemo(() => normalized.filter((n) => n.isTarget), [normalized]);
  const sent = useMemo(() => normalized.filter((n) => !n.isTarget), [normalized]);
  const activeConnection = useMemo(
    () => normalized.find((n) => n.id === activeId) || null,
    [normalized, activeId]
  );

  const InterlocuteurCell = ({ row }) => {
    const isPro = row.other.isProfessional;
    const isSuspended = row.status === "suspended";

    if (isPro) {
      const displayName =
        `${row.other.first_name || ""} ${row.other.last_name || ""}`.trim() || "Professionnel";
      const company = row.other.company_name;
      const avatar = row.other.avatar_url || "";
      const cvdUrl = row.other.cvd_url || "";

      return (
        <div
          className={`relative flex flex-col gap-3 p-4 border rounded-lg transition-all shadow-sm hover:shadow-md ${
            isSuspended ? "bg-gray-100 opacity-80" : "bg-gradient-to-br from-white to-gray-50/50"
          }`}
        >
          {isSuspended && <div className="absolute inset-0 bg-white/40 z-10 rounded-lg pointer-events-none" />}

          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11 border shadow-sm">
              <AvatarImage
                src={isFilled(avatar) ? avatar : undefined}
                alt={displayName}
                onError={(e) => {
                  e.currentTarget.src = "";
                }}
              />
              <AvatarFallback>{initials(row.other.first_name, row.other.last_name)}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              {isFilled(cvdUrl) ? (
                <a
                  href={cvdUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="font-semibold text-sm truncate text-blue-600 hover:text-blue-700 hover:underline transition-colors block"
                  title="Voir le profil"
                >
                  {displayName}
                </a>
              ) : (
                <p className="font-semibold text-sm truncate text-gray-900">{displayName}</p>
              )}

              {(company || row.other.function) && (
                <p className="text-xs text-muted-foreground truncate">
                  {company || "Société"}
                  {row.other.function ? ` — ${row.other.function}` : ""}
                </p>
              )}
            </div>

            {isFilled(cvdUrl) && (
              <Button
                size="icon"
                variant="ghost"
                asChild
                className="h-8 w-8 shrink-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                title="Voir la carte de visite digitale"
              >
                <a href={cvdUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>

          {row.other.showContacts && (
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-xs font-semibold text-gray-700">Informations de contact</span>
              </div>

              <div className="space-y-2 pl-1">
                {row.other.company_name && (
                  <div className="flex items-start gap-2 text-xs">
                    <span className="text-gray-500 shrink-0 min-w-[60px]">Agence:</span>
                    <span className="font-medium text-gray-900">{row.other.company_name}</span>
                  </div>
                )}

                {row.other.phone && (
                  <div className="flex items-center gap-2 text-xs">
                    <Phone className="h-3 w-3 text-gray-500 shrink-0" />
                    <a
                      href={`tel:${row.other.phone}`}
                      className="hover:underline hover:text-blue-600 font-medium transition-colors"
                    >
                      {row.other.phone}
                    </a>
                  </div>
                )}

                {row.other.email && (
                  <div className="flex items-center gap-2 text-xs">
                    <Mail className="h-3 w-3 text-gray-500 shrink-0" />
                    <a
                      href={`mailto:${row.other.email}`}
                      className="hover:underline hover:text-blue-600 font-medium truncate transition-colors"
                    >
                      {row.other.email}
                    </a>
                  </div>
                )}

                {row.other.agency_website_url && (
                  <div className="flex items-center gap-2 text-xs">
                    <ExternalLink className="h-3 w-3 text-gray-500 shrink-0" />
                    <a
                      href={row.other.agency_website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline hover:text-blue-600 font-medium truncate transition-colors"
                    >
                      {formatWebsiteUrl(row.other.agency_website_url)}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    const displayName =
      row.other.first_name || row.other.last_name
        ? `${row.other.first_name || ""} ${row.other.last_name || ""}`.trim()
        : "Particulier";

    return (
      <div className="flex flex-col gap-3 p-3 border rounded-lg bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border">
            <AvatarFallback className="bg-slate-100 text-slate-500">
              {initials(row.other.first_name, row.other.last_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-sm">{displayName}</div>
            <div className="text-xs text-muted-foreground">Particulier</div>
          </div>
        </div>

        {row.other.showContacts && (row.other.email || row.other.phone) && (
          <div className="text-xs text-muted-foreground space-y-2 pl-1 pt-2 border-t border-gray-100">
            {row.other.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3 text-gray-500" />
                <a href={`tel:${row.other.phone}`} className="hover:underline hover:text-blue-600 font-medium">
                  {row.other.phone}
                </a>
              </div>
            )}
            {row.other.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3 text-gray-500" />
                <a
                  href={`mailto:${row.other.email}`}
                  className="hover:underline hover:text-blue-600 font-medium truncate"
                >
                  {row.other.email}
                </a>
              </div>
            )}
          </div>
        )}

        {!row.other.showContacts && (
          <div className="text-[11px] italic text-muted-foreground pt-2 border-t border-gray-100">
            Coordonnées masquées en attente d&apos;approbation.
          </div>
        )}
      </div>
    );
  };

  const ProjectCell = ({ row }) => (
    <div className="space-y-3">
      <button
        className="text-brand-blue hover:underline flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-brand-blue/80"
        onClick={() => {
          setProjectToView(row.project);
          setIsProjectOpen(true);
        }}
      >
        <Paperclip className="h-3.5 w-3.5" /> Voir le projet complet
      </button>
      <ProjectVignette project={row.project} />
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (!actorUserId) {
    return (
      <div className="text-center text-muted-foreground py-10">
        Connexion requise pour voir vos mises en relation.
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 py-10">Erreur de chargement des données.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Users className="inline-block mr-2" />
          Mes mises en relation
        </CardTitle>
        <CardDescription>Suivez vos demandes reçues et envoyées.</CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="received">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="received">Reçues ({received.length})</TabsTrigger>
            <TabsTrigger value="sent">Envoyées ({sent.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="mt-4">
            <div className="overflow-x-auto">
              {received.length ? (
                <Table className="table-fixed w-full border rounded-md overflow-hidden">
                  <Cols />
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="border-r pl-4">Interlocuteur</TableHead>
                      <TableHead className="border-r pl-4">Projet</TableHead>
                      <TableHead className="text-center border-r">Date</TableHead>
                      <TableHead className="text-center border-r">Actions</TableHead>
                      <TableHead className="text-right pr-4">Statut</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {received.map((row) => (
                      <TableRow key={row.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="border-r align-top p-4">
                          <InterlocuteurCell row={row} />
                        </TableCell>

                        <TableCell className="border-r align-top p-4">
                          <ProjectCell row={row} />
                        </TableCell>

                        <TableCell className="border-r text-center align-top whitespace-nowrap pt-4 text-sm text-muted-foreground">
                          {row.date ? new Date(row.date).toLocaleDateString("fr-FR") : "—"}
                        </TableCell>

                        <TableCell className="border-r text-center align-top pt-4">
                          <div className="flex flex-col items-center gap-3">
                            {row.status !== "suspended" && row.status !== "rejected" && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setActiveId(row.id);
                                  setIsChatOpen(true);
                                }}
                                className="w-full max-w-[140px]"
                              >
                                <MessageSquare className="h-4 w-4 mr-1.5" />
                                Discuter
                              </Button>
                            )}

                            {row.status === "pending" && (
                              <div className="flex flex-wrap gap-2 justify-center w-full">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={decisionLoadingId === row.id}
                                  onClick={() => handleConnectionDecision(row.id, "rejected")}
                                  className="flex-1 min-w-[100px]"
                                >
                                  {decisionLoadingId === row.id && (
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                  )}
                                  Refuser
                                </Button>

                                <Button
                                  size="sm"
                                  disabled={decisionLoadingId === row.id}
                                  onClick={() => handleConnectionDecision(row.id, "approved")}
                                  className="flex-1 min-w-[100px]"
                                >
                                  {decisionLoadingId === row.id && (
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                  )}
                                  Accepter
                                </Button>
                              </div>
                            )}

                            {row.status === "approved" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 flex items-center gap-1.5 w-full max-w-[140px]"
                                onClick={() => handleSuspendConnection(row.id)}
                                disabled={suspendingId === row.id}
                              >
                                {suspendingId === row.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <ShieldAlert className="h-3 w-3" />
                                )}
                                <span>Suspendre</span>
                              </Button>
                            )}

                            {row.status === "suspended" && (
                              <span className="text-xs text-red-700 font-medium px-2 py-1 bg-red-50 rounded">
                                Mise en relation suspendue
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-right align-top pt-4 pr-4">
                          {StatusBadge(row.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">Aucune demande reçue.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="sent" className="mt-4">
            <div className="overflow-x-auto">
              {sent.length ? (
                <Table className="table-fixed w-full border rounded-md overflow-hidden">
                  <Cols />
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="border-r pl-4">Interlocuteur</TableHead>
                      <TableHead className="border-r pl-4">Projet</TableHead>
                      <TableHead className="text-center border-r">Date</TableHead>
                      <TableHead className="text-center border-r">Actions</TableHead>
                      <TableHead className="text-right pr-4">Statut</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {sent.map((row) => (
                      <TableRow key={row.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="border-r align-top p-4">
                          <InterlocuteurCell row={row} />
                        </TableCell>

                        <TableCell className="border-r align-top p-4">
                          <ProjectCell row={row} />
                        </TableCell>

                        <TableCell className="border-r text-center align-top whitespace-nowrap pt-4 text-sm text-muted-foreground">
                          {row.date ? new Date(row.date).toLocaleDateString("fr-FR") : "—"}
                        </TableCell>

                        <TableCell className="border-r text-center align-top pt-4">
                          <div className="flex flex-col items-center gap-3">
                            {row.status !== "suspended" && row.status !== "rejected" && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setActiveId(row.id);
                                  setIsChatOpen(true);
                                }}
                                className="w-full max-w-[140px]"
                              >
                                <MessageSquare className="h-4 w-4 mr-1.5" />
                                Voir
                              </Button>
                            )}

                            {row.status === "approved" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 flex items-center gap-1.5 w-full max-w-[140px]"
                                onClick={() => handleSuspendConnection(row.id)}
                                disabled={suspendingId === row.id}
                              >
                                {suspendingId === row.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <ShieldAlert className="h-3 w-3" />
                                )}
                                <span>Suspendre</span>
                              </Button>
                            )}

                            {row.status === "suspended" && (
                              <span className="text-xs text-red-700 font-medium px-2 py-1 bg-red-50 rounded">
                                Mise en relation suspendue
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-right align-top pt-4 pr-4">
                          {StatusBadge(row.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">Aucune demande envoyée.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Dialog
          open={isChatOpen}
          onOpenChange={(open) => {
            setIsChatOpen(open);
            if (!open) setActiveId(null);
          }}
        >
          <DialogContent className="max-w-4xl h-[85vh] p-0">
            {activeConnection && (
              <div className="flex flex-col h-full">
                <div className="border-b px-4 py-3 bg-muted/40 text-sm space-y-2">
                  {activeConnection.first_message && (
                    <>
                      <div className="font-medium">
                        {activeConnection.isTarget
                          ? "Message d'introduction"
                          : "Votre demande initiale"}
                      </div>
                      <p className="whitespace-pre-wrap text-muted-foreground">
                        {activeConnection.first_message}
                      </p>
                    </>
                  )}

                  {activeConnection.isTarget && activeConnection.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={decisionLoadingId === activeConnection.id}
                        onClick={() => handleConnectionDecision(activeConnection.id, "approved")}
                      >
                        Accepter la mise en relation
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={decisionLoadingId === activeConnection.id}
                        onClick={() => handleConnectionDecision(activeConnection.id, "rejected")}
                      >
                        Refuser la mise en relation
                      </Button>
                    </div>
                  )}
                </div>

                {activeConnection.status === "suspended" ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
                    <ShieldAlert className="h-10 w-10 text-red-500" />
                    <p className="font-semibold text-gray-800">Mise en relation suspendue</p>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Vous avez suspendu cette mise en relation pour votre sécurité.
                      Aucun nouvel échange n&apos;est possible via cette conversation.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 min-h-0">
                    <Suspense
                      fallback={
                        <div className="flex h-full items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
                        </div>
                      }
                    >
                      <ChatPage
                        connectionId={activeConnection.id}
                        isModal
                        managedByParentUI
                        closeModal={() => setIsChatOpen(false)}
                        onConnectionUpdate={fetchConnections}
                      />
                    </Suspense>
                  </div>
                )}

                {activeConnection.status === "approved" && (
                  <div className="border-t px-4 py-2 flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 flex items-center gap-1.5"
                      onClick={() => handleSuspendConnection(activeConnection.id)}
                      disabled={suspendingId === activeConnection.id}
                    >
                      {suspendingId === activeConnection.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <ShieldAlert className="h-3 w-3" />
                      )}
                      <span>Suspendre la mise en relation</span>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog
          open={isProjectOpen}
          onOpenChange={(open) => {
            setIsProjectOpen(open);
            if (!open) setProjectToView(null);
          }}
        >
          <DialogContent className="max-w-3xl">
            {projectToView && (
              <div className="space-y-5">
                <h2 className="text-xl font-semibold">Détails du projet</h2>

                <div className="flex flex-wrap gap-2">
                  {projectToView.type_projet && (
                    <Badge variant="secondary">{projectToView.type_projet}</Badge>
                  )}
                  {projectToView.property_type && (
                    <Badge variant="secondary">{projectToView.property_type}</Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    {projectToView.prix_demande ? (
                      <p>
                        <strong>Prix demandé :</strong>{" "}
                        {Number(projectToView.prix_demande).toLocaleString()} €
                      </p>
                    ) : projectToView.budget_max ? (
                      <p>
                        <strong>Budget :</strong>{" "}
                        {Number(projectToView.budget_max).toLocaleString()} €
                      </p>
                    ) : null}
                  </div>

                  <div>
                    {projectToView.surface && (
                      <p>
                        <strong>Surface :</strong> {projectToView.surface} m²
                      </p>
                    )}
                    {projectToView.bedrooms != null && (
                      <p>
                        <strong>Chambres :</strong> {projectToView.bedrooms}
                      </p>
                    )}
                  </div>
                </div>

                {projectToView.location_label && (
                  <p>
                    <strong>Localisation :</strong> {projectToView.location_label}
                  </p>
                )}

                {projectToView.description && (
                  <div>
                    <strong>Description :</strong>
                    <p className="mt-1 text-muted-foreground">{projectToView.description}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}