export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'moderator';
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: any;
  description: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  admin_id: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  old_values: any;
  new_values: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AdminDashboardStats {
  total_users: number;
  new_users_this_month: number;
  total_invoices: number;
  paid_invoices: number;
  overdue_invoices: number;
  total_revenue: number;
  revenue_this_month: number;
  total_clients: number;
}

export interface UserWithStats {
  id: string;
  email: string;
  name: string;
  company: string | null;
  is_admin: boolean;
  created_at: string;
  invoice_count: number;
  total_revenue: number;
  last_activity: string | null;
}