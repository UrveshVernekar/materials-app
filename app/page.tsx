"use client";

import { useState, useEffect } from "react";
import api from "@/app/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Item, KPIs } from "@/app/types";
import { DashboardKPIs } from "@/components/dashboard-kpis";
import { DashboardTable } from "@/components/dashboard-table";
import { MaterialDetailDialog } from "@/components/material-detail-dialog";

const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse bg-muted rounded-md", className)} />
);

const ShimmerCard = () => (
  <Card className="shadow-sm border-border">
    <CardContent className="p-5">
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-9 w-32" />
    </CardContent>
  </Card>
);

export default function MaterialsDashboard() {
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<Item | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [kpisRes, tableRes] = await Promise.all([
        api.get("/dashboard/kpis"),
        api.get(`/dashboard/table`),
      ]);
      setKpis(kpisRes.data);
      setAllItems(tableRes.data.items);
      setError("");
    } catch (err) {
      setError("Failed to fetch materials data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeMaterial = selectedMaterial
    ? allItems.find((item) => item.material_code === selectedMaterial.material_code) || selectedMaterial
    : null;

  if (loading && allItems.length === 0 && !kpis) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50/70 dark:bg-zinc-950 p-4 md:p-6 lg:p-8 font-sans">
        <div className="max-w-[1680px] mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <Skeleton className="h-9 w-80" />
              <Skeleton className="h-4 w-96 mt-2" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <ShimmerCard key={i} />
            ))}
          </div>
          <Card className="shadow-sm border-border overflow-hidden">
            <div className="p-6">
              <Skeleton className="h-64 w-full" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-2xl mb-2">⚠️</div>
          <p className="text-xl font-medium text-red-600">{error}</p>
          <Button onClick={() => fetchData()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50/70 dark:bg-zinc-950 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-[1680px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Materials Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Overview of materials, stock levels, and coverage
            </p>
          </div>
        </div>

        {/* KPI CARDS */}
        <DashboardKPIs kpis={kpis} />

        {/* MAIN TABLE */}
        <DashboardTable
          allItems={allItems}
          loading={loading}
          onSelectMaterial={setSelectedMaterial}
          onRefresh={fetchData}
        />
      </div>

      {/* Detail Dialog Popup */}
      <MaterialDetailDialog
        selectedMaterial={activeMaterial}
        onClose={() => setSelectedMaterial(null)}
        onPOAddedOrUpdated={fetchData}
      />
    </div>
  );
}
