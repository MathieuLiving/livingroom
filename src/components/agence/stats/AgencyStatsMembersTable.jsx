import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ROLE_LABELS = {
  director: "Directeur",
  team_leader: "Team Leader",
  agent_affiliate: "Agent affilié",
  agent: "Agent",
};

export default function AgencyStatsMembersTable({ members = [] }) {
  const safeMembers = Array.isArray(members) ? members : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance par collaborateur</CardTitle>
        <CardDescription>
          Détail de l’activité sur le périmètre affiché.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead className="text-right">Recherche de biens</TableHead>
              <TableHead className="text-right">Vente de biens</TableHead>
              <TableHead className="text-right">Leads directs</TableHead>
              <TableHead className="text-right">Clics lien CVD</TableHead>
              <TableHead className="text-right">Scan QR CVD</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {safeMembers.length > 0 ? (
              safeMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {member.full_name || "Collaborateur"}
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {ROLE_LABELS[member.role] || member.role || "—"}
                  </TableCell>

                  <TableCell className="text-right">
                    {Number(member?.buying_projects || 0)}
                  </TableCell>

                  <TableCell className="text-right">
                    {Number(member?.selling_projects || 0)}
                  </TableCell>

                  <TableCell className="text-right">
                    {Number(member?.leads || 0)}
                  </TableCell>

                  <TableCell className="text-right">
                    {Number(member?.clicks || 0)}
                  </TableCell>

                  <TableCell className="text-right">
                    {Number(member?.scans || 0)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-6 text-center text-muted-foreground"
                >
                  Aucun collaborateur trouvé pour ce périmètre.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}