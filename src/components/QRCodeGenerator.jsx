// src/components/QRCodeGenerator.jsx
import React, { useMemo } from "react";
import { QRCode } from "react-qrcode-logo";

const isFilled = (v) => v !== undefined && v !== null && String(v).trim() !== "";

const normalizeUrl = (v) => {
  const s = String(v || "").trim();
  return s || "";
};

const normalizeColor = (v, fallback = "#000000") => {
  const s = String(v || "").trim();
  return /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(s) ? s : fallback;
};

/**
 * QR Code generator (scannability-first).
 *
 * Règles :
 * - si withLogo = false => aucun logo injecté
 * - si logoUrl vide => aucun logo injecté
 * - niveau de correction :
 *    - H avec logo
 *    - M sans logo
 *
 * Ce composant reste neutre :
 * - il ne décide pas quel logo utiliser
 * - il applique seulement ce qu'on lui passe
 */
const QRCodeGenerator = ({
  url,
  logoUrl,
  withLogo = false,
  fgColor = "#000000",
  size = 450,
  id = "cvd-qr-code-canvas",
  quietZone = 40,
  ecLevel,
  className = "",
}) => {
  const safeUrl = normalizeUrl(url);
  const safeLogoUrl = normalizeUrl(logoUrl);
  const safeFgColor = normalizeColor(fgColor, "#000000");

  const hasLogo = Boolean(withLogo && isFilled(safeLogoUrl));
  const effectiveEcLevel = ecLevel || (hasLogo ? "H" : "M");

  const logoProps = hasLogo
    ? {
        logoImage: safeLogoUrl,
        logoWidth: Math.round(size * 0.24),
        logoHeight: Math.round(size * 0.24),
        logoOpacity: 1,
        removeQrCodeBehindLogo: true,
        logoPadding: 6,
        logoPaddingStyle: "circle",
        enableCORS: true,
      }
    : {};

  const qrKey = useMemo(
    () =>
      [
        safeUrl,
        safeLogoUrl,
        String(hasLogo),
        safeFgColor,
        String(size),
        String(quietZone),
        effectiveEcLevel,
      ].join("|"),
    [safeUrl, safeLogoUrl, hasLogo, safeFgColor, size, quietZone, effectiveEcLevel]
  );

  if (!safeUrl) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-400 ${className}`}
        style={{ width: size, height: size }}
      >
        URL indisponible
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center overflow-hidden rounded-xl bg-white p-6 shadow-sm ${className}`}
    >
      <QRCode
        key={qrKey}
        id={id}
        value={safeUrl}
        size={size}
        fgColor={safeFgColor}
        bgColor="#FFFFFF"
        qrStyle="squares"
        eyeRadius={0}
        quietZone={quietZone}
        ecLevel={effectiveEcLevel}
        {...logoProps}
      />
    </div>
  );
};

export default QRCodeGenerator;