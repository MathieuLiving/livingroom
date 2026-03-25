// src/pages/ProfessionnelDirectLeadsPage.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import SEO from "@/components/SEO";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/lib/customSupabaseClient";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  MapPin,
  CalendarDays,
  Home,
  Euro,
  Expand,
  Bed,
  Phone,
  Mail,
  Filter,
  ArrowLeft,
  Clock,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

/* ========================= Helpers ========================= */
const isFilled = (v) => v !== undefined && v !== null && String(v).trim() !== "";

function formatPrice(v) {
  if (v == null || v === "") return null;
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(Number(v));
  } catch {
    return `${v} €`;
  }
}

function formatSurface(v) {
  if (v == null || v === "") return null;
  return `${v} m²`;
}

function plural(n, one, many) {
  if (n == null) return null;
  return `${n} ${Number(n) > 1 ? many : one}`;
}

function formatDate(d) {
  if (!d) return "Date inconnue";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// NB: la vue expose: city, city_choice_1..3 (pas de prénom/nom ici)
function extractLocationsFromViewRow(lead) {
  const list = [];
  const c0 = lead?.city || null;

  if (c0) list.push({ city: c0, quartier: null });

  for (let i = 1; i <= 3; i++) {
    const c = lead?.[`city_choice_${i}`] || null;
    if (
      c &&
      !list.some((x) => (x.city || "").toLowerCase() === String(c).toLowerCase())
    ) {
      list.push({ city: c, quartier: null });
    }
  }

  return list;
}

function mapLeadFromView(lead, contact = {}) {
  const type_projet = (lead?.type_projet || "achat").toLowerCase();
  const isVente = type_projet === "vente";
  const type_bien = lead?.type_bien || "Type Non Précisé";
  const title = lead?.title || `${isVente ? "Vente" : "Achat"} ${type_bien}`.trim();

  const montant =
    lead?.budget_or_price ??
    (isVente ? lead?.prix_demande ?? null : lead?.budget_max ?? null);

  const surface = isVente
    ? lead?.surface ?? null
    : lead?.surface_max ?? lead?.surface_min ?? null;

  return {
    id: lead?.id,
    title,
    type_projet,
    type_bien,
    delai: lead?.delai || "N/A",
    description: lead?.description || "",
    prix_demande: montant,
    surface,
    bedrooms: lead?.bedrooms_min ?? null,
    created_at: lead?.created_at,
    contact: {
      first_name: contact.first_name || "",
      last_name: contact.last_name || "",
      email: contact.email || null,
      phone: contact.phone || null,
      received_at: lead?.created_at || null,
    },
    locations: extractLocationsFromViewRow(lead),
    meta: {
      email_status: lead?.email_status || null,
      email_sent_at: lead?.email_sent_at || null,
      is_unclaimed: !!lead?.is_unclaimed,
    },
  };
}

function LeadContactInline({ contact }) {
  if (!contact) return null;

  const fullName =
    [contact.first_name, contact.last_name].filter(Boolean).join(" ") || "—";

  return (
    <div className="border-t mt-6 pt-4">
      <div className="text-sm font-medium text-gray-900">{fullName}</div>
      <div className="mt-2 flex flex-col gap-1 text-sm">
        {contact.phone && (
          <a
            href={`tel:${contact.phone}`}
            className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900"
          >
            <Phone className="h-4 w-4" />
            <span className="truncate">{contact.phone}</span>
          </a>
        )}
        {contact.email && (
          <a
            href={`mailto:${contact.email}`}
            className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 break-all"
          >
            <Mail className="h-4 w-4" />
            <span className="truncate">{contact.email}</span>
          </a>
        )}
      </div>
    </div>
  );
}

function LocationsList({ locations }) {
  if (!locations || locations.length === 0) return null;

  return (
    <div className="mt-4">
      <div className="text-sm font-medium text-gray-900">Localisations</div>
      <ul className="mt-2 space-y-1">
        {locations.map((loc, idx) => (
          <li key={idx} className="flex items-start gap-2 text-gray-800">
            <MapPin className="h-4 w-4 mt-0.5 text-orange-500" />
            <span className="truncate">{loc.city || "—"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LeadCard({ data }) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 ease-in-out">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-semibold text-brand-blue">
            {data.title}
          </CardTitle>
          <div className="text-xs text-gray-500 flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full border">
            <Clock className="h-3 w-3" />
            {formatDate(data.created_at)}
          </div>
        </div>

        <CardDescription className="flex items-center gap-2 text-sm text-gray-600 mt-1">
          <Home className="h-4 w-4" />
          {data.type_bien} ({data.type_projet})
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {data.prix_demande && (
            <div className="flex items-center gap-2 text-gray-800">
              <Euro className="h-4 w-4" />
              <span className="font-medium">
                {data.type_projet === "vente" ? "Prix" : "Budget"}:
              </span>{" "}
              {formatPrice(data.prix_demande)}
            </div>
          )}

          {data.surface && (
            <div className="flex items-center gap-2 text-gray-800">
              <Expand className="h-4 w-4" />
              <span className="font-medium">Surface:</span>{" "}
              {formatSurface(data.surface)}
            </div>
          )}

          {data.bedrooms && (
            <div className="flex items-center gap-2 text-gray-800">
              <Bed className="h-4 w-4" />
              <span className="font-medium">Chambres:</span>{" "}
              {plural(data.bedrooms, "chambre", "chambres")}
            </div>
          )}

          {data.delai && (
            <div className="flex items-center gap-2 text-gray-800">
              <CalendarDays className="h-4 w-4" />
              <span className="font-medium">Délai:</span> {data.delai}
            </div>
          )}

          {data.description && (
            <p className="text-sm text-gray-700 mt-4 line-clamp-3 bg-slate-50 p-3 rounded-md border border-slate-100">
              "{data.description}"
            </p>
          )}
        </div>

        <LocationsList locations={data.locations} />
        <LeadContactInline contact={data.contact} />
      </CardContent>
    </Card>
  );
}

const LeadsList = ({ leads, loading, filters, setFilters }) => {
  const { q, period, city } = filters;
  const { setQ, setPeriod, setCity } = setFilters;

  const cityOptions = useMemo(() => {
    const cities = new Set();

    for (const ld of leads || []) {
      if (ld?.locations?.length) {
        ld.locations.forEach((l) => {
          if (l.city) cities.add(String(l.city).trim());
        });
      }
    }

    return Array.from(cities).sort((a, b) => a.localeCompare(b));
  }, [leads]);

  return (
    <>
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:items-end">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Recherche</label>
            <div className="flex gap-2">
              <Input
                placeholder="Mots-clés (titre, description, ville...)"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <Button variant="outline" onClick={() => setQ("")}>
                <Filter className="w-4 h-4 mr-2" />
                Effacer
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Période</label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 derniers jours</SelectItem>
                <SelectItem value="30d">30 derniers jours</SelectItem>
                <SelectItem value="all">Tout</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ville</label>
            <Select
              value={city || "all"}
              onValueChange={(v) => setCity(v === "all" ? "" : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Toutes les villes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {cityOptions.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-brand-blue" />
        </div>
      ) : leads.length === 0 ? (
        <Card className="p-6 text-center text-gray-600">
          Aucun lead ne correspond à vos filtres.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {leads.map((card) => (
            <LeadCard key={card.id} data={card} />
          ))}
        </div>
      )}
    </>
  );
};

/* ========================= Navigation helpers ========================= */
const isCardUrl = (u) => {
  if (typeof u !== "string") return false;
  const s = u.trim();
  if (!s) return false;

  return (
    s.includes("/cvd") ||
    s.includes("/carte-visite-digitale") ||
    s.includes("/livingroom") ||
    s.includes("/StandaloneDigitalBusinessCard")
  );
};

const toAbs = (raw) => {
  if (typeof raw !== "string") return "";
  const v0 = raw.trim();
  if (!v0) return "";
  if (/^https?:\/\//i.test(v0)) return v0;

  const v = v0.startsWith("/") ? v0 : `/${v0}`;
  return `${window.location.origin}${v}`;
};

const getQP = (search, key) => {
  try {
    return new URLSearchParams(search || "").get(key);
  } catch {
    return null;
  }
};

/* ========================= Page ========================= */
const ProfessionnelDirectLeadsPage = () => {
  const {
    user,
    profile,
    pro,
    proId,
    loading: authLoading,
  } = useAuth() || {};

  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const navState = location.state || {};
  const rawReturnTo = navState.returnTo || navState.from;
  const returnTo = typeof rawReturnTo === "string" ? rawReturnTo.trim() : "";

  const entryQP = getQP(location.search, "entry");
  const cvdQP = getQP(location.search, "cvd");

  const fromDigitalCard = useMemo(() => {
    const flag =
      Boolean(navState.fromDigitalCard) ||
      cvdQP === "1" ||
      entryQP === "external";

    const hasCardReturn = isCardUrl(returnTo);
    return flag || hasCardReturn;
  }, [navState.fromDigitalCard, cvdQP, entryQP, returnTo]);

  const [loadingLeads, setLoadingLeads] = useState(true);
  const [leads, setLeads] = useState([]);

  // Filtres
  const [q, setQ] = useState("");
  const [period, setPeriod] = useState("30d");
  const [city, setCity] = useState("");

  /* --------- Protection d’accès --------- */
  useEffect(() => {
    if (authLoading) return;

    if (!user || !profile || profile.role !== "professionnel") {
      toast({
        variant: "destructive",
        title: "Accès réservé",
        description: "Cette page est réservée aux professionnels connectés.",
      });
      navigate("/pro-de-limmo", { replace: true });
    }
  }, [authLoading, user, profile, navigate, toast]);

  /* --------- Fetch des leads via la VUE + coordonnées via direct_leads --------- */
  const fetchLeads = useCallback(
    async (professionnelId) => {
      if (!professionnelId) {
        setLeads([]);
        setLoadingLeads(false);
        return;
      }

      setLoadingLeads(true);

      try {
        const { data: rows, error } = await supabase
          .from("v_my_direct_leads")
          .select(`
            id, created_at, title, type_projet, type_bien,
            budget_or_price, budget_max, prix_demande,
            surface, surface_min, surface_max, bedrooms_min,
            delai, description,
            city, city_choice_1, city_choice_2, city_choice_3,
            email_status, email_sent_at, particulier_id, is_unclaimed, pro_id
          `)
          .eq("pro_id", professionnelId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        let contactsById = {};

        if (rows && rows.length > 0) {
          const ids = rows.map((r) => r.id).filter(Boolean);

          const { data: dlRows, error: dlErr } = await supabase
            .from("direct_leads")
            .select("id, first_name, last_name, email, phone")
            .in("id", ids);

          if (dlErr) {
            console.warn("[DirectLeads] contacts fetch error:", dlErr);
          } else {
            contactsById = (dlRows || []).reduce((acc, r) => {
              acc[r.id] = {
                first_name: r.first_name,
                last_name: r.last_name,
                email: r.email,
                phone: r.phone,
              };
              return acc;
            }, {});
          }
        }

        setLeads(
          (rows || []).map((r) => mapLeadFromView(r, contactsById[r.id] || {}))
        );
      } catch (e) {
        console.error("[DirectLeads] fetch leads error:", e);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger vos leads directs.",
        });
        setLeads([]);
      } finally {
        setLoadingLeads(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (!authLoading && proId) {
      fetchLeads(proId);
      return;
    }

    if (!authLoading && pro?.id) {
      fetchLeads(pro.id);
      return;
    }

    if (!authLoading) {
      setLeads([]);
      setLoadingLeads(false);
    }
  }, [authLoading, proId, pro?.id, fetchLeads]);

  /* --------- Filtres / dérivés --------- */
  const now = useMemo(() => new Date(), []);

  const filteredLeads = useMemo(() => {
    const qLower = q.trim().toLowerCase();

    const dateFrom = (() => {
      if (period === "7d") {
        const d = new Date(now);
        d.setDate(d.getDate() - 7);
        return d;
      }

      if (period === "30d") {
        const d = new Date(now);
        d.setDate(d.getDate() - 30);
        return d;
      }

      return null;
    })();

    return (leads || []).filter((c) => {
      if (dateFrom && c?.contact?.received_at) {
        const created = new Date(c.contact.received_at);
        if (!(created >= dateFrom)) return false;
      }

      if (city) {
        const inCities = (c.locations || []).some(
          (loc) => (loc.city || "").toLowerCase() === city.toLowerCase()
        );
        if (!inCities) return false;
      }

      if (qLower) {
        const hay = [
          c.title,
          c.description,
          c.type_bien,
          ...(c.locations || []).map((l) => l.city),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!hay.includes(qLower)) return false;
      }

      return true;
    });
  }, [leads, q, period, city, now]);

  /* --------- Retour : carte autonome OU partenaires --------- */
  const handleBack = useCallback(async () => {
    if (fromDigitalCard) {
      if (isCardUrl(returnTo)) {
        window.location.assign(toAbs(returnTo));
        return;
      }

      const resolvedProId = navState.proId || proId || pro?.id;

      if (isFilled(resolvedProId)) {
        try {
          const { data, error } = await supabase
            .from("professionnels")
            .select("digital_card_livingroom_url")
            .eq("id", resolvedProId)
            .maybeSingle();

          if (!error && isFilled(data?.digital_card_livingroom_url)) {
            window.location.assign(toAbs(data.digital_card_livingroom_url));
            return;
          }
        } catch (e) {
          console.warn("[DirectLeads] back fetch card url failed:", e);
        }
      }

      navigate(-1);
      return;
    }

    navigate("/nos-professionnels-partenaires");
  }, [fromDigitalCard, returnTo, navState.proId, proId, pro?.id, navigate]);

  const backLabel = useMemo(() => {
    if (fromDigitalCard) return "Retour à la carte";
    return "Retour aux professionnels";
  }, [fromDigitalCard]);

  /* ========================= Rendu ========================= */
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <SEO
        title="Leads captés directement"
        description="Vos leads reçus via votre carte de visite digitale."
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-blue">
            Leads captés directement
          </h1>
          <p className="text-gray-600 mt-1">
            Récapitulatif des demandes reçues via votre carte de visite digitale.
          </p>
        </div>

        <Button
          variant="ghost"
          onClick={handleBack}
          className="self-start md:self-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {backLabel}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:col-span-1 col-span-full">
        <LeadsList
          leads={filteredLeads}
          loading={loadingLeads}
          filters={{ q, period, city }}
          setFilters={{ setQ, setPeriod, setCity }}
        />
      </div>
    </div>
  );
};

export default ProfessionnelDirectLeadsPage;