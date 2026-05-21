export type Item = {
  material_code: string;
  material_description: string;
  vendor: string;
  machine_population: number;
  current_stock: number;
  coverage_days: number;
  three_m_avg: number;
  twelve_m_avg: number;
  price: number;
  status: string;
  lead_time: number;
  lead_time_qty?: number;
  delta: number;
  total_lead_time: number;
  month1_prediction?: number;
  month2_prediction?: number;
  month3_prediction?: number;
  month1_date?: string;
  month2_date?: string;
  month3_date?: string;
};

export type TrendData = {
  year: number;
  month: number;
  formatted_date: string;
  total_consumption: number;
};

export type KPIs = {
  total_materials: number;
  active_materials: number;
  critical_stock: number;
  low_stock: number;
  avg_coverage_days: number;
  obsolete_count: number;
};

export type PurchaseOrder = {
  id: number;
  material_code: string;
  po_number: string;
  order_qty: number;
  receive_qty: number;
  year: number;
  month: number;
  period_date?: string;
  created_at?: string;
  updated_at?: string;
};
