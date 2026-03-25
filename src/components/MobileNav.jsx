import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogOut, User, LayoutDashboard, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

const MobileNav = ({
  isOpen,
  setIsOpen,
  onAuthClick,
  navLinks,
  user,
  profile,
  signOut,
  dashboardPath
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    navigate('/');
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  // Animation variants
  const backdropVariants = {
    closed: { opacity: 0 },
    open: { opacity: 1 },
  };

  const drawerVariants = {
    closed: { x: '-100%' },
    open: { x: 0 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial="closed"
            animate="open"
            exit="closed"
            variants={backdropVariants}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial="closed"
            animate="open"
            exit="closed"
            variants={drawerVariants}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 w-[280px] bg-white shadow-2xl flex flex-col h-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <NavLink to="/" onClick={() => setIsOpen(false)}>
                <img
                  className="h-8 w-auto"
                  src="https://horizons-cdn.hostinger.com/f7eb5659-bed0-4bf7-847c-ea6067478f08/81bc2da05b2ffbe090fd1540a48ac891.png"
                  alt="LivingRoom.immo"
                />
              </NavLink>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-500" />
              </Button>
            </div>

            {/* Navigation Links */}
            <ScrollArea className="flex-1 px-6 py-6">
              <nav className="flex flex-col space-y-1">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-brand-orange/10 text-brand-orange'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-brand-blue'
                      }`
                    }
                  >
                    {link.text}
                    <ChevronRight className={`h-4 w-4 ${location.pathname === link.to ? 'text-brand-orange' : 'text-gray-300'}`} />
                  </NavLink>
                ))}
              </nav>
            </ScrollArea>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-100 bg-gray-50/50">
              {user ? (
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center space-x-3 mb-2 px-1">
                    <div className="h-10 w-10 rounded-full bg-brand-blue/10 flex items-center justify-center">
                       <span className="text-brand-blue font-semibold text-sm">
                         {profile?.first_name ? profile.first_name[0].toUpperCase() : user.email[0].toUpperCase()}
                       </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {profile?.first_name || 'Utilisateur'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                            {user.email}
                        </p>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-brand-blue hover:bg-blue-700 text-white shadow-sm" 
                    onClick={() => handleNavigation(dashboardPath)}
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Mon Espace
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleSignOut} 
                    className="w-full text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </Button>
                </div>
              ) : (
                <Button 
                  className="w-full bg-brand-orange hover:bg-orange-600 text-white shadow-md transition-all hover:translate-y-[-1px]" 
                  onClick={() => { setIsOpen(false); onAuthClick(); }}
                >
                  <User className="mr-2 h-4 w-4" />
                  Connexion / Inscription
                </Button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileNav;