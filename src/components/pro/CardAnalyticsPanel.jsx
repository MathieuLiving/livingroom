import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  format,
  subDays,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
} from "date-fns";
import { fr } from "date-fns/locale";
import {
  BarChart3,
  MousePointerClick,
  QrCode,
  TrendingUp,
  CalendarDays,
  AlertCircle,
} from "lucide-react";

import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/lib/customSupabaseClient";
import { useToast } from "@/components/ui/use-toast";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PERIODS = [
  { key: "1d", label: "Aujourd'hui" },
  { key: "7d", label: "7 Jours" },
  { key: "30d", label: "30 Jours" },
  { key: "custom", label: "Personnalisé" },
];

const formatDateKey = (date) => format(date, "yyyy-MM-dd");
const toDisplayDate = (value) =>
  format(new Date(value), "dd MMMM yyyy", { locale: fr });

const getDominantChannel = (clicks, scans) => {
  const total = Number(clicks || 0) + Number(scans || 0);
  if (total === 0) return "Aucun";
  if (clicks > scans) return "Lien";
  if (scans > clicks) return "QR";
  return "Équilibre";
};

const buildDateRange = (period, customStart, customEnd) => {
  const now = new Date();

  if (period === "1d") {
    return {
      startDate: startOfDay(now),
      endDate: endOfDay(now),
    };
  }

  if (period === "7d") {
    return {
      startDate: startOfDay(subDays(now, 6)),
      endDate: endOfDay(now),
    };
  }

  if (period === "30d") {
    return {
      startDate: startOfDay(subDays(now, 29)),
      endDate: endOfDay(now),
    };
  }

  if (period === "custom") {
    if (!customStart || !customEnd) return null;

    const startDate = startOfDay(new Date(customStart));
    const endDate = endOfDay(new Date(customEnd));

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return null;
    }

    return { startDate, endDate };
  }

  return null;
};

