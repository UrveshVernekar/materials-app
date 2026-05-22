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
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const statuses = useMemo(() => {
    const set = new Set<string>();
    allItems.forEach((item) => {
      if (item.status) {
        set.add(item.status);
      }
    });
    return Array.from(set).sort();
  }, [allItems]);

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    selection: 48,
    material_code: 60,
    material_description: 160,
    vendor: 50,
    machine_population: 170,
    current_stock: 50,
    coverage_days: 140,
    lead_time: 110,
    lead_time_qty: 110,
    delta: 95,
    total_lead_time: 130,
    three_m_avg: 110,
    twelve_m_avg: 110,
    price: 50,
    status: 50,
    month1_prediction: 60,
    month1_po: 80,
    month2_prediction: 60,
    month2_po: 80,
    month3_prediction: 60,
    month3_po: 80,
    month1_mes: 80,
    month2_mes: 80,
    month3_mes: 80,
  });

  const predictionMonthNames = useMemo(() => {
    const itemWithPrediction = allItems.find(
      (item) => item.month1_date && item.month2_date && item.month3_date
    );

    if (itemWithPrediction && itemWithPrediction.month1_date) {
      const formatDateStr = (dateStr: string) => {
        try {
          const dateObj = new Date(dateStr);
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          return `${months[dateObj.getMonth()]}-${dateObj.getFullYear().toString().slice(-2)} Forecast`;
        } catch (e) {
          return null;
        }
      };
      const m1 = formatDateStr(itemWithPrediction.month1_date);
      const m2 = itemWithPrediction.month2_date ? formatDateStr(itemWithPrediction.month2_date) : null;
      const m3 = itemWithPrediction.month3_date ? formatDateStr(itemWithPrediction.month3_date) : null;

      if (m1 && m2 && m3) {
        return [m1, m2, m3];
      }
    }

    return ["Month 1 Forecast", "Month 2 Forecast", "Month 3 Forecast"];
  }, [allItems]);

  const poMonthNames = useMemo(() => {
    return predictionMonthNames.map((name) => {
      if (name.endsWith(" Forecast")) {
        return `PO in ${name.slice(0, -9)}`;
      }
      return `PO in ${name}`;
    });
  }, [predictionMonthNames]);

  const mesMonthNames = useMemo(() => {
    return predictionMonthNames.map((name) => {
      if (name.endsWith(" Forecast")) {
        return `MES in ${name.slice(0, -9)}`;
      }
      return `MES in ${name}`;
    });
  }, [predictionMonthNames]);

  const [hiddenColumns, setHiddenColumns] = useState<string[]>([
    "material_description",
    "vendor",
  ]);

  const toggleableColumns = useMemo(() => [
    { id: "material_code", label: "Material Code" },
    { id: "material_description", label: "Description" },
    { id: "vendor", label: "Vendor" },
    { id: "current_stock", label: "Current Stock" },
    { id: "lead_time_qty", label: "Lead Time Qty" },
    { id: "price", label: "Price" },
    { id: "status", label: "Status" },
    { id: "month1_prediction", label: predictionMonthNames[0] },
    { id: "month1_po", label: poMonthNames[0] },
    { id: "month1_mes", label: mesMonthNames[0] },
    { id: "month2_prediction", label: predictionMonthNames[1] },
    { id: "month2_po", label: poMonthNames[1] },
    { id: "month2_mes", label: mesMonthNames[1] },
    { id: "month3_prediction", label: predictionMonthNames[2] },
    { id: "month3_po", label: poMonthNames[2] },
    { id: "month3_mes", label: mesMonthNames[2] },
  ], [predictionMonthNames, poMonthNames, mesMonthNames]);

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
          "font-medium text-muted-foreground relative group select-none overflow-hidden whitespace-normal break-words h-auto align-middle",
          tableDensity === "compact" ? "py-2 px-1.5" : "py-3 px-2",
          align === "right" && "text-right",
          align === "center" && "text-center",
          extraClass
        )}
      >
        <div className="whitespace-normal break-words leading-tight pr-2">{label}</div>
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
    let result = allItems;

    if (selectedStatus !== "all") {
      result = result.filter((item) => item.status === selectedStatus);
    }

    if (debouncedSearch) {
      const lower = debouncedSearch.toLowerCase();
      result = result.filter((item) =>
        item.material_code?.toLowerCase().includes(lower) ||
        item.material_description?.toLowerCase().includes(lower) ||
        item.vendor?.toLowerCase().includes(lower)
      );
    }

    return result;
  }, [allItems, selectedStatus, debouncedSearch]);

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

      const data = filteredItems.map((item: any) => {
        const rowData: Record<string, any> = {
          "Material Code": item.material_code,
          "Description": item.material_description,
          "Vendor": item.vendor,
          "Machine Population": item.machine_population,
          "Current Stock": item.current_stock,
          "Coverage (Days)": item.coverage_days,
          "Lead Time": item.lead_time,
          "Lead Time Qty": item.lead_time_qty,
          "Delta": item.delta,
          "Total Lead Time": item.total_lead_time,
          "3M Avg": item.three_m_avg,
          "12M Avg": item.twelve_m_avg,
          "Unit Price": item.price,
          "Status": item.status,
        };
        // Month 1
        rowData[predictionMonthNames[0]] = item.month1_prediction !== null && item.month1_prediction !== undefined ? item.month1_prediction : "";
        const m1Po = (item?.lead_time_qty || 0) - (item?.current_stock || 0) + (item?.month1_prediction || 0);
        const m1PoClamped = m1Po < 0 ? 0 : m1Po;
        rowData[poMonthNames[0]] = m1PoClamped;
        let m1Mes = (item?.current_stock || 0) - (item?.month1_prediction || 0) + m1PoClamped;
        rowData[mesMonthNames[0]] = m1Mes;

        // Month 2
        rowData[predictionMonthNames[1]] = item.month2_prediction !== null && item.month2_prediction !== undefined ? item.month2_prediction : "";
        const m2Po = m1PoClamped + (item?.month2_prediction || 0);
        const m2PoClamped = m2Po < 0 ? 0 : m2Po;
        rowData[poMonthNames[1]] = m2PoClamped;
        const m2Mes = m1Mes + m2PoClamped - (item?.month2_prediction || 0);
        rowData[mesMonthNames[1]] = m2Mes;

        // Month 3
        rowData[predictionMonthNames[2]] = item.month3_prediction !== null && item.month3_prediction !== undefined ? item.month3_prediction : "";
        const m3Po = m2PoClamped + (item?.month3_prediction || 0);
        const m3PoClamped = m3Po < 0 ? 0 : m3Po;
        rowData[poMonthNames[2]] = m3PoClamped;
        const m3Mes = m2Mes + m3PoClamped - (item?.month3_prediction || 0);
        rowData[mesMonthNames[2]] = m3Mes;

        return rowData;
      });

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
        <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search material code, description, or vendor..."
              className="pl-10 h-10 bg-background shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={selectedStatus}
            onValueChange={(val) => {
              setSelectedStatus(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[150px] h-10 bg-background shadow-sm">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border">
              <SelectItem value="all">All Statuses</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                .filter(([key]) => !hiddenColumns.includes(key) && toggleableColumns.some(col => col.id === key))
                .reduce((sum, [_, width]) => sum + width, 0),
              minWidth: "100%",
            }}
          >
            <TableHeader className="bg-muted/50 sticky top-0 z-10">
              <TableRow>
                {renderHeader("material_code", "Material Code")}
                {renderHeader("material_description", "Description")}
                {renderHeader("vendor", "Vendor")}
                {/* {renderHeader("machine_population", "Machine Population", "right")} */}
                {renderHeader("current_stock", "Current Stock", "right")}
                {renderHeader("lead_time_qty", "Lead Time Qty", "right")}
                {/* {renderHeader("coverage_days", "Coverage Days", "right")} */}
                {/* {renderHeader("lead_time", "Lead Time", "right")} */}
                {/* {renderHeader("delta", "Delta", "right")} */}
                {/* {renderHeader("total_lead_time", "Total Lead Time", "right")} */}
                {/* {renderHeader("three_m_avg", "3M Avg", "right")} */}
                {/* {renderHeader("twelve_m_avg", "12M Avg", "right")} */}
                {renderHeader("price", "Price", "right")}
                {renderHeader("status", "Status", "center")}

                {renderHeader("month1_prediction", predictionMonthNames[0], "right")}
                {renderHeader("month1_po", poMonthNames[0], "right")}
                {renderHeader("month1_mes", mesMonthNames[0], "right")}
                {renderHeader("month2_prediction", predictionMonthNames[1], "right")}
                {renderHeader("month2_po", poMonthNames[1], "right")}
                {renderHeader("month2_mes", mesMonthNames[1], "right")}
                {renderHeader("month3_prediction", predictionMonthNames[2], "right")}
                {renderHeader("month3_po", poMonthNames[2], "right")}
                {renderHeader("month3_mes", mesMonthNames[2], "right")}
              </TableRow>
            </TableHeader>

            <TableBody>
              {items.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={16 - hiddenColumns.length} className="h-72 text-center">
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Search className="w-10 h-10 mb-4 opacity-40" />
                      <p className="font-medium">No matching materials found</p>
                      <p className="text-sm mt-1">Try adjusting your search or filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const month1Po =
                    (item?.lead_time_qty || 0) -
                    (item?.current_stock || 0) +
                    (item?.month1_prediction || 0);
                  const month2Po = month1Po + (item?.month2_prediction || 0);
                  const month3Po = month2Po + (item?.month3_prediction || 0);

                  const mes1 = item?.current_stock - (item?.month1_prediction || 0) + month1Po;
                  const mes2 = mes1 + month2Po - (item?.month2_prediction || 0);
                  const mes3 = mes2 + month3Po - (item?.month3_prediction || 0);

                  return (
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
                      {!hiddenColumns.includes("lead_time_qty") && (
                        <TableCell className="text-right font-medium truncate">
                          {item.lead_time_qty?.toFixed(0) || "-"}
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
                          {item.price != null && item.price !== 0
                            ? `₹${item.price.toFixed(2)}`
                            : "-"}
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

                      {!hiddenColumns.includes("month1_prediction") && (
                        <TableCell className="text-right font-medium text-blue-600">
                          {item.month1_prediction !== null && item.month1_prediction !== undefined
                            ? item.month1_prediction.toFixed(0)
                            : "—"}
                        </TableCell>
                      )}

                      {!hiddenColumns.includes("month1_po") && (
                        <TableCell className="text-right font-medium text-blue-600">
                          {month1Po < 0 ? 0 : (month1Po).toFixed(0)}
                        </TableCell>
                      )}

                      {!hiddenColumns.includes("month1_mes") && (
                        <TableCell className="text-right font-medium text-slate-700 dark:text-slate-300">
                          {mes1 !== null && !isNaN(mes1)
                            ? Math.max(0, mes1).toFixed(0)
                            : "—"}
                        </TableCell>
                      )}

                      {!hiddenColumns.includes("month2_prediction") && (
                        <TableCell className="text-right font-medium text-blue-600">
                          {item.month2_prediction !== null && item.month2_prediction !== undefined
                            ? item.month2_prediction.toFixed(0)
                            : "—"}
                        </TableCell>
                      )}

                      {!hiddenColumns.includes("month2_po") && (
                        <TableCell className="text-right font-medium text-blue-600">
                          {month2Po < 0 ? 0 : (month2Po).toFixed(0)}
                        </TableCell>
                      )}

                      {!hiddenColumns.includes("month2_mes") && (
                        <TableCell className="text-right font-medium text-slate-700 dark:text-slate-300">
                          {mes2 !== null && !isNaN(mes2)
                            ? Math.max(0, mes2).toFixed(0)
                            : "—"}
                        </TableCell>
                      )}

                      {!hiddenColumns.includes("month3_prediction") && (
                        <TableCell className="text-right font-medium text-blue-600">
                          {item.month3_prediction !== null && item.month3_prediction !== undefined
                            ? item.month3_prediction.toFixed(0)
                            : "—"}
                        </TableCell>
                      )}

                      {!hiddenColumns.includes("month3_po") && (
                        <TableCell className="text-right font-medium text-blue-600">
                          {month3Po < 0 ? 0 : (month3Po).toFixed(0)}
                        </TableCell>
                      )}

                      {!hiddenColumns.includes("month3_mes") && (
                        <TableCell className="text-right font-medium text-slate-700 dark:text-slate-300">
                          {mes3 !== null && !isNaN(mes3)
                            ? Math.max(0, mes3).toFixed(0)
                            : "—"}
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })
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
