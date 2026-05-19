import { useState, useEffect } from "react";
import api from "@/app/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Info, Loader2 } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { Item, TrendData } from "@/app/types";

interface MaterialDetailDialogProps {
  selectedMaterial: Item | null;
  onClose: () => void;
}

export function MaterialDetailDialog({
  selectedMaterial,
  onClose,
}: MaterialDetailDialogProps) {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loadingTrend, setLoadingTrend] = useState(false);
  const [trendError, setTrendError] = useState("");

  useEffect(() => {
    if (!selectedMaterial) {
      setTrendData([]);
      setTrendError("");
      return;
    }

    let isMounted = true;
    const fetchTrend = async () => {
      try {
        setLoadingTrend(true);
        setTrendError("");
        const res = await api.get("/analytics/monthly-trend", {
          params: { material_code: selectedMaterial.material_code },
        });
        if (isMounted) {
          const rawData = res.data.data || [];
          const slicedData = rawData.slice(-12);
          setTrendData(slicedData);
        }
      } catch (err) {
        if (isMounted) {
          setTrendError("Failed to fetch consumption trend data.");
        }
      } finally {
        if (isMounted) setLoadingTrend(false);
      }
    };

    fetchTrend();
    return () => {
      isMounted = false;
    };
  }, [selectedMaterial]);

  if (!selectedMaterial) return null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
          <p className="font-semibold text-xs text-muted-foreground uppercase mb-1">{label}</p>
          <p className="text-sm font-bold text-primary">
            {payload[0].value.toLocaleString()} units
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-background border border-border rounded-2xl max-w-3xl w-full shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-start justify-between p-6 border-b">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {selectedMaterial.material_code}
              </h2>
              <Badge
                variant="secondary"
                className={cn(
                  "font-medium",
                  selectedMaterial.status === "Running" &&
                  "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
                  selectedMaterial.status === "Obsolete" &&
                  "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
                  selectedMaterial.status === "New" &&
                  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                )}
              >
                {selectedMaterial.status}
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs font-medium">
              Material Information & Analytics
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* CONTENT BODY */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* DESCRIPTION CARD */}
            <div className="col-span-1 md:col-span-3 bg-muted/40 p-4 rounded-xl border space-y-1">
              <div className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                Material Description
              </div>
              <div className="text-sm font-medium text-foreground">
                {selectedMaterial.material_description || "No description provided"}
              </div>
            </div>

            {/* VENDOR CARD */}
            <div className="bg-muted/20 p-4 rounded-xl border space-y-1">
              <div className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                Vendor
              </div>
              <div
                className="text-sm font-semibold text-foreground truncate"
                title={selectedMaterial.vendor}
              >
                {selectedMaterial.vendor || "N/A"}
              </div>
            </div>

            {/* CURRENT STOCK */}
            <div className="bg-muted/20 p-4 rounded-xl border space-y-1">
              <div className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                Current Stock
              </div>
              <div className="text-sm font-semibold text-foreground">
                {selectedMaterial.current_stock?.toLocaleString(undefined, {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                }) || "0.0"}{" "}
                units
              </div>
            </div>

            {/* PRICE */}
            <div className="bg-muted/20 p-4 rounded-xl border space-y-1">
              <div className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                Unit Price
              </div>
              <div className="text-sm font-semibold text-foreground">
                ₹{selectedMaterial.price?.toFixed(2) || "0.00"}
              </div>
            </div>

            {/* LEAD TIME DETAILS */}
            <div className="bg-muted/10 p-4 rounded-xl border grid grid-cols-3 gap-2 col-span-1 md:col-span-3 divide-x divide-border">
              <div className="space-y-1 text-center">
                <div className="text-[10px] font-medium text-muted-foreground uppercase">
                  Lead Time
                </div>
                <div className="text-lg font-bold text-foreground">
                  {selectedMaterial.lead_time?.toFixed(0) || "0"}{" "}
                  <span className="text-xs font-normal text-muted-foreground">days</span>
                </div>
              </div>
              <div className="space-y-1 text-center">
                <div className="text-[10px] font-medium text-muted-foreground uppercase">
                  Delta
                </div>
                <div className="text-lg font-bold text-foreground">
                  {selectedMaterial.delta?.toFixed(0) || "0"}{" "}
                  <span className="text-xs font-normal text-muted-foreground">days</span>
                </div>
              </div>
              <div className="space-y-1 text-center">
                <div className="text-[10px] font-medium text-muted-foreground uppercase">
                  Total Lead Time
                </div>
                <div className="text-lg font-bold text-primary">
                  {selectedMaterial.total_lead_time?.toFixed(0) || "0"}{" "}
                  <span className="text-xs font-normal text-muted-foreground">days</span>
                </div>
              </div>
            </div>

            {/* CONSUMPTION STATS */}
            <div className="bg-muted/10 p-4 rounded-xl border grid grid-cols-2 gap-2 col-span-1 md:col-span-3 divide-x divide-border">
              <div className="space-y-1 text-center">
                <div className="text-[10px] font-medium text-muted-foreground uppercase">
                  3M Avg Consumption
                </div>
                <div className="text-lg font-bold text-foreground">
                  {selectedMaterial.three_m_avg?.toFixed(2) || "0.00"}{" "}
                  <span className="text-xs font-normal text-muted-foreground">units/mo</span>
                </div>
              </div>
              <div className="space-y-1 text-center">
                <div className="text-[10px] font-medium text-muted-foreground uppercase">
                  12M Avg Consumption
                </div>
                <div className="text-lg font-bold text-foreground">
                  {selectedMaterial.twelve_m_avg?.toFixed(2) || "0.00"}{" "}
                  <span className="text-xs font-normal text-muted-foreground">units/mo</span>
                </div>
              </div>
            </div>
          </div>

          {/* CONSUMPTION TREND */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                Consumption Trend (Last 12 Months)
              </h3>
              {trendData.length > 0 && (
                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-2.5 py-0.5 rounded-full">
                  {trendData.length} {trendData.length === 1 ? "month" : "months"} of data
                </span>
              )}
            </div>

            {loadingTrend ? (
              <div className="h-[200px] bg-muted/30 animate-pulse rounded-xl border flex items-center justify-center">
                <div className="text-muted-foreground text-xs font-medium flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Fetching consumption history...
                </div>
              </div>
            ) : trendError ? (
              <div className="h-[200px] rounded-xl border border-destructive/20 bg-destructive/5 text-destructive flex items-center justify-center text-xs font-medium p-4">
                {trendError}
              </div>
            ) : trendData.length > 0 ? (
              <div className="h-[200px] w-full min-w-0 border rounded-xl p-4 bg-muted/10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dialogColorConsumption" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                    <XAxis
                      dataKey="formatted_date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#888888' }}
                      dy={8}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#888888' }}
                      tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                    />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="total_consumption"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#dialogColorConsumption)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] border border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
                <Info className="w-6 h-6 opacity-25 mb-2" />
                <p className="text-xs font-semibold">No consumption trend data available</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  This material does not have recorded monthly records
                </p>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-end p-5 border-t bg-muted/10">
          <Button onClick={onClose} size="sm">
            Close Details
          </Button>
        </div>
      </div>
    </div>
  );
}
