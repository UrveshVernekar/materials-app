"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Info,
  Search,
  ArrowUpDown,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = {
  material_code: string;
  material_description: string;
  vendor: string;
  current_stock: number;
  coverage_days: number;
  three_m_avg: number;
  twelve_m_avg: number;
  price: number;
  status: string;
};

type KPIs = {
  total_materials: number;
  active_materials: number;
  critical_stock: number;
  low_stock: number;
  avg_coverage_days: number;
  obsolete_count: number;
};

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
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [tableDensity, setTableDensity] = useState<"default" | "compact">("default");
  const [pageSize, setPageSize] = useState("50");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [items, setItems] = useState<Item[]>([]);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);

        const [kpisRes, tableRes] = await Promise.all([
          axios.get("http://localhost:8000/dashboard/kpis"),
          axios.get(`http://localhost:8000/dashboard/table`, {
            params: {
              page: currentPage,
              size: Number(pageSize),
              search: debouncedSearch || undefined
            }
          })
        ]);

        if (isMounted) {
          setKpis(kpisRes.data);
          setItems(tableRes.data.items);
          setTotalItems(tableRes.data.total);
        }
      } catch (err) {
        if (isMounted) setError("Failed to fetch materials data");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [currentPage, pageSize, debouncedSearch]);

  const toggleRowSelection = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    if (selectedRows.length === items.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(items.map((i) => i.material_code));
    }
  };

  const totalPages = Math.ceil(totalItems / Number(pageSize));

  if (loading && items.length === 0 && !kpis) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50/70 dark:bg-zinc-950 p-4 md:p-6 lg:p-8 font-sans">
        <div className="max-w-[1680px] mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <Skeleton className="h-9 w-80" />
              <Skeleton className="h-4 w-96 mt-2" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-32" />
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
          <Button onClick={() => window.location.reload()} className="mt-4">
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
          {/* <div className="flex gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
              Create PO
            </Button>
          </div> */}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            {
              label: "Total Materials",
              value: kpis?.total_materials?.toLocaleString() || "0",
              color: "",
            },
            {
              label: "Active Materials",
              value: kpis?.active_materials?.toLocaleString() || "0",
              color: "text-emerald-600",
            },
            {
              label: "Critical Stock (<30 Days)",
              value: kpis?.critical_stock?.toLocaleString() || "0",
              color: "text-red-600",
            },
            {
              label: "Low Stock (30-60 Days)",
              value: kpis?.low_stock?.toLocaleString() || "0",
              color: "text-orange-500",
            },
            {
              label: "Avg Coverage Days",
              value: kpis?.avg_coverage_days?.toFixed(1) || "0",
              color: "text-blue-600",
            },
            {
              label: "Obsolete Count",
              value: kpis?.obsolete_count?.toLocaleString() || "0",
              color: "text-gray-500",
            },
          ].map((card, i) => (
            <Card
              key={i}
              className="shadow-sm border border-border hover:shadow transition-all duration-200"
            >
              <CardContent className="p-5">
                <div className="text-xs font-medium text-muted-foreground tracking-widest uppercase mb-1">
                  {card.label}
                </div>
                <div
                  className={cn(
                    "text-3xl font-semibold tracking-tighter",
                    card.color,
                  )}
                >
                  {card.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-3">
            <div className="relative w-full sm:w-100">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search material code, description, or vendor..."
                className="pl-10 h-10 bg-background shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground hidden sm:inline">
              Density:
            </span>
            <Button
              variant={tableDensity === "default" ? "default" : "outline"}
              size="sm"
              onClick={() => setTableDensity("default")}
            >
              Default
            </Button>
            <Button
              variant={tableDensity === "compact" ? "default" : "outline"}
              size="sm"
              onClick={() => setTableDensity("compact")}
            >
              Compact
            </Button>
          </div>
        </div>

        {/* Main Table */}
        <Card className="shadow-sm border-border overflow-hidden">
          <div className="overflow-x-auto relative">
            {loading && items.length > 0 && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-20 flex items-center justify-center">
                <div className="animate-pulse font-medium text-blue-600">Loading...</div>
              </div>
            )}
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-12 pl-4">
                    <Checkbox
                      checked={
                        selectedRows.length === items.length &&
                        items.length > 0
                      }
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead className="font-medium text-muted-foreground whitespace-nowrap py-4">Material Code</TableHead>
                  <TableHead className="font-medium text-muted-foreground whitespace-nowrap py-4">Description</TableHead>
                  <TableHead className="font-medium text-muted-foreground whitespace-nowrap py-4">Vendor</TableHead>
                  <TableHead className="font-medium text-muted-foreground whitespace-nowrap py-4 text-right">Current Stock</TableHead>
                  <TableHead className="font-medium text-muted-foreground whitespace-nowrap py-4 text-right">Coverage Days</TableHead>
                  <TableHead className="font-medium text-muted-foreground whitespace-nowrap py-4 text-right">3M Avg</TableHead>
                  <TableHead className="font-medium text-muted-foreground whitespace-nowrap py-4 text-right">12M Avg</TableHead>
                  <TableHead className="font-medium text-muted-foreground whitespace-nowrap py-4 text-right">Price</TableHead>
                  <TableHead className="font-medium text-muted-foreground whitespace-nowrap py-4 text-center">Status</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {items.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-72 text-center">
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Search className="w-10 h-10 mb-4 opacity-40" />
                        <p className="font-medium">No matching materials found</p>
                        <p className="text-sm mt-1">
                          Try adjusting your search or filters
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow
                      key={item.material_code}
                      className={cn(
                        "hover:bg-muted/50 transition-colors group",
                        tableDensity === "compact" && "h-12",
                      )}
                    >
                      <TableCell className="pl-4">
                        <Checkbox
                          checked={selectedRows.includes(item.material_code)}
                          onCheckedChange={() => toggleRowSelection(item.material_code)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.material_code}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[300px] truncate" title={item.material_description}>
                        {item.material_description}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={item.vendor}>
                        {item.vendor}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.current_stock?.toFixed(1) || "0.0"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={cn(
                          "font-medium",
                          item.coverage_days < 30 ? "text-red-600" :
                            item.coverage_days <= 60 ? "text-orange-500" : "text-emerald-600"
                        )}>
                          {item.coverage_days?.toFixed(1) || "0.0"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.three_m_avg?.toFixed(2) || "0.00"}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.twelve_m_avg?.toFixed(2) || "0.00"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{item.price?.toFixed(2) || "0.00"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className={cn(
                          "font-medium",
                          item.status === "Running" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
                          item.status === "Obsolete" && "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
                          item.status === "New" && "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
                        )}>
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer Bar */}
          <div className="border-t bg-muted/40 px-6 py-3 flex flex-col md:flex-row gap-3 md:items-center md:justify-between text-sm">
            <div>
              Showing {totalItems === 0 ? 0 : (currentPage - 1) * Number(pageSize) + 1}
              {" - "}
              {Math.min(currentPage * Number(pageSize), totalItems)} of {totalItems}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Select value={pageSize} onValueChange={(val) => {
                setPageSize(val);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[110px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / page</SelectItem>
                  <SelectItem value="20">20 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                  <SelectItem value="100">100 / page</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  disabled={currentPage === 1 || loading}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="px-3 py-1 font-medium min-w-[3rem] text-center">
                  {currentPage} / {totalPages || 1}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  disabled={currentPage >= totalPages || loading}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
