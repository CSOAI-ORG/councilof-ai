-- Create depots table (physical locations where materials are stored)
CREATE TABLE public.depots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  postcode TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  capacity_tonnes NUMERIC DEFAULT 0,
  current_utilization NUMERIC DEFAULT 0,
  depot_type TEXT DEFAULT 'yard',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create material_types table (master list of materials)
CREATE TABLE public.material_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'aggregate',
  unit TEXT DEFAULT 'tonnes',
  default_buy_price NUMERIC DEFAULT 0,
  default_sell_price NUMERIC DEFAULT 0,
  ewc_code TEXT,
  requires_testing BOOLEAN DEFAULT false,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stock_levels table (current inventory at each depot)
CREATE TABLE public.stock_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  depot_id UUID NOT NULL REFERENCES public.depots(id) ON DELETE CASCADE,
  material_type_id UUID NOT NULL REFERENCES public.material_types(id) ON DELETE CASCADE,
  quantity_tonnes NUMERIC DEFAULT 0,
  reserved_quantity NUMERIC DEFAULT 0,
  min_stock_level NUMERIC DEFAULT 0,
  max_stock_level NUMERIC DEFAULT 1000,
  last_stocktake_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(depot_id, material_type_id)
);

-- Create stock_movements table (audit trail of all movements)
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  depot_id UUID NOT NULL REFERENCES public.depots(id) ON DELETE CASCADE,
  material_type_id UUID NOT NULL REFERENCES public.material_types(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL,
  quantity_tonnes NUMERIC NOT NULL,
  source_type TEXT,
  source_id UUID,
  unit_price NUMERIC DEFAULT 0,
  total_value NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  payment_terms TEXT DEFAULT 'net30',
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create aggregate_sales table (sales orders)
CREATE TABLE public.aggregate_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  sale_number TEXT NOT NULL,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'quote',
  delivery_address TEXT,
  delivery_date DATE,
  total_amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'GBP',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create aggregate_sale_items table (line items)
CREATE TABLE public.aggregate_sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.aggregate_sales(id) ON DELETE CASCADE,
  material_type_id UUID NOT NULL REFERENCES public.material_types(id),
  depot_id UUID NOT NULL REFERENCES public.depots(id),
  quantity_tonnes NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  delivered_quantity NUMERIC DEFAULT 0
);

-- Create purchase_orders table
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  po_number TEXT NOT NULL,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'draft',
  delivery_depot_id UUID REFERENCES public.depots(id),
  total_amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'GBP',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase_order_items table
CREATE TABLE public.purchase_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  material_type_id UUID NOT NULL REFERENCES public.material_types(id),
  quantity_tonnes NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  received_quantity NUMERIC DEFAULT 0
);

-- Add stock-related columns to jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS destination_depot_id UUID REFERENCES public.depots(id),
ADD COLUMN IF NOT EXISTS processed_to_stock BOOLEAN DEFAULT false;

-- Enable RLS on all new tables
ALTER TABLE public.depots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aggregate_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aggregate_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for depots
CREATE POLICY "Users can manage own depots" ON public.depots FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for material_types
CREATE POLICY "Users can manage own material types" ON public.material_types FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for stock_levels
CREATE POLICY "Users can manage own stock levels" ON public.stock_levels FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for stock_movements
CREATE POLICY "Users can manage own stock movements" ON public.stock_movements FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for suppliers
CREATE POLICY "Users can manage own suppliers" ON public.suppliers FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for aggregate_sales
CREATE POLICY "Users can manage own aggregate sales" ON public.aggregate_sales FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for aggregate_sale_items
CREATE POLICY "Users can manage own sale items" ON public.aggregate_sale_items FOR ALL 
USING (EXISTS (SELECT 1 FROM public.aggregate_sales WHERE id = aggregate_sale_items.sale_id AND user_id = auth.uid()));

-- RLS Policies for purchase_orders
CREATE POLICY "Users can manage own purchase orders" ON public.purchase_orders FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for purchase_order_items
CREATE POLICY "Users can manage own PO items" ON public.purchase_order_items FOR ALL 
USING (EXISTS (SELECT 1 FROM public.purchase_orders WHERE id = purchase_order_items.purchase_order_id AND user_id = auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_stock_levels_depot ON public.stock_levels(depot_id);
CREATE INDEX idx_stock_levels_material ON public.stock_levels(material_type_id);
CREATE INDEX idx_stock_movements_depot ON public.stock_movements(depot_id);
CREATE INDEX idx_stock_movements_material ON public.stock_movements(material_type_id);
CREATE INDEX idx_aggregate_sales_customer ON public.aggregate_sales(customer_id);
CREATE INDEX idx_aggregate_sales_status ON public.aggregate_sales(status);
CREATE INDEX idx_purchase_orders_supplier ON public.purchase_orders(supplier_id);

-- Update triggers for updated_at
CREATE TRIGGER update_depots_updated_at BEFORE UPDATE ON public.depots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_aggregate_sales_updated_at BEFORE UPDATE ON public.aggregate_sales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();