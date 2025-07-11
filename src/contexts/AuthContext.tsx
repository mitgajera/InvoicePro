import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type UserProfile = Database['public']['Tables']['users']['Row'];

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: { email: string; password: string; name: string; company?: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<UserProfile>) => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    // Check for admin credentials
    if (email === 'admin@invoicepro.com' && password === 'admin123') {
      // Create a mock admin session
      const mockAdminUser = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@invoicepro.com',
        aud: 'authenticated',
        role: 'authenticated',
        email_confirmed_at: new Date().toISOString(),
        phone: '',
        confirmed_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        identities: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as User;

      const mockAdminProfile = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@invoicepro.com',
        name: 'System Administrator',
        company: 'InvoicePro',
        address: null,
        phone: null,
        logo: null,
        is_admin: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as UserProfile;

      setUser(mockAdminUser);
      setUserProfile(mockAdminProfile);
      
      // Store auth state in localStorage for persistence
      localStorage.setItem('auth_user', JSON.stringify(mockAdminUser));
      localStorage.setItem('auth_profile', JSON.stringify(mockAdminProfile));
      return;
    }

    // Check for demo user credentials
    if (email === 'demo@invoicepro.com') {
      // Create a mock demo user session
      const mockDemoUser = {
        id: '00000000-0000-0000-0000-000000000002',
        email: 'demo@invoicepro.com',
        aud: 'authenticated',
        role: 'authenticated',
        email_confirmed_at: new Date().toISOString(),
        phone: '',
        confirmed_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        identities: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as User;

      const mockDemoProfile = {
        id: '00000000-0000-0000-0000-000000000002',
        email: 'demo@invoicepro.com',
        name: 'Demo User',
        company: 'Demo Company',
        address: '123 Demo Street, Demo City, DC 12345',
        phone: '+1 (555) 123-4567',
        logo: null,
        is_admin: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as UserProfile;

      setUser(mockDemoUser);
      setUserProfile(mockDemoProfile);
      
      // Store auth state in localStorage for persistence
      localStorage.setItem('auth_user', JSON.stringify(mockDemoUser));
      localStorage.setItem('auth_profile', JSON.stringify(mockDemoProfile));
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const register = async (userData: { 
    email: string; 
    password: string; 
    name: string; 
    company?: string 
  }): Promise<void> => {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    });

    if (error) throw error;

    if (data.user) {
      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: userData.email,
          name: userData.name,
          company: userData.company,
          is_admin: false
        });

      if (profileError) throw profileError;
    }
  };

  const logout = async (): Promise<void> => {
    // Handle mock user logout (admin or demo)
    if (userProfile && (
      user?.id === '00000000-0000-0000-0000-000000000001' || 
      user?.id === '00000000-0000-0000-0000-000000000002'
    )) {
      setUser(null);
      setUserProfile(null);
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_profile');
      toast.success('Logged out successfully');
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    toast.success('Logged out successfully');
  };

  const updateProfile = async (userData: Partial<UserProfile>): Promise<void> => {
    if (!user) throw new Error('No user logged in');

    // Handle mock users - just update local state
    if (user.id === '00000000-0000-0000-0000-000000000001' || 
        user.id === '00000000-0000-0000-0000-000000000002') {
      const updatedProfile = { ...userProfile, ...userData } as UserProfile;
      setUserProfile(updatedProfile);
      localStorage.setItem('auth_profile', JSON.stringify(updatedProfile));
      return;
    }

    const { error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', user.id);

    if (error) throw error;

    // Refresh profile
    await fetchUserProfile(user.id);
  };

  // Check for stored auth state on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('auth_user');
    const storedProfile = localStorage.getItem('auth_profile');
    
    if (storedUser && storedProfile && !user) {
      try {
        setUser(JSON.parse(storedUser));
        setUserProfile(JSON.parse(storedProfile));
      } catch (error) {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_profile');
      }
    }
  }, [user]);

  const value: AuthContextType = {
    user,
    userProfile,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isAdmin: !!userProfile?.is_admin,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};