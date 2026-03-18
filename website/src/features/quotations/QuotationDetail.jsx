import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, CheckCircle, XCircle, Clock, CircleNotch, Calendar, DownloadSimple } from '@phosphor-icons/react';
import { quotationsApi } from '../../api/quotations';
import { toast } from 'sonner';
import { DetailPageSkeleton } from '../../components/Skeletons';

const STATUS_COLORS = {
  draft: 'text-gray-400',
  sent: 'text-blue-400',
  viewed: 'text-purple-400',
  accepted: 'text-green-400',
  rejected: 'text-red-400',
  expired: 'text-yellow-400',
};

export default function QuotationDetail() {
  const { quotationNumber } = useParams();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    quotationsApi.getQuotation(quotationNumber)
      .then(({ data }) => setQuotation(data))
      .catch(() => toast.error('Quotation not found'))
      .finally(() => setLoading(false));
  }, [quotationNumber]);

  const handleAccept = async () => {
    setResponding(true);
    try {
      const { data } = await quotationsApi.respondToQuotation(quotationNumber, { action: 'accept' });
      setQuotation(data);
      toast.success('Quotation accepted! An invoice has been generated.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to accept quotation');
    } finally {
      setResponding(false);
    }
  };

  const handleReject = async () => {
    setResponding(true);
    try {
      const { data } = await quotationsApi.respondToQuotation(quotationNumber, {
        action: 'reject',
        rejection_reason: rejectReason,
      });
      setQuotation(data);
      toast.success('Quotation rejected.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject quotation');
    } finally {
      setResponding(false);
      setShowRejectForm(false);
    }
  };

  if (loading) return <DetailPageSkeleton />;

  if (!quotation) return null;

  const canRespond = ['sent', 'viewed'].includes(quotation.status);

  const handleDownloadPDF = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(quotationsApi.getQuotationPdfUrl(quotation.quotation_number), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${quotation.quotation_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download PDF');
    }
  };

  return (
    <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark pt-32 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/account/quotations" className="inline-flex items-center gap-1 text-gray-500 dark:text-white/50 hover:text-taqon-charcoal dark:hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to quotations
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white">{quotation.quotation_number}</h1>
              <p className="text-gray-400 dark:text-white/40 text-sm">{quotation.title}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-taqon-charcoal dark:text-white text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
              >
                <DownloadSimple size={16} /> Download PDF
              </button>
              <span className={`text-lg font-semibold capitalize ${STATUS_COLORS[quotation.status] || 'text-white/50'}`}>
                {quotation.status}
              </span>
            </div>
          </div>

          {/* Validity */}
          {quotation.valid_until && (
            <div className="bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-2xl p-4 mb-6 flex items-center gap-3">
              <Calendar size={18} className="text-taqon-orange" />
              <p className="text-gray-700 dark:text-white/70 text-sm">
                Valid until <span className="text-taqon-charcoal dark:text-white font-medium">{new Date(quotation.valid_until).toLocaleDateString('en-ZW', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </p>
            </div>
          )}

          {/* Description */}
          {quotation.description && (
            <div className="bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-2xl p-6 mb-6">
              <h2 className="text-taqon-charcoal dark:text-white font-semibold mb-2">Description</h2>
              <p className="text-gray-600 dark:text-white/60 text-sm whitespace-pre-line">{quotation.description}</p>
            </div>
          )}

          {/* Items */}
          <div className="bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-taqon-charcoal dark:text-white font-semibold mb-4">Items</h2>
            <div className="space-y-3">
              {quotation.items?.map((item, i) => (
                <div key={item.id || i} className="flex justify-between items-center py-2 border-b border-warm-100 dark:border-white/5 last:border-0">
                  <div>
                    <p className="text-taqon-charcoal dark:text-white text-sm">{item.name}</p>
                    {item.description && <p className="text-gray-400 dark:text-white/40 text-xs">{item.description}</p>}
                    <p className="text-gray-400 dark:text-white/30 text-xs">
                      {item.item_type !== 'product' && <span className="capitalize">{item.item_type} &bull; </span>}
                      Qty: {item.quantity}
                      {item.warranty && ` &bull; Warranty: ${item.warranty}`}
                    </p>
                  </div>
                  <p className="text-taqon-charcoal dark:text-white font-medium">${parseFloat(item.total_price).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-2xl p-6">
              <h2 className="text-taqon-charcoal dark:text-white font-semibold mb-4">Pricing</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500 dark:text-white/50">Subtotal</span><span className="text-taqon-charcoal dark:text-white">${parseFloat(quotation.subtotal).toFixed(2)}</span></div>
                {parseFloat(quotation.tax_amount) > 0 && (
                  <div className="flex justify-between"><span className="text-gray-500 dark:text-white/50">Tax ({quotation.tax_rate}%)</span><span className="text-taqon-charcoal dark:text-white">${parseFloat(quotation.tax_amount).toFixed(2)}</span></div>
                )}
                {parseFloat(quotation.discount_amount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-white/50">Discount{quotation.discount_description ? ` (${quotation.discount_description})` : ''}</span>
                    <span className="text-green-400">-${parseFloat(quotation.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                <hr className="border-warm-200 dark:border-white/10" />
                <div className="flex justify-between font-semibold text-lg">
                  <span className="text-taqon-charcoal dark:text-white">Total</span>
                  <span className="text-taqon-orange">${parseFloat(quotation.total).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {quotation.system_size_kw > 0 && (
              <div className="bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-2xl p-6">
                <h2 className="text-taqon-charcoal dark:text-white font-semibold mb-4">System Details</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500 dark:text-white/50">System Size</span><span className="text-taqon-charcoal dark:text-white">{quotation.system_size_kw} kW</span></div>
                  {quotation.project_type && (
                    <div className="flex justify-between"><span className="text-gray-500 dark:text-white/50">Project Type</span><span className="text-taqon-charcoal dark:text-white capitalize">{quotation.project_type}</span></div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Terms */}
          {quotation.terms_and_conditions && (
            <div className="bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-2xl p-6 mb-6">
              <h2 className="text-taqon-charcoal dark:text-white font-semibold mb-2">Terms & Conditions</h2>
              <p className="text-gray-500 dark:text-white/50 text-sm whitespace-pre-line">{quotation.terms_and_conditions}</p>
            </div>
          )}

          {/* Response buttons */}
          {canRespond && (
            <div className="bg-white dark:bg-taqon-charcoal/50 border border-taqon-orange/20 rounded-2xl p-6">
              <h2 className="text-taqon-charcoal dark:text-white font-semibold mb-4">Respond to this Quotation</h2>

              {showRejectForm ? (
                <div className="space-y-4">
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Reason for rejection (optional)"
                    rows={3}
                    className="w-full bg-taqon-cream dark:bg-white/5 border border-warm-300 dark:border-white/10 rounded-xl px-4 py-3 text-taqon-charcoal dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 text-sm focus:outline-none focus:border-taqon-orange/50"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleReject}
                      disabled={responding}
                      className="px-5 py-2.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-sm font-semibold hover:bg-red-500/30 transition-all disabled:opacity-50"
                    >
                      {responding ? 'Rejecting...' : 'Confirm Rejection'}
                    </button>
                    <button
                      onClick={() => setShowRejectForm(false)}
                      className="px-5 py-2.5 text-white/50 text-sm hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleAccept}
                    disabled={responding}
                    className="flex items-center gap-2 px-6 py-3 bg-taqon-orange text-white rounded-xl font-semibold hover:bg-taqon-orange/90 transition-all disabled:opacity-50"
                  >
                    <CheckCircle size={16} /> {responding ? 'Accepting...' : 'Accept Quotation'}
                  </button>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="flex items-center gap-2 px-6 py-3 border border-red-500/30 text-red-400 rounded-xl font-semibold hover:bg-red-500/10 transition-all"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              )}
            </div>
          )}

          {quotation.status === 'accepted' && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center">
              <CheckCircle size={24} className="text-green-400 mx-auto mb-2" />
              <p className="text-green-400 font-semibold">Quotation Accepted</p>
              <p className="text-gray-500 dark:text-white/50 text-sm mt-1">An invoice has been generated. Check your invoices page.</p>
              <Link
                to="/account/invoices"
                className="inline-flex items-center gap-2 mt-4 text-taqon-orange text-sm font-medium hover:underline"
              >
                View Invoices
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
