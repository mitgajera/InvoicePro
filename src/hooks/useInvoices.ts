import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../types/database';

type Invoice = Database['public']['Tables']['invoices']['Row'] & {
  client: Database['public']['Tables']['clients']['Row'];
  invoice_items: Database['public']['Tables']['invoice_items']['Row'][];
};

type InvoiceInsert = Database['public']['Tables']['invoices']['Insert'];
type InvoiceUpdate = Database['public']['Tables']['invoices']['Update'];
type InvoiceItemInsert = Database['public']['Tables']['invoice_items']['Insert'];

// Mock data for demo users
const mockInvoices: Invoice[] = [
  {
    id: 'mock-inv-1',
    user_id: 'admin@invoicepro.com',
    client_id: 'mock-1',
    invoice_number: 'INV-2024-0001',
    issue_date: '2024-01-15',
    due_date: '2024-02-15',
    status: 'sent',
    subtotal: 2500.00,
    tax_rate: 8.5,
    tax_amount: 212.50,
    total: 2712.50,
    notes: 'Thank you for your business!',
    payment_link: null,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    client: {
      id: 'mock-1',
      user_id: 'admin@invoicepro.com',
      name: 'Acme Corporation',
      email: 'contact@acme.com',
      phone: '+1 (555) 123-4567',
      address: '123 Business St, Suite 100',
      city: 'New York',
      state: 'NY',
      zip_code: '10001',
      country: 'United States',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    },
    invoice_items: [
      {
        id: 'mock-item-1',
        invoice_id: 'mock-inv-1',
        description: 'Web Development Services',
        quantity: 50,
        rate: 50.00,
        amount: 2500.00,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      }
    ]
  }
];

export const useInvoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if user is a mock user
  const isMockUser = user && (user.id === 'admin@invoicepro.com' || user.id === 'demo@invoicepro.com');

  useEffect(() => {
    if (user) {
      fetchInvoices();
    }
  }, [user]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      
      if (isMockUser) {
        // For mock users, use local mock data
        setInvoices(mockInvoices.filter(invoice => invoice.user_id === user.id));
      } else {
        // For real users, fetch from Supabase with proper RLS filtering
        const { data, error } = await supabase
          .from('invoices')
          .select(`
            *,
            client:clients(*),
            invoice_items(*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setInvoices(data || []);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInvoiceNumber = async (): Promise<string> => {
    if (isMockUser) {
      // For mock users, generate based on current mock data
      const invoiceCount = invoices.length + 1;
      return `INV-${new Date().getFullYear()}-${invoiceCount.toString().padStart(4, '0')}`;
    } else {
      // For real users, query Supabase
      const { count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      const invoiceCount = (count || 0) + 1;
      return `INV-${new Date().getFullYear()}-${invoiceCount.toString().padStart(4, '0')}`;
    }
  };

  const createInvoice = async (
    clientId: string,
    items: Omit<InvoiceItemInsert, 'invoice_id'>[],
    invoiceData: Omit<InvoiceInsert, 'user_id' | 'client_id' | 'invoice_number'>
  ): Promise<Invoice> => {
    if (!user) throw new Error('No user logged in');

    const invoiceNumber = await generateInvoiceNumber();

    if (isMockUser) {
      // For mock users, create in local state
      const newInvoice: Invoice = {
        ...invoiceData,
        id: `mock-inv-${Date.now()}`,
        user_id: user.id,
        client_id: clientId,
        invoice_number: invoiceNumber,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        client: mockInvoices[0].client, // Use mock client data
        invoice_items: items.map((item, index) => ({
          ...item,
          id: `mock-item-${Date.now()}-${index}`,
          invoice_id: `mock-inv-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))
      };

      setInvoices(prev => [newInvoice, ...prev]);
      return newInvoice;
    } else {
      // For real users, create in Supabase
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          ...invoiceData,
          user_id: user.id,
          client_id: clientId,
          invoice_number: invoiceNumber,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const itemsWithInvoiceId = items.map(item => ({
        ...item,
        invoice_id: invoice.id,
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsWithInvoiceId);

      if (itemsError) throw itemsError;

      // Fetch the complete invoice with relations
      await fetchInvoices();
      
      return invoices.find(inv => inv.id === invoice.id)!;
    }
  };

  const updateInvoice = async (id: string, invoiceData: Omit<InvoiceUpdate, 'id' | 'user_id'>): Promise<void> => {
    if (isMockUser) {
      // For mock users, update local state
      setInvoices(prev => 
        prev.map(invoice => 
          invoice.id === id ? { 
            ...invoice, 
            ...invoiceData, 
            updated_at: new Date().toISOString() 
          } : invoice
        )
      );
    } else {
      // For real users, update in Supabase
      const { error } = await supabase
        .from('invoices')
        .update(invoiceData)
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      await fetchInvoices();
    }
  };

  const deleteInvoice = async (id: string): Promise<void> => {
    if (isMockUser) {
      // For mock users, remove from local state
      setInvoices(prev => prev.filter(invoice => invoice.id !== id));
    } else {
      // For real users, delete from Supabase
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setInvoices(prev => prev.filter(invoice => invoice.id !== id));
    }
  };

  const getInvoice = (id: string): Invoice | undefined => {
    return invoices.find(invoice => invoice.id === id);
  };

  const getInvoicesByStatus = (status: string): Invoice[] => {
    return invoices.filter(invoice => invoice.status === status);
  };

  const markAsPaid = async (id: string): Promise<void> => {
    await updateInvoice(id, { status: 'paid' });
  };

  const sendInvoice = async (id: string): Promise<void> => {
    const paymentLink = `${window.location.origin}/invoice/${id}`;
    await updateInvoice(id, { 
      status: 'sent',
      payment_link: paymentLink
    });
  };

  return {
    invoices,
    loading,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    getInvoice,
    getInvoicesByStatus,
    markAsPaid,
    sendInvoice,
    generateInvoiceNumber,
    refetch: fetchInvoices
  };
};