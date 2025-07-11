import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Invoice } from '../types';
import { formatCurrency } from './calculations';

export const generateInvoicePDF = async (invoice: Invoice, elementId: string): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`Invoice-${invoice.invoiceNumber}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
};

export const generateManualPDF = (invoice: Invoice): void => {
  const pdf = new jsPDF();
  
  // Header
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INVOICE', 20, 30);
  
  // Invoice details
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Invoice #: ${invoice.invoiceNumber}`, 20, 50);
  pdf.text(`Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 20, 60);
  pdf.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 20, 70);
  
  // Client details
  pdf.setFont('helvetica', 'bold');
  pdf.text('Bill To:', 20, 90);
  pdf.setFont('helvetica', 'normal');
  pdf.text(invoice.client.name, 20, 100);
  if (invoice.client.company) pdf.text(invoice.client.company, 20, 110);
  if (invoice.client.email) pdf.text(invoice.client.email, 20, 120);
  
  // Items table
  let yPos = 140;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Description', 20, yPos);
  pdf.text('Qty', 120, yPos);
  pdf.text('Price', 140, yPos);
  pdf.text('Total', 170, yPos);
  
  yPos += 10;
  pdf.setFont('helvetica', 'normal');
  
  invoice.items.forEach((item) => {
    const itemTotal = item.quantity * item.price;
    pdf.text(item.name, 20, yPos);
    pdf.text(item.quantity.toString(), 120, yPos);
    pdf.text(formatCurrency(item.price), 140, yPos);
    pdf.text(formatCurrency(itemTotal), 170, yPos);
    yPos += 10;
  });
  
  // Totals
  yPos += 10;
  pdf.text(`Subtotal: ${formatCurrency(invoice.subtotal)}`, 140, yPos);
  yPos += 10;
  if (invoice.discount > 0) {
    pdf.text(`Discount: -${formatCurrency(invoice.discount)}`, 140, yPos);
    yPos += 10;
  }
  pdf.text(`Tax: ${formatCurrency(invoice.taxAmount)}`, 140, yPos);
  yPos += 10;
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Total: ${formatCurrency(invoice.total)}`, 140, yPos);
  
  pdf.save(`Invoice-${invoice.invoiceNumber}.pdf`);
};