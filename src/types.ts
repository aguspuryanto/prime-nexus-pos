export interface Product {
  id: number;
  name: string;
  price: number;
  category_id: number;
  category_name?: string;
  image: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Transaction {
  id: number;
  total: number;
  payment_method: string;
  cashier_name: string;
  items: string;
  created_at: string;
}

export interface User {
  id: number;
  name: string;
  role: string;
  pin?: string;
}

export interface SavedBill {
  id: number;
  table_name: string;
  items: string;
  created_at: string;
}
