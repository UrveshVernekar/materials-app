import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import { Card } from "@/components/ui/card";
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
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Item } from "@/app/types";

interface DashboardTableProps {
  allItems: Item[];
  loading: boolean;
  onSelectMaterial: (item: Item) => void;
}

export function DashboardTable({
  allItems,
  loading,
  onSelectMaterial,
}: DashboardTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [tableDensity, setTableDensity] = useState<"default" | "compact">("default");
  const [pageSize, setPageSize] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    selection: 48,
    material_code: 160,
    material_description: 280,
    vendor: 180,
    machine_population: 170,
    current_stock: 140,
    coverage_days: 140,
    lead_time: 110,
    delta: 95,
    total_lead_time: 130,
    three_m_avg: 110,
    twelve_m_avg: 110,
    price: 110,
    status: 120,
  });

  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  const toggleableColumns = [
    { id: "material_code", label: "Material Code" },
    { id: "material_description", label: "Description" },
    { id: "vendor", label: "Vendor" },
    // { id: "machine_population", label: "Machine Population" },
    { id: "current_stock", label: "Current Stock" },
    // { id: "coverage_days", label: "Coverage Days" },
    // { id: "lead_time", label: "Lead Time" },
    // { id: "delta", label: "Delta" },
    // { id: "total_lead_time", label: "Total Lead Time" },
    // { id: "three_m_avg", label: "3M Avg" },
    // { id: "twelve_m_avg", label: "12M Avg" },
    { id: "price", label: "Price" },
    { id: "status", label: "Status" },
  ];

  const toggleColumnVisibility = (columnId: string) => {
    setHiddenColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((col) => col !== columnId)
        : [...prev, columnId]
    );
  };

  const startResize = (e: React.PointerEvent, columnKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = columnWidths[columnKey];

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const minWidth = columnKey === "selection" ? 30 : 60;
      const newWidth = Math.max(minWidth, startWidth + deltaX);
      setColumnWidths((prev) => ({
        ...prev,
        [columnKey]: newWidth,
      }));
    };

    const handlePointerUp = () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  };

  const renderHeader = (
    key: keyof typeof columnWidths,
    label: React.ReactNode,
    align: "left" | "right" | "center" = "left",
    extraClass: string = ""
  ) => {
    if (hiddenColumns.includes(key)) return null;
    return (
      <TableHead
        style={{ width: columnWidths[key] }}
        className={cn(
          "font-medium text-muted-foreground py-4 relative group select-none overflow-hidden",
          align === "right" && "text-right",
          align === "center" && "text-center",
          extraClass
        )}
      >
        <div className="truncate pr-2">{label}</div>
        <div
          onPointerDown={(e) => startResize(e, key)}
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 active:bg-primary z-10 select-none group-hover:bg-muted-foreground/30 transition-colors"
        />
      </TableHead>
    );
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredItems = useMemo(() => {
    if (!debouncedSearch) return allItems;
    const lower = debouncedSearch.toLowerCase();
    return allItems.filter((item) =>
      item.material_code?.toLowerCase().includes(lower) ||
      item.material_description?.toLowerCase().includes(lower) ||
      item.vendor?.toLowerCase().includes(lower)
    );
  }, [allItems, debouncedSearch]);

  const items = useMemo(() => {
    const size = Number(pageSize);
    const start = (currentPage - 1) * size;
    return filteredItems.slice(start, start + size);
  }, [filteredItems, currentPage, pageSize]);

  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / Number(pageSize));

  const toggleRowSelection = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    if (selectedRows.length === items.length && items.length > 0) {
      setSelectedRows([]);
    } else {
      setSelectedRows(items.map((i) => i.material_code));
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);

      const data = filteredItems.map((item: any) => ({
        "Material Code": item.material_code,
        "Description": item.material_description,
        "Vendor": item.vendor,
        "Machine Population": item.machine_population,
        "Current Stock": item.current_stock,
        "Coverage (Days)": item.coverage_days,
        "Lead Time": item.lead_time,
        "Delta": item.delta,
        "Total Lead Time": item.total_lead_time,
        "3M Avg": item.three_m_avg,
        "12M Avg": item.twelve_m_avg,
        "Unit Price": item.price,
        "Status": item.status,
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Materials");

      const dateStr = new Date().toISOString().split("T")[0];
      XLSX.writeFile(wb, `Materials_Overview_${dateStr}.xlsx`);
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* TOOLBAR */}
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

        <div className="flex items-center gap-3 text-sm">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isExporting ? "Exporting..." : "Export"}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="w-4 h-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-background border border-border">
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {toggleableColumns.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={!hiddenColumns.includes(col.id)}
                  onCheckedChange={() => toggleColumnVisibility(col.id)}
                  onSelect={(e) => e.preventDefault()}
                >
                  {col.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <span className="text-muted-foreground hidden sm:inline">Density:</span>
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

      {/* MAIN TABLE */}
      <Card className="shadow-sm border-border overflow-hidden">
        <div className="overflow-x-auto relative">
          {loading && items.length > 0 && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-20 flex items-center justify-center">
              <div className="animate-pulse font-medium text-blue-600">Loading...</div>
            </div>
          )}
          <Table
            style={{
              tableLayout: "fixed",
              width: Object.entries(columnWidths)
                .filter(([key]) => !hiddenColumns.includes(key))
                .reduce((sum, [_, width]) => sum + width, 0),
            }}
          >
            <TableHeader className="bg-muted/50 sticky top-0 z-10">
              <TableRow>
                {renderHeader("material_code", "Material Code")}
                {renderHeader("material_description", "Description")}
                {renderHeader("vendor", "Vendor")}
                {/* {renderHeader("machine_population", "Machine Population", "right")} */}
                {renderHeader("current_stock", "Current Stock", "right")}
                {/* {renderHeader("coverage_days", "Coverage Days", "right")} */}
                {/* {renderHeader("lead_time", "Lead Time", "right")} */}
                {/* {renderHeader("delta", "Delta", "right")} */}
                {/* {renderHeader("total_lead_time", "Total Lead Time", "right")} */}
                {/* {renderHeader("three_m_avg", "3M Avg", "right")} */}
                {/* {renderHeader("twelve_m_avg", "12M Avg", "right")} */}
                {renderHeader("price", "Price", "right")}
                {renderHeader("status", "Status", "center")}
                <TableHead
                  className={cn(
                    "font-medium text-muted-foreground py-4 relative group select-none overflow-hidden",
                    "text-right",
                  )}
                >
                  <div className="truncate pr-2">Prediction June</div>
                  <div
                    onPointerDown={(e) => startResize(e, 'prediction_june')}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 active:bg-primary z-10 select-none group-hover:bg-muted-foreground/30 transition-colors"
                  />
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {items.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={14 - hiddenColumns.length} className="h-72 text-center">
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Search className="w-10 h-10 mb-4 opacity-40" />
                      <p className="font-medium">No matching materials found</p>
                      <p className="text-sm mt-1">Try adjusting your search or filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow
                    key={item.material_code}
                    className={cn(
                      "hover:bg-muted/50 transition-colors group cursor-pointer",
                      tableDensity === "compact" && "h-12"
                    )}
                    onClick={() => onSelectMaterial(item)}
                  >
                    {!hiddenColumns.includes("material_code") && (
                      <TableCell className="font-medium truncate">{item.material_code}</TableCell>
                    )}
                    {!hiddenColumns.includes("material_description") && (
                      <TableCell
                        className="text-muted-foreground truncate"
                        title={item.material_description}
                      >
                        {item.material_description}
                      </TableCell>
                    )}
                    {!hiddenColumns.includes("vendor") && (
                      <TableCell className="truncate" title={item.vendor}>
                        {item.vendor}
                      </TableCell>
                    )}
                    {/* {!hiddenColumns.includes("machine_population") && (
                      <TableCell className="text-right font-medium truncate">
                        {item.machine_population?.toFixed(0) || "0"}
                      </TableCell>
                    )} */}
                    {!hiddenColumns.includes("current_stock") && (
                      <TableCell className="text-right font-medium truncate">
                        {item.current_stock?.toFixed(1) || "0.0"}
                      </TableCell>
                    )}
                    {/* {!hiddenColumns.includes("coverage_days") && (
                      <TableCell className="text-right truncate">
                        <div
                          className={cn(
                            "font-medium",
                            item.coverage_days < 30
                              ? "text-red-600"
                              : item.coverage_days <= 60
                                ? "text-orange-500"
                                : "text-emerald-600"
                          )}
                        >
                          {item.coverage_days?.toFixed(1) || "0.0"}
                        </div>
                      </TableCell>
                    )} */}
                    {/* {!hiddenColumns.includes("lead_time") && (
                      <TableCell className="text-right truncate">
                        {item.lead_time?.toFixed(0) || "0"}
                      </TableCell>
                    )} */}
                    {/* {!hiddenColumns.includes("delta") && (
                      <TableCell className="text-right truncate">{item.delta?.toFixed(0) || "0"}</TableCell>
                    )} */}
                    {/* {!hiddenColumns.includes("total_lead_time") && (
                      <TableCell className="text-right truncate">
                        {item.total_lead_time?.toFixed(0) || "0"}
                      </TableCell>
                    )} */}
                    {/* {!hiddenColumns.includes("three_m_avg") && (
                      <TableCell className="text-right truncate">
                        {item.three_m_avg?.toFixed(2) || "0.00"}
                      </TableCell>
                    )} */}
                    {/* {!hiddenColumns.includes("twelve_m_avg") && (
                      <TableCell className="text-right truncate">
                        {item.twelve_m_avg?.toFixed(2) || "0.00"}
                      </TableCell>
                    )} */}
                    {!hiddenColumns.includes("price") && (
                      <TableCell className="text-right font-medium truncate">
                        ₹{item.price?.toFixed(2) || "0.00"}
                      </TableCell>
                    )}
                    {!hiddenColumns.includes("status") && (
                      <TableCell className="text-center truncate">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "font-medium",
                            item.status === "Running" &&
                            "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
                            item.status === "Obsolete" &&
                            "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
                            item.status === "New" &&
                            "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                          )}
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* FOOTER BAR */}
        <div className="border-t bg-muted/40 px-6 py-3 flex flex-col md:flex-row gap-3 md:items-center md:justify-between text-sm">
          <div>
            Showing {totalItems === 0 ? 0 : (currentPage - 1) * Number(pageSize) + 1}
            {" - "}
            {Math.min(currentPage * Number(pageSize), totalItems)} of {totalItems}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={pageSize}
              onValueChange={(val) => {
                setPageSize(val);
                setCurrentPage(1);
              }}
            >
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
  );
}
