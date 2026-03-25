import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, ShieldCheck, Zap, ArrowUpRight } from "lucide-react";

export default function AgencySubscriptionPage({ agency }) {
  // Placeholder data - in a real app, this would come from the agency object or a subscription hook
  const plan = {
    name: "Business Pro",
    price: "199€",
    period: "/mois",
    status: "active",
    renewalDate: "15 Octobre 2026",
    features: [
      { name: "Membres d'équipe", limit: 20, current: 5 },
      { name: "Projets illimités", included: true },
      { name: "Leads illimités", included: true },
      { name: "Statistiques avancées", included: true },
      { name: "Support prioritaire", included: true },
    ]
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Mon Abonnement</h2>
          <p className="text-muted-foreground">Gérez votre offre et vos factures.</p>
        </div>
        <Badge variant={plan.status === 'active' ? "success" : "destructive"} className="px-4 py-1 text-sm bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
          {plan.status === 'active' ? 'Actif' : 'Inactif'}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-brand-blue/20 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Plan Actuel</span>
              <ShieldCheck className="h-5 w-5 text-brand-blue" />
            </CardTitle>
            <CardDescription>Votre offre en cours</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-baseline">
              <span className="text-4xl font-extrabold">{plan.price}</span>
              <span className="text-muted-foreground ml-1">{plan.period}</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Offre</span>
                <span className="font-medium">{plan.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Prochaine facture</span>
                <span className="font-medium">{plan.renewalDate}</span>
              </div>
            </div>
            
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-semibold">Utilisation</h4>
              {plan.features.filter(f => f.limit).map((feature, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{feature.name}</span>
                    <span className="text-muted-foreground">{feature.current} / {feature.limit}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-blue rounded-full" 
                      style={{ width: `${(feature.current / feature.limit) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button className="w-full bg-brand-blue hover:bg-blue-700">
              <Zap className="mr-2 h-4 w-4" /> Changer d'offre
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" /> Facturation
            </CardTitle>
            <CardDescription>Historique et moyen de paiement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded border">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                </div>
                <div>
                  <p className="font-medium text-sm">Mastercard finissant par 4242</p>
                  <p className="text-xs text-muted-foreground">Expire le 12/28</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">Modifier</Button>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold mb-3">Dernières factures</h4>
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                  <div className="flex flex-col">
                    <span className="font-medium">15 {['Septembre', 'Août', 'Juillet'][i]} 2026</span>
                    <span className="text-xs text-muted-foreground">REF-2026-{890 + i}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>199,00 €</span>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              Gérer la facturation (Stripe)
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}