const aggregateMetricsByDay = (rows, startDate, endDate) => {
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const baseMap = {};
  days.forEach((day) => {
    const key = formatDateKey(day);
    baseMap[key] = {
      date: key,
      link_clicks: 0,
      qr_scans: 0,
    };
  });

  (rows || []).forEach((row) => {
    const dateKey = String(row.date || "").slice(0, 10);
    if (!baseMap[dateKey]) {
      baseMap[dateKey] = {
        date: dateKey,
        link_clicks: 0,
        qr_scans: 0,
      };
    }

    const count = Number(row.count ?? 0) || 0;
    const metricType = String(row.metric_type || "").trim();

    if (metricType === "url_click") {
      baseMap[dateKey].link_clicks += count;
    } else if (metricType === "qr_scan") {
      baseMap[dateKey].qr_scans += count;
    }
  });

  return Object.values(baseMap)
    .map((row) => ({
      ...row,
      total: row.link_clicks + row.qr_scans,
      dominant: getDominantChannel(row.link_clicks, row.qr_scans),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

const MiniBarsChart = ({ data }) => {
  const maxValue = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return 0;
    return Math.max(...data.map((item) => Number(item.total || 0)), 0);
  }, [data]);

  if (!data?.length) return null;

  return (
    <div className="space-y-4">
      <div className="grid h-56 grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <div className="flex h-full items-end gap-2 overflow-x-auto">
          {data.map((item) => {
            const total = Number(item.total || 0);
            const clicks = Number(item.link_clicks || 0);
            const scans = Number(item.qr_scans || 0);

            const totalHeight = maxValue > 0 ? Math.max((total / maxValue) * 100, total > 0 ? 8 : 0) : 0;
            const clicksHeight =
              total > 0 ? Math.max((clicks / total) * totalHeight, clicks > 0 ? 6 : 0) : 0;
            const scansHeight =
              total > 0 ? Math.max((scans / total) * totalHeight, scans > 0 ? 6 : 0) : 0;

            return (
              <div
                key={item.date}
                className="flex min-w-[44px] flex-1 flex-col items-center justify-end gap-2"
                title={`${toDisplayDate(item.date)} • ${clicks} clic(s) • ${scans} scan(s)`}
              >
                <div className="flex h-40 w-full items-end justify-center">
                  <div className="flex w-8 flex-col justify-end overflow-hidden rounded-t-md bg-slate-200">
                    <div
                      className="w-full bg-orange-400"
                      style={{ height: `${scansHeight}%` }}
                    />
                    <div
                      className="w-full bg-blue-600"
                      style={{ height: `${clicksHeight}%` }}
                    />
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xs font-semibold text-slate-900">{total}</div>
                  <div className="text-[10px] text-slate-500">
                    {format(new Date(item.date), "dd/MM", { locale: fr })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm bg-blue-600" />
          Clics lien
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm bg-orange-400" />
          Scans QR
        </div>
      </div>
    </div>
  );
};

const CardAnalyticsPanel = () => {
  const { pro } = useAuth();
  const { toast } = useToast();

  const [period, setPeriod] = useState("7d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const range = useMemo(
    () => buildDateRange(period, customStart, customEnd),
    [period, customStart, customEnd]
  );

  const fetchMetrics = useCallback(async () => {
    if (!pro?.id) return;
    if (!range) return;

    setLoading(true);
    setError(null);

    try {
      const { data: rows, error: supabaseError } = await supabase
        .from("professionnel_daily_metrics")
        .select("date, metric_type, count")
        .eq("professionnel_id", pro.id)
        .eq("card_variant", "premium")
        .in("metric_type", ["url_click", "qr_scan"])
        .gte("date", formatDateKey(range.startDate))
        .lte("date", formatDateKey(range.endDate))
        .order("date", { ascending: true });

      if (supabaseError) throw supabaseError;

      const aggregated = aggregateMetricsByDay(
        rows || [],
        range.startDate,
        range.endDate
      );

      setData(aggregated);
    } catch (err) {
      console.error("[CardAnalyticsPanel] Error fetching metrics:", err);
      setError("Impossible de charger les statistiques.");
      setData([]);

      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger vos statistiques.",
      });
    } finally {
      setLoading(false);
    }
  }, [pro?.id, range, toast]);

  useEffect(() => {
    if (!pro?.id) return;
    if (!range) return;
    if (period === "custom" && (!customStart || !customEnd)) return;

    fetchMetrics();
  }, [pro?.id, period, customStart, customEnd, range, fetchMetrics]);

  const handleCustomSearch = () => {
    if (!customStart || !customEnd) {
      toast({
        variant: "destructive",
        title: "Dates invalides",
        description: "Veuillez sélectionner une date de début et une date de fin.",
      });
      return;
    }

    if (new Date(customStart) > new Date(customEnd)) {
      toast({
        variant: "destructive",
        title: "Plage invalide",
        description: "La date de début doit être antérieure ou égale à la date de fin.",
      });
      return;
    }

    fetchMetrics();
  };

  const summary = useMemo(() => {
    const totalClicks = data.reduce(
      (acc, row) => acc + (Number(row.link_clicks ?? 0) || 0),
      0
    );
    const totalScans = data.reduce(
      (acc, row) => acc + (Number(row.qr_scans ?? 0) || 0),
      0
    );
    const totalInteractions = totalClicks + totalScans;
    const dominantChannel = getDominantChannel(totalClicks, totalScans);

    return {
      totalClicks,
      totalScans,
      totalInteractions,
      dominantChannel,
    };
  }, [data]);

  const tableData = useMemo(() => {
    return [...data].sort((a, b) => b.date.localeCompare(a.date));
  }, [data]);

  if (!pro) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <BarChart3 className="h-5 w-5 text-brand-blue" />
            Statistiques de votre carte
          </h2>
          <p className="text-sm text-slate-500">
            Analysez les performances de votre carte de visite digitale.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {PERIODS.map((item) => (
            <Button
              key={item.key}
              variant={period === item.key ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(item.key)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {period === "custom" && (
        <Card className="border-slate-200 bg-slate-50/50">
          <CardContent className="flex flex-wrap items-end gap-4 p-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Du</label>
              <Input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-auto"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Au</label>
              <Input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-auto"
              />
            </div>

            <Button onClick={handleCustomSearch} disabled={loading}>
              Rechercher
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-2">
              <p className="text-sm font-medium text-slate-500">Total Clics Lien</p>
              <MousePointerClick className="h-4 w-4 text-brand-blue" />
            </div>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <h3 className="text-2xl font-bold text-slate-900">
                {summary.totalClicks}
              </h3>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-2">
              <p className="text-sm font-medium text-slate-500">Total Scans QR</p>
              <QrCode className="h-4 w-4 text-orange-500" />
            </div>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <h3 className="text-2xl font-bold text-slate-900">
                {summary.totalScans}
              </h3>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-2">
              <p className="text-sm font-medium text-slate-500">Interactions (Total)</p>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <h3 className="text-2xl font-bold text-slate-900">
                {summary.totalInteractions}
              </h3>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-2">
              <p className="text-sm font-medium text-slate-500">Canal Dominant</p>
              <BarChart3 className="h-4 w-4 text-amber-500" />
            </div>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <h3 className="mt-1 text-lg font-bold text-slate-900">
                {summary.dominantChannel}
              </h3>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-slate-500" />
            Évolution sur la période
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-56 w-full" />
              <Skeleton className="h-4 w-40" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-500">
              <AlertCircle className="mb-2 h-8 w-8 text-red-400" />
              <p>{error}</p>
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
              <BarChart3 className="mb-3 h-10 w-10 text-slate-300" />
              <p className="text-base font-medium text-slate-900">Aucune donnée</p>
              <p className="text-sm">
                Il n&apos;y a pas eu d&apos;interactions sur cette période.
              </p>
            </div>
          ) : (
            <MiniBarsChart data={data} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5 text-slate-500" />
            Détail quotidien
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-500">
              <AlertCircle className="mb-2 h-8 w-8 text-red-400" />
              <p>{error}</p>
            </div>
          ) : tableData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
              <BarChart3 className="mb-3 h-10 w-10 text-slate-300" />
              <p className="text-base font-medium text-slate-900">Aucune donnée</p>
              <p className="text-sm">
                Il n&apos;y a pas eu d&apos;interactions sur cette période.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Clics Lien</TableHead>
                    <TableHead className="text-right">Scans QR</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Dominant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.map((row) => {
                    const clicks = Number(row.link_clicks || 0);
                    const scans = Number(row.qr_scans || 0);
                    const total = Number(row.total || 0);
                    const dominant = row.dominant || "Aucun";

                    return (
                      <TableRow key={row.date}>
                        <TableCell className="font-medium">
                          {toDisplayDate(row.date)}
                        </TableCell>
                        <TableCell className="text-right">{clicks}</TableCell>
                        <TableCell className="text-right">{scans}</TableCell>
                        <TableCell className="text-right font-bold text-brand-blue">
                          {total}
                        </TableCell>
                        <TableCell className="text-right">
                          {dominant !== "Aucun" && (
                            <Badge
                              variant="outline"
                              className={
                                dominant === "Lien"
                                  ? "border-brand-blue text-brand-blue"
                                  : dominant === "QR"
                                  ? "border-orange-400 text-orange-500"
                                  : "border-slate-400 text-slate-600"
                              }
                            >
                              {dominant}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CardAnalyticsPanel;