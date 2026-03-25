import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/lib/customSupabaseClient";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Search, Users, AlertCircle } from "lucide-react";
import ProfessionnelPartnerCard from "@/components/pro/ProfessionnelPartnerCard";
import SEO from "@/components/SEO";
import { withCacheBuster } from "@/utils/proHelpers";
import { getPublicCvdUrl, getPremiumPublicCardUrl } from "@/utils/cvdHelpers";

const BUCKET_PUBLIC_AVATARS = "public-avatars";
const BUCKET_PUBLIC_LOGOS = "public-logos";

const pickFirstUrl = (...vals) => {
  for (const v of vals) {
    const u = String(v || "").trim();
    if (u) return u;
  }
  return "";
};

const isHttpUrl = (value) => /^https?:\/\//i.test(String(value || "").trim());
const normalizeText = (v) => String(v || "").trim();

const getStoragePublicUrl = (bucket, path) => {
  const cleanPath = String(path || "").trim().replace(/^\/+/, "");
  if (!bucket || !cleanPath) return null;
  const { data } = supabase.storage.from(bucket).getPublicUrl(cleanPath);
  return data?.publicUrl || null;
};

const resolveAvatar = (pro) => {
  const rawUrl = normalizeText(pro?.avatar_url);
  const rawPath = normalizeText(pro?.avatar_path);

  if (rawUrl && isHttpUrl(rawUrl)) {
    return withCacheBuster(rawUrl);
  }

  if (rawPath) {
    const rebuilt = getStoragePublicUrl(BUCKET_PUBLIC_AVATARS, rawPath);
    return rebuilt ? withCacheBuster(rebuilt) : null;
  }

  return null;
};

const resolveLogo = (pro) => {
  const rawUrl = normalizeText(pro?.logo_url);
  const rawPath = normalizeText(pro?.logo_path);

  if (rawUrl && isHttpUrl(rawUrl)) {
    return withCacheBuster(rawUrl);
  }

  if (!pro?.agency_id && rawPath) {
    const rebuilt = getStoragePublicUrl(BUCKET_PUBLIC_LOGOS, rawPath);
    return rebuilt ? withCacheBuster(rebuilt) : null;
  }

  return null;
};

const getRoleOrder = (role) => {
  const r = normalizeText(role).toLowerCase();
  if (r === "director") return 1;
  if (r === "team_leader") return 2;
  if (r === "agent_affiliate") return 3;
  return 99;
};

const getDisplayName = (pro) => {
  const full = `${pro?.first_name || ""} ${pro?.last_name || ""}`.trim();
  return full || pro?.company_name || pro?.email || "Professionnel";
};

const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="space-y-4 rounded-xl border bg-white p-6">
        <div className="flex justify-center">
          <Skeleton className="h-24 w-24 rounded-full" />
        </div>
        <div className="space-y-2 text-center">
          <Skeleton className="mx-auto h-5 w-32" />
          <Skeleton className="mx-auto h-4 w-24" />
        </div>
        <div className="space-y-3 pt-4">
          <Skeleton className="h-10 w-full rounded-full" />
        </div>
      </div>
    ))}
  </div>
);

