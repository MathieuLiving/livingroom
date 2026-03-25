// src/pages/SignUpProPage.jsx
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";

import AuthForm from "@/components/auth/AuthForm";
import SEO from "@/components/SEO";

const SignUpProPage = () => {
  const location = useLocation();

  // Permet de respecter un éventuel ?next= interne
  const next = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const p = params.get("next");

    const isSafe =
      typeof p === "string" &&
      p.startsWith("/") &&
      !p.startsWith("//") &&
      !p.includes("\\");

    return isSafe ? p : "/professionnel-dashboard";
  }, [location.search]);

  return (
    <>
      <SEO
        title="Inscription Professionnel - LivingRoom.immo"
        description="Créez votre compte professionnel sur LivingRoom.immo et accédez à un réseau de porteurs de projets qualifiés."
      />

      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <Link to="/">
              <img
                className="h-12 mx-auto"
                src="https://horizons-cdn.hostinger.com/f7eb5659-bed0-4bf7-847c-ea6067478f08/2699f3a27badcb8dcd9d395f6cb7eab7.jpg"
                alt="LivingRoom.immo Logo"
              />
            </Link>

            <h1 className="mt-4 text-2xl font-semibold text-slate-800">
              Créer mon compte professionnel
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Ce compte sera utilisé pour gérer vos projets et votre visibilité
              auprès des porteurs de projets.
            </p>
          </motion.div>

          <AuthForm
            userType="professionnel"
            initialTab="register"
            next={next}
          />
        </div>
      </div>
    </>
  );
};

export default SignUpProPage;