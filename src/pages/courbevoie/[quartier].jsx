import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SEO from '@/components/SEO';
import { courbevoieNeighborhoods as quartiersCourbevoie } from '@/lib/courbevoieData';
import BlogCallToAction from '@/components/blog/BlogCallToAction';

const CourbevoieQuartierPage = () => {
  const { quartierSlug } = useParams();
  const quartier = quartiersCourbevoie.find(q => q.slug === quartierSlug);

  if (!quartier) {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <h1 className="text-3xl font-bold text-brand-blue">Quartier non trouvé</h1>
        <p className="text-gray-600 mt-4">Désolé, la page pour ce quartier de Courbevoie n'existe pas.</p>
        <Button asChild className="mt-6">
          <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Retour à l'accueil</Link>
        </Button>
      </div>
    );
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Accueil",
        "item": "https://www.livingroom.immo/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": `Immobilier ${quartier.name}, Courbevoie`
      }
    ]
  };

  return (
    <>
      <SEO
        title={quartier.title}
        description={quartier.description}
        keywords={quartier.keywords}
        schema={breadcrumbSchema}
      />
      <div className="bg-white">
        <div className="relative h-64 md:h-80">
          <img src={quartier.heroImage} alt={`Vue du quartier ${quartier.name} à Courbevoie`} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
              className="text-center text-white p-4"
            >
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">{quartier.name}</h1>
              <p className="text-xl md:text-2xl mt-2 font-light">Le guide immobilier de votre quartier à Courbevoie</p>
            </motion.div>
          </div>
        </div>

        <div className="container mx-auto max-w-4xl px-4 py-10">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <header className="mb-8">
              <div className="flex flex-wrap gap-2">
                {quartier.keywords.split(', ').map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
              </div>
            </header>
            
            <div 
              className="prose lg:prose-xl max-w-none text-gray-800"
              dangerouslySetInnerHTML={{ __html: quartier.content }}
            />

            <BlogCallToAction />
          </motion.article>
        </div>
      </div>
    </>
  );
};

export default CourbevoieQuartierPage;