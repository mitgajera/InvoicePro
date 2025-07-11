import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { 
  Plus, 
  Trash2, 
  Save, 
  Send, 
  Eye, 
  Calculator,
  User,
  Calendar,
  FileText,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { useClients } from '../hooks/useClients';
import { useInvoices } from '../hooks/useInvoices';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, calculateInvoiceTotal } from '../utils/calculations';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const invoiceSchema = yup.object({
  client_id: yup.string().required('Please select a client'),
  issue_date: yup.string().required('Issue date is required'),
  due_date: yup.string().required('Due date is required'),
  items: yup.array().of(
    yup.object({
      name: yup.string().required('Item name is required'),
      description: yup.string(),
      quantity: yup.number().min(1, 'Quantity must be at least 1').required(),
      price: yup.number().min(0, 'Price must be positive').required(),
      discount: yup.number().min(0).max(100, 'Discount cannot exceed 100%').default(0)
    })
  ).min(1, 'At least one item is required'),
  discount: yup.number().min(0).max(100).default(0),
  tax_rate: yup.number().min(0).max(100).default(0),
  notes: yup.string(),
  terms: yup.string()
});

interface InvoiceFormData {
  client_id: string;
  issue_date: string;
  due_date: string;
  items: Array<{
    name: string;
    description: string;
    quantity: number;
    price: number;
    discount: number;
  }>;
  discount: number;
  tax_rate: number;
  notes: string;
  terms: string;
}

