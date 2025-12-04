import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://cgwqicgtxsgrmxyzdjzx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnd3FpY2d0eHNncm14eXpkanp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NzY4MDYsImV4cCI6MjA3OTI1MjgwNn0.tdNEOCfAbYUlugCxf4k7mmLAbAQRxGSWLeBegfOytS4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types
export interface Profile {
  id: string;
  full_name: string;
  company_name: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  user_id: string;
  name: string;
  price: number;
  image_url?: string | null;
  category_id?: string | null;
  sub_category_id?: string | null;
  is_optional?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: 'main' | 'sub';
  parent_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AddonCategory {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface AddonVariant {
  id: string;
  addon_category_id: string;
  user_id: string;
  name: string;
  price: number;
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id: string;
  user_id: string;
  order_number?: number;
  customer_name: string;
  items: any[];
  subtotal: number;
  vat_amount: number;
  total: number;
  payment_method?: 'cash' | 'card' | 'vipps' | 'other';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}



export interface BusinessSettings {
  id: string;
  user_id: string;
  business_name: string;
  address: string;
  city: string;
  postal_code?: string;
  org_number: string;
  phone: string;
  email: string;
  vat_rate: number;
  logo_url?: string;
  receipt_footer?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductSize {
  id: string;
  name: string;
  price_modifier: number;
  created_at?: string;
}

export interface ProductSizeJunction {
  id: string;
  product_id: string;
  size_id: string;
  custom_price?: number;
}

export interface ProductAddonJunction {
  id: string;
  product_id: string;
  addon_category_id: string;
}