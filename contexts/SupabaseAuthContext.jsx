// contexts/SupabaseAuthContext.jsx
// ✅ PROXY DE COMPATIBILITÉ (ne doit plus contenir de logique)
// Toute l'app doit utiliser: src/contexts/SupabaseAuthContext.jsx
// Ce fichier évite un crash si un import legacy traîne encore.

export * from "../src/contexts/SupabaseAuthContext.jsx";

// ✅ Si un import legacy fait "import AuthProvider from ...", on couvre aussi ce cas.
import * as mod from "../src/contexts/SupabaseAuthContext.jsx";
export default mod;