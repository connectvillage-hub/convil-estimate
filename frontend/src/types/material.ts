export interface Material {
  id: number;
  product_name: string;
  product_code: string;
  spec: string;
  unit: string;
  unit_price: number;
  coverage_area_py: number | null;
  coverage_area_m2: number | null;
  price_per_py: number | null;
  price_per_m2: number | null;
  loss_rate: number;
  purchase_url: string;
  note: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  brand_name: string;
  category_level1: string;
  category_level2: string;
  category_level3: string;
}

export interface MaterialCreate {
  product_name: string;
  product_code?: string;
  spec?: string;
  unit?: string;
  unit_price?: number;
  coverage_area_py?: number | null;
  coverage_area_m2?: number | null;
  loss_rate?: number;
  purchase_url?: string;
  note?: string;
  is_active?: boolean;
  brand_name?: string;
  category_level1?: string;
  category_level2?: string;
  category_level3?: string;
}

export interface MaterialUpdate extends Partial<MaterialCreate> {}

export interface MaterialListResponse {
  materials: Material[];
  total: number;
}

export interface LaborRate {
  id: number;
  item_name: string;
  spec: string;
  unit: string;
  material_cost: number;
  labor_cost: number;
  expense_cost: number;
  total_cost: number;
  note: string;
  is_active: boolean;
  updated_at: string;
  work_type_name: string;
}

export interface LaborRateListResponse {
  labor_rates: LaborRate[];
  total: number;
}

export interface MiscItem {
  id: number;
  item_name: string;
  spec: string;
  unit: string;
  unit_price: number;
  note: string;
  work_type_name: string;
}

export interface MiscItemListResponse {
  misc_items: MiscItem[];
  total: number;
}

export interface Brand {
  id: number;
  name: string;
  website: string;
  note: string;
}

export interface Category {
  id: number;
  level1: string;
  level2: string;
  level3: string;
}

export interface DbStats {
  materials: number;
  brands: number;
  categories: number;
  work_types: number;
  labor_rates: number;
  misc_items: number;
  sketchup_mappings: number;
}
