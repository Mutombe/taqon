import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, ChatsTeardrop, Clock, CaretRight, ArrowLeft,
} from '@phosphor-icons/react';
import { supportApi } from '../../api/support';
import SEO from '../../components/SEO';
import { OrderListSkeleton } from '../../components/Skeletons';
import Pagination from '../../components/Pagination';

const PAGE_SIZE = 15;

const STATUS_COLORS = {
  open: 'bg-blue-500/10 text-blue-400',
  in_progress: 'bg-taqon-orange/10 text-taqon-orange',
  waiting_customer: 'bg-yellow-500/10 text-yellow-400',
  waiting_staff: 'bg-purple-500/10 text-purple-400',
  resolved: 'bg-green-500/10 text-green-400',
  closed: 'bg-gray-500/10 text-gray-500',
};

const PRIORITY_COLORS = {
  low: 'text-gray-400',
  medium: 'text-blue-400',
  high: 'text-orange-400',
  urgent: 'text-red-400',
};

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_customer', label: 'Waiting on Me' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

export default function TicketList() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: PAGE_SIZE };
      if (statusFilter) params.status = statusFilter;
      const { data } = await supportApi.getMyTickets(params);
      setTickets(data.results || data);
      if (data.count) setTotalPages(Math.ceil(data.count / PAGE_SIZE));
    } catch {}
    setLoading(false);
  }, [statusFilter, page]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  return (
    <>
      <SEO title="My Support Tickets" />

      <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link to="/faq" className="text-gray-400 hover:text-taqon-charcoal dark:text-white transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white">My Tickets</h1>
                <p className="text-sm text-gray-400">
                  {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Link
              to="/support/create"
              className="flex items-center gap-2 px-4 py-2 bg-taqon-orange hover:bg-taqon-orange/90 text-taqon-charcoal dark:text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Plus size={16} /> New Ticket
            </Link>
          </div>

          {/* Filter */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${
                  statusFilter === s.value
                    ? 'bg-taqon-orange text-taqon-charcoal dark:text-white'
                    : 'bg-gray-50 dark:bg-white/5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* List */}
          {loading ? (
            <OrderListSkeleton count={4} />
          ) : tickets.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-taqon-charcoal/30 rounded-2xl border border-warm-100 dark:border-white/5">
              <ChatsTeardrop size={48} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-400 mb-2">No Tickets</h3>
              <p className="text-sm text-gray-500 mb-4">You haven't created any support tickets yet.</p>
              <Link to="/support/create" className="text-taqon-orange text-sm font-semibold hover:underline">
                Create your first ticket
              </Link>
            </div>
          ) : (
            <>
            <div className="space-y-3">
              {tickets.map((ticket, i) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link
                    to={`/support/tickets/${ticket.ticket_number}`}
                    className="group block bg-white dark:bg-taqon-charcoal/50 rounded-xl p-5 border border-warm-100 dark:border-white/5 hover:border-taqon-orange/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500 font-mono">{ticket.ticket_number}</span>
                          <span className={`text-xs font-semibold capitalize ${PRIORITY_COLORS[ticket.priority]}`}>
                            {ticket.priority}
                          </span>
                        </div>
                        <h3 className="font-semibold text-taqon-charcoal dark:text-white group-hover:text-taqon-orange transition-colors line-clamp-1">
                          {ticket.subject}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${STATUS_COLORS[ticket.status]}`}>
                          {ticket.status.replace(/_/g, ' ')}
                        </span>
                        <CaretRight size={16} className="text-gray-600 group-hover:text-taqon-orange transition-colors" />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="capitalize">{ticket.category.replace(/_/g, ' ')}</span>
                      <span className="flex items-center gap-1">
                        <ChatsTeardrop size={12} /> {ticket.message_count} messages
                      </span>
                      {ticket.last_reply_at && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> Last reply {new Date(ticket.last_reply_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="mt-8" />
          </>
          )}
        </div>
      </div>
    </>
  );
}
