import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, PaperPlaneTilt, CircleNotch, Robot, User, Info,
  Star, ChatsTeardrop, Clock, Tag,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { supportApi } from '../../api/support';
import SEO from '../../components/SEO';
import { DetailPageSkeleton } from '../../components/Skeletons';

const STATUS_COLORS = {
  open: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  in_progress: 'bg-taqon-orange/10 text-taqon-orange border-taqon-orange/20',
  waiting_customer: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  waiting_staff: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  resolved: 'bg-green-500/10 text-green-400 border-green-500/20',
  closed: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

export default function TicketDetail() {
  const { ticketNumber } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    supportApi.getTicket(ticketNumber)
      .then(({ data }) => {
        setTicket(data);
        if (data.status === 'resolved' && !data.satisfaction_rating) {
          setShowRating(true);
        }
      })
      .catch(() => toast.error('Ticket not found.'))
      .finally(() => setLoading(false));
  }, [ticketNumber]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;

    setSending(true);
    try {
      await supportApi.replyToTicket(ticketNumber, { content: reply });
      setReply('');
      // Refresh ticket
      const { data } = await supportApi.getTicket(ticketNumber);
      setTicket(data);
    } catch {
      toast.error('Failed to send reply.');
    } finally {
      setSending(false);
    }
  };

  const handleRate = async () => {
    if (rating < 1) return;
    try {
      await supportApi.rateTicket(ticketNumber, { rating, comment: ratingComment });
      toast.success('Thank you for your feedback!');
      setShowRating(false);
      setTicket((prev) => ({ ...prev, satisfaction_rating: rating }));
    } catch {
      toast.error('Failed to submit rating.');
    }
  };

  if (loading) return <DetailPageSkeleton />;

  if (!ticket) return null;

  const isClosed = ['resolved', 'closed'].includes(ticket.status);

  return (
    <>
      <SEO title={`Ticket ${ticket.ticket_number}`} />

      <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark pt-32 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <Link to="/support/tickets" className="text-gray-400 hover:text-taqon-charcoal dark:text-white transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs text-gray-500 font-mono">{ticket.ticket_number}</span>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${STATUS_COLORS[ticket.status]}`}>
                  {ticket.status.replace(/_/g, ' ')}
                </span>
              </div>
              <h1 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white line-clamp-1">{ticket.subject}</h1>
            </div>
          </div>

          {/* Ticket Info */}
          <div className="flex flex-wrap gap-3 mb-6 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Tag size={12} /> {ticket.category.replace(/_/g, ' ')}
            </span>
            <span className="flex items-center gap-1 capitalize">
              Priority: <strong className="text-taqon-charcoal dark:text-white">{ticket.priority}</strong>
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} /> Created {new Date(ticket.created_at).toLocaleDateString()}
            </span>
            {ticket.assigned_to_name && (
              <span>Assigned to: <strong className="text-taqon-charcoal dark:text-white">{ticket.assigned_to_name}</strong></span>
            )}
          </div>

          {/* Rating Banner */}
          {showRating && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-taqon-charcoal/60 rounded-xl p-5 border border-taqon-orange/20 mb-6"
            >
              <p className="text-sm font-semibold text-taqon-charcoal dark:text-white mb-3">How was your support experience?</p>
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setRating(s)}>
                    <Star
                      size={24}
                      className={s <= rating ? 'text-yellow-400' : 'text-gray-600'}
                      fill={s <= rating ? 'currentColor' : 'none'}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <>
                  <textarea
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    rows={2}
                    placeholder="Any additional feedback? (optional)"
                    className="w-full bg-taqon-cream dark:bg-taqon-dark border border-warm-200 dark:border-white/10 rounded-lg px-3 py-2 text-taqon-charcoal dark:text-white text-sm focus:border-taqon-orange focus:ring-0 mb-3"
                  />
                  <button
                    onClick={handleRate}
                    className="px-4 py-2 bg-taqon-orange hover:bg-taqon-orange/90 text-taqon-charcoal dark:text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    Submit Rating
                  </button>
                </>
              )}
            </motion.div>
          )}

          {/* Messages */}
          <div className="space-y-4 mb-6">
            {ticket.messages?.map((msg) => {
              const isCustomer = msg.sender_type === 'customer';
              const isSystem = msg.sender_type === 'system';

              if (isSystem) {
                return (
                  <div key={msg.id} className="text-center">
                    <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-50 dark:bg-white/5 px-3 py-1 rounded-full">
                      <Info size={10} /> {msg.content}
                    </span>
                  </div>
                );
              }

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${isCustomer ? 'order-1' : 'order-1'}`}>
                    <div className="flex items-end gap-2">
                      {!isCustomer && (
                        <div className="w-7 h-7 rounded-full bg-taqon-orange/10 flex items-center justify-center flex-shrink-0">
                          <Robot size={14} className="text-taqon-orange" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500">{msg.sender_name}</span>
                          <span className="text-xs text-gray-600">
                            {new Date(msg.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div
                          className={`px-4 py-3 rounded-2xl text-sm whitespace-pre-line ${
                            isCustomer
                              ? 'bg-taqon-orange text-taqon-charcoal dark:text-white rounded-br-md'
                              : 'bg-white dark:bg-taqon-charcoal/60 text-gray-300 rounded-bl-md border border-warm-100 dark:border-white/5'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                      {isCustomer && (
                        <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                          <User size={14} className="text-taqon-charcoal dark:text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Form */}
          {!isClosed ? (
            <form onSubmit={handleReply} className="sticky bottom-4">
              <div className="flex items-center gap-2 bg-white dark:bg-taqon-charcoal/80 backdrop-blur-sm rounded-xl border border-warm-200 dark:border-white/10 px-4 py-3">
                <input
                  type="text"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type your reply..."
                  className="flex-1 bg-transparent text-sm outline-none text-taqon-charcoal dark:text-white placeholder:text-gray-500"
                />
                <button
                  type="submit"
                  disabled={!reply.trim() || sending}
                  className="w-9 h-9 rounded-lg bg-taqon-orange text-taqon-charcoal dark:text-white flex items-center justify-center hover:bg-taqon-orange/90 transition-colors disabled:opacity-40"
                >
                  {sending ? <CircleNotch size={14} className="animate-spin" /> : <PaperPlaneTilt size={14} />}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-4 bg-white dark:bg-taqon-charcoal/30 rounded-xl border border-warm-100 dark:border-white/5">
              <p className="text-sm text-gray-500">
                This ticket is {ticket.status}. {ticket.satisfaction_rating && `Rated: ${ticket.satisfaction_rating}/5`}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
