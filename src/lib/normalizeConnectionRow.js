/**
 * Normalise une ligne issue de `connections_enriched_safe`
 * dans un format unique exploitable par les pages de connexions.
 *
 * Format de sortie attendu notamment par :
 * - ProfessionnelConnectionsPage
 * - écrans liste de demandes / chat / projet
 *
 * @param {Object} row
 * @param {string|null} currentUserId
 * @returns {Object|null}
 */
export function normalizeConnectionRow(row, currentUserId = null) {
  if (!row) return null;

  const status = String(row.status || "").toLowerCase();
  const isApproved = status === "approved" || status === "accepted";
  const isPending = status === "pending";

  const requestingUserId = row.requesting_user_id || null;
  const targetUserId = row.target_user_id || null;

  const isRequester = Boolean(currentUserId && requestingUserId === currentUserId);
  const isTarget = Boolean(currentUserId && targetUserId === currentUserId);

  const showContacts = isApproved;

  const parseRole = (value) => {
    const raw = String(value || "").toLowerCase();

    if (raw.includes("admin")) return "admin";
    if (raw.includes("pro")) return "professionnel";
    if (raw.includes("professionnel")) return "professionnel";
    return "particulier";
  };

  const maskLastName = (lastName) => {
    if (!lastName) return "";
    return `${String(lastName).charAt(0)}.`;
  };

  const buildPerson = (prefix, userId, proId = null) => {
    const role = parseRole(row[`${prefix}_role`]);
    const firstName = row[`${prefix}_first_name`] || "";
    const rawLastName = row[`${prefix}_last_name`] || "";
    const companyName =
      row[`${prefix}_company`] ||
      row[`${prefix}_agency_name`] ||
      null;

    const isMe = Boolean(currentUserId && userId === currentUserId);
    const shouldMaskIdentity = !isMe && !isApproved;

    const safeLastName = shouldMaskIdentity ? maskLastName(rawLastName) : rawLastName;
    const safeEmail = shouldMaskIdentity ? null : row[`${prefix}_email`] || null;
    const safePhone = shouldMaskIdentity ? null : row[`${prefix}_phone`] || null;

    let displayName = [firstName, safeLastName].filter(Boolean).join(" ").trim();

    if (!displayName) {
      if (companyName) {
        displayName = companyName;
      } else if (role === "professionnel") {
        displayName = "Professionnel";
      } else if (role === "admin") {
        displayName = "Administrateur";
      } else {
        displayName = "Utilisateur";
      }
    }

    return {
      id: userId || null,
      proId: proId || null,
      role,
      isProfessional: Boolean(proId || role === "professionnel"),
      name: displayName,
      first_name: firstName || null,
      last_name: safeLastName || null,
      email: safeEmail,
      phone: safePhone,
      company_name: companyName,
      company: companyName,
      agency_name: row[`${prefix}_agency_name`] || null,
      avatar: null,
    };
  };

  const requesting = buildPerson(
    "requesting",
    requestingUserId,
    row.requesting_professionnel_id || null
  );

  const target = buildPerson(
    "target",
    targetUserId,
    row.target_professionnel_id || null
  );

  const other = isRequester ? target : requesting;
  const me = isRequester ? requesting : target;

  const snap = row.project_snapshot || {};

  const firstDefined = (...values) => {
    for (const value of values) {
      if (value !== undefined && value !== null && value !== "") {
        return value;
      }
    }
    return null;
  };

  const images = [
    row.ui_image_1_url,
    row.ui_image_2_url,
    row.ui_image_3_url,
    snap.image_1_url,
    snap.image_2_url,
    snap.image_3_url,
  ].filter(Boolean);

  const uniqueImages = Array.from(new Set(images));

  const projectTitle = firstDefined(
    row.ui_title,
    snap.project_title,
    snap.title,
    snap.nom,
    "Projet"
  );

  const projectType = firstDefined(
    row.ui_type_projet,
    snap.type_projet,
    row.project_type,
    null
  );

  const propertyType = firstDefined(
    row.ui_property_type,
    snap.type_bien,
    snap.property_type,
    row.project_type_bien,
    null
  );

  const description = firstDefined(
    row.ui_description,
    snap.description,
    snap.project_description,
    null
  );

  const locationLabel = firstDefined(
    row.ui_location,
    snap.city,
    snap.ville,
    snap.localisation,
    row.project_city_choice_1,
    row.city_choice_1,
    null
  );

  const quartier = firstDefined(
    row.ui_quartier,
    snap.quartier,
    snap.quartier_choice_1,
    null
  );

  const prixDemande = firstDefined(
    row.ui_prix_demande,
    snap.prix_demande,
    null
  );

  const budgetMax = firstDefined(
    row.ui_budget_max,
    row.ui_budget,
    snap.budget_max,
    snap.budget,
    null
  );

  const surface = firstDefined(
    row.ui_surface,
    snap.surface,
    null
  );

  const surfaceMin = firstDefined(
    row.ui_surface_min,
    snap.surface_min,
    null
  );

  const surfaceMax = firstDefined(
    row.ui_surface_max,
    snap.surface_max,
    null
  );

  const bedrooms = firstDefined(
    row.ui_bedrooms,
    snap.bedrooms,
    null
  );

  const rooms = firstDefined(
    row.ui_rooms,
    snap.rooms,
    snap.chambres,
    null
  );

  const deadlineLabel = firstDefined(
    row.ui_timeline,
    snap.delai,
    snap.timeline,
    null
  );

  const project = {
    id: row.derived_project_id || row.project_marketplace_id || null,
    project_id: row.derived_project_id || row.project_marketplace_id || null,
    title: projectTitle,
    project_title: projectTitle,
    type_projet: projectType,
    type: projectType,
    property_type: propertyType,
    type_bien: propertyType,
    description,
    location_label:
      quartier && locationLabel && !String(locationLabel).includes(quartier)
        ? `${locationLabel} (${quartier})`
        : locationLabel,
    city: firstDefined(
      row.project_city_choice_1,
      row.city_choice_1,
      snap.city_choice_1,
      snap.city,
      snap.ville,
      null
    ),
    quartier,
    prix_demande: prixDemande,
    budget_max: budgetMax,
    surface,
    surface_min: surfaceMin,
    surface_max: surfaceMax,
    bedrooms,
    rooms,
    deadline_label: deadlineLabel,
    image_1_url: uniqueImages[0] || null,
    image_2_url: uniqueImages[1] || null,
    image_3_url: uniqueImages[2] || null,
    images: uniqueImages,
    has_garden: firstDefined(row.ui_has_garden, snap.has_garden, null),
    has_terrace: firstDefined(row.ui_has_terrace, snap.has_terrace, null),
    has_balcony: firstDefined(row.ui_has_balcony, snap.has_balcony, null),
    has_pool: firstDefined(row.ui_has_pool, snap.has_pool, null),
    has_elevator: firstDefined(row.ui_has_elevator, snap.has_elevator, null),
    has_cellar: firstDefined(row.ui_has_cellar, snap.has_cellar, null),
    has_parking: firstDefined(row.ui_has_parking, snap.has_parking, null),
    has_caretaker: firstDefined(row.ui_has_caretaker, snap.has_caretaker, null),
    has_clear_view: firstDefined(row.ui_has_clear_view, snap.has_clear_view, null),
    is_last_floor: firstDefined(row.ui_is_last_floor, snap.is_last_floor, null),
    source: row.derived_source || row.project_origin || null,
    origin: row.project_origin || null,
    snapshot: snap,
  };

  return {
    id: row.id,
    date: row.created_at || null,
    created_at: row.created_at || null,
    status,
    connection_type: row.connection_type || null,
    first_message: row.first_message || null,

    isRequester,
    isTarget,
    showContacts,

    me,
    other,

    requesting_user: requesting,
    target_user: target,

    project,

    requesting_user_id: requestingUserId,
    target_user_id: targetUserId,
    requesting_professionnel_id: row.requesting_professionnel_id || null,
    target_professionnel_id: row.target_professionnel_id || null,

    derived_source: row.derived_source || null,
    ui_location: row.ui_location || null,
    raw: row,
  };
}

export default normalizeConnectionRow;