import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus } from 'lucide-react';
import SEO from '@/components/SEO';

const CreateAdminPage = () => {
  const { profile, loading: authLoading, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && (!profile || profile.role !== 'admin')) {
      navigate('/admin/dashboard');
      toast({
        variant: 'destructive',
        title: 'Accès non autorisé',
        description: 'Vous devez être administrateur pour accéder à cette page.',
      });
    }
  }, [profile, authLoading, navigate, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signUp(email, password, {
        data: {
            first_name: firstName,
            last_name: lastName,
            role: 'admin'
        }
    });

    if (!error) {
        toast({
            title: 'Succès !',
            description: "Le compte administrateur a été créé. Un email de confirmation a été envoyé.",
        });
        setEmail('');
        setPassword('');
        setFirstName('');
        setLastName('');
    }
    
    setLoading(false);
  };
  
  if (authLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-brand-blue" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-10">
       <SEO
        title="Créer un Administrateur"
        description="Page sécurisée pour la création de nouveaux comptes administrateur."
      />
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center text-brand-blue">
            <UserPlus className="mr-2" /> Créer un nouvel administrateur
          </CardTitle>
          <CardDescription>
            Remplissez les informations pour créer un nouveau compte administrateur.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength="6"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Créer le compte'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/admin/dashboard')} className="w-full">
                Annuler
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default CreateAdminPage;