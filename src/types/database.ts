export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          company: string | null;
          address: string | null;
          phone: string | null;
          logo: string | null;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          company?: string | null;
          address?: string | null;
          phone?: string | null;
          logo?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          company?: string | null;
          address?: string | null;
          phone?: string | null;
          logo?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      admin_users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'super_admin' | 'admin' | 'moderator';
          is_active: boolean;
          last_login: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role?: 'super_admin' | 'admin' | 'moderator';
          is_active?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'super_admin' | 'admin' | 'moderator';
          is_active?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      system_settings: {
        Row: {
          id: string;
          key: string;
          value: any;
          description: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: any;
          description?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: any;
          description?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          admin_id?: string | null;
          action: string;
          table_name?: string | null;
          record_id?: string | null;
          old_values?: any;
          new_values?: any;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          admin_id?: string | null;
          action?: string;
          table_name?: string | null;
          record_id?: string | null;
          old_values?: any;
          new_values?: any;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string;
          company: string | null;
          address: string | null;
          phone: string | null;
          tax_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          email: string;
          company?: string | null;
          address?: string | null;
          phone?: string | null;
          tax_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          email?: string;
          company?: string | null;
          address?: string | null;
          phone?: string | null;
          tax_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          user_id: string;
          client_id: string;
          invoice_number: string;
          status: 'draft' | 'sent' | 'paid' | 'overdue';
          subtotal: number;
          discount: number;
          tax_rate: number;
          tax_amount: number;
          total: number;
          currency: string;
          issue_date: string;
          due_date: string;
          notes: string | null;
          terms: string | null;
          payment_link: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          client_id: string;
          invoice_number: string;
          status?: 'draft' | 'sent' | 'paid' | 'overdue';
          subtotal: number;
          discount?: number;
          tax_rate?: number;
          tax_amount?: number;
          total: number;
          currency?: string;
          issue_date: string;
          due_date: string;
          notes?: string | null;
          terms?: string | null;
          payment_link?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          client_id?: string;
          invoice_number?: string;
          status?: 'draft' | 'sent' | 'paid' | 'overdue';
          subtotal?: number;
          discount?: number;
          tax_rate?: number;
          tax_amount?: number;
          total?: number;
          currency?: string;
          issue_date?: string;
          due_date?: string;
          notes?: string | null;
          terms?: string | null;
          payment_link?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          name: string;
          description: string | null;
          quantity: number;
          price: number;
          discount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          name: string;
          description?: string | null;
          quantity: number;
          price: number;
          discount?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          name?: string;
          description?: string | null;
          quantity?: number;
          price?: number;
          discount?: number;
          created_at?: string;
        };
      };
      admin_dashboard_stats: {
        Row: {
          total_users: number;
          new_users_this_month: number;
          total_invoices: number;
          paid_invoices: number;
          overdue_invoices: number;
          total_revenue: number;
          revenue_this_month: number;
          total_clients: number;
        };
      };
    };
    Views: {
      admin_dashboard_stats: {
        Row: {
          total_users: number;
          new_users_this_month: number;
          total_invoices: number;
          paid_invoices: number;
          overdue_invoices: number;
          total_revenue: number;
          revenue_this_month: number;
          total_clients: number;
        };
      };
    };
    Functions: {
      log_admin_action: {
        Args: {
          p_action: string;
          p_table_name?: string;
          p_record_id?: string;
          p_old_values?: any;
          p_new_values?: any;
        };
        Returns: void;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}