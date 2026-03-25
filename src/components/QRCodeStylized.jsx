// src/components/QRCodeStylized.jsx
import React, { useEffect, useState, useRef } from "react";
import { QRCode } from "react-qrcode-logo";

import { safeFetch, isIgnorableFetchError, isSigningOutOrUnloading } from "../lib/fetchUtils";

const isFilled = (v) => v !== undefined && v !== null && String(v).trim() !== "";

const QRCodeStylized = ({ value, size = 128, logoSrc, fgColor = "#005E9E" }) => {
  const [base64Logo, setBase64Logo] = useState(null);

  // ✅ évite les setState après unmount + ignore réponses "anciennes"
  const mountedRef = useRef(true);
  const runIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      runIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    const runId = ++runIdRef.current;

    const safeSet = (v) => {
      if (mountedRef.current && runId === runIdRef.current) setBase64Logo(v);
    };

    const src = isFilled(logoSrc) ? String(logoSrc).trim() : "";

    // 0) pas de logo => reset immédiat (important si on vient de désactiver le switch)
    if (!src) {
      safeSet(null);
      return;
    }

    // 1) déjà en data URL -> direct
    if (src.startsWith("data:")) {
      safeSet(src);
      return;
    }

    // 2) pendant logout/navigation -> ne lance rien
    if (isSigningOutOrUnloading()) {
      safeSet(null);
      return;
    }

    const controller = new AbortController();

    const convertImageToBase64 = async () => {
      try {
        const response = await safeFetch(src, {
          mode: "cors",
          signal: controller.signal,
        });

        if (!response?.ok) {
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText || ""}`.trim());
        }

        const blob = await response.blob();
        const reader = new FileReader();

        const onAbort = () => {
          try {
            reader.abort();
          } catch {
            // noop
          }
        };

        controller.signal.addEventListener("abort", onAbort, { once: true });

        reader.onloadend = () => {
          controller.signal.removeEventListener("abort", onAbort);

          if (
            !mountedRef.current ||
            runId !== runIdRef.current ||
            controller.signal.aborted ||
            isSigningOutOrUnloading()
          ) {
            return;
          }

          safeSet(reader.result || null);
        };

        reader.readAsDataURL(blob);
      } catch (error) {
        if (controller.signal.aborted || isSigningOutOrUnloading() || isIgnorableFetchError(error)) return;

        // ⚠️ fallback visuel (si CORS bloque)
        console.warn("Error converting QR logo to base64 (CORS might be disabled on server):", error);
        safeSet(src);
      }
    };

    convertImageToBase64();

    return () => {
      controller.abort();
    };
  }, [logoSrc]);

  return (
    <div className="p-2 bg-white rounded-lg shadow-md inline-block">
      <QRCode
        id="react-qrcode-logo"
        value={value}
        size={size}
        // ✅ IMPORTANT : si base64Logo est null => pas de logo
        logoImage={base64Logo || undefined}
        logoWidth={size * 0.3}
        logoHeight={size * 0.3}
        logoPadding={2}
        logoPaddingStyle="circle"
        qrStyle="dots"
        eyeRadius={5}
        fgColor={fgColor}
        bgColor="#FFFFFF"
      />
    </div>
  );
};

export default QRCodeStylized;