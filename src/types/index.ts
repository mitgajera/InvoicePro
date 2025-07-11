export interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  address?: string;
  phone?: string;
  logo?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
  address?: string;
  phone?: string;
  taxId?: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  price: number;
  discount?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  client: Client;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  issueDate: string;
  dueDate: string;
  notes?: string;
  terms?: string;
  paymentLink?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalRevenue: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
  }>;
}