export interface Project {
  id: string;
  user_id: string;
  bid_number: string | null;
  customer_name: string | null;
  project_name: string;
  created_at: string;
  updated_at: string;
  status: 'draft' | 'in_progress' | 'review' | 'completed';
  notes: string | null;
  ship_to_address: string | null;
  phone: string | null;
  email: string | null;
  archived: boolean;
}

export interface StructureDescription {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  icon: string;
  created_at: string;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  display_order: number;
  created_at: string;
}

export interface Option {
  id: string;
  subcategory_id: string;
  name: string;
  description: string | null;
  specifications: Record<string, any>;
  price: number;
  dependencies: {
    requires?: string[];
    conflicts?: string[];
  };
  created_at: string;
}

export interface UserSelection {
  id: string;
  project_id: string;
  subcategory_id: string;
  option_id: string;
  created_at: string;
  updated_at: string;
}

export interface StructureModel {
  id: string;
  project_id: string;
  model_id: string;
  width: string;
  load: string;
  glazing: string;
  eave: string;
  range_count: number;
  house_count: number;
  house_length: number;
  description_id: string;
  structural_upgrades?: string;
  zones?: number;
  concrete_slab?: string;
  phase_voltage?: string;
  nat_gas_propane?: string;
  elevation?: number;
  temps_climate?: string;
  roof?: string;
  roof_vent?: string;
  sidewalls?: string;
  endwalls?: string;
  upper_gables?: string;
  gutter_partitions?: number;
  gable_partitions?: number;
  stemwall?: string;
  endwall_transitions?: number;
  base_angle_12ft?: number;
  ba_bolts?: number;
  base_stringer?: number;
}