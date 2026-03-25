import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Search,
  Home,
  Users,
  MousePointer2,
  QrCode,
} from "lucide-react";

const StatCard = ({ title, value, icon: Icon, description }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>

    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

export default function AgencyStatsOverviewCards({
  totalBuyingProjects = 0,
  totalSellingProjects = 0,
  totalLeads = 0,
  totalClicks = 0,
  totalScans = 0,
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <StatCard
        title="Recherche de biens"
        value={totalBuyingProjects}
        icon={Search}
        description="Projets d’achat"
      />
      <StatCard
        title="Vente de biens"
        value={totalSellingProjects}
        icon={Home}
        description="Mandats de vente"
      />
      <StatCard
        title="Leads directs"
        value={totalLeads}
        icon={Users}
        description="Contacts entrants"
      />
      <StatCard
        title="Clics sur lien CVD"
        value={totalClicks}
        icon={MousePointer2}
        description="Vues web"
      />
      <StatCard
        title="Scan QR sur CVD"
        value={totalScans}
        icon={QrCode}
        description="Scans physiques"
      />
    </div>
  );
}