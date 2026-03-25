import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, ShieldCheck } from "lucide-react";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const CookieBanner = () => {
  const { showBanner, acceptCookies, declineCookies } = useCookieConsent();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(true);

  if (!showBanner) return null;

  const handleSavePreferences = () => {
    // Since our hook currently only supports binary consent (all or nothing),
    // we'll map the "marketing" switch to full consent.
    // In a more complex implementation, we would store granular preferences.
    if (marketingEnabled) {
      acceptCookies();
    } else {
      declineCookies();
    }
    setIsSettingsOpen(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
        >
          <div className="container max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1 space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                <Cookie className="h-5 w-5 text-brand-orange" />
                Respect de votre vie privée
              </h3>
              <p className="text-sm text-gray-600 max-w-3xl leading-relaxed">
                Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic et personnaliser le contenu. 
                Vous pouvez accepter tous les cookies, les refuser ou personnaliser vos choix. 
                Votre choix est conservé pendant 6 mois.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto min-w-fit">
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="whitespace-nowrap font-medium">
                    Paramétrer
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Paramètres des cookies</DialogTitle>
                    <DialogDescription>
                      Gérez vos préférences en matière de cookies. Les cookies nécessaires au bon fonctionnement du site ne peuvent pas être désactivés.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="py-4 space-y-6">
                    <div className="flex items-start justify-between space-x-4">
                      <div className="flex flex-col space-y-1">
                        <Label htmlFor="necessary" className="font-semibold flex items-center gap-2 text-base">
                          <ShieldCheck className="h-4 w-4 text-green-600" />
                          Cookies nécessaires
                        </Label>
                        <span className="text-xs text-muted-foreground leading-snug">
                          Indispensables au fonctionnement du site (session, sécurité). Ils sont toujours actifs.
                        </span>
                      </div>
                      <Switch id="necessary" checked disabled />
                    </div>

                    <div className="flex items-start justify-between space-x-4">
                      <div className="flex flex-col space-y-1">
                        <Label htmlFor="marketing" className="font-semibold text-base">
                          Mesure d'audience & Marketing
                        </Label>
                        <span className="text-xs text-muted-foreground leading-snug">
                          Nous aident à comprendre comment vous utilisez le site pour l'améliorer et vous proposer du contenu pertinent.
                        </span>
                      </div>
                      <Switch 
                        id="marketing" 
                        checked={marketingEnabled} 
                        onCheckedChange={setMarketingEnabled} 
                      />
                    </div>
                  </div>

                  <DialogFooter className="flex-col sm:flex-row gap-2">
                     <Button 
                       variant="outline" 
                       onClick={() => { declineCookies(); setIsSettingsOpen(false); }} 
                       className="sm:mr-auto"
                     >
                      Tout refuser
                    </Button>
                    <Button onClick={handleSavePreferences} className="bg-brand-blue hover:bg-brand-blue/90 text-white">
                      Enregistrer mes choix
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={declineCookies}
                className="whitespace-nowrap font-medium"
              >
                Tout refuser
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={acceptCookies}
                className="bg-brand-blue hover:bg-brand-blue/90 whitespace-nowrap font-medium text-white"
              >
                Tout accepter
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;