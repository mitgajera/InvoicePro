import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AdminDashboardStats, UserWithStats, AuditLog, SystemSetting } from '../types/admin';

export const useAdmin = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchDashboardStats(),
        fetchUsers(),
        fetchAuditLogs(),
        fetchSystemSettings()
      ]);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    const { data, error } = await supabase
      .from('admin_dashboard_stats')
      .select('*')
      .single();

    if (error) throw error;
    setStats(data);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        company,
        is_admin,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const usersWithStats = data?.map(user => ({
      ...user,
      invoice_count: 0, // Will be populated separately if needed
      total_revenue: 0, // Will be populated separately if needed
      last_activity: null // This would need a separate query for last login/activity
    })) || [];

    setUsers(usersWithStats);
  };

  const fetchAuditLogs = async () => {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    setAuditLogs(data || []);
  };

  const fetchSystemSettings = async () => {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('key');

    if (error) throw error;
    setSystemSettings(data || []);
  };

  const updateSystemSetting = async (key: string, value: any) => {
    const { error } = await supabase
      .from('system_settings')
      .update({ value, updated_by: (await supabase.auth.getUser()).data.user?.id })
      .eq('key', key);

    if (error) throw error;
    await fetchSystemSettings();
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    // In a real implementation, you might want to disable the user's auth account
    const { error } = await supabase
      .from('users')
      .update({ is_admin: isActive })
      .eq('id', userId);

    if (error) throw error;
    await fetchUsers();
  };

  const deleteUser = async (userId: string) => {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;
    await fetchUsers();
  };

  const getRevenueByMonth = async (months: number = 12) => {
    const { data, error } = await supabase
      .from('invoices')
      .select('total, created_at')
      .eq('status', 'paid')
      .gte('created_at', new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    // Group by month
    const monthlyRevenue = data?.reduce((acc, invoice) => {
      const month = new Date(invoice.created_at).toISOString().slice(0, 7);
      acc[month] = (acc[month] || 0) + invoice.total;
      return acc;
    }, {} as Record<string, number>) || {};

    return Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue
    }));
  };

  const getUserGrowth = async (months: number = 12) => {
    const { data, error } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    // Group by month
    const monthlyUsers = data?.reduce((acc, user) => {
      const month = new Date(user.created_at).toISOString().slice(0, 7);
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return Object.entries(monthlyUsers).map(([month, users]) => ({
      month,
      users
    }));
  };

  return {
    stats,
    users,
    auditLogs,
    systemSettings,
    loading,
    updateSystemSetting,
    toggleUserStatus,
    deleteUser,
    getRevenueByMonth,
    getUserGrowth,
    refetch: fetchAdminData
  };
};