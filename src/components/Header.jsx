// src/components/Header.jsx
import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

import { Button } from "./ui/button";
import { LogOut, Menu, User, Briefcase, Home } from "lucide-react";

import { useAuth } from "../contexts/SupabaseAuthContext";
import AuthForm from "./auth/AuthForm";
import MobileNav from "./MobileNav";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";

// Clean text-only navigation items
const navLinks = [
  { to: "/place-des-projets", text: "Place des projets" },
  { to: "/particuliers", text: "Particuliers" },
  { to: "/pro-de-limmo", text: "Agents indépendants" },
  { to: "/reseau-agences", text: "Réseaux et Agences" },
  { to: "/nos-professionnels-partenaires", text: "Nos agents partenaires" },
  { to: "/blog", text: "Blog" },
];

const RoleSelectionModal = ({ isOpen, onOpenChange, onSelectRole }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center text-brand-blue">
            Bienvenue sur LivingRoom
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            Pour commencer, dites-nous qui vous êtes.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4 pt-4">
          <Button
            onClick={() => onSelectRole("particulier")}
            className="w-full h-20 text-lg bg-brand-blue hover:bg-blue-700 transition-colors shadow-sm group"
          >
            <div className="bg-white/20 p-2 rounded-full mr-4 group-hover:scale-110 transition-transform">
              <Home className="h-6 w-6" />
            </div>
            Je suis un Particulier
          </Button>

          <Button
            onClick={() => onSelectRole("professionnel")}
            className="w-full h-20 text-lg bg-brand-orange hover:bg-orange-600 transition-colors shadow-sm group"
          >
            <div className="bg-white/20 p-2 rounded-full mr-4 group-hover:scale-110 transition-transform">
              <Briefcase className="h-6 w-6" />
            </div>
            Je suis un Professionnel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Header = () => {
  const { user, signOut, loading, isAuthBusy, profileLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isRoleSelectionModalOpen, setIsRoleSelectionModalOpen] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState("particulier");
  const [scrolled, setScrolled] = useState(false);

  // ✅ Debug logging
  useEffect(() => {
    console.log('[Header] Auth state:', {
      hasUser: !!user,
      loading,
      isAuthBusy,
      profileLoading,
      userId: user?.id,
    });
  }, [user, loading, isAuthBusy, profileLoading]);

  // ✅ Route unique, robuste : le hub décide selon admin/pro/particulier
  const espacePath = "/mon-espace";

  // Sticky header shadow on scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Close auth modals when user logs in
  useEffect(() => {
    if (user && (isAuthModalOpen || isRoleSelectionModalOpen)) {
      console.log('[Header] User logged in, closing auth modals');
      setIsAuthModalOpen(false);
      setIsRoleSelectionModalOpen(false);
    }
  }, [user, isAuthModalOpen, isRoleSelectionModalOpen]);

  const handleSignOut = async () => {
    console.log('[Header] Sign out triggered');
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error('[Header] ❌ Sign out error:', error);
    }
  };

  const handleAuthClick = () => {
    console.log('[Header] Auth button clicked');
    setIsRoleSelectionModalOpen(true);
  };

  const handleRoleSelect = (role) => {
    console.log('[Header] Role selected:', role);
    setSelectedUserType(role);
    setIsRoleSelectionModalOpen(false);
    setIsAuthModalOpen(true);
  };

  // ✅ "Mon Espace" navigation with proper error handling
  const handleMonEspace = () => {
    console.log('[Header] Mon Espace clicked, navigating to:', espacePath);
    try {
      navigate(espacePath);
    } catch (error) {
      console.error('[Header] ❌ Navigation error:', error);
    }
  };

  // ✅ MobileNav reçoit la même route hub
  const dashboardPath = espacePath;

  // ✅ Désactiver le bouton pendant le chargement
  const monEspaceDisabled = Boolean(loading || isAuthBusy || profileLoading);

  // ✅ Show/hide button based on auth state
  const showMonEspaceButton = !loading && !isAuthBusy && !!user;

  console.log('[Header] Button state:', {
    showMonEspaceButton,
    monEspaceDisabled,
    hasUser: !!user,
  });

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className={`sticky top-0 z-30 w-full transition-all duration-300 border-b ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-sm border-gray-200"
            : "bg-white border-transparent"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <NavLink to="/" className="group">
                <img
                  className="h-8 w-auto transition-transform duration-300 group-hover:scale-105"
                  src="https://horizons-cdn.hostinger.com/f7eb5659-bed0-4bf7-847c-ea6067478f08/81bc2da05b2ffbe090fd1540a48ac891.png"
                  alt="LivingRoom.immo"
                />
              </NavLink>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center justify-center space-x-8">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => `
                    group relative py-2 text-sm font-semibold transition-colors duration-200
                    ${isActive ? "text-brand-orange" : "text-blue-700 hover:text-blue-800"}
                  `}
                >
                  {({ isActive }) => (
                    <>
                      {link.text}
                      <span
                        className={`
                          absolute bottom-0 left-0 w-full h-0.5 bg-brand-orange transform origin-left transition-transform duration-300 ease-out
                          ${isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}
                        `}
                      />
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center space-x-4">
              {showMonEspaceButton ? (
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={handleMonEspace}
                    disabled={monEspaceDisabled}
                    className="bg-brand-blue text-white hover:bg-blue-700 shadow-sm transition-all hover:shadow-md disabled:opacity-60"
                  >
                    Mon Espace
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleAuthClick}
                  disabled={loading || isAuthBusy}
                  className="bg-brand-orange text-white hover:bg-orange-600 shadow-sm transition-all hover:translate-y-[-1px] hover:shadow-md font-semibold disabled:opacity-60"
                >
                  <User className="mr-2 h-4 w-4" />
                  Connexion
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(true)}
                className="text-blue-700 hover:bg-gray-100"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Navigation Drawer */}
      <MobileNav
        isOpen={isMenuOpen}
        setIsOpen={setIsMenuOpen}
        onAuthClick={handleAuthClick}
        navLinks={navLinks}
        user={user}
        profile={null}
        signOut={signOut}
        dashboardPath={dashboardPath}
      />

      {/* Auth Modals */}
      <RoleSelectionModal
        isOpen={isRoleSelectionModalOpen}
        onOpenChange={setIsRoleSelectionModalOpen}
        onSelectRole={handleRoleSelect}
      />

      <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white border-none shadow-2xl">
          <div className="p-6">
            <AuthForm userType={selectedUserType} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Header;