const ProfessionnelPartnerPage = () => {
  const { toast } = useToast();

  const [professionals, setProfessionals] = useState([]);
  const [premiumMap, setPremiumMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scopeFilter, setScopeFilter] = useState("all");

  const fetchProfessionals = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const legacyPromise = supabase.from("professionnels_partner_page_public").select(`
          id,
          created_at,
          updated_at,
          first_name,
          last_name,
          company_name,
          effective_company_name,
          email,
          avatar_url,
          avatar_path,
          logo_url,
          logo_path,
          effective_logo_url,
          effective_logo_path,
          card_slug,
          digital_card_livingroom_url,
          premium_professionnel_card,
          scope_intervention_choice_1,
          scope_intervention_choice_2,
          scope_intervention_choice_3,
          visibility_pro_partner_page,
          agency_id,
          agency_name
        `);

      const agencyPromise = supabase.from("partner_professionnels_agency").select(`
          id,
          created_at,
          updated_at,
          first_name,
          last_name,
          company_name,
          effective_company_name,
          email,
          avatar_url,
          avatar_path,
          logo_url,
          logo_path,
          effective_logo_url,
          effective_logo_path,
          card_slug,
          digital_card_livingroom_url,
          premium_professionnel_card,
          scope_intervention_choice_1,
          scope_intervention_choice_2,
          scope_intervention_choice_3,
          visibility_pro_partner_page,
          member_agency_id,
          agency_name,
          effective_role,
          role_order
        `);

      const [legacyRes, agencyRes] = await Promise.allSettled([
        legacyPromise,
        agencyPromise,
      ]);

      let legacyRows = [];
      let agencyRows = [];
      let legacyErr = null;
      let agencyErr = null;

      if (legacyRes.status === "fulfilled") {
        legacyErr = legacyRes.value.error;
        legacyRows = legacyRes.value.data || [];
      } else {
        legacyErr = legacyRes.reason;
      }

      if (agencyRes.status === "fulfilled") {
        agencyErr = agencyRes.value.error;
        agencyRows = agencyRes.value.data || [];
      } else {
        agencyErr = agencyRes.reason;
      }

      if (legacyErr && agencyErr) {
        throw legacyErr;
      }

      if (legacyErr) {
        console.warn("[PartnerPage] legacy source error:", legacyErr);
      }

      if (agencyErr) {
        console.warn("[PartnerPage] agency source error:", agencyErr);
      }

      const mergedMap = new Map();

      (legacyRows || [])
        .filter((p) => !!p?.id)
        .forEach((p) => {
          mergedMap.set(p.id, {
            ...p,
            source_type: "legacy_public",
            effective_role: null,
            role_order: 99,
          });
        });

      (agencyRows || [])
        .filter((p) => !!p?.id)
        .forEach((p) => {
          const existing = mergedMap.get(p.id) || {};
          mergedMap.set(p.id, {
            ...existing,
            ...p,
            agency_id: p.member_agency_id || existing.agency_id || null,
            source_type: "agency_public",
            effective_role: p.effective_role || existing.effective_role || null,
            role_order:
              typeof p.role_order === "number"
                ? p.role_order
                : getRoleOrder(p.effective_role),
          });
        });

      const rows = Array.from(mergedMap.values());

      rows.sort((a, b) => {
        const agencyA = normalizeText(a.agency_name);
        const agencyB = normalizeText(b.agency_name);

        if (agencyA && agencyB) {
          const byAgency = agencyA.localeCompare(agencyB, "fr");
          if (byAgency !== 0) return byAgency;
        } else if (agencyA && !agencyB) {
          return -1;
        } else if (!agencyA && agencyB) {
          return 1;
        }

        const roleA =
          typeof a.role_order === "number"
            ? a.role_order
            : getRoleOrder(a.effective_role);

        const roleB =
          typeof b.role_order === "number"
            ? b.role_order
            : getRoleOrder(b.effective_role);

        if (roleA !== roleB) return roleA - roleB;

        const nameA = getDisplayName(a);
        const nameB = getDisplayName(b);
        const byName = nameA.localeCompare(nameB, "fr");
        if (byName !== 0) return byName;

        return (
          new Date(b.updated_at || b.created_at || 0).getTime() -
          new Date(a.updated_at || a.created_at || 0).getTime()
        );
      });

      setProfessionals(rows);

      const proIds = rows.map((r) => r.id).filter(Boolean);
      if (!proIds.length) {
        setPremiumMap({});
        return;
      }

      const { data: effectiveRows, error: effectiveErr } = await supabase
        .from("pro_cards_effective_v4")
        .select(
          "professionnel_id, premium_professionnel_card, digital_card_livingroom_url, card_url_clicks, card_qr_scans"
        )
        .in("professionnel_id", proIds);

      if (effectiveErr) {
        console.warn("[PartnerPage] effective cards fetch error:", effectiveErr);
        setPremiumMap({});
        return;
      }

      const map = {};
      (effectiveRows || []).forEach((r) => {
        if (!r?.professionnel_id) return;
        map[r.professionnel_id] = {
          professionnel_id: r.professionnel_id,
          premium_professionnel_card: normalizeText(r.premium_professionnel_card),
          digital_card_livingroom_url: normalizeText(r.digital_card_livingroom_url),
          card_url_clicks: Number(r.card_url_clicks ?? 0) || 0,
          card_qr_scans: Number(r.card_qr_scans ?? 0) || 0,
        };
      });

      setPremiumMap(map);
    } catch (err) {
      console.error("Error fetching partner professionals:", err);
      setError(err);
      toast({
        variant: "destructive",
        title: "Erreur de chargement",
        description:
          err?.message || "Impossible de charger la liste des partenaires.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProfessionals();
  }, [fetchProfessionals]);

  const availableScopes = useMemo(() => {
    const scopes = new Set();

    professionals.forEach((p) => {
      [
        p.scope_intervention_choice_1,
        p.scope_intervention_choice_2,
        p.scope_intervention_choice_3,
      ].forEach((scope) => {
        const s = normalizeText(scope);
        if (s) scopes.add(s);
      });
    });

    return Array.from(scopes).sort((a, b) => a.localeCompare(b, "fr"));
  }, [professionals]);

  const displayedPros = useMemo(() => {
    if (scopeFilter === "all") return professionals;

    return professionals.filter((p) =>
      [
        p.scope_intervention_choice_1,
        p.scope_intervention_choice_2,
        p.scope_intervention_choice_3,
      ].some((scope) => normalizeText(scope) === scopeFilter)
    );
  }, [professionals, scopeFilter]);

  const hydratedPros = useMemo(() => {
    return displayedPros.map((p) => {
      const effective = premiumMap?.[p.id] || null;

      const avatarUi = resolveAvatar(p);
      const resolvedLogo = resolveLogo(p);

      const premiumCardRaw = pickFirstUrl(
        effective?.premium_professionnel_card,
        p?.premium_professionnel_card
      );

      const premiumCardUrl =
        getPremiumPublicCardUrl(
          { premium_professionnel_card: premiumCardRaw },
          {
            cvd: true,
            entry: "external",
            from: "partners-list",
          }
        ) || null;

      const fallbackPublicUrl =
        getPublicCvdUrl(
          {
            id: p.id,
            card_slug: p.card_slug || null,
            premium_professionnel_card: premiumCardRaw,
            digital_card_livingroom_url:
              effective?.digital_card_livingroom_url || p?.digital_card_livingroom_url || null,
          },
          {
            cvd: true,
            entry: "external",
            from: "partners-list",
          }
        ) || null;

      const effectiveCardUrl = premiumCardUrl || fallbackPublicUrl || null;

      return {
        ...p,
        avatar_url: avatarUi || null,
        resolved_logo: resolvedLogo || null,
        premium_professionnel_card: premiumCardRaw || null,
        premium_card_url: premiumCardUrl,
        effective_card_url: effectiveCardUrl,
        card_url_clicks: Number(effective?.card_url_clicks ?? 0) || 0,
        card_qr_scans: Number(effective?.card_qr_scans ?? 0) || 0,
      };
    });
  }, [displayedPros, premiumMap]);

  const schemaData = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Nos Professionnels Partenaires - LivingRoom",
      description:
        "Liste des professionnels de l'immobilier partenaires certifiés LivingRoom.",
      itemListElement: hydratedPros.map((pro, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "ProfessionalService",
          name: getDisplayName(pro),
          description:
            pro.company_name || pro.effective_company_name || pro.agency_name || "Professionnel Immobilier",
          image: pro.avatar_url || undefined,
          url: pro.effective_card_url || undefined,
          address: {
            "@type": "PostalAddress",
            addressLocality: pro.scope_intervention_choice_1 || "France",
          },
        },
      })),
    }),
    [hydratedPros]
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <SEO
        title="Nos Professionnels Partenaires | LivingRoom"
        description="Découvrez nos professionnels de l'immobilier partenaires. Experts qualifiés pour vous accompagner dans vos projets d'achat et de vente."
        canonical="/nos-professionnels-partenaires"
      />

      <Helmet>
        <script type="application/ld+json">{JSON.stringify(schemaData)}</script>
      </Helmet>

      <div className="border-b border-slate-200 bg-white">
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-full bg-[#005E9E]/10 p-3">
            <Users className="h-8 w-8 text-[#005E9E]" />
          </div>
          <h1
            className="mb-4 text-3xl font-bold md:text-4xl"
            style={{ color: "#005E9E" }}
          >
            Nos Professionnels Partenaires
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-600">
            Retrouvez les experts certifiés LivingRoom, prêts à vous accompagner
            avec des outils digitaux innovants.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {availableScopes.length > 1 && !loading && (
          <div className="mb-10 flex flex-wrap justify-center gap-2">
            <Button
              variant={scopeFilter === "all" ? "default" : "outline"}
              onClick={() => setScopeFilter("all")}
              className="rounded-full"
              size="sm"
            >
              Tous les secteurs
            </Button>

            {availableScopes.map((scope) => (
              <Button
                key={scope}
                variant={scopeFilter === scope ? "default" : "outline"}
                onClick={() => setScopeFilter(scope)}
                className="rounded-full"
                size="sm"
              >
                {scope}
              </Button>
            ))}
          </div>
        )}

        {error ? (
          <div className="rounded-xl border border-slate-200 bg-white py-12 text-center shadow-sm">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-slate-900">
              Une erreur est survenue
            </h3>
            <p className="mb-6 text-slate-500">
              Nous n&apos;avons pas pu charger la liste des partenaires.
            </p>
            <Button onClick={fetchProfessionals} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Réessayer
            </Button>
          </div>
        ) : loading ? (
          <LoadingSkeleton />
        ) : hydratedPros.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">
              Aucun professionnel trouvé
            </h3>
            <p className="mt-2 text-slate-500">
              {scopeFilter !== "all"
                ? "Aucun partenaire dans ce secteur pour le moment."
                : "Aucun partenaire disponible actuellement."}
            </p>
            {scopeFilter !== "all" && (
              <Button
                variant="link"
                onClick={() => setScopeFilter("all")}
                className="mt-4"
              >
                Voir tous les professionnels
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {hydratedPros.map((pro) => (
              <ProfessionnelPartnerCard key={pro.id} professional={pro} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionnelPartnerPage;