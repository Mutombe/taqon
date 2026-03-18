import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Receipt, CaretRight, FileX } from '@phosphor-icons/react';
import { quotationsApi } from '../../api/quotations';
import { OrderListSkeleton } from '../../components/Skeletons';

const STATUS_COLORS = {
  draft: 'bg-gray-500/10 text-gray-400',
  sent: 'bg-blue-500/10 text-blue-400',
  paid: 'bg-green-500/10 text-green-400',
  partially_paid: 'bg-yellow-500/10 text-yellow-400',
  overdue: 'bg-red-500/10 text-red-400',
  cancelled: 'bg-gray-500/10 text-gray-400',
};

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    quotationsApi.getMyInvoices()
      .then(({ data }) => setInvoices(data.results || data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark pt-32 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold font-syne text-taqon-charcoal dark:text-white mb-8"
        >
          My Invoices
        </motion.h1>

        {loading ? (
          <OrderListSkeleton count={4} />
        ) : invoices.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <FileX className="w-16 h-16 text-gray-300 dark:text-white/20 mx-auto mb-4" />
            <h2 className="text-xl text-gray-500 dark:text-white/50 mb-2">No invoices yet</h2>
            <p className="text-gray-400 dark:text-white/30 text-sm">Invoices will appear here after orders or accepted quotations.</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {invoices.map((inv, i) => (
              <motion.div
                key={inv.invoice_number || inv.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/account/invoices/${inv.invoice_number}`}
                  className="block bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-2xl p-5 hover:border-taqon-orange/30 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-taqon-orange/10 rounded-xl flex items-center justify-center">
                        <Receipt className="w-6 h-6 text-taqon-orange" />
                      </div>
                      <div>
                        <h3 className="text-taqon-charcoal dark:text-white font-semibold">{inv.invoice_number}</h3>
                        <p className="text-gray-400 dark:text-white/40 text-sm">
                          {new Date(inv.issue_date || inv.created_at).toLocaleDateString('en-ZW', {
                            year: 'numeric', month: 'short', day: 'numeric',
                          })}
                          {inv.due_date && (
                            <> &bull; Due {new Date(inv.due_date).toLocaleDateString('en-ZW', { month: 'short', day: 'numeric' })}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-taqon-charcoal dark:text-white font-semibold">${parseFloat(inv.total).toFixed(2)}</p>
                        {parseFloat(inv.amount_due) > 0 && (
                          <p className="text-taqon-orange text-xs">Due: ${parseFloat(inv.amount_due).toFixed(2)}</p>
                        )}
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[inv.status] || 'bg-white/10 text-white/50'}`}>
                          {inv.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <CaretRight className="w-5 h-5 text-gray-400 dark:text-white/30 group-hover:text-taqon-orange transition-colors" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
