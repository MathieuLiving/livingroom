import { enqueueNotification } from "./notifications";

/**
 * Sends an agency invitation email via the notification system.
 * 
 * @param {Object} params
 * @param {string} params.recipientEmail - The email of the invited person
 * @param {string} params.inviterName - Name of the person sending the invite (Director/TL)
 * @param {string} params.agencyName - Name of the agency
 * @param {string} params.invitationToken - The unique token for the URL
 * @param {string} params.temporaryCode - The 6-digit code for verification
 * @param {string} params.roleLabel - e.g., "Agent Commercial" or "Team Leader"
 */
export async function sendAgencyInvitationEmail({
  recipientEmail,
  inviterName,
  agencyName,
  invitationToken,
  temporaryCode,
  roleLabel = "Collaborateur",
}) {
  const invitationLink = `${window.location.origin}/agency-invitation?token=${invitationToken}`;

  return enqueueNotification({
    type: "agency_invitation",
    recipientEmail,
    subject: `Invitation LivingRoom – Accès à votre espace agence ${agencyName}`,
    payload: {
      inviter_name: inviterName,
      agency_name: agencyName,
      role_label: roleLabel,
      temporary_code: temporaryCode,
      invitation_link: invitationLink,
      cta_url: invitationLink, // Standard CTA for templates
      
      // Fallback text if template is generic
      preheader: `${inviterName} vous invite à rejoindre ${agencyName} sur LivingRoom.`,
      content_html: `
        <p>Bonjour,</p>
        <p><strong>${inviterName}</strong> vous invite à rejoindre l'équipe <strong>${agencyName}</strong> en tant que ${roleLabel}.</p>
        <p>Pour activer votre compte, veuillez cliquer sur le bouton ci-dessous et utiliser votre code temporaire.</p>
        <div style="background:#f3f4f6; padding:15px; border-radius:8px; text-align:center; margin: 20px 0;">
          <span style="font-size:14px; color:#6b7280; display:block; margin-bottom:5px;">Votre code d'accès temporaire :</span>
          <strong style="font-size:24px; letter-spacing:4px; color:#111827;">${temporaryCode}</strong>
        </div>
      `
    }
  });
}