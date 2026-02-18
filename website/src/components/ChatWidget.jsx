import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, ExternalLink } from 'lucide-react';

const WHATSAPP_LINK = 'https://wa.me/263772771036?text=Hi%20Taqon%20Electrico%2C%20I%27d%20like%20to%20enquire%20about%20your%20services.';

const RESPONSES = {
  greeting: {
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'greetings', 'howzit'],
    reply: "Hello! Welcome to Taqon Electrico. I'm here to help you with solar and electrical enquiries. What would you like to know?",
    suggestions: ['Pricing info', 'Installation timeline', 'Warranty details'],
  },
  pricing: {
    keywords: ['price', 'cost', 'how much', 'pricing', 'afford', 'budget', 'expensive', 'cheap', 'quote', 'quotation'],
    reply: "Our solar systems start from $1,200 for basic home setups and go up to $12,000+ for commercial installations. For an accurate estimate tailored to your needs, try our Solar Savings Calculator or request a free quote!",
    suggestions: ['Open Calculator', 'Get a Quote', 'Financing options'],
    links: { 'Open Calculator': '/calculator', 'Get a Quote': '/quote' },
  },
  installation: {
    keywords: ['install', 'installation', 'timeline', 'how long', 'duration', 'time', 'days', 'process', 'setup'],
    reply: "A typical residential solar installation takes 1-3 days, depending on system size and roof type. Commercial installations may take 1-2 weeks. Our team handles everything from site survey to final commissioning.",
    suggestions: ['Get a Quote', 'View packages', 'Contact us'],
    links: { 'Get a Quote': '/quote', 'View packages': '/packages' },
  },
  warranty: {
    keywords: ['warranty', 'guarantee', 'lifespan', 'how long last', 'durability', 'quality'],
    reply: "We use only premium equipment with excellent warranties: Solar panels come with up to 25-year performance warranties, batteries up to 5 years, and inverters up to 5 years. We also warranty our installation workmanship.",
    suggestions: ['View products', 'Get a Quote'],
    links: { 'View products': '/shop' },
  },
  financing: {
    keywords: ['payment', 'financing', 'pay', 'installment', 'credit', 'loan', 'ecocash', 'innbucks', 'plan'],
    reply: "We offer flexible payment plans! Choose from 6-month (0% interest), 12-month (5% interest), or 24-month (10% interest) plans. We accept EcoCash, InnBucks, bank transfer, and cash. Visit our Financing page for details.",
    suggestions: ['Financing page', 'Payment calculator'],
    links: { 'Financing page': '/financing', 'Payment calculator': '/financing' },
  },
  contact: {
    keywords: ['contact', 'phone', 'call', 'email', 'address', 'location', 'where', 'visit', 'office', 'reach'],
    reply: "You can reach us at:\n\nPhone: +263 772 771 036\nEmail: info@taqon.co.zw\nOffice: 876 Ringwood Drive, Strathaven, Harare\n\nBusiness Hours: Mon-Fri 08:00-16:30, Sat 08:00-13:00",
    suggestions: ['WhatsApp us', 'Contact page', 'Get directions'],
    links: { 'Contact page': '/contact' },
  },
  products: {
    keywords: ['panel', 'battery', 'inverter', 'product', 'equipment', 'brand', 'jinko', 'pylontech', 'kodak', 'deye'],
    reply: "We supply premium solar equipment from trusted brands: Jinko & JA Solar panels, Pylontech & Dyness batteries, and Kodak & Deye inverters. Browse our full product range in our shop.",
    suggestions: ['View shop', 'View packages'],
    links: { 'View shop': '/shop', 'View packages': '/packages' },
  },
  services: {
    keywords: ['service', 'offer', 'what do you do', 'solutions', 'borehole', 'lighting', 'maintenance', 'electrical'],
    reply: "We offer: Solar Installations, Electrical Maintenance, Borehole Pump Installations, Lighting Solutions, Solar System Maintenance, and Electrical Hardware Supply. We serve residential, commercial, and institutional clients across Zimbabwe.",
    suggestions: ['Our solutions', 'Get a Quote'],
    links: { 'Our solutions': '/solutions', 'Get a Quote': '/quote' },
  },
  zera: {
    keywords: ['zera', 'certified', 'certification', 'licensed', 'registered', 'legit', 'legitimate', 'trusted'],
    reply: "Yes! Taqon Electrico is recommended by the Zimbabwe Energy Regulatory Authority (ZERA). We are a fully licensed and certified solar installation company with 5+ years of experience and 500+ completed projects.",
    suggestions: ['About us', 'View projects'],
    links: { 'About us': '/about', 'View projects': '/projects' },
  },
};

