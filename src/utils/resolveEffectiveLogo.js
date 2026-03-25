import { getLogoUrl } from "@/utils/storageAssets";

const normalize = (value) => {
  const v = String(value ?? "").trim();
  return v || "";
};

const isAgencyMember = (pro) => {
  if (!pro) return false;

  const agencyId = normalize(pro.agency_id);
  const role = normalize(pro.agency_role).toLowerCase();

  if (!agencyId) return false;

  return (
    role === "director" ||
    role === "team_leader" ||
    role === "agent" ||
    role === "agent_affiliate"
  );
};

/**
 * Détermine l'URL du logo à afficher.
 *
 * Règles métier :
 * - pro rattaché à une agence (director, team_leader, agent, agent_affiliate)
 *   => priorité au logo agence
 *   => fallback sur le logo perso si le logo agence n'est pas renseigné
 *
 * - pro indépendant
 *   => priorité au logo perso
 *
 * Ordre de priorité :
 *
 * Membres d'agence :
 *   1) agency.logo_path
 *   2) agency.logo_url
 *   3) pro.custom_logo_url
 *   4) pro.logo_path
 *   5) pro.logo_url
 *
 * Indépendants :
 *   1) pro.custom_logo_url
 *   2) pro.logo_path
 *   3) pro.logo_url
 */
export const resolveEffectiveLogoUrl = (pro, agency) => {
  if (!pro) return "";

  const agencyMember = isAgencyMember(pro);

  if (agencyMember) {
    const agencyPathUrl = getLogoUrl(agency?.logo_path || agency?.logo_storage_path);
    if (agencyPathUrl) return agencyPathUrl;

    const agencyDirectUrl = normalize(agency?.logo_url);
    if (agencyDirectUrl) return agencyDirectUrl;

    const customLogoUrl = normalize(pro?.custom_logo_url);
    if (customLogoUrl) return customLogoUrl;

    const proPathUrl = getLogoUrl(pro?.logo_path);
    if (proPathUrl) return proPathUrl;

    const proLegacyUrl = normalize(pro?.logo_url);
    if (proLegacyUrl) return proLegacyUrl;

    return "";
  }

  const customLogoUrl = normalize(pro?.custom_logo_url);
  if (customLogoUrl) return customLogoUrl;

  const proPathUrl = getLogoUrl(pro?.logo_path);
  if (proPathUrl) return proPathUrl;

  const proLegacyUrl = normalize(pro?.logo_url);
  if (proLegacyUrl) return proLegacyUrl;

  return "";
};

export default resolveEffectiveLogoUrl;