import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/customSupabaseClient";
import SEO from "@/components/SEO";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ArrowLeft, PlusCircle, X } from "lucide-react";
import ProfessionnelCard from "@/components/pro/ProfessionnelCard";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import RgpdNotice from "@/components/legal/RgpdNotice";

const PROPERTY_TYPES = [
  "Appartement",
  "Maison/villa",
  "Loft",
  "Hôtel particulier",
  "Parking",
  "Autre surface",
];

const TIMELINE_OPTIONS = ["Tout de suite", "< 3 mois", "3 à 6 mois", "+ 6 mois"];

const num = (v) => {
  const n = parseInt(String(v || "").replace(/\s/g, ""), 10);
  return Number.isFinite(n) ? n : null;
};

const isEmail = (v) => /^\S+@\S+\.\S+$/.test(String(v || "").trim());
const isPhone = (v) => String(v || "").trim().length >= 6;

const PRO_PUBLIC_TABLE = "professionnels_public";

const getQP = (search, key) => {
  try {
    return new URLSearchParams(search || "").get(key);
  } catch {
    return null;
  }
};

const SelectField = ({ label, value, onChange, options, id }) => (
  <div>
    {label ? (
      <Label htmlFor={id} className="text-brand-blue">
        {label}
      </Label>
    ) : null}
    <select
      id={id}
      className="w-full border rounded-md h-10 px-3"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

const AuthStrip = ({
  user,
  authLoading,
  email,
  onSignOut,
  role,
  setRole,
  showLogin,
  setShowLogin,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authSubmitting,
  handleMinimalSignin,
}) => (
  <div className="mb-8">
    {authLoading ? (
      <div className="flex items-center gap-2 text-sm text-brand-blue">
        <Loader2 className="w-4 h-4 animate-spin" />
        Vérification de votre session…
      </div>
    ) : user ? (
      <div className="flex items-center justify-between rounded-lg p-3 bg-gray-50 border">
        <div className="text-sm text-brand-blue">
          Connecté en tant que <span className="font-medium">{email || user.email}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onSignOut}>
          Se déconnecter
        </Button>
      </div>
    ) : (
      <div className="rounded-lg p-4 bg-gray-50 border space-y-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-2">
            <p className="text-sm text-brand-blue font-medium">Vous êtes :</p>
            <Button
              type="button"
              size="sm"
              variant={role === "Particulier" ? "default" : "outline"}
              onClick={() => setRole("Particulier")}
            >
              Particulier
            </Button>
            <Button
              type="button"
              size="sm"
              variant={role === "Professionnel" ? "default" : "outline"}
              onClick={() => setRole("Professionnel")}
            >
              Professionnel
            </Button>
          </div>

          <Button
            variant="link"
            className="p-0 h-auto text-sm"
            onClick={() => setShowLogin(!showLogin)}
          >
            Vous disposez déjà d&apos;un compte ?
          </Button>
        </div>

        {showLogin ? (
          <form onSubmit={handleMinimalSignin} className="flex flex-wrap items-end gap-3 pt-2">
            <div className="min-w-[240px] flex-1">
              <Label htmlFor="authEmail" className="text-brand-blue text-sm">
                Email
              </Label>
              <Input
                id="authEmail"
                type="email"
                autoComplete="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="vous@exemple.com"
              />
            </div>

            <div className="min-w-[200px]">
              <Label htmlFor="authPwd" className="text-brand-blue text-sm">
                Mot de passe
              </Label>
              <Input
                id="authPwd"
                type="password"
                autoComplete="current-password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div>
              <Button type="submit" disabled={authSubmitting}>
                {authSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Se connecter
              </Button>
            </div>

            <div className="w-full pt-1 text-xs text-gray-500">
              En vous connectant, vous confirmez avoir pris connaissance de notre{" "}
              <Link to="/confidentialite" className="underline hover:text-gray-700">
                politique de confidentialité
              </Link>
              .
            </div>
          </form>
        ) : null}
      </div>
    )}
  </div>
);

const FeatureChecklist = ({
  hasGarden,
  setHasGarden,
  hasTerrace,
  setHasTerrace,
  hasBalcony,
  setHasBalcony,
  hasPool,
  setHasPool,
  hasElevator,
  setHasElevator,
  hasCellar,
  setHasCellar,
  hasParking,
  setHasParking,
  hasCaretaker,
  setHasCaretaker,
  hasClearView,
  setHasClearView,
  isLastFloor,
  setIsLastFloor,
}) => (
  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-2">
    {[
      ["Jardin", hasGarden, setHasGarden],
      ["Terrasse", hasTerrace, setHasTerrace],
      ["Balcon", hasBalcony, setHasBalcony],
      ["Piscine", hasPool, setHasPool],
      ["Ascenseur", hasElevator, setHasElevator],
      ["Cave", hasCellar, setHasCellar],
      ["Parking", hasParking, setHasParking],
      ["Gardien", hasCaretaker, setHasCaretaker],
      ["Vue dégagée", hasClearView, setHasClearView],
      ["Dernier étage", isLastFloor, setIsLastFloor],
    ].map(([label, checked, onChange]) => (
      <label key={label} className="flex items-center gap-2 text-brand-blue">
        <Checkbox checked={checked} onCheckedChange={onChange} /> {label}
      </label>
    ))}
  </div>
);

const LocationRow = ({
  index,
  loc,
  onCityTyping,
  onPickCity,
  geoOpen,
  geoLoading,
  geoResults,
  onOpenGeo,
  onCloseGeo,
  quartiers,
  quartierLoading,
  quartierOpen,
  onOpenQuartier,
  onPickQuartier,
  onQuartierTyping,
  onRemove,
  canRemove,
}) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) onCloseGeo?.();
    };

    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [onCloseGeo]);

  return (
    <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start relative">
      <div className="relative">
        <Label className="text-xs text-gray-500">Ville {index + 1}</Label>
        <Input
          value={loc.city}
          onChange={(e) => onCityTyping(index, e.target.value)}
          onFocus={() => onOpenGeo(index)}
          placeholder="Saisissez une ville"
        />
        {geoOpen && (geoLoading || geoResults.length > 0) ? (
          <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow max-h-60 overflow-y-auto">
            {geoLoading ? (
              <div className="px-3 py-2 text-sm text-gray-500">Recherche…</div>
            ) : (
              geoResults.map((g) => (
                <button
                  type="button"
                  key={g.uid}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50"
                  onClick={() =>
                    onPickCity(index, {
                      label: g.label,
                      uid: g.uid,
                    })
                  }
                >
                  <span className="text-sm">{g.label}</span>
                  {g.parent_label ? (
                    <span className="text-xs text-gray-500"> · {g.parent_label}</span>
                  ) : null}
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>

      <div className="flex items-end gap-2 relative">
        <div className="flex-grow">
          <Label className="text-xs text-gray-500">
            Quartier (optionnel)
            {loc.ville_uid ? "" : " — choisissez d’abord une ville"}
          </Label>
          <Input
            value={loc.quartier}
            disabled={!loc.ville_uid}
            onChange={(e) => onQuartierTyping(index, e.target.value)}
            onFocus={() => onOpenQuartier(index)}
            placeholder={loc.ville_uid ? "Commencez à saisir…" : "Choisissez d’abord une ville"}
          />
          {quartierOpen && loc.ville_uid ? (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow max-h-60 overflow-y-auto">
              {quartierLoading ? (
                <div className="px-3 py-2 text-sm text-gray-500">Chargement…</div>
              ) : quartiers.length > 0 ? (
                quartiers.map((q) => (
                  <button
                    type="button"
                    key={`${q.uid || q.label}-${index}`}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50"
                    onClick={() =>
                      onPickQuartier(index, {
                        label: q.label,
                        uid: q.uid,
                      })
                    }
                  >
                    <span className="text-sm">{q.label}</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500">Aucun quartier trouvé</div>
              )}
            </div>
          ) : null}
        </div>

        {canRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemove(index)}
            className="h-9 w-9"
            aria-label={`Retirer la localisation ${index + 1}`}
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
};

const DirectLeadFormPage = () => {
  const { professionnelId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const navState = location.state || {};
  const returnTo = (navState.returnTo || navState.fromPath || "").trim();
  const fromQP = getQP(location.search, "from");
  const entryQP = getQP(location.search, "entry");

  const fromPartnersList = useMemo(() => {
    return (
      Boolean(navState.fromPartnersList) ||
      navState.from === "partners-list" ||
      fromQP === "partners-list"
    );
  }, [navState, fromQP]);

  const backLabel = fromPartnersList ? "Retour aux professionnels" : "Retour";

  const handleBack = useCallback(() => {
    if (returnTo) {
      navigate(returnTo);
      return;
    }

    if (fromPartnersList) {
      navigate("/nos-professionnels-partenaires");
      return;
    }

    navigate(-1);
  }, [returnTo, fromPartnersList, navigate]);

  const [professionnel, setProfessionnel] = useState(null);
  const [loadingPro, setLoadingPro] = useState(true);

  const { user, isLoading: authLoading, signOut, refresh } = useAuth?.() ?? {};

  const [showLogin, setShowLogin] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [role, setRole] = useState("Particulier");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [projectTitle, setProjectTitle] = useState("");
  const [projectTab, setProjectTab] = useState("achat");
  const [typeBien, setTypeBien] = useState("Maison/villa");
  const [delai, setDelai] = useState("Tout de suite");

  const [locations, setLocations] = useState([
    { city: "", quartier: "", ville_uid: null, quartier_uid: null },
  ]);

  const [budget, setBudget] = useState("");
  const [price, setPrice] = useState("");
  const [surface, setSurface] = useState("");
  const [surfaceMin, setSurfaceMin] = useState("");
  const [surfaceMax, setSurfaceMax] = useState("");
  const [bedroomsMin, setBedroomsMin] = useState("");

  const [hasGarden, setHasGarden] = useState(false);
  const [hasTerrace, setHasTerrace] = useState(false);
  const [hasBalcony, setHasBalcony] = useState(false);
  const [hasPool, setHasPool] = useState(false);
  const [hasElevator, setHasElevator] = useState(false);
  const [hasCellar, setHasCellar] = useState(false);
  const [hasParking, setHasParking] = useState(false);
  const [hasCaretaker, setHasCaretaker] = useState(false);
  const [hasClearView, setHasClearView] = useState(false);
  const [isLastFloor, setIsLastFloor] = useState(false);

  const [publicVisibility, setPublicVisibility] = useState(true);
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [refId, setRefId] = useState(null);

  const [editMode, setEditMode] = useState(false);
  const isParticulierOwner = user?.id && role === "Particulier";

  const [geoQuery, setGeoQuery] = useState("");
  const [geoResults, setGeoResults] = useState([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [activeLocationIndex, setActiveLocationIndex] = useState(0);
  const [showGeoDropdown, setShowGeoDropdown] = useState(false);

  const [quartiersCache, setQuartiersCache] = useState({});
  const [activeQuartierIndex, setActiveQuartierIndex] = useState(null);
  const [quartierQuery, setQuartierQuery] = useState("");
  const [quartierLoading, setQuartierLoading] = useState(false);
  const [showQuartierDropdown, setShowQuartierDropdown] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target)) {
        setShowGeoDropdown(false);
        setShowQuartierDropdown(false);
      }
    };

    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const fetchProfessionnel = useCallback(async () => {
    if (!professionnelId) {
      setLoadingPro(false);
      return;
    }

    setLoadingPro(true);

    try {
      const { data, error } = await supabase
        .from(PRO_PUBLIC_TABLE)
        .select("*")
        .eq("id", professionnelId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("PRO_NOT_FOUND");

      setProfessionnel(data);
    } catch (err) {
      console.error("Fetch pro error:", err);
      toast({
        variant: "destructive",
        title: "Professionnel introuvable",
        description: "Impossible de charger les informations du professionnel.",
      });

      if (fromPartnersList) {
        navigate("/nos-professionnels-partenaires", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } finally {
      setLoadingPro(false);
    }
  }, [professionnelId, toast, navigate, fromPartnersList]);

  const preloadProfile = useCallback(async () => {
    try {
      if (!user?.id) return;

      if (user.email) setEmail(user.email);

      let first = null;
      let last = null;
      let tel = null;

      const { data: part } = await supabase
        .from("particuliers")
        .select("first_name,last_name,phone,email")
        .eq("id", user.id)
        .maybeSingle();

      if (part) {
        first = part.first_name ?? first;
        last = part.last_name ?? last;
        tel = part.phone ?? tel;
        if (part.email) setEmail(part.email);
        setRole("Particulier");
      } else {
        const { data: pro } = await supabase
          .from("professionnels")
          .select("first_name,last_name,phone,email")
          .eq("id", user.id)
          .maybeSingle();

        if (pro) {
          first = pro.first_name ?? first;
          last = pro.last_name ?? last;
          tel = pro.phone ?? tel;
          if (pro.email) setEmail(pro.email);
          setRole("Professionnel");
        }
      }

      if (!first || !last) {
        const full = user.user_metadata?.full_name || "";
        const parts = full.trim().split(" ");
        if (!first && parts[0]) first = parts[0];
        if (!last && parts.length > 1) last = parts.slice(1).join(" ");
      }

      if (!tel && user.user_metadata?.phone) tel = user.user_metadata.phone;

      if (first) setFirstName((prev) => prev || first);
      if (last) setLastName((prev) => prev || last);
      if (tel) setPhone((prev) => prev || tel);
    } catch (e) {
      console.warn("preloadProfile error:", e);
    }
  }, [user]);

  const fetchPros = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from(PRO_PUBLIC_TABLE)
        .select("id, first_name, last_name, company_name")
        .order("last_name", { ascending: true });

      if (error) throw error;
      setPros(data || []);
    } catch (e) {
      console.warn("fetchPros error:", e);
      setPros([]);
    }
  }, []);

  const [pros, setPros] = useState([]);
  const [targetProId, setTargetProId] = useState("");

  useEffect(() => {
    fetchProfessionnel();
  }, [fetchProfessionnel]);

  useEffect(() => {
    preloadProfile();
  }, [preloadProfile]);

  useEffect(() => {
    fetchPros();
  }, [fetchPros]);

  useEffect(() => {
    let unsubscribe;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        Promise.resolve(refresh?.()).finally(() => preloadProfile());
      }

      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          Promise.resolve(refresh?.()).finally(() => preloadProfile());
        }
      });

      unsubscribe = sub?.subscription?.unsubscribe;
    })();

    return () => {
      try {
        unsubscribe?.();
      } catch {}
    };
  }, [refresh, preloadProfile]);

  const searchGeo = useCallback(async (q) => {
    const query = q.trim();
    if (!query || query.length < 2) {
      setGeoResults([]);
      return;
    }

    setGeoLoading(true);

    try {
      const { data, error } = await supabase.rpc("f_search_villes", {
        p_query: query,
        p_limit: 10,
      });

      if (error) throw error;
      setGeoResults(data || []);
    } catch (e) {
      console.warn("searchGeo error:", e);
      setGeoResults([]);
    } finally {
      setGeoLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      searchGeo(geoQuery);
    }, 250);

    return () => clearTimeout(t);
  }, [geoQuery, searchGeo]);

  const loadQuartiersForVille = useCallback(
    async (ville_uid) => {
      if (!ville_uid) return [];
      if (quartiersCache[ville_uid]) return quartiersCache[ville_uid];

      setQuartierLoading(true);

      try {
        const { data, error } = await supabase
          .from("stg_geo")
          .select("quartier, quartier_uid")
          .eq("ville_uid", ville_uid)
          .not("quartier", "is", null)
          .order("quartier", { ascending: true });

        if (error) throw error;

        const rows = (data || [])
          .filter((r) => r.quartier && r.quartier.trim().length > 0)
          .map((r) => ({
            label: r.quartier,
            uid: r.quartier_uid || null,
          }));

        setQuartiersCache((prev) => ({
          ...prev,
          [ville_uid]: rows,
        }));

        return rows;
      } catch (e) {
        console.warn("loadQuartiersForVille error:", e);
        return [];
      } finally {
        setQuartierLoading(false);
      }
    },
    [quartiersCache]
  );

  const projectType = useMemo(
    () => (projectTab === "achat" ? "Achat" : "Vente"),
    [projectTab]
  );

  const buildColumns = () => ({
    email: email || null,
    first_name: firstName || null,
    last_name: lastName || null,
    phone: phone || null,
    role: role || null,
    project_title: projectTitle || null,
    project_type: projectType,
    type_projet: projectType,
    type_bien: typeBien || null,
    delai: delai || null,
    description: description || null,
    city_choice_1: locations[0]?.city || null,
    ville_uid_choice_1: locations[0]?.ville_uid || null,
    quartier_choice_1: locations[0]?.quartier || null,
    quartier_uid_choice_1: locations[0]?.quartier_uid || null,
    city_choice_2: locations[1]?.city || null,
    ville_uid_choice_2: locations[1]?.ville_uid || null,
    quartier_choice_2: locations[1]?.quartier || null,
    quartier_uid_choice_2: locations[1]?.quartier_uid || null,
    city_choice_3: locations[2]?.city || null,
    ville_uid_choice_3: locations[2]?.ville_uid || null,
    quartier_choice_3: locations[2]?.quartier || null,
    quartier_uid_choice_3: locations[2]?.quartier_uid || null,
    city_choice_4: locations[3]?.city || null,
    ville_uid_choice_4: locations[3]?.ville_uid || null,
    quartier_choice_4: locations[3]?.quartier || null,
    quartier_uid_choice_4: locations[3]?.quartier_uid || null,
    city_choice_5: locations[4]?.city || null,
    ville_uid_choice_5: locations[4]?.ville_uid || null,
    quartier_choice_5: locations[4]?.quartier || null,
    quartier_uid_choice_5: locations[4]?.quartier_uid || null,
    budget_max: num(budget),
    prix_demande: num(price),
    surface: num(surface),
    surface_min: num(surfaceMin),
    surface_max: num(surfaceMax),
    bedrooms_min: num(bedroomsMin),
    has_garden: !!hasGarden,
    has_terrace: !!hasTerrace,
    has_balcony: !!hasBalcony,
    has_pool: !!hasPool,
    has_elevator: !!hasElevator,
    has_cellar: !!hasCellar,
    has_parking: !!hasParking,
    has_caretaker: !!hasCaretaker,
    has_clear_view: !!hasClearView,
    is_last_floor: !!isLastFloor,
  });

  const buildPayloadJSON = () => ({
    public_visibility: !!publicVisibility,
    contact: {
      role,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
    },
    entry: entryQP || null,
  });

  const handleMinimalSignin = async (e) => {
    e?.preventDefault?.();

    if (!isEmail(authEmail) || !authPassword) {
      toast({
        variant: "destructive",
        title: "Identifiants invalides",
        description: "Email et mot de passe sont requis.",
      });
      return;
    }

    setAuthSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });

      if (error) throw error;

      setRole(role === "Particulier" ? "Particulier" : "Professionnel");
      await refresh?.();
      await preloadProfile();

      toast({ title: "Connexion réussie" });
    } catch (err) {
      console.error("signin error", err);
      toast({
        variant: "destructive",
        title: "Connexion impossible",
        description: "Vérifiez vos identifiants.",
      });
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut?.();
      toast({ title: "Déconnecté" });
      setAuthEmail("");
      setAuthPassword("");
      setShowLogin(false);
    } catch {
      toast({
        variant: "destructive",
        title: "Erreur de déconnexion",
        description: "Veuillez réessayer.",
      });
    }
  };

  const handleLocationChange = (index, field, value) => {
    const newLocations = [...locations];
    newLocations[index][field] = value;

    if (field === "city") {
      newLocations[index].quartier = "";
      newLocations[index].quartier_uid = null;
      newLocations[index].ville_uid = null;
    }

    setLocations(newLocations);
  };

  const setVilleForIndex = async (index, { label, uid }) => {
    const newLocations = [...locations];
    newLocations[index].city = label;
    newLocations[index].ville_uid = uid;
    newLocations[index].quartier = "";
    newLocations[index].quartier_uid = null;
    setLocations(newLocations);

    await loadQuartiersForVille(uid);
    setShowGeoDropdown(false);
  };

  const setQuartierForIndex = (index, { label, uid }) => {
    const newLocations = [...locations];
    newLocations[index].quartier = label;
    newLocations[index].quartier_uid = uid || null;
    setLocations(newLocations);
    setShowQuartierDropdown(false);
  };

  const addLocation = () => {
    if (locations.length < 5) {
      setLocations([
        ...locations,
        { city: "", quartier: "", ville_uid: null, quartier_uid: null },
      ]);
    }
  };

  const removeLocation = (index) => {
    if (locations.length > 1) {
      setLocations(locations.filter((_, i) => i !== index));
    }
  };

  const filteredQuartiersFor = (ville_uid, query) => {
    const list = quartiersCache[ville_uid] || [];
    const q = (query || "").toLowerCase().trim();
    if (!q) return list;
    return list.filter((it) => it.label.toLowerCase().includes(q));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();

    if (!professionnelId) {
      toast({
        variant: "destructive",
        title: "Lien professionnel manquant",
        description: "Impossible d’enregistrer.",
      });
      return;
    }

    if (!firstName || !lastName || !isEmail(email) || !isPhone(phone)) {
      toast({
        variant: "destructive",
        title: "Informations manquantes",
        description: "Renseignez Nom, Prénom, un email valide et un téléphone.",
      });
      return;
    }

    const cols = buildColumns();

    const row = {
      ...cols,
      professionnel_id: professionnelId,
      particulier_id: role === "Particulier" && user?.id ? user.id : null,
      payload: buildPayloadJSON(),
    };

    setSending(true);

    try {
      const { data, error } = await supabase
        .from("direct_leads")
        .insert([row])
        .select("id")
        .single();

      if (error) throw error;

      setRefId(data?.id || null);
      setSubmitted(true);

      toast({
        title: "Votre projet a été enregistré",
        description: "Merci ! Le professionnel vous recontactera.",
      });
    } catch (err) {
      console.error("[direct_leads] insert error", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d’enregistrer votre demande.",
      });
    } finally {
      setSending(false);
    }
  };

  const handleUpdate = async () => {
    if (!refId || !user?.id) return;

    const cols = buildColumns();
    const updates = {
      ...cols,
      payload: buildPayloadJSON(),
    };

    setSending(true);

    try {
      const { error } = await supabase
        .from("direct_leads")
        .update(updates)
        .eq("id", refId)
        .eq("particulier_id", user.id);

      if (error) throw error;

      setEditMode(false);
      toast({ title: "Modifications enregistrées" });
    } catch (e) {
      console.error("update lead error", e);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d’enregistrer les modifications.",
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendToOtherPro = async () => {
    if (!refId || !targetProId) {
      toast({
        variant: "destructive",
        title: "Sélection manquante",
        description: "Choisissez un professionnel.",
      });
      return;
    }

    const cols = buildColumns();

    const clone = {
      ...cols,
      professionnel_id: targetProId,
      particulier_id: role === "Particulier" && user?.id ? user.id : null,
      payload: buildPayloadJSON(),
    };

    setSending(true);

    try {
      const { error } = await supabase.from("direct_leads").insert([clone]);
      if (error) throw error;

      setTargetProId("");
      toast({ title: "Projet adressé à un autre professionnel" });
    } catch (e) {
      console.error("clone lead error", e);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Envoi impossible.",
      });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!refId || !user?.id) return;

    setSending(true);

    try {
      const { error } = await supabase
        .from("direct_leads")
        .delete()
        .eq("id", refId)
        .eq("particulier_id", user.id);

      if (error) throw error;

      toast({ title: "Projet retiré" });
      setSubmitted(false);
      setRefId(null);
    } catch (e) {
      console.error("delete lead error", e);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Suppression impossible.",
      });
    } finally {
      setSending(false);
    }
  };

  if (loadingPro) {
    return (
      <div className="container mx-auto px-4 py-10 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (submitted && !editMode) {
    return (
      <>
        <SEO title="Projet envoyé" description="Votre projet a été enregistré." />

        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="hidden lg:block lg:col-span-1 sticky top-10">
              {professionnel ? <ProfessionnelCard professionnel={professionnel} /> : null}
            </div>

            <div className="col-span-1 lg:col-span-2">
              <Card className="p-6">
                <h1 className="text-2xl md:text-3xl font-bold text-brand-blue mb-2">
                  Merci, votre projet a été envoyé
                </h1>

                <p className="text-brand-blue/90 mb-2">
                  Le professionnel vous recontactera rapidement.
                </p>

                <div className="mb-6 text-xs text-gray-500">
                  Pour en savoir plus sur l’usage de vos données, consultez la{" "}
                  <Link to="/confidentialite" className="underline hover:text-gray-700">
                    politique de confidentialité
                  </Link>
                  .
                </div>

                {user && isParticulierOwner ? (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-brand-blue">Actions</h2>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button onClick={() => setEditMode(true)}>Modifier le projet</Button>

                      <div className="flex gap-2 items-center">
                        <select
                          className="border rounded-md px-3 py-2"
                          value={targetProId}
                          onChange={(e) => setTargetProId(e.target.value)}
                        >
                          <option value="">Choisir un professionnel…</option>
                          {pros.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.first_name} {p.last_name}
                              {p.company_name ? ` · ${p.company_name}` : ""}
                            </option>
                          ))}
                        </select>

                        <Button
                          variant="outline"
                          onClick={handleSendToOtherPro}
                          disabled={!targetProId || sending}
                        >
                          Adresser à ce professionnel
                        </Button>
                      </div>

                      <Button variant="destructive" onClick={handleDelete} disabled={sending}>
                        Retirer mon projet
                      </Button>
                    </div>
                  </div>
                ) : null}

                <Button variant="ghost" onClick={handleBack} className="mt-8">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {backLabel}
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title={`Préciser votre projet à ${professionnel?.first_name || ""} ${professionnel?.last_name || ""}`}
        description="Expliquez votre besoin : vous serez recontacté rapidement."
      />

      <div className="container mx-auto px-4 py-10" ref={dropdownRef}>
        <Button variant="ghost" onClick={handleBack} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {backLabel}
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="hidden lg:block lg:col-span-1 sticky top-10">
            {professionnel ? <ProfessionnelCard professionnel={professionnel} /> : null}
          </div>

          <div className="col-span-1 lg:col-span-2">
            <Card className="p-6">
              <h1 className="text-2xl md:text-3xl font-bold text-brand-blue mb-2">
                Parlez-moi de votre projet...
              </h1>

              <p className="text-brand-blue/90 mb-6">
                Expliquez votre besoin à {professionnel?.first_name}. Vous serez recontacté
                rapidement.
              </p>

              <AuthStrip
                user={user}
                authLoading={authLoading}
                email={email}
                onSignOut={handleSignOut}
                role={role}
                setRole={setRole}
                showLogin={showLogin}
                setShowLogin={setShowLogin}
                authEmail={authEmail}
                setAuthEmail={setAuthEmail}
                authPassword={authPassword}
                setAuthPassword={setAuthPassword}
                authSubmitting={authSubmitting}
                handleMinimalSignin={handleMinimalSignin}
              />

              <form
                onSubmit={
                  editMode
                    ? (e) => {
                        e.preventDefault();
                        handleUpdate();
                      }
                    : handleSubmit
                }
              >
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-brand-blue">
                        Prénom
                      </Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Prénom"
                      />
                    </div>

                    <div>
                      <Label htmlFor="lastName" className="text-brand-blue">
                        Nom
                      </Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Nom"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-brand-blue">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="vous@exemple.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-brand-blue">
                        Téléphone
                      </Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="06..."
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="projectTitle" className="text-brand-blue">
                      Titre du projet
                    </Label>
                    <Input
                      id="projectTitle"
                      placeholder="Ex. Vente T3 lumineux à Belleville"
                      value={projectTitle}
                      onChange={(e) => setProjectTitle(e.target.value)}
                    />
                  </div>

                  <Tabs
                    defaultValue="achat"
                    value={projectTab}
                    onValueChange={setProjectTab}
                    className="w-full"
                  >
                    <TabsList className="grid grid-cols-2 w-full">
                      <TabsTrigger value="achat">Achat</TabsTrigger>
                      <TabsTrigger value="vente">Vente</TabsTrigger>
                    </TabsList>

                    <TabsContent value="achat">
                      <div className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <SelectField
                            id="typeAchat"
                            label="Type de bien"
                            value={typeBien}
                            onChange={setTypeBien}
                            options={PROPERTY_TYPES}
                          />
                          <SelectField
                            id="delaiAchat"
                            label="Délai"
                            value={delai}
                            onChange={setDelai}
                            options={TIMELINE_OPTIONS}
                          />
                        </div>

                        <div className="space-y-3">
                          <Label className="text-brand-blue">Localisation(s) souhaitée(s)</Label>

                          {locations.map((loc, index) => {
                            const villeUid = loc.ville_uid;
                            const quartiers = filteredQuartiersFor(
                              villeUid,
                              index === activeQuartierIndex ? quartierQuery : ""
                            );

                            return (
                              <LocationRow
                                key={index}
                                index={index}
                                loc={loc}
                                onCityTyping={(i, val) => {
                                  handleLocationChange(i, "city", val);
                                  setGeoQuery(val);
                                  setActiveLocationIndex(i);
                                  setShowGeoDropdown(true);
                                }}
                                onPickCity={async (i, g) => {
                                  await setVilleForIndex(i, g);
                                  setGeoResults([]);
                                }}
                                geoOpen={showGeoDropdown && activeLocationIndex === index}
                                geoLoading={geoLoading}
                                geoResults={geoResults}
                                onOpenGeo={(i) => {
                                  setActiveLocationIndex(i);
                                  setShowGeoDropdown(true);
                                }}
                                onCloseGeo={() => setShowGeoDropdown(false)}
                                quartiers={quartiers}
                                quartierLoading={quartierLoading}
                                quartierOpen={
                                  showQuartierDropdown && activeQuartierIndex === index
                                }
                                onOpenQuartier={async (i) => {
                                  if (!locations[i].ville_uid) return;
                                  setActiveQuartierIndex(i);
                                  setShowQuartierDropdown(true);

                                  if (!quartiersCache[locations[i].ville_uid]) {
                                    setQuartierLoading(true);
                                    await loadQuartiersForVille(locations[i].ville_uid);
                                    setQuartierLoading(false);
                                  }
                                }}
                                onPickQuartier={(i, q) => setQuartierForIndex(i, q)}
                                onQuartierTyping={(i, v) => {
                                  setQuartierQuery(v);
                                  handleLocationChange(i, "quartier", v);
                                }}
                                onRemove={removeLocation}
                                canRemove={locations.length > 1}
                              />
                            );
                          })}

                          {locations.length < 5 ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addLocation}
                              className="mt-2"
                            >
                              <PlusCircle className="w-4 h-4 mr-2" />
                              Ajouter une localisation
                            </Button>
                          ) : null}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-brand-blue">Budget souhaité (€)</Label>
                            <Input
                              inputMode="numeric"
                              value={budget}
                              onChange={(e) => setBudget(e.target.value)}
                              placeholder="800000"
                            />
                          </div>

                          <div>
                            <Label className="text-brand-blue">Surface mini (m²)</Label>
                            <Input
                              inputMode="numeric"
                              value={surfaceMin}
                              onChange={(e) => setSurfaceMin(e.target.value)}
                              placeholder="50"
                            />
                          </div>

                          <div>
                            <Label className="text-brand-blue">Surface maxi (m²)</Label>
                            <Input
                              inputMode="numeric"
                              value={surfaceMax}
                              onChange={(e) => setSurfaceMax(e.target.value)}
                              placeholder="90"
                            />
                          </div>

                          <div>
                            <Label className="text-brand-blue">Chambres mini</Label>
                            <Input
                              inputMode="numeric"
                              value={bedroomsMin}
                              onChange={(e) => setBedroomsMin(e.target.value)}
                              placeholder="2"
                            />
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="vente">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <SelectField
                          id="typeVente"
                          label="Type de bien"
                          value={typeBien}
                          onChange={setTypeBien}
                          options={PROPERTY_TYPES}
                        />

                        <SelectField
                          id="delaiVente"
                          label="Délai"
                          value={delai}
                          onChange={setDelai}
                          options={TIMELINE_OPTIONS}
                        />

                        <div className="relative">
                          <Label className="text-brand-blue">Ville *</Label>
                          <Input
                            value={locations[0].city}
                            onChange={(e) => {
                              handleLocationChange(0, "city", e.target.value);
                              setGeoQuery(e.target.value);
                              setActiveLocationIndex(0);
                              setShowGeoDropdown(true);
                            }}
                            onFocus={() => {
                              setActiveLocationIndex(0);
                              setShowGeoDropdown(true);
                            }}
                            placeholder="Saisissez une ville"
                          />

                          {showGeoDropdown &&
                          activeLocationIndex === 0 &&
                          (geoLoading || geoResults.length > 0) ? (
                            <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow max-h-60 overflow-y-auto">
                              {geoLoading ? (
                                <div className="px-3 py-2 text-sm text-gray-500">Recherche…</div>
                              ) : (
                                geoResults.map((g) => (
                                  <button
                                    type="button"
                                    key={g.uid}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-50"
                                    onClick={async () => {
                                      await setVilleForIndex(0, {
                                        label: g.label,
                                        uid: g.uid,
                                      });
                                      setGeoResults([]);
                                      setShowGeoDropdown(false);
                                    }}
                                  >
                                    <span className="text-sm">{g.label}</span>
                                    {g.parent_label ? (
                                      <span className="text-xs text-gray-500">
                                        {" "}
                                        · {g.parent_label}
                                      </span>
                                    ) : null}
                                  </button>
                                ))
                              )}
                            </div>
                          ) : null}
                        </div>

                        <div className="relative">
                          <Label className="text-brand-blue">Quartier</Label>
                          <Input
                            value={locations[0].quartier}
                            onChange={(e) => {
                              const v = e.target.value;
                              setQuartierQuery(v);
                              handleLocationChange(0, "quartier", v);
                              setActiveQuartierIndex(0);
                              setShowQuartierDropdown(true);
                            }}
                            onFocus={async () => {
                              if (!locations[0].ville_uid) return;
                              setActiveQuartierIndex(0);
                              setShowQuartierDropdown(true);

                              if (!quartiersCache[locations[0].ville_uid]) {
                                setQuartierLoading(true);
                                await loadQuartiersForVille(locations[0].ville_uid);
                                setQuartierLoading(false);
                              }
                            }}
                            disabled={!locations[0].ville_uid}
                            placeholder={
                              locations[0].ville_uid
                                ? "Commencez à saisir…"
                                : "Choisissez d’abord une ville"
                            }
                          />

                          {showQuartierDropdown &&
                          activeQuartierIndex === 0 &&
                          locations[0].ville_uid ? (
                            <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow max-h-60 overflow-y-auto">
                              {quartierLoading ? (
                                <div className="px-3 py-2 text-sm text-gray-500">Chargement…</div>
                              ) : filteredQuartiersFor(
                                  locations[0].ville_uid,
                                  quartierQuery
                                ).length > 0 ? (
                                filteredQuartiersFor(locations[0].ville_uid, quartierQuery).map(
                                  (q) => (
                                    <button
                                      type="button"
                                      key={`${q.uid || q.label}-vente`}
                                      className="w-full text-left px-3 py-2 hover:bg-gray-50"
                                      onClick={() =>
                                        setQuartierForIndex(0, {
                                          label: q.label,
                                          uid: q.uid,
                                        })
                                      }
                                    >
                                      <span className="text-sm">{q.label}</span>
                                    </button>
                                  )
                                )
                              ) : (
                                <div className="px-3 py-2 text-sm text-gray-500">
                                  Aucun quartier trouvé
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>

                        <div>
                          <Label className="text-brand-blue">Valeur souhaitée (€)</Label>
                          <Input
                            inputMode="numeric"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="800000"
                          />
                        </div>

                        <div>
                          <Label className="text-brand-blue">Surface (m²)</Label>
                          <Input
                            inputMode="numeric"
                            value={surface}
                            onChange={(e) => setSurface(e.target.value)}
                            placeholder="70"
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <FeatureChecklist
                    hasGarden={hasGarden}
                    setHasGarden={setHasGarden}
                    hasTerrace={hasTerrace}
                    setHasTerrace={setHasTerrace}
                    hasBalcony={hasBalcony}
                    setHasBalcony={setHasBalcony}
                    hasPool={hasPool}
                    setHasPool={setHasPool}
                    hasElevator={hasElevator}
                    setHasElevator={setHasElevator}
                    hasCellar={hasCellar}
                    setHasCellar={setHasCellar}
                    hasParking={hasParking}
                    setHasParking={setHasParking}
                    hasCaretaker={hasCaretaker}
                    setHasCaretaker={setHasCaretaker}
                    hasClearView={hasClearView}
                    setHasClearView={setHasClearView}
                    isLastFloor={isLastFloor}
                    setIsLastFloor={setIsLastFloor}
                  />

                  <div>
                    <Label htmlFor="description" className="text-brand-blue">
                      En dire plus sur votre bien / besoin
                    </Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Décrivez votre bien, son état, ses atouts…"
                      rows={5}
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Conseil : évitez d’indiquer des informations sensibles.
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <Checkbox
                      checked={publicVisibility}
                      onCheckedChange={setPublicVisibility}
                    />
                    <div className="text-sm leading-tight text-brand-blue">
                      Rendre ce projet visible sur la Place des Projets publique
                      <div className="mt-1 text-xs text-gray-500">
                        Vos coordonnées ne sont pas destinées à être affichées publiquement.
                        Vous pourrez modifier ou retirer votre projet ensuite.
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border bg-gray-50 p-4">
                    <RgpdNotice
                      variant="short"
                      context="direct-lead"
                      proName={professionnel?.first_name || ""}
                    />
                    <div className="pt-2 text-xs text-gray-500">
                      Liens utiles :{" "}
                      <Link to="/confidentialite" className="underline hover:text-gray-700">
                        Confidentialité
                      </Link>{" "}
                      ·{" "}
                      <Link to="/cgu" className="underline hover:text-gray-700">
                        CGU
                      </Link>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button type="submit" disabled={sending} className="w-full md:w-auto">
                      {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      {editMode ? "Enregistrer les modifications" : "Créer le projet"}
                    </Button>

                    {editMode ? (
                      <Button
                        type="button"
                        variant="ghost"
                        className="ml-2"
                        onClick={() => setEditMode(false)}
                      >
                        Annuler
                      </Button>
                    ) : null}
                  </div>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default DirectLeadFormPage;