const DEFAULT_RESPONSE = {
  reply: "I appreciate your question! For more detailed assistance, I'd recommend speaking with our team directly. You can call us at +263 772 771 036 or chat on WhatsApp for an immediate response.",
  suggestions: ['WhatsApp us', 'Contact page', 'Pricing info'],
  links: { 'Contact page': '/contact' },
};

function getResponse(message) {
  const lower = message.toLowerCase().trim();
  for (const [, data] of Object.entries(RESPONSES)) {
    if (data.keywords.some((kw) => lower.includes(kw))) {
      return data;
    }
  }
  return DEFAULT_RESPONSE;
}

const SESSION_KEY = 'taqon_chat_messages';

function loadMessages() {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Ignore parse errors
  }
  return [
    {
      id: 1,
      sender: 'bot',
      text: "Hi there! I'm the Taqon Electrico assistant. How can I help you today?",
      suggestions: ['Pricing info', 'Installation timeline', 'Our services'],
    },
  ];
}

function saveMessages(messages) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages));
  } catch {
    // Ignore storage errors
  }
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(loadMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = (text) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    const userMsg = { id: Date.now(), sender: 'user', text: messageText };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = getResponse(messageText);
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: response.reply,
        suggestions: response.suggestions || [],
        links: response.links || {},
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 800 + Math.random() * 600);
  };

  const handleSuggestionClick = (suggestion) => {
    // Check if the last bot message has a link for this suggestion
    const lastBot = [...messages].reverse().find((m) => m.sender === 'bot');
    if (lastBot?.links?.[suggestion]) {
      window.location.href = lastBot.links[suggestion];
      return;
    }
    if (suggestion === 'WhatsApp us') {
      window.open(WHATSAPP_LINK, '_blank');
      return;
    }
    if (suggestion === 'Get directions') {
      window.open('https://goo.gl/maps/gEBWUQoo4cgKEym2A', '_blank');
      return;
    }
    handleSend(suggestion);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Bubble */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-24 right-6 z-[55] w-14 h-14 rounded-full bg-taqon-orange text-white shadow-lg shadow-taqon-orange/30 flex items-center justify-center hover:bg-taqon-orange/90 transition-colors"
            aria-label="Open chat"
          >
            <MessageCircle size={24} />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 right-6 z-[55] w-[340px] h-[480px] bg-white dark:bg-taqon-charcoal rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-taqon-orange px-5 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm font-syne">Taqon Assistant</p>
                  <p className="text-white/70 text-xs">Online now</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors"
                aria-label="Close chat"
              >
                <X size={16} className="text-white" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] ${msg.sender === 'user' ? 'order-1' : 'order-1'}`}>
                    <div className="flex items-end gap-2">
                      {msg.sender === 'bot' && (
                        <div className="w-6 h-6 rounded-full bg-taqon-orange/10 flex items-center justify-center flex-shrink-0">
                          <Bot size={12} className="text-taqon-orange" />
                        </div>
                      )}
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                          msg.sender === 'user'
                            ? 'bg-taqon-orange text-white rounded-br-md'
                            : 'bg-gray-100 dark:bg-taqon-dark text-taqon-charcoal dark:text-white/90 rounded-bl-md'
                        }`}
                      >
                        {msg.text}
                      </div>
                      {msg.sender === 'user' && (
                        <div className="w-6 h-6 rounded-full bg-taqon-charcoal dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                          <User size={12} className="text-white" />
                        </div>
                      )}
                    </div>

                    {/* Suggestion Buttons */}
                    {msg.sender === 'bot' && msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 ml-8">
                        {msg.suggestions.map((s) => (
                          <button
                            key={s}
                            onClick={() => handleSuggestionClick(s)}
                            className="text-xs px-3 py-1.5 rounded-full border border-taqon-orange/30 text-taqon-orange hover:bg-taqon-orange hover:text-white transition-all"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex items-end gap-2">
                  <div className="w-6 h-6 rounded-full bg-taqon-orange/10 flex items-center justify-center flex-shrink-0">
                    <Bot size={12} className="text-taqon-orange" />
                  </div>
                  <div className="bg-gray-100 dark:bg-taqon-dark rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-taqon-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-taqon-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-taqon-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* WhatsApp Fallback */}
            <div className="px-4 py-2 border-t border-gray-100 dark:border-white/5 flex-shrink-0">
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-xs text-green-600 dark:text-green-400 hover:underline"
              >
                <ExternalLink size={12} />
                Prefer WhatsApp? Chat with a real person
              </a>
            </div>

            {/* Input */}
            <div className="px-4 pb-4 pt-2 flex-shrink-0">
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-taqon-dark rounded-xl border border-gray-200 dark:border-white/10 px-3 py-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent text-sm outline-none text-taqon-charcoal dark:text-white placeholder:text-taqon-muted"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  className="w-8 h-8 rounded-lg bg-taqon-orange text-white flex items-center justify-center hover:bg-taqon-orange/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