const CreateInvoice: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { clients, loading: clientsLoading } = useClients();
  const { createInvoice, generateInvoiceNumber } = useInvoices();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<InvoiceFormData>({
    resolver: yupResolver(invoiceSchema),
    defaultValues: {
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [{ name: '', description: '', quantity: 1, price: 0, discount: 0 }],
      discount: 0,
      tax_rate: 10,
      notes: '',
      terms: 'Payment is due within 30 days of invoice date.'
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchedItems = watch('items');
  const watchedDiscount = watch('discount');
  const watchedTaxRate = watch('tax_rate');
  const selectedClientId = watch('client_id');

  useEffect(() => {
    const loadInvoiceNumber = async () => {
      try {
        const number = await generateInvoiceNumber();
        setInvoiceNumber(number);
      } catch (error) {
        console.error('Error generating invoice number:', error);
      }
    };
    loadInvoiceNumber();
  }, [generateInvoiceNumber]);

  const selectedClient = clients.find(client => client.id === selectedClientId);

  const calculations = React.useMemo(() => {
    const subtotal = watchedItems.reduce((sum, item) => {
      const itemTotal = (item.quantity || 0) * (item.price || 0);
      const itemDiscount = (item.discount || 0) / 100 * itemTotal;
      return sum + (itemTotal - itemDiscount);
    }, 0);

    const { discountAmount, taxAmount, total } = calculateInvoiceTotal(
      subtotal,
      watchedDiscount || 0,
      watchedTaxRate || 0
    );

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total
    };
  }, [watchedItems, watchedDiscount, watchedTaxRate]);

  const onSubmit = async (data: InvoiceFormData, status: 'draft' | 'sent' = 'draft') => {
    setIsSubmitting(true);
    try {
      const invoiceData = {
        status,
        subtotal: calculations.subtotal,
        discount: calculations.discountAmount,
        tax_rate: data.tax_rate,
        tax_amount: calculations.taxAmount,
        total: calculations.total,
        currency: 'USD',
        issue_date: data.issue_date,
        due_date: data.due_date,
        notes: data.notes,
        terms: data.terms
      };

      await createInvoice(data.client_id, data.items, invoiceData);
      
      toast.success(
        status === 'sent' 
          ? 'Invoice created and sent successfully!' 
          : 'Invoice saved as draft!'
      );
      
      navigate('/invoices');
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addItem = () => {
    append({ name: '', description: '', quantity: 1, price: 0, discount: 0 });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  if (clientsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (previewMode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPreviewMode(false)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Edit</span>
          </button>
          <div className="flex space-x-3">
            <button
              onClick={() => onSubmit(watch(), 'draft')}
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Save className="w-4 h-4" />
              <span>Save Draft</span>
            </button>
            <button
              onClick={() => onSubmit(watch(), 'sent')}
              disabled={isSubmitting}
              className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              <Send className="w-4 h-4" />
              <span>Send Invoice</span>
            </button>
          </div>
        </div>

        {/* Invoice Preview */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-4xl mx-auto">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
                <p className="text-gray-600 mt-2">#{invoiceNumber}</p>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-bold text-gray-900">{userProfile?.name}</h2>
                {userProfile?.company && (
                  <p className="text-gray-600">{userProfile.company}</p>
                )}
                {userProfile?.address && (
                  <p className="text-gray-600 mt-2 whitespace-pre-line">{userProfile.address}</p>
                )}
                {userProfile?.phone && (
                  <p className="text-gray-600">{userProfile.phone}</p>
                )}
                <p className="text-gray-600">{userProfile?.email}</p>
              </div>
            </div>

            {/* Client & Dates */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Bill To
                </h3>
                {selectedClient && (
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900">{selectedClient.name}</p>
                    {selectedClient.company && (
                      <p className="text-gray-600">{selectedClient.company}</p>
                    )}
                    <p className="text-gray-600">{selectedClient.email}</p>
                    {selectedClient.address && (
                      <p className="text-gray-600 whitespace-pre-line">{selectedClient.address}</p>
                    )}
                  </div>
                )}
              </div>
              <div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Issue Date:</span>
                    <span className="font-medium">{watch('issue_date')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Due Date:</span>
                    <span className="font-medium">{watch('due_date')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Rate
                    </th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {watchedItems.map((item, index) => {
                    const itemTotal = (item.quantity || 0) * (item.price || 0);
                    const itemDiscount = (item.discount || 0) / 100 * itemTotal;
                    const finalAmount = itemTotal - itemDiscount;
                    
                    return (
                      <tr key={index}>
                        <td className="py-4">
                          <div>
                            <p className="font-medium text-gray-900">{item.name}</p>
                            {item.description && (
                              <p className="text-sm text-gray-600">{item.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 text-right">{item.quantity}</td>
                        <td className="py-4 text-right">{formatCurrency(item.price || 0)}</td>
                        <td className="py-4 text-right font-medium">
                          {formatCurrency(finalAmount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(calculations.subtotal)}</span>
                </div>
                {calculations.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount ({watchedDiscount}%):</span>
                    <span className="font-medium">-{formatCurrency(calculations.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax ({watchedTaxRate}%):</span>
                  <span className="font-medium">{formatCurrency(calculations.taxAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="text-lg font-bold text-gray-900">Total:</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(calculations.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes & Terms */}
            {(watch('notes') || watch('terms')) && (
              <div className="space-y-4">
                {watch('notes') && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                    <p className="text-gray-600 whitespace-pre-line">{watch('notes')}</p>
                  </div>
                )}
                {watch('terms') && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Terms & Conditions</h4>
                    <p className="text-gray-600 whitespace-pre-line">{watch('terms')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/invoices"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Invoices</span>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Invoice</h1>
            <p className="text-gray-600 mt-1">Invoice #{invoiceNumber}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setPreviewMode(true)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => onSubmit(data, 'draft'))} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Selection */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Client *
                  </label>
                  <select
                    {...register('client_id')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Choose a client...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} - {client.email}
                      </option>
                    ))}
                  </select>
                  {errors.client_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.client_id.message}</p>
                  )}
                </div>

                {selectedClient && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{selectedClient.name}</h4>
                        {selectedClient.company && (
                          <p className="text-sm text-gray-600">{selectedClient.company}</p>
                        )}
                        <p className="text-sm text-gray-600">{selectedClient.email}</p>
                        {selectedClient.address && (
                          <p className="text-sm text-gray-600 mt-1">{selectedClient.address}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Invoice Details */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issue Date *
                  </label>
                  <input
                    type="date"
                    {...register('issue_date')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {errors.issue_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.issue_date.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    {...register('due_date')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {errors.due_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.due_date.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Line Items</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Item</span>
                </button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Item {index + 1}</h4>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Item Name *
                        </label>
                        <input
                          {...register(`items.${index}.name`)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Enter item name"
                        />
                        {errors.items?.[index]?.name && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.items[index]?.name?.message}
                          </p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          {...register(`items.${index}.description`)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Enter item description"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        {errors.items?.[index]?.quantity && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.items[index]?.quantity?.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Price *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          {...register(`items.${index}.price`, { valueAsNumber: true })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        {errors.items?.[index]?.price && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.items[index]?.price?.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Discount (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          {...register(`items.${index}.discount`, { valueAsNumber: true })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>

                      <div className="flex items-end">
                        <div className="w-full">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Total
                          </label>
                          <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-medium">
                            {formatCurrency(
                              ((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.price || 0)) *
                              (1 - (watchedItems[index]?.discount || 0) / 100)
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Add any notes for this invoice..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Terms & Conditions
                  </label>
                  <textarea
                    {...register('terms')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter payment terms and conditions..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            {/* Invoice Summary */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 sticky top-6">
              <div className="flex items-center space-x-2 mb-4">
                <Calculator className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900">Invoice Summary</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    {...register('discount', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    {...register('tax_rate', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(calculations.subtotal)}</span>
                  </div>
                  {calculations.discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Discount:</span>
                      <span className="font-medium">-{formatCurrency(calculations.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-medium">{formatCurrency(calculations.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(calculations.total)}</span>
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Save Draft</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleSubmit((data) => onSubmit(data, 'sent'))}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>Create & Send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateInvoice;