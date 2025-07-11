// Local storage utilities for demo purposes
// In production, this would be replaced with API calls

const STORAGE_KEYS = {
  USER: 'invoice_user',
  CLIENTS: 'invoice_clients',
  INVOICES: 'invoice_invoices',
  SETTINGS: 'invoice_settings'
};

export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },

  remove: (key: string): void => {
    localStorage.removeItem(key);
  },

  clear: (): void => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  }
};

export const KEYS = STORAGE_KEYS;