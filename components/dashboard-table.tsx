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
  TrendingUpDown,
  ShoppingCart,
  Box,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Filter,
  X,
  ChevronDown,
  RefreshCw
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Item, UserCheckDetail } from "@/app/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useAuth } from "@/components/auth-provider";
import api from "@/app/lib/api";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";

export interface EnrichedItem extends Item {
  month1_po: number;
  month1_mes: number;
  month1_prediction_days: number;
  month1_po_days: number;
  month1_mes_days: number;
  month2_po: number;
  month2_mes: number;
  month2_prediction_days: number;
  month2_po_days: number;
  month2_mes_days: number;
  month3_po: number;
  month3_mes: number;
  month3_prediction_days: number;
  month3_po_days: number;
  month3_mes_days: number;
}

const getAvatarGradient = (email: string) => {
  const gradients = [
    "from-blue-600 to-indigo-600",
    "from-emerald-600 to-teal-600",
    "from-violet-600 to-purple-600",
    "from-rose-600 to-pink-600",
    "from-amber-600 to-orange-600",
    "from-cyan-600 to-blue-600",
    "from-fuchsia-600 to-pink-600",
    "from-violet-600 to-indigo-600",
  ];
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

interface DashboardTableProps {
  allItems: Item[];
  loading: boolean;
  onSelectMaterial: (item: Item) => void;
  onRefresh?: () => void;
}

export function DashboardTable({
  allItems,
  loading,
  onSelectMaterial,
  onRefresh,
}: DashboardTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  // const [tableDensity, setTableDensity] = useState<"default" | "compact">(
  //   "default",
  // );
  const [viewMode, setViewMode] = useState<"qty" | "days">("qty");
  const [pageSize, setPageSize] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc" | null;
  }>({
    key: "",
    direction: null,
  });

  const { user } = useAuth();
  const [localChecks, setLocalChecks] = useState<
    Record<string, { is_checked: boolean; checks?: UserCheckDetail[] }>
  >({});

  const [selectedFilterUsers, setSelectedFilterUsers] = useState<string[]>([]);

  const allUsers = useMemo(() => {
    const userMap = new Map<string, { email: string; name: string }>();
    allItems.forEach((item) => {
      item.checks?.forEach((c) => {
        if (!userMap.has(c.email)) {
          userMap.set(c.email, {
            email: c.email,
            name: `${c.first_name} ${c.last_name}`.trim(),
          });
        }
      });
    });
    return Array.from(userMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allItems]);

  const formatCheckTime = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const handleToggleCheck = async (item: Item) => {
    const material_code = item.material_code;
    const currentChecked = user?.role === "admin"
      ? (item.checks?.some((c) => c.email === user?.email && c.is_checked) ?? false)
      : (item.is_checked ?? false);

    const newChecked = !currentChecked;

    // Optimistically update local state
    const nowStr = new Date().toISOString();
    const userCheckDetail: UserCheckDetail = {
      email: user?.email || "",
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      is_checked: newChecked,
      checked_at: newChecked ? nowStr : undefined,
      unchecked_at: !newChecked ? nowStr : undefined,
    };

    let newChecks = [...(item.checks || [])];
    const userIndex = newChecks.findIndex((c) => c.email === user?.email);
    if (userIndex > -1) {
      newChecks[userIndex] = userCheckDetail;
    } else {
      newChecks.push(userCheckDetail);
    }

    setLocalChecks((prev) => ({
      ...prev,
      [material_code]: {
        is_checked: newChecked,
        checks: newChecks,
      },
    }));

    try {
      await api.post("/dashboard/check", {
        material_code,
        is_checked: newChecked,
      });
    } catch (err) {
      console.error("Failed to update check status", err);
      // Revert local update on failure
      setLocalChecks((prev) => {
        const updated = { ...prev };
        delete updated[material_code];
        return updated;
      });
    }
  };

  const renderPOCellContent = (predictedQty: number, predictedDays: number, actualQty: number | null | undefined, twelveMAvg: number) => {
    const dailyDemand = twelveMAvg ? twelveMAvg / 30 : 0;
    const showActual = actualQty !== null && actualQty !== undefined;

    let predText = "";
    let actText = "";

    if (viewMode === "days") {
      predText = predictedDays ? `${predictedDays.toFixed(0)}d` : "0d";
      if (showActual) {
        const actDays = dailyDemand > 0 ? actualQty! / dailyDemand : 0;
        actText = `${actDays.toFixed(0)}d`;
      }
    } else {
      predText = predictedQty.toFixed(0);
      if (showActual) {
        actText = actualQty!.toFixed(0);
      }
    }

    return (
      <div className="flex flex-col items-center justify-center leading-tight">
        <span>{predText}</span>
        {showActual && (
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
            Act: {actText}
          </span>
        )}
      </div>
    );
  };

  const renderMESCellContent = (predictedQty: number, predictedDays: number, actualQty: number | null | undefined, actualDays: number | null | undefined, hasAnyActualPO: boolean) => {
    let predText = "";
    let actText = "";

    if (viewMode === "days") {
      predText = predictedDays ? `${predictedDays.toFixed(0)}d` : "0d";
      if (hasAnyActualPO) {
        actText = actualDays !== null && actualDays !== undefined ? `${actualDays.toFixed(0)}d` : "0d";
      }
    } else {
      predText = predictedQty ? predictedQty.toFixed(0) : "0";
      if (hasAnyActualPO) {
        actText = actualQty !== null && actualQty !== undefined ? actualQty.toFixed(0) : "0";
      }
    }

    return (
      <div className="flex flex-col items-center justify-center leading-tight">
        <span>{predText}</span>
        {hasAnyActualPO && (
          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
            Act: {actText}
          </span>
        )}
      </div>
    );
  };

  const selectedStatus = filters.status || "all";
  const setSelectedStatus = (statusVal: string) => {
    setFilters((prev) => ({
      ...prev,
      status: statusVal === "all" ? "" : statusVal,
    }));
  };

  const selectedCategory = filters.product_category || "all";
  const setSelectedCategory = (categoryVal: string) => {
    setFilters((prev) => ({
      ...prev,
      product_category: categoryVal === "all" ? "" : categoryVal,
    }));
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === "asc") {
          return { key, direction: "desc" };
        } else if (prev.direction === "desc") {
          return { key: "", direction: null };
        }
      }
      return { key, direction: "asc" };
    });
  };

  const statuses = useMemo(() => {
    const set = new Set<string>();
    allItems.forEach((item) => {
      if (item.status) {
        set.add(item.status);
      }
    });
    return Array.from(set).sort();
  }, [allItems]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    allItems.forEach((item) => {
      if (item.product_category) {
        set.add(item.product_category);
      }
    });
    return Array.from(set).sort();
  }, [allItems]);

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    is_checked: 110,
    selection: 48,
    material_code: 140,
    material_description: 220,
    vendor: 120,
    remarks: 180,
    machine_population: 170,
    current_stock: 110,
    coverage_days: 140,
    product_category: 100,
    lead_time: 110,
    lead_time_qty: 100,
    delta: 95,
    total_lead_time: 130,
    three_m_avg: 110,
    twelve_m_avg: 110,
    price: 90,
    status: 115,
    month1_prediction: 100,
    month1_po: 100,
    month1_mes: 100,
    month2_prediction: 100,
    month2_po: 100,
    month2_mes: 100,
    month3_prediction: 100,
    month3_po: 100,
    month3_mes: 100,
  });

  const predictionMonthNames = useMemo(() => {
    const itemWithPrediction = allItems.find(
      (item) => item.month1_date && item.month2_date && item.month3_date,
    );

    if (itemWithPrediction && itemWithPrediction.month1_date) {
      const formatDateStr = (dateStr: string) => {
        try {
          const dateObj = new Date(dateStr);
          const months = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          return `${months[dateObj.getMonth()]}-${dateObj.getFullYear().toString().slice(-2)} Forecast`;
        } catch {
          return null;
        }
      };
      const m1 = formatDateStr(itemWithPrediction.month1_date);
      const m2 = itemWithPrediction.month2_date
        ? formatDateStr(itemWithPrediction.month2_date)
        : null;
      const m3 = itemWithPrediction.month3_date
        ? formatDateStr(itemWithPrediction.month3_date)
        : null;

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

  const toggleableColumns = useMemo(
    () => [
      { id: "is_checked", label: "Checked" },
      { id: "material_code", label: "Material Code" },
      { id: "material_description", label: "Description" },
      { id: "vendor", label: "Vendor" },
      { id: "remarks", label: "Remarks" },
      { id: "current_stock", label: "GPC Stk." },
      { id: "coverage_days", label: "Coverage Days" },
      { id: "product_category", label: "Category" },
      { id: "lead_time", label: "Lead Time" },
      { id: "lead_time_qty", label: "LT Qty." },
      { id: "twelve_m_avg", label: "12M Avg" },
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
    ],
    [predictionMonthNames, poMonthNames, mesMonthNames],
  );

  const toggleColumnVisibility = (columnId: string) => {
    setHiddenColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((col) => col !== columnId)
        : [...prev, columnId],
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

  const getMonthPart = (headerText: string) => {
    if (headerText.endsWith(" Forecast")) {
      return headerText.slice(0, -9);
    }
    if (headerText.startsWith("PO in ")) {
      return headerText.slice(6);
    }
    if (headerText.startsWith("MES in ")) {
      return headerText.slice(7);
    }
    return headerText;
  };

  const renderSortIcon = (key: string) => {
    const isSorted = sortConfig.key === key;
    if (!isSorted) {
      return (
        <ArrowUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100 transition-opacity flex-shrink-0" />
      );
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
    );
  };

  const renderFilterInput = (key: string) => {
    if (key === "status") {
      return (
        <Select
          value={filters.status || "all"}
          onValueChange={(val) =>
            handleFilterChange("status", val === "all" ? "" : val)
          }
        >
          <SelectTrigger className="h-7 text-[11px] px-2 bg-background border border-muted-foreground/20 font-normal w-full shadow-none focus:ring-1 focus:ring-blue-500 rounded">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent className="bg-background border border-border">
            <SelectItem value="all">All</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (key === "product_category") {
      return (
        <Select
          value={filters.product_category || "all"}
          onValueChange={(val) =>
            handleFilterChange("product_category", val === "all" ? "" : val)
          }
        >
          <SelectTrigger className="h-7 text-[11px] px-2 bg-background border border-muted-foreground/20 font-normal w-full shadow-none focus:ring-1 focus:ring-blue-500 rounded">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent className="bg-background border border-border">
            <SelectItem value="all">All</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (key === "is_checked") {
      if (user?.role !== "admin") {
        return (
          <Select
            value={filters.is_checked || "all"}
            onValueChange={(val) =>
              handleFilterChange("is_checked", val === "all" ? "" : val)
            }
          >
            <SelectTrigger className="h-7 text-[11px] px-2 bg-background border border-muted-foreground/20 font-normal w-full shadow-none focus:ring-1 focus:ring-blue-500 rounded">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="checked">Checked</SelectItem>
              <SelectItem value="unchecked">Unchecked</SelectItem>
            </SelectContent>
          </Select>
        );
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-7 text-[10px] px-2 bg-background border border-muted-foreground/20 font-normal w-full shadow-none justify-between rounded hover:bg-background/80 active:bg-background"
            >
              <span className="truncate">
                {selectedFilterUsers.length === 0
                  ? "All Users"
                  : selectedFilterUsers.length === 1
                    ? allUsers.find(u => u.email === selectedFilterUsers[0])?.name || "1 User"
                    : `${selectedFilterUsers.length} Users`}
              </span>
              <ChevronDown className="w-3 h-3 text-muted-foreground ml-1.5 flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-56 bg-background border border-border z-[100]"
          >
            <DropdownMenuLabel className="text-xs">Filter Checked Users</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {allUsers.length === 0 ? (
              <div className="p-2 text-xs text-muted-foreground text-center">No checks found</div>
            ) : (
              <>
                {allUsers.map((u) => (
                  <DropdownMenuCheckboxItem
                    key={u.email}
                    className="text-xs"
                    checked={selectedFilterUsers.includes(u.email)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedFilterUsers((prev) => [...prev, u.email]);
                      } else {
                        setSelectedFilterUsers((prev) => prev.filter((e) => e !== u.email));
                      }
                      setCurrentPage(1);
                    }}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {u.name}
                  </DropdownMenuCheckboxItem>
                ))}
                {selectedFilterUsers.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-xs text-center justify-center font-medium text-blue-600 hover:text-blue-500 cursor-pointer"
                      onClick={() => {
                        setSelectedFilterUsers([]);
                        setCurrentPage(1);
                      }}
                    >
                      Clear Filter
                    </DropdownMenuItem>
                  </>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    const isNumericKey = ![
      "is_checked",
      "material_code",
      "material_description",
      "vendor",
      "status",
      "product_category",
    ].includes(key);

    return (
      <div className="relative w-full">
        <Filter className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/50 pointer-events-none" />
        <Input
          className="h-7 text-xs pl-6 pr-5 bg-background border border-muted-foreground/20 rounded font-normal w-full shadow-none focus-visible:ring-1 focus-visible:ring-blue-500"
          value={filters[key] || ""}
          onChange={(e) => handleFilterChange(key, e.target.value)}
          placeholder={isNumericKey ? "e.g. >=10, !=0" : ""}
          title={
            isNumericKey
              ? "Filter options: >=, <=, >, <, !=, =, ranges (e.g., 10..20), or comma-separated conditions (e.g., >=10, <=20)"
              : ""
          }
        />
        {(filters[key] || "").length > 0 && (
          <button
            onClick={() => handleFilterChange(key, "")}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-[10px] p-0.5 line-none font-bold"
            title="Clear filter"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  };

  const renderHeader = (
    key: keyof typeof columnWidths,
    label: string,
    align: "left" | "right" | "center" = "left",
    extraClass: string = "",
  ) => {
    if (hiddenColumns.includes(key)) return null;

    let displayLabel: React.ReactNode = label;
    let tooltipTitle: string = label;

    if (key.endsWith("_prediction")) {
      const monthStr = getMonthPart(label);
      tooltipTitle = `${monthStr} Forecast (${viewMode === "days" ? "Days" : "Quantity"})`;
      displayLabel = (
        <span
          className={cn(
            "inline-flex items-center gap-1.5",
            align === "right" && "justify-end",
            align === "center" && "justify-center",
          )}
        >
          <TrendingUpDown className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
          <span>
            {monthStr}{" "}
            {/* <span className="text-[10px] opacity-70 font-normal">
              ({viewMode === "days" ? "Days" : "Qty"})
            </span> */}
          </span>
        </span>
      );
    } else if (key.endsWith("_po")) {
      const monthStr = getMonthPart(label);
      tooltipTitle = `${monthStr} Purchase Order (${viewMode === "days" ? "Days" : "Quantity"})`;
      displayLabel = (
        <span
          className={cn(
            "inline-flex items-center gap-1.5",
            align === "right" && "justify-end",
            align === "center" && "justify-center",
          )}
        >
          <ShoppingCart className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 flex-shrink-0" />
          <span>
            {monthStr}{" "}
            {/* <span className="text-[10px] opacity-70 font-normal">
              ({viewMode === "days" ? "Days" : "Qty"})
            </span> */}
          </span>
        </span>
      );
    } else if (key.endsWith("_mes")) {
      const monthStr = getMonthPart(label);
      tooltipTitle = `${monthStr} MES (${viewMode === "days" ? "Days" : "Quantity"})`;
      displayLabel = (
        <span
          className={cn(
            "inline-flex items-center gap-1.5",
            align === "right" && "justify-end",
            align === "center" && "justify-center",
          )}
        >
          <Box className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400 flex-shrink-0" />
          <span>
            {monthStr}{" "}
            {/* <span className="text-[10px] opacity-70 font-normal">
              ({viewMode === "days" ? "Days" : "Qty"})
            </span> */}
          </span>
        </span>
      );
    }

    return (
      <TableHead
        style={{ width: columnWidths[key] }}
        className={cn(
          "font-medium text-muted-foreground relative group select-none overflow-hidden whitespace-normal break-words h-auto align-middle pb-2.5 pt-2 px-2",
          align === "right" && "text-right",
          align === "center" && "text-center",
          extraClass,
        )}
        title={tooltipTitle}
      >
        <div className="flex flex-col gap-1.5 h-full justify-between">
          <div
            className={cn(
              "flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors leading-tight",
              align === "right" && "justify-end",
              align === "center" && "justify-center",
            )}
            onClick={() => handleSort(key)}
          >
            <div className="truncate">{displayLabel}</div>
            <div className="flex-shrink-0">{renderSortIcon(key)}</div>
          </div>

          <div className="mt-1 w-full" onClick={(e) => e.stopPropagation()}>
            {renderFilterInput(key)}
          </div>
        </div>

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

  const enrichedItems = useMemo(() => {
    return allItems.map((item) => {
      // Calculate coverage days safely
      let computedCoverage = 0;
      if (item.twelve_m_avg && item.twelve_m_avg > 0) {
        const val = (item.current_stock / item.twelve_m_avg) * 30;
        if (isFinite(val) && !isNaN(val)) {
          computedCoverage = val;
        } else {
          computedCoverage = item.current_stock > 0 ? 999999 : 0;
        }
      } else {
        computedCoverage = item.current_stock > 0 ? 999999 : 0;
      }

      const localOverride = localChecks[item.material_code];
      const isChecked = localOverride !== undefined ? localOverride.is_checked : (item.is_checked ?? false);
      const checks = localOverride !== undefined ? localOverride.checks : (item.checks ?? []);

      return {
        ...item,
        coverage_days: computedCoverage,
        is_checked: isChecked,
        checks: checks,
        month1_po: item.month1_po || 0,
        month1_mes: item.month1_mes || 0,
        month1_prediction_days: item.month1_prediction_days || 0,
        month1_po_days: item.month1_po_days || 0,
        month1_mes_days: item.month1_mes_days || 0,
        month2_po: item.month2_po || 0,
        month2_mes: item.month2_mes || 0,
        month2_prediction_days: item.month2_prediction_days || 0,
        month2_po_days: item.month2_po_days || 0,
        month2_mes_days: item.month2_mes_days || 0,
        month3_po: item.month3_po || 0,
        month3_mes: item.month3_mes || 0,
        month3_prediction_days: item.month3_prediction_days || 0,
        month3_po_days: item.month3_po_days || 0,
        month3_mes_days: item.month3_mes_days || 0,
      };
    });
  }, [allItems, localChecks]);

  const matchStringFilter = (
    val: string | undefined | null,
    filterStr: string,
  ): boolean => {
    if (!filterStr) return true;
    if (!val) return false;
    return val.toLowerCase().includes(filterStr.toLowerCase().trim());
  };

  const matchNumericFilter = (
    val: number | undefined | null,
    filterStr: string,
  ): boolean => {
    if (!filterStr) return true;
    if (val === undefined || val === null) return false;

    // Split filter string by comma to support multiple conditions (logical AND)
    // Example: ">=10, <=20, !=15"
    const conditions = filterStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (conditions.length === 0) return true;

    return conditions.every((cond) => {
      const trimmed = cond;

      if (trimmed.startsWith(">=")) {
        const num = parseFloat(trimmed.slice(2).trim());
        return isNaN(num) ? true : val >= num;
      }
      if (trimmed.startsWith("<=")) {
        const num = parseFloat(trimmed.slice(2).trim());
        return isNaN(num) ? true : val <= num;
      }
      if (trimmed.startsWith("!==")) {
        const num = parseFloat(trimmed.slice(3).trim());
        return isNaN(num) ? true : val !== num;
      }
      if (trimmed.startsWith("!=")) {
        const num = parseFloat(trimmed.slice(2).trim());
        return isNaN(num) ? true : val !== num;
      }
      if (trimmed.startsWith("<>")) {
        const num = parseFloat(trimmed.slice(2).trim());
        return isNaN(num) ? true : val !== num;
      }
      if (trimmed.startsWith(">")) {
        const num = parseFloat(trimmed.slice(1).trim());
        return isNaN(num) ? true : val > num;
      }
      if (trimmed.startsWith("<")) {
        const num = parseFloat(trimmed.slice(1).trim());
        return isNaN(num) ? true : val < num;
      }
      if (trimmed.startsWith("==")) {
        const num = parseFloat(trimmed.slice(2).trim());
        return isNaN(num) ? true : val === num;
      }
      if (trimmed.startsWith("=")) {
        const num = parseFloat(trimmed.slice(1).trim());
        return isNaN(num) ? true : val === num;
      }

      // Check for range formats like "10..20" or "10-20"
      if (trimmed.includes("..")) {
        const parts = trimmed.split("..");
        if (parts.length === 2) {
          const min = parseFloat(parts[0].trim());
          const max = parseFloat(parts[1].trim());
          const matchMin = isNaN(min) ? true : val >= min;
          const matchMax = isNaN(max) ? true : val <= max;
          return matchMin && matchMax;
        }
      }

      const rangeParts = trimmed.split("-");
      if (
        rangeParts.length === 2 &&
        rangeParts[0].trim() !== "" &&
        rangeParts[1].trim() !== ""
      ) {
        const min = parseFloat(rangeParts[0].trim());
        const max = parseFloat(rangeParts[1].trim());
        if (!isNaN(min) && !isNaN(max)) {
          return val >= min && val <= max;
        }
      }

      // Default fallback
      const num = parseFloat(trimmed);
      return isNaN(num) ? val.toString().includes(trimmed) : val === num;
    });
  };

  const filteredItems = useMemo(() => {
    let result = enrichedItems;

    if (debouncedSearch) {
      const lower = debouncedSearch.toLowerCase();
      result = result.filter(
        (item) =>
          item.material_code?.toLowerCase().includes(lower) ||
          item.material_description?.toLowerCase().includes(lower) ||
          item.vendor?.toLowerCase().includes(lower),
      );
    }

    Object.entries(filters).forEach(([key, filterVal]) => {
      if (!filterVal) return;

      if (key === "is_checked") {
        if (filterVal === "checked") {
          result = result.filter((item) => item.is_checked === true);
        } else if (filterVal === "unchecked") {
          result = result.filter((item) => item.is_checked === false);
        }
      } else if (key === "status") {
        result = result.filter((item) => item.status === filterVal);
      } else if (key === "product_category") {
        result = result.filter((item) => item.product_category === filterVal);
      } else if (
        key === "material_code" ||
        key === "material_description" ||
        key === "vendor"
      ) {
        result = result.filter((item) =>
          matchStringFilter(item[key as keyof Item] as string, filterVal),
        );
      } else {
        result = result.filter((item) =>
          matchNumericFilter(
            item[key as keyof typeof item] as number,
            filterVal,
          ),
        );
      }
    });

    if (user?.role === "admin" && selectedFilterUsers.length > 0) {
      result = result.filter((item) =>
        item.checks?.some((c) => selectedFilterUsers.includes(c.email) && c.is_checked)
      );
    }

    return result;
  }, [enrichedItems, debouncedSearch, filters, selectedFilterUsers, user]);

  const sortedItems = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return filteredItems;

    const key = sortConfig.key;
    const direction = sortConfig.direction;

    return [...filteredItems].sort((a, b) => {
      let aVal = a[key as keyof typeof a];
      let bVal = b[key as keyof typeof b];

      if (aVal === undefined || aVal === null) aVal = "";
      if (bVal === undefined || bVal === null) bVal = "";

      if (typeof aVal === "number" && typeof bVal === "number") {
        return direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();

      if (aStr < bStr) return direction === "asc" ? -1 : 1;
      if (aStr > bStr) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredItems, sortConfig]);

  const items = useMemo(() => {
    const size = Number(pageSize);
    const start = (currentPage - 1) * size;
    return sortedItems.slice(start, start + size);
  }, [sortedItems, currentPage, pageSize]);

  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / Number(pageSize));

  const handleExport = async () => {
    try {
      setIsExporting(true);

      const data = (filteredItems as EnrichedItem[]).map((item) => {
        const rowData: Record<string, string | number | null | undefined> = {
          Checked: (item.is_checked || item.checks?.some((c) => c.is_checked)) ? "Yes" : "No",
          "Material Code": item.material_code,
          Category: item.product_category,
          Description: item.material_description,
          Vendor: item.vendor,
          Remarks: item.remarks,
          "Machine Population": item.machine_population,
          "GPC Stk.": item.current_stock,
          "Coverage (Days)": item.coverage_days,
          "Lead Time": item.lead_time,
          "LT Qty.": item.lead_time_qty,
          Delta: item.delta,
          "Total Lead Time": item.total_lead_time,
          "3M Avg": item.three_m_avg,
          "12M Avg": item.twelve_m_avg,
          "Unit Price": item.price,
          Status: item.status,
        };
        // Month 1
        rowData[predictionMonthNames[0]] =
          item.month1_prediction !== null &&
            item.month1_prediction !== undefined
            ? item.month1_prediction
            : "";
        rowData[`${predictionMonthNames[0]} (Days)`] =
          item.month1_prediction_days !== null &&
            item.month1_prediction_days !== undefined
            ? item.month1_prediction_days
            : "";
        rowData[poMonthNames[0]] = item.month1_po;
        rowData[`${poMonthNames[0]} (Days)`] = item.month1_po_days;
        rowData[mesMonthNames[0]] = item.month1_mes;
        rowData[`${mesMonthNames[0]} (Days)`] = item.month1_mes_days;

        // Month 2
        rowData[predictionMonthNames[1]] =
          item.month2_prediction !== null &&
            item.month2_prediction !== undefined
            ? item.month2_prediction
            : "";
        rowData[`${predictionMonthNames[1]} (Days)`] =
          item.month2_prediction_days !== null &&
            item.month2_prediction_days !== undefined
            ? item.month2_prediction_days
            : "";
        rowData[poMonthNames[1]] = item.month2_po;
        rowData[`${poMonthNames[1]} (Days)`] = item.month2_po_days;
        rowData[mesMonthNames[1]] = item.month2_mes;
        rowData[`${mesMonthNames[1]} (Days)`] = item.month2_mes_days;

        // Month 3
        rowData[predictionMonthNames[2]] =
          item.month3_prediction !== null &&
            item.month3_prediction !== undefined
            ? item.month3_prediction
            : "";
        rowData[`${predictionMonthNames[2]} (Days)`] =
          item.month3_prediction_days !== null &&
            item.month3_prediction_days !== undefined
            ? item.month3_prediction_days
            : "";
        rowData[poMonthNames[2]] = item.month3_po;
        rowData[`${poMonthNames[2]} (Days)`] = item.month3_po_days;
        rowData[mesMonthNames[2]] = item.month3_mes;
        rowData[`${mesMonthNames[2]} (Days)`] = item.month3_mes_days;

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

          <Select
            value={selectedCategory}
            onValueChange={(val) => {
              setSelectedCategory(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[170px] h-10 bg-background shadow-sm">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3 text-sm">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 cursor-pointer"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              Refresh
            </Button>
          )}

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
            <DropdownMenuContent
              align="end"
              className="w-56 bg-background border border-border"
            >
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

          <span className="text-muted-foreground hidden sm:inline">View:</span>
          <div className="flex items-center border border-input rounded-md overflow-hidden bg-background h-8 mr-1 shadow-sm">
            <button
              type="button"
              className={cn(
                "h-full px-3 font-semibold cursor-pointer text-[11px] transition-all duration-150 focus:outline-none",
                viewMode === "qty"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted/70 text-muted-foreground",
              )}
              onClick={() => setViewMode("qty")}
            >
              Qty
            </button>
            <button
              type="button"
              className={cn(
                "h-full px-3 font-semibold cursor-pointer text-[11px] transition-all duration-150 border-l border-input focus:outline-none",
                viewMode === "days"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted/70 text-muted-foreground",
              )}
              onClick={() => setViewMode("days")}
            >
              Days
            </button>
          </div>

          {/* <span className="text-muted-foreground hidden sm:inline">
            Density:
          </span> */}
          {/* <Button
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
          </Button> */}
        </div>
      </div>

      {/* MAIN TABLE */}
      <Card className="shadow-sm border-border overflow-hidden">
        <div className="overflow-x-auto relative">
          {loading && items.length > 0 && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-20 flex items-center justify-center">
              <div className="animate-pulse font-medium text-blue-600">
                Loading...
              </div>
            </div>
          )}
          <Table
            style={{
              tableLayout: "fixed",
              width: Object.entries(columnWidths)
                .filter(
                  ([key]) =>
                    !hiddenColumns.includes(key) &&
                    toggleableColumns.some((col) => col.id === key),
                )
                .reduce((sum, entry) => sum + entry[1], 0),
              minWidth: "100%",
            }}
          >
            <TableHeader className="bg-muted/50 sticky top-0 z-10">
              <TableRow>
                {renderHeader("is_checked", "Checked", "center")}
                {renderHeader("material_code", "Material Code")}
                {renderHeader("product_category", "Category")}
                {renderHeader("material_description", "Description")}
                {renderHeader("vendor", "Vendor")}
                {renderHeader("remarks", "Remarks")}
                {/* {renderHeader("machine_population", "Machine Population", "right")} */}
                {renderHeader("current_stock", "GPC Stk.", "right")}
                {renderHeader("coverage_days", "Coverage Days", "right")}
                {renderHeader("lead_time", "Lead Time", "right")}
                {renderHeader("lead_time_qty", "LT Qty.", "right")}
                {/* {renderHeader("delta", "Delta", "right")} */}
                {/* {renderHeader("total_lead_time", "Total Lead Time", "right")} */}
                {/* {renderHeader("three_m_avg", "3M Avg", "right")} */}
                {renderHeader("twelve_m_avg", "12M Avg", "right")}
                {renderHeader("price", "Price", "right")}
                {renderHeader("status", "Status", "center")}

                {renderHeader(
                  "month1_prediction",
                  predictionMonthNames[0],
                  "right",
                  "bg-blue-200/40 dark:bg-blue-950/20",
                )}
                {renderHeader(
                  "month1_po",
                  poMonthNames[0],
                  "right",
                  "bg-blue-200/40 dark:bg-blue-950/20",
                )}
                {renderHeader(
                  "month1_mes",
                  mesMonthNames[0],
                  "right",
                  "bg-blue-200/40 dark:bg-blue-950/20",
                )}
                {renderHeader(
                  "month2_prediction",
                  predictionMonthNames[1],
                  "right",
                  "bg-amber-200/40 dark:bg-amber-950/20",
                )}
                {renderHeader(
                  "month2_po",
                  poMonthNames[1],
                  "right",
                  "bg-amber-200/40 dark:bg-amber-950/20",
                )}
                {renderHeader(
                  "month2_mes",
                  mesMonthNames[1],
                  "right",
                  "bg-amber-200/40 dark:bg-amber-950/20",
                )}
                {renderHeader(
                  "month3_prediction",
                  predictionMonthNames[2],
                  "right",
                  "bg-fuchsia-200/40 dark:bg-fuchsia-950/20",
                )}
                {renderHeader(
                  "month3_po",
                  poMonthNames[2],
                  "right",
                  "bg-fuchsia-200/40 dark:bg-fuchsia-950/20",
                )}
                {renderHeader(
                  "month3_mes",
                  mesMonthNames[2],
                  "right",
                  "bg-fuchsia-200/40 dark:bg-fuchsia-950/20",
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {items.length === 0 && !loading ? (
                <TableRow>
                  <TableCell
                    colSpan={toggleableColumns.filter((c) => !hiddenColumns.includes(c.id)).length}
                    className="h-72 text-center"
                  >
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
                items.map((item) => {
                  const usersWhoChecked = item.checks?.filter((c) => c.is_checked) || [];
                  return (
                    <TableRow
                      key={item.material_code}
                      className={cn(
                        "hover:bg-muted/50 transition-colors group cursor-pointer",
                        // tableDensity === "compact" && "h-12",
                      )}
                      onClick={() => onSelectMaterial(item)}
                    >
                      {!hiddenColumns.includes("is_checked") && (
                        <TableCell
                          className="text-center align-middle py-2 px-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Checkbox
                              checked={item.is_checked ?? false}
                              onCheckedChange={() => handleToggleCheck(item)}
                              aria-label={`Toggle check for ${item.material_code}`}
                            />
                            {user?.role === "admin" && usersWhoChecked.length > 0 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center cursor-help ml-1">
                                    <AvatarGroup>
                                      {usersWhoChecked.map((check) => {
                                        const initials = `${check.first_name[0] || ""}${check.last_name[0] || ""}`.toUpperCase();
                                        return (
                                          <Avatar key={check.email} size="sm" className="border-border shadow-sm select-none">
                                            <AvatarFallback className={cn("bg-gradient-to-br text-[8px] text-white font-extrabold", getAvatarGradient(check.email))}>
                                              {initials}
                                            </AvatarFallback>
                                          </Avatar>
                                        );
                                      })}
                                    </AvatarGroup>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="bg-white dark:bg-zinc-900 border border-border p-3 shadow-lg rounded-md max-w-sm text-foreground z-[100]">
                                  <div className="space-y-2 min-w-[200px]">
                                    <p className="font-semibold text-xs border-b border-border pb-1">User Check Statuses</p>
                                    {item.checks && item.checks.length > 0 ? (
                                      <div className="space-y-2 text-xs">
                                        {item.checks.map((check) => (
                                          <div key={check.email} className="flex items-center justify-between gap-3">
                                            <div className="flex flex-col text-left">
                                              <span className="font-medium text-foreground">
                                                {check.first_name} {check.last_name}
                                              </span>
                                              <span className="text-[10px] text-muted-foreground">
                                                {check.email}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] text-right">
                                              {check.is_checked ? (
                                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/20 px-1 py-0.5 rounded">
                                                  Checked {formatCheckTime(check.checked_at)}
                                                </span>
                                              ) : check.unchecked_at ? (
                                                <span className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-1 py-0.5 rounded">
                                                  Unchecked {formatCheckTime(check.unchecked_at)}
                                                </span>
                                              ) : (
                                                <span className="text-muted-foreground opacity-60 bg-muted px-1 py-0.5 rounded">
                                                  Not checked
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-muted-foreground">No users have checked this item.</p>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                      )}
                      {!hiddenColumns.includes("material_code") && (
                        <TableCell className="font-medium truncate">
                          {item.material_code}
                        </TableCell>
                      )}
                      {!hiddenColumns.includes("product_category") && (
                        <TableCell
                          className="truncate"
                          title={item.product_category}
                        >
                          {item.product_category}
                        </TableCell>
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
                      {!hiddenColumns.includes("remarks") && (
                        <TableCell className="text-muted-foreground truncate" title={item.remarks}>
                          {item.remarks || "—"}
                        </TableCell>
                      )}
                      {!hiddenColumns.includes("current_stock") && (
                        <TableCell className="text-center font-medium truncate">
                          {item.current_stock?.toFixed(1) || "0.0"}
                        </TableCell>
                      )}
                      {!hiddenColumns.includes("coverage_days") && (
                        <TableCell className="text-center font-medium truncate">
                          {item.coverage_days >= 999999
                            ? "—"
                            : item.coverage_days.toFixed(0)}
                        </TableCell>
                      )}
                      {!hiddenColumns.includes("lead_time") && (
                        <TableCell className="text-center font-medium truncate">
                          {item.lead_time || "-"}
                        </TableCell>
                      )}
                      {!hiddenColumns.includes("lead_time_qty") && (
                        <TableCell className="text-center font-medium truncate">
                          {item.lead_time_qty?.toFixed(0) || "-"}
                        </TableCell>
                      )}
                      {!hiddenColumns.includes("twelve_m_avg") && (
                        <TableCell className="text-center font-medium truncate">
                          {item.twelve_m_avg?.toFixed(0) || "-"}
                        </TableCell>
                      )}
                      {!hiddenColumns.includes("price") && (
                        <TableCell className="text-center font-medium truncate">
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
                              "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
                            )}
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                      )}

                      {!hiddenColumns.includes("month1_prediction") && (
                        <TableCell className="text-center font-medium text-blue-600 bg-blue-200/30 dark:bg-blue-950/10">
                          {item.month1_prediction !== null &&
                            item.month1_prediction !== undefined ? (
                            viewMode === "days" ? (
                              <span>
                                {item.month1_prediction_days
                                  ? `${item.month1_prediction_days.toFixed(0)}d`
                                  : "0d"}
                              </span>
                            ) : (
                              <span>{item.month1_prediction.toFixed(0)}</span>
                            )
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      )}

                      {!hiddenColumns.includes("month1_po") && (
                        <TableCell className="text-center font-medium text-blue-600 bg-blue-200/30 dark:bg-blue-950/10">
                          {renderPOCellContent(item.month1_po, item.month1_po_days, item.actual_month1_po, item.twelve_m_avg)}
                        </TableCell>
                      )}

                      {!hiddenColumns.includes("month1_mes") && (
                        <TableCell className="text-center font-medium text-slate-700 dark:text-slate-300 bg-blue-200/30 dark:bg-blue-950/10">
                          {renderMESCellContent(
                            item.month1_mes,
                            item.month1_mes_days,
                            item.actual_month1_mes,
                            item.actual_month1_mes_days,
                            item.actual_month1_po !== null || item.actual_month2_po !== null || item.actual_month3_po !== null
                          )}
                        </TableCell>
                      )}

                      {!hiddenColumns.includes("month2_prediction") && (
                        <TableCell className="text-center font-medium text-blue-600 bg-amber-200/30 dark:bg-amber-950/10">
                          {item.month2_prediction !== null &&
                            item.month2_prediction !== undefined ? (
                            viewMode === "days" ? (
                              <span>
                                {item.month2_prediction_days
                                  ? `${item.month2_prediction_days.toFixed(0)}d`
                                  : "0d"}
                              </span>
                            ) : (
                              <span>{item.month2_prediction.toFixed(0)}</span>
                            )
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      )}

                      {!hiddenColumns.includes("month2_po") && (
                        <TableCell className="text-center font-medium text-blue-600 bg-amber-200/30 dark:bg-amber-950/10">
                          {renderPOCellContent(item.month2_po, item.month2_po_days, item.actual_month2_po, item.twelve_m_avg)}
                        </TableCell>
                      )}

                      {!hiddenColumns.includes("month2_mes") && (
                        <TableCell className="text-center font-medium text-slate-700 dark:text-slate-300 bg-amber-200/30 dark:bg-amber-950/10">
                          {renderMESCellContent(
                            item.month2_mes,
                            item.month2_mes_days,
                            item.actual_month2_mes,
                            item.actual_month2_mes_days,
                            item.actual_month1_po !== null || item.actual_month2_po !== null || item.actual_month3_po !== null
                          )}
                        </TableCell>
                      )}

                      {!hiddenColumns.includes("month3_prediction") && (
                        <TableCell className="text-center font-medium text-blue-600 bg-fuchsia-200/30 dark:bg-fuchsia-950/10">
                          {item.month3_prediction !== null &&
                            item.month3_prediction !== undefined ? (
                            viewMode === "days" ? (
                              <span>
                                {item.month3_prediction_days
                                  ? `${item.month3_prediction_days.toFixed(0)}d`
                                  : "0d"}
                              </span>
                            ) : (
                              <span>{item.month3_prediction.toFixed(0)}</span>
                            )
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      )}

                      {!hiddenColumns.includes("month3_po") && (
                        <TableCell className="text-center font-medium text-blue-600 bg-fuchsia-200/30 dark:bg-fuchsia-950/10">
                          {renderPOCellContent(item.month3_po, item.month3_po_days, item.actual_month3_po, item.twelve_m_avg)}
                        </TableCell>
                      )}

                      {!hiddenColumns.includes("month3_mes") && (
                        <TableCell className="text-center font-medium text-slate-700 dark:text-slate-300 bg-fuchsia-200/30 dark:bg-fuchsia-950/10">
                          {renderMESCellContent(
                            item.month3_mes,
                            item.month3_mes_days,
                            item.actual_month3_mes,
                            item.actual_month3_mes_days,
                            item.actual_month1_po !== null || item.actual_month2_po !== null || item.actual_month3_po !== null
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* FOOTER BAR */}
        <div className="border-t bg-muted/40 px-6 py-3 flex flex-col md:flex-row gap-3 md:items-center md:justify-between text-sm">
          <div>
            Showing{" "}
            {totalItems === 0 ? 0 : (currentPage - 1) * Number(pageSize) + 1}
            {" - "}
            {Math.min(currentPage * Number(pageSize), totalItems)} of{" "}
            {totalItems}
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
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
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
