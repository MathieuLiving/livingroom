import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search } from "lucide-react";
import { useNavigate } from 'react-router-dom';

export default function PersonalMarketplace() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6 items-center bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-8 text-white shadow-lg">
        <div className="flex-1 space-y-4">
          <h2 className="text-3xl font-bold">Marché Inter-Professionnel</h2>
          <p className="text-purple-100 text-lg max-w-xl">
            Accédez à une base de données exclusive de projets qualifiés partagés par d'autres professionnels de l'immobilier.
          </p>
          <div className="flex gap-3 pt-2">
            <Button 
              size="lg" 
              variant="secondary" 
              className="bg-white text-purple-700 hover:bg-gray-100 font-semibold"
              onClick={() => navigate('/place-des-projets')}
            >
              <Search className="mr-2 h-5 w-5" /> Explorer les projets
            </Button>
          </div>
        </div>
        <div className="hidden md:block w-1/3">
           {/* Decorative illustration placeholder */}
           <div className="aspect-video bg-white/10 rounded-lg backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <p className="text-white/80 font-medium">Opportunités Off-Market</p>
           </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <FeatureCard 
          title="Mandats de Recherche" 
          description="Trouvez des biens pour vos acquéreurs parmi les mandats simples ou exclusifs de vos confrères."
        />
        <FeatureCard 
          title="Mandats de Vente" 
          description="Proposez vos biens à la vente à des acquéreurs qualifiés suivis par d'autres agents."
        />
        <FeatureCard 
          title="Partage d'Honoraires" 
          description="Collaborez en toute transparence et sécurisez vos partages de commission."
        />
      </div>
    </div>
  );
}

function FeatureCard({ title, description }) {
  return (
    <Card className="hover:shadow-md transition-all border-purple-100">
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </CardContent>
    </Card>
  );
}