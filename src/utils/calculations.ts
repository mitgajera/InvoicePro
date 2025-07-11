import { InvoiceItem } from '../types';

export const calculateItemTotal = (item: InvoiceItem): number => {
  const subtotal = item.quantity * item.price;
  const discountAmount = (item.discount || 0) / 100 * subtotal;
  return subtotal - discountAmount;
};

export const calculateInvoiceSubtotal = (items: InvoiceItem[]): number => {
  return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
};

export const calculateTaxAmount = (subtotal: number, taxRate: number): number => {
  return (subtotal * taxRate) / 100;
};

export const calculateInvoiceTotal = (
  subtotal: number,
  discount: number,
  taxRate: number
): { discountAmount: number; taxAmount: number; total: number } => {
  const discountAmount = (discount / 100) * subtotal;
  const discountedSubtotal = subtotal - discountAmount;
  const taxAmount = calculateTaxAmount(discountedSubtotal, taxRate);
  const total = discountedSubtotal + taxAmount;

  return {
    discountAmount,
    taxAmount,
    total
  };
};

export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};