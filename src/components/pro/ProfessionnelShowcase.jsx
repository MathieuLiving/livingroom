import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  MapPin, Briefcase, MessageSquare, User, Link, Linkedin, Facebook, Instagram, Youtube,
  Building, Home, Search, ShoppingCart, Tag, Star
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import ProjectCardParticulier from '@/components/particulier/ProjetCardParticulier';

const isFilled = (v) => v !== undefined && v !== null && String(v).trim() !== '';

const SocialLink = ({ href, icon: Icon, label }) => {
  if (!isFilled(href)) return null;
  const url = href.startsWith('http') ? href : `https://${href}`;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" title={label}>
      <Button variant="outline" size="icon" className="rounded-full">
        <Icon className="h-5 w-5" />
      </Button>
    </a>
  );
};

const ProfessionnelShowcase = ({ professionnel, buyingProjects, sellingProjects }) => {
  const navigate = useNavigate();

  const first = (professionnel?.first_name || '').trim().charAt(0).toUpperCase();
  const last = (professionnel?.last_name || '').trim().charAt(0).toUpperCase();
  const initials = (first || last) ? `${first}${last}` : '';

  const goToDirectLeads = () => {
    if (!professionnel?.id) return;
    navigate(`/preciser-projet/${professionnel.id}`, {
      state: { from: `/nos-professionnels-partenaires/${professionnel.id}` },
    });
  };

  const scopeAreas = [
    professionnel?.scope_intervention_choice_1,
    professionnel?.scope_intervention_choice_2,
    professionnel?.scope_intervention_choice_3,
  ].filter(isFilled);

  return (
    <div className="bg-slate-50 min-h-screen">
      <header className="relative bg-brand-blue text-white py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue to-blue-800 opacity-80"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
              <AvatarImage src={professionnel?.avatar_url} alt={`${professionnel?.first_name} ${professionnel?.last_name}`} />
              <AvatarFallback className="text-5xl bg-slate-200 text-brand-blue">{initials || <User />}</AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left">
              <h1 className="text-4xl font-bold">{`${professionnel?.first_name || ''} ${professionnel?.last_name || ''}`}</h1>
              <p className="text-xl text-brand-orange font-medium mt-1">{professionnel?.function || 'Professionnel Immobilier'}</p>
              <p className="text-lg text-blue-200">{professionnel?.company_name}</p>
            </div>
            {professionnel?.logo_url && (
              <div className="ml-auto bg-white p-3 rounded-lg shadow-md hidden md:block">
                <img src={professionnel.logo_url} alt="Logo Agence" className="max-h-16 object-contain" />
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 -mt-16 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {isFilled(professionnel?.professionnal_presentation) && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-brand-blue flex items-center gap-2"><User className="h-5 w-5" /> Présentation</CardTitle>
                </CardHeader>
                <CardContent>
<p className="text-gray-700 whitespace-pre-wrap">{professionnel.professionnal_presentation}</p>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-brand-blue flex items-center gap-2"><Search className="h-5 w-5" /> Biens recherchés par ce professionnel</CardTitle>
                <CardDescription>Projets d'achat actifs pour lesquels ce professionnel recherche des biens.</CardDescription>
              </CardHeader>
              <CardContent>
                {buyingProjects && buyingProjects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {buyingProjects.map(project => (
                      <ProjectCardParticulier
                        key={project.id}
                        project={{ ...project, origin: 'professionnel', project_type: 'achat' }}
                        isOwner={false}
                        onClick={() => goToDirectLeads()}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Aucun bien recherché pour le moment.</p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-brand-blue flex items-center gap-2"><Home className="h-5 w-5" /> Biens proposés par ce professionnel</CardTitle>
                <CardDescription>Propriétés actuellement en vente gérées par ce professionnel.</CardDescription>
              </CardHeader>
              <CardContent>
                {sellingProjects && sellingProjects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sellingProjects.map(project => (
                      <ProjectCardParticulier
                        key={project.id}
                        project={{ ...project, origin: 'professionnel', project_type: 'vente' }}
                        isOwner={false}
                        onClick={() => goToDirectLeads()}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Aucun bien proposé pour le moment.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-brand-blue flex items-center gap-2"><Briefcase className="h-5 w-5" /> Contact & Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={goToDirectLeads} className="w-full bg-brand-orange hover:bg-orange-600">
                  <MessageSquare className="mr-2 h-4 w-4" /> Me préciser votre projet
                </Button>
                {scopeAreas.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2"><MapPin className="h-4 w-4" /> Zones d'intervention</h4>
                    <div className="flex flex-wrap gap-2">
                      {scopeAreas.map((area, index) => (
                        <Badge key={index} variant="secondary">{area}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-center space-x-2 pt-2">
                  <SocialLink href={professionnel?.agency_website_url} icon={Link} label="Site web" />
                  <SocialLink href={professionnel?.linkedin_url} icon={Linkedin} label="LinkedIn" />
                  <SocialLink href={professionnel?.facebook_url} icon={Facebook} label="Facebook" />
                  <SocialLink href={professionnel?.instagram_url} icon={Instagram} label="Instagram" />
                  <SocialLink href={professionnel?.youtube_url} icon={Youtube} label="YouTube" />
                </div>
                {isFilled(professionnel?.customer_review_url) && (
                  <a href={professionnel.customer_review_url.startsWith('http') ? professionnel.customer_review_url : `https://${professionnel.customer_review_url}`} target="_blank" rel="noopener noreferrer" className="w-full">
                    <Button variant="outline" className="w-full">
                      <Star className="mr-2 h-4 w-4" /> Voir les avis clients
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfessionnelShowcase;