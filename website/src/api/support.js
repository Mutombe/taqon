import api from './axios';

const BASE = '/support';

export const supportApi = {
  // Public — FAQ
  getFAQs: (params = {}) => api.get(`${BASE}/faq/`, { params }),
  getFAQCategories: () => api.get(`${BASE}/faq/categories/`),
  faqFeedback: (faqId, helpful) => api.post(`${BASE}/faq/${faqId}/feedback/`, { helpful }),

  // Chatbot
  sendChat: (message) => api.post(`${BASE}/chat/`, { message }),
  getChatHistory: () => api.get(`${BASE}/chat/history/`),
  clearChatHistory: () => api.delete(`${BASE}/chat/history/`),

  // Customer Tickets
  getMyTickets: (params = {}) => api.get(`${BASE}/tickets/`, { params }),
  createTicket: (data) => api.post(`${BASE}/tickets/create/`, data),
  getTicket: (ticketNumber) => api.get(`${BASE}/tickets/${ticketNumber}/`),
  replyToTicket: (ticketNumber, data) => api.post(`${BASE}/tickets/${ticketNumber}/reply/`, data),
  rateTicket: (ticketNumber, data) => api.post(`${BASE}/tickets/${ticketNumber}/satisfaction/`, data),
};
