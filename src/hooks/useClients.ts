import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../types/database';

type Client = Database['public']['Tables']['clients']['Row'];
type ClientInsert = Database['public']['Tables']['clients']['Insert'];
type ClientUpdate = Database['public']['Tables']['clients']['Update'];

// Mock data for demo users
const mockClients: Client[] = [
  {
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
  {
    id: 'mock-2',
    user_id: 'admin@invoicepro.com',
    name: 'Tech Solutions Inc',
    email: 'hello@techsolutions.com',
    phone: '+1 (555) 987-6543',
    address: '456 Innovation Ave',
    city: 'San Francisco',
    state: 'CA',
    zip_code: '94105',
    country: 'United States',
    created_at: '2024-01-20T14:30:00Z',
    updated_at: '2024-01-20T14:30:00Z'
  }
];

export const useClients = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if user is a mock user
  const isMockUser = user && (user.id === 'admin@invoicepro.com' || user.id === 'demo@invoicepro.com');

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      
      if (isMockUser) {
        // For mock users, use local mock data
        setClients(mockClients.filter(client => client.user_id === user.id));
      } else {
        // For real users, fetch from Supabase with proper RLS filtering
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setClients(data || []);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const addClient = async (clientData: Omit<ClientInsert, 'user_id'>): Promise<Client> => {
    if (!user) throw new Error('No user logged in');

    if (isMockUser) {
      // For mock users, add to local state
      const newClient: Client = {
        ...clientData,
        id: `mock-${Date.now()}`,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setClients(prev => [newClient, ...prev]);
      return newClient;
    } else {
      // For real users, insert into Supabase
      const { data, error } = await supabase
        .from('clients')
        .insert({
          ...clientData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setClients(prev => [data, ...prev]);
      return data;
    }
  };

  const updateClient = async (id: string, clientData: Omit<ClientUpdate, 'id' | 'user_id'>): Promise<void> => {
    if (isMockUser) {
      // For mock users, update local state
      setClients(prev => 
        prev.map(client => 
          client.id === id ? { 
            ...client, 
            ...clientData, 
            updated_at: new Date().toISOString() 
          } : client
        )
      );
    } else {
      // For real users, update in Supabase
      const { error } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setClients(prev => 
        prev.map(client => 
          client.id === id ? { ...client, ...clientData } : client
        )
      );
    }
  };

  const deleteClient = async (id: string): Promise<void> => {
    if (isMockUser) {
      // For mock users, remove from local state
      setClients(prev => prev.filter(client => client.id !== id));
    } else {
      // For real users, delete from Supabase
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setClients(prev => prev.filter(client => client.id !== id));
    }
  };

  const getClient = (id: string): Client | undefined => {
    return clients.find(client => client.id === id);
  };

  return {
    clients,
    loading,
    addClient,
    updateClient,
    deleteClient,
    getClient,
    refetch: fetchClients
  };
};