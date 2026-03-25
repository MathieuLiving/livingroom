import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, LogIn } from 'lucide-react';
import SEO from '@/components/SEO';

const EmailConfirmationPage = () => {
  return (
    <div className="container mx-auto px-4 py-20 flex items-center justify-center bg-gray-50 min-h-[calc(100vh-200px)]">
      <SEO
        title="Email Confirmé - LivingRoom.immo"
        description="Votre adresse e-mail a été confirmée avec succès. Vous pouvez maintenant vous connecter."
      />
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Card className="w-full max-w-md text-center shadow-2xl rounded-2xl overflow-hidden border-2 border-green-500 bg-white">
          <CardHeader className="bg-gradient-to-br from-green-50 to-emerald-100 p-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
              className="mx-auto bg-white rounded-full h-24 w-24 flex items-center justify-center shadow-lg"
            >
              <CheckCircle className="h-16 w-16 text-green-600" />
            </motion.div>
            <CardTitle className="text-3xl font-bold text-brand-dark-blue mt-6">Email Confirmé !</CardTitle>
            <CardDescription className="text-gray-700 text-lg mt-2">
              Votre compte a été activé avec succès.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <p className="text-gray-600">Bienvenue chez LivingRoom.immo ! Vous pouvez désormais vous connecter à votre espace personnel pour une expérience immobilière unique.</p>
          </CardContent>
          <CardFooter className="p-6 bg-gray-50">
            <Button asChild size="lg" className="w-full bg-brand-blue hover:bg-opacity-90 text-white text-lg py-6 rounded-xl transition-transform transform hover:scale-105">
              <Link to="/porteur-projet">
                <LogIn className="mr-3 h-5 w-5" />
                Accéder à mon espace
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default EmailConfirmationPage;