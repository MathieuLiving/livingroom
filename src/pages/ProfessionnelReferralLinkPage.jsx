import React, { useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Copy, Share2, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import QRCodeStylized from '@/components/QRCodeStylized';
import SEO from '@/components/SEO';
import { useNavigate } from 'react-router-dom';

const ProfessionnelReferralLinkPage = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    
    if (!user) {
        navigate('/pro-de-limmo');
        return null;
    }

    const digitalCardUrl = `${window.location.origin}/carte-visite-digitale/${user.id}`;
    const projectSubmissionUrl = `${window.location.origin}/preciser-projet/${user.id}`;
    
    const copyToClipboard = (text, type) => {
        navigator.clipboard.writeText(text).then(() => {
            toast({ title: 'Copié !', description: `Le lien de ${type} a été copié.` });
        }).catch(() => {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de copier le lien.' });
        });
    };

    const handleShare = async (url, title, text) => {
        if (navigator.share) {
            try {
                await navigator.share({ title, text, url });
            } catch (error) {
                console.error('Erreur de partage :', error);
            }
        } else {
            copyToClipboard(url, title);
        }
    };

    return (
        <div className="container mx-auto px-4 py-10">
            <SEO title="Partage & Réseau" description="Partagez votre carte de visite et vos liens de soumission de projet pour développer votre réseau." />
            <h1 className="text-3xl font-bold mb-6 text-brand-blue">Partage & Réseau</h1>

            <div className="grid md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Carte de Visite Digitale</CardTitle>
                        <CardDescription>Votre profil professionnel complet à partager. Idéal pour le networking.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center space-y-4">
                        <div className="p-4 bg-white rounded-lg border">
                           <QRCodeStylized value={digitalCardUrl} />
                        </div>
                        <div className="w-full relative">
                            <Input type="text" value={digitalCardUrl} readOnly className="pr-10" />
                            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => copyToClipboard(digitalCardUrl, "carte de visite")}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button className="w-full" onClick={() => handleShare(digitalCardUrl, 'Ma Carte de Visite Digitale', 'Découvrez mon profil professionnel.')}>
                            <Share2 className="mr-2 h-4 w-4" /> Partager ma carte
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Lien de Soumission de Projet</CardTitle>
                        <CardDescription>Permettez à vos contacts de vous soumettre leurs projets immobiliers directement.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center space-y-4">
                        <div className="p-4 bg-white rounded-lg border">
                            <QRCodeStylized value={projectSubmissionUrl} />
                        </div>
                        <div className="w-full relative">
                            <Input type="text" value={projectSubmissionUrl} readOnly className="pr-10" />
                            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => copyToClipboard(projectSubmissionUrl, "soumission de projet")}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                         <Button className="w-full" onClick={() => handleShare(projectSubmissionUrl, 'Soumettre un Projet Immobilier', 'Vous avez un projet ? Soumettez-le moi directement.')}>
                            <Share2 className="mr-2 h-4 w-4" /> Partager le lien de soumission
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ProfessionnelReferralLinkPage;