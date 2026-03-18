import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Receipt, Download, CircleNotch, Calendar, CreditCard } from '@phosphor-icons/react';
import { quotationsApi } from '../../api/quotations';
import { toast } from 'sonner';
import { DetailPageSkeleton } from '../../components/Skeletons';

const STATUS_COLORS = {
  draft: 'text-gray-400',
  sent: 'text-blue-400',
  paid: 'text-green-400',
  partially_paid: 'text-yellow-400',
  overdue: 'text-red-400',
};

export default function InvoiceDetail() {
  const { invoiceNumber } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    quotationsApi.getInvoice(invoiceNumber)
      .then(({ data }) => setInvoice(data))
      .catch(() => toast.error('Invoice not found'))
      .finally(() => setLoading(false));
  }, [invoiceNumber]);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const tokens = JSON.parse(localStorage.getItem('taqon-tokens') || 'null');
      const url = quotationsApi.getInvoicePdfUrl(invoiceNumber);
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${tokens?.access || ''}` },
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(downloadUrl);
      toast.success('Invoice downloaded');
    } catch {
      toast.error('Failed to download invoice');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <DetailPageSkeleton />;

  if (!invoice) return null;

  return (
    <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark pt-32 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/account/invoices" className="inline-flex items-center gap-1 text-gray-500 dark:text-white/50 hover:text-taqon-charcoal dark:hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to invoices
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white">{invoice.invoice_number}</h1>
              <p className={`text-sm font-medium capitalize ${STATUS_COLORS[invoice.status] || 'text-white/50'}`}>
                {invoice.status.replace(/_/g, ' ')}
              </p>
            </div>
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="inline-flex items-center gap-2 bg-taqon-orange text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-taqon-orange/90 transition-all disabled:opacity-50"
            >
              <Download size={16} /> {downloading ? 'Downloading...' : 'Download PDF'}
            </button>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-xl p-4">
              <p className="text-gray-400 dark:text-white/40 text-xs">Issue Date</p>
              <p className="text-taqon-charcoal dark:text-white text-sm font-medium mt-1">{new Date(invoice.issue_date || invoice.created_at).toLocaleDateString('en-ZW', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
            </div>
            {invoice.due_date && (
              <div className="bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-xl p-4">
                <p className="text-gray-400 dark:text-white/40 text-xs">Due Date</p>
                <p className="text-taqon-charcoal dark:text-white text-sm font-medium mt-1">{new Date(invoice.due_date).toLocaleDateString('en-ZW', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
              </div>
            )}
            <div className="bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-xl p-4">
              <p className="text-gray-400 dark:text-white/40 text-xs">Total</p>
              <p className="text-taqon-orange text-lg font-bold mt-1">${parseFloat(invoice.total).toFixed(2)}</p>
            </div>
            <div className="bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-xl p-4">
              <p className="text-gray-400 dark:text-white/40 text-xs">Amount Due</p>
              <p className={`text-lg font-bold mt-1 ${parseFloat(invoice.amount_due) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                ${parseFloat(invoice.amount_due).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-taqon-charcoal dark:text-white font-semibold mb-4 flex items-center gap-2">
              <Receipt size={18} className="text-taqon-orange" /> Items
            </h2>
            <div className="space-y-3">
              {invoice.items?.map((item, i) => (
                <div key={item.id || i} className="flex justify-between items-center py-2 border-b border-warm-100 dark:border-white/5 last:border-0">
                  <div>
                    <p className="text-taqon-charcoal dark:text-white text-sm">{item.name}</p>
                    {item.description && <p className="text-gray-400 dark:text-white/40 text-xs">{item.description}</p>}
                    <p className="text-gray-400 dark:text-white/30 text-xs">Qty: {item.quantity} x ${parseFloat(item.unit_price).toFixed(2)}</p>
                  </div>
                  <p className="text-taqon-charcoal dark:text-white font-medium">${parseFloat(item.total_price).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-taqon-charcoal dark:text-white font-semibold mb-4">Summary</h2>
            <div className="space-y-2 text-sm max-w-sm ml-auto">
              <div className="flex justify-between"><span className="text-gray-500 dark:text-white/50">Subtotal</span><span className="text-taqon-charcoal dark:text-white">${parseFloat(invoice.subtotal).toFixed(2)}</span></div>
              {parseFloat(invoice.tax_amount) > 0 && (
                <div className="flex justify-between"><span className="text-gray-500 dark:text-white/50">Tax ({invoice.tax_rate}%)</span><span className="text-taqon-charcoal dark:text-white">${parseFloat(invoice.tax_amount).toFixed(2)}</span></div>
              )}
              {parseFloat(invoice.discount_amount) > 0 && (
                <div className="flex justify-between"><span className="text-gray-500 dark:text-white/50">Discount</span><span className="text-green-400">-${parseFloat(invoice.discount_amount).toFixed(2)}</span></div>
              )}
              <hr className="border-warm-200 dark:border-white/10" />
              <div className="flex justify-between font-semibold text-lg"><span className="text-taqon-charcoal dark:text-white">Total</span><span className="text-taqon-orange">${parseFloat(invoice.total).toFixed(2)}</span></div>
              {parseFloat(invoice.amount_paid) > 0 && (
                <div className="flex justify-between"><span className="text-gray-500 dark:text-white/50">Paid</span><span className="text-green-400">${parseFloat(invoice.amount_paid).toFixed(2)}</span></div>
              )}
              <div className="flex justify-between font-semibold"><span className="text-gray-700 dark:text-white/70">Balance Due</span><span className={parseFloat(invoice.amount_due) > 0 ? 'text-red-400' : 'text-green-400'}>${parseFloat(invoice.amount_due).toFixed(2)}</span></div>
            </div>
          </div>

          {/* Terms */}
          {invoice.terms && (
            <div className="bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-2xl p-6">
              <h2 className="text-taqon-charcoal dark:text-white font-semibold mb-2">Terms</h2>
              <p className="text-gray-500 dark:text-white/50 text-sm">{invoice.terms}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
