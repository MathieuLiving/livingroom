// src/components/auth/AuthForm.jsx
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
import { Eye, EyeOff, LogIn, UserPlus, Loader2, MailCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { useToast } from "../../components/ui/use-toast";
import { useAuth } from "../../contexts/SupabaseAuthContext";
import { Checkbox } from "../../components/ui/checkbox";

// ✅ Versions affichées / enregistrées
const CGU_VERSION = "2026-01-02";
const PRIVACY_VERSION = "2026-01-02";
const CGV_VERSION = "2026-01-02";

const norm = (v) => String(v ?? "").trim().toLowerCase();
const isProType = (t) => {
  const x = norm(t);
  return x === "professionnel" || x === "pro";
};

// ✅ Canonical base URL (prod) : optionnel mais recommandé
function getPublicSiteUrl() {
  try {
    const envUrl =
      (typeof import.meta !== "undefined" &&
        import.meta.env &&
        (import.meta.env.VITE_PUBLIC_SITE_URL ||
          import.meta.env.VITE_SITE_URL ||
          import.meta.env.VITE_APP_URL)) ||
      "";
    const fromEnv = String(envUrl || "").trim().replace(/\/+$/, "");
    if (fromEnv.startsWith("http://") || fromEnv.startsWith("https://")) return fromEnv;
  } catch {}
  // fallback
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return String(origin || "").replace(/\/+$/, "");
}

/** ✅ sécurité: next doit être un chemin interne, propre, non ambigu */
function sanitizeNextPath(next, fallback = "/") {
  const v = String(next || "").trim();

  // vide => fallback
  if (!v) return fallback;

  // must be internal absolute path
  if (!v.startsWith("/")) return fallback;

  // block protocol-relative or windows path
  if (v.startsWith("//") || v.includes("\\")) return fallback;

  // block known bad / legacy ambiguous slugs that trigger /:combinedSlug -> /cvd/...
  const lower = v.toLowerCase();

  // on interdit explicitement /administration qui t’envoie dans le piège du slug
  if (lower === "/administration" || lower.startsWith("/administration/")) return fallback;

  // optionnel: si tu veux éviter toute redirection vers /cvd en callback
  if (lower.startsWith("/cvd/") || lower.includes("/cvd/")) return fallback;

  return v;
}

/** ---------- Login ---------- */
const LoginForm = ({ next, userType }) => {
  const { toast } = useToast();
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);
    if (error) {
      setLoading(false);
      toast({
        title: "Connexion impossible",
        description: "Vérifiez vos identifiants et réessayez.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email-login">Email</Label>
        <Input
          id="email-login"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="votre.email@exemple.com"
          autoComplete="email"
        />
      </div>

      <div>
        <Label htmlFor="password-login">Mot de passe</Label>
        <div className="relative">
          <Input
            id="password-login"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="********"
            autoComplete="current-password"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </Button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white"
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
        {loading ? "Connexion..." : "Se connecter"}
      </Button>

      <div className="text-sm text-center pt-2">
        <Link to="/recuperation-mot-de-passe" className="text-brand-orange hover:underline">
          Mot de passe oublié ?
        </Link>
      </div>

      <p className="text-xs text-muted-foreground text-center leading-relaxed pt-2">
        En vous connectant, vous acceptez notre{" "}
        <Link to="/confidentialite" className="underline underline-offset-2 hover:opacity-80">
          Politique de confidentialité
        </Link>{" "}
        et nos{" "}
        <Link to="/cgu" className="underline underline-offset-2 hover:opacity-80">
          CGU
        </Link>
        .
      </p>
    </form>
  );
};

/** ---------- Register ---------- */
const RegisterForm = ({ userType, next }) => {
  const { toast } = useToast();
  const { signUp } = useAuth();

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [rgpdAccepted, setRgpdAccepted] = useState(false);
  const [cgvAccepted, setCgvAccepted] = useState(false);

  const isPro = isProType(userType);
  const requirePhone = false;

  // ✅ NEXT canonique basé sur tes routes réelles
  const defaultNext = isPro ? "/professionnel-dashboard" : "/dashboard-particulier";
  const safeNext = useMemo(() => sanitizeNextPath(next, defaultNext), [next, defaultNext]);

  // ✅ CRITIQUE : doit matcher EXACTEMENT tes Redirect URLs Supabase (ici /auth/callback)
  const emailRedirectTo = useMemo(() => {
    const base = getPublicSiteUrl();
    return `${base}/auth/callback?next=${encodeURIComponent(safeNext)}`;
  }, [safeNext]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!rgpdAccepted) {
      toast({
        title: "Confirmation requise",
        description: "Merci d'accepter la Politique de confidentialité et les CGU pour créer un compte.",
        variant: "destructive",
      });
      return;
    }

    if (isPro && !cgvAccepted) {
      toast({
        title: "CGV requises",
        description: "Merci d'accepter les CGV pour créer un compte professionnel.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const role = isPro ? "professionnel" : "particulier";
    const nowIso = new Date().toISOString();

    const metadata = {
      role,
      user_type: role,
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,

      cgu_accepted_at: nowIso,
      cgu_version: CGU_VERSION,
      privacy_accepted_at: nowIso,
      privacy_version: PRIVACY_VERSION,
    };

    if (isPro) {
      metadata.company_name = companyName || null;
      metadata.visibility_pro_partner_page = true;

      metadata.cgv_accepted_at = nowIso;
      metadata.cgv_version = CGV_VERSION;
    }

    const options = {
      data: metadata,
      emailRedirectTo,
    };

    try {
      const res = await signUp(email, password, options);

      const error = res?.error ?? null;
      if (error) throw error;

      // Si email confirmation ON, user peut être null selon config => on ne bloque pas
      setSubmitted(true);
    } catch (err) {
      console.error("[REGISTER ERROR]", err);
      toast({
        title: "Erreur lors de l'inscription",
        description: err?.message ?? "Une erreur est survenue. Merci de réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center p-4 bg-green-100 border border-green-200 rounded-lg text-green-800"
      >
        <MailCheck className="mx-auto h-12 w-12 text-green-500 mb-4" />
        <h3 className="text-xl font-semibold">Presque terminé !</h3>
        <p className="mt-2">
          Un e-mail de confirmation a été envoyé à <strong className="font-medium">{email}</strong>.
          Veuillez cliquer sur le lien pour activer votre compte.
        </p>
      </motion.div>
    );
  }

  const canSubmit = !loading && rgpdAccepted && (!isPro || cgvAccepted);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">Prénom</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            autoComplete="given-name"
          />
        </div>
        <div>
          <Label htmlFor="lastName">Nom</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            autoComplete="family-name"
          />
        </div>
      </div>

      {isPro && (
        <div>
          <Label htmlFor="companyName">Nom de l'agence (optionnel)</Label>
          <Input
            id="companyName"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            autoComplete="organization"
          />
        </div>
      )}

      <div>
        <Label htmlFor="phone">Téléphone</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required={requirePhone}
          placeholder="06 12 34 56 78"
          autoComplete="tel"
        />
      </div>

      <div>
        <Label htmlFor="email-register">Email</Label>
        <Input
          id="email-register"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div>
        <Label htmlFor="password-register">Mot de passe</Label>
        <div className="relative">
          <Input
            id="password-register"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </Button>
        </div>
      </div>

      <div className="rounded-md border p-3 space-y-3">
        <div className="flex items-start gap-2">
          <Checkbox checked={rgpdAccepted} onCheckedChange={(v) => setRgpdAccepted(!!v)} />
          <p className="text-xs text-muted-foreground leading-relaxed">
            J’ai pris connaissance de la{" "}
            <Link to="/confidentialite" className="underline underline-offset-2 hover:opacity-80">
              Politique de confidentialité
            </Link>{" "}
            et j’accepte les{" "}
            <Link to="/cgu" className="underline underline-offset-2 hover:opacity-80">
              CGU
            </Link>
            .{" "}
            <span className="text-[11px] text-muted-foreground">
              (v. {PRIVACY_VERSION} / {CGU_VERSION})
            </span>
          </p>
        </div>

        {isPro && (
          <div className="flex items-start gap-2">
            <Checkbox checked={cgvAccepted} onCheckedChange={(v) => setCgvAccepted(!!v)} />
            <p className="text-xs text-muted-foreground leading-relaxed">
              J’ai lu et j’accepte les{" "}
              <Link to="/cgv" className="underline underline-offset-2 hover:opacity-80">
                CGV
              </Link>
              .{" "}
              <span className="text-[11px] text-muted-foreground">(v. {CGV_VERSION})</span>
            </p>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Astuce : évitez de saisir des informations sensibles (santé, données bancaires…).
        </p>
      </div>

      <Button
        type="submit"
        disabled={!canSubmit}
        className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white"
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
        {loading ? "Création..." : "Créer mon compte"}
      </Button>
    </form>
  );
};

/** ---------- Wrapper ---------- */
const AuthForm = ({
  userType = "particulier",
  initialTab = "login",
  view = "tabs",
  next,
}) => {
  const pro = isProType(userType);

  const title = pro ? "Espace Professionnel" : "Espace Particulier";
  const description = pro
    ? "Accédez à vos outils ou rejoignez la plateforme."
    : "Gérez vos projets ou créez votre compte.";

  // ✅ IMPORTANT: chez toi la route réel particulier est /dashboard-particulier
  const defaultNext = pro ? "/professionnel-dashboard" : "/dashboard-particulier";

  // ✅ on sanitise dès ici pour éviter de propager du mauvais next dans l’emailRedirectTo
  const nextPath = useMemo(() => sanitizeNextPath(next, defaultNext), [next, defaultNext]);

  if (view === "sign_up") {
    return (
      <Card className="w-full max-w-md shadow-lg border-none">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-brand-blue">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm userType={pro ? "professionnel" : "particulier"} next={nextPath} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-none">
      <Tabs defaultValue={initialTab}>
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl text-brand-blue">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Connexion</TabsTrigger>
            <TabsTrigger value="register">Inscription</TabsTrigger>
          </TabsList>

          <motion.div
            key={initialTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6"
          >
            <TabsContent value="login">
              <LoginForm next={nextPath} userType={pro ? "professionnel" : "particulier"} />
            </TabsContent>
            <TabsContent value="register">
              <RegisterForm userType={pro ? "professionnel" : "particulier"} next={nextPath} />
            </TabsContent>
          </motion.div>
        </CardContent>
      </Tabs>
    </Card>
  );
};

export default AuthForm;