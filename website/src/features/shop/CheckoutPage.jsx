import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  Storefront,
  CreditCard,
  Bank,
  DeviceMobile,
  Money,
  Check,
  CaretRight,
  CaretLeft,
  MapPin,
  Notepad,
  CircleNotch,
  Bag,
  WarningCircle,
  Package,
  Shield,
} from '@phosphor-icons/react';
import { shopApi } from '../../api/shop';
import { paymentsApi } from '../../api/payments';
import useCartStore from '../../stores/cartStore';
import useAuthStore from '../../stores/authStore';
import { toast } from 'sonner';

const STEPS = [
  { key: 'delivery', label: 'Delivery', icon: Truck },
  { key: 'payment', label: 'Payment', icon: CreditCard },
  { key: 'review', label: 'Review', icon: Check },
];

const PAYMENT_METHODS = [
  { key: 'ecocash', label: 'EcoCash', icon: DeviceMobile, description: 'STK prompt to your EcoCash number', requiresPhone: true, type: 'mobile' },
  { key: 'onemoney', label: 'OneMoney', icon: DeviceMobile, description: 'STK prompt to your OneMoney number', requiresPhone: true, type: 'mobile' },
  { key: 'innbucks', label: 'InnBucks', icon: DeviceMobile, description: 'Pay with your InnBucks wallet', requiresPhone: true, type: 'mobile' },
  { key: 'card', label: 'Card Payment', icon: CreditCard, description: 'Visa or Mastercard — enter card details on Paynow', type: 'web' },
  { key: 'zimswitch', label: 'ZimSwitch', icon: CreditCard, description: 'Local ZimSwitch card — complete payment on Paynow', type: 'web' },
  { key: 'bank_transfer', label: 'Bank Transfer', icon: Bank, description: 'Direct bank transfer — complete payment on Paynow', type: 'web' },
  { key: 'cash', label: 'Cash on Delivery', icon: Money, description: 'Pay when your order arrives', type: 'cash' },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { items, subtotal, totalSavings, fetchCart } = useCartStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Form state
  const [deliveryType, setDeliveryType] = useState('delivery');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  const { openAuthModal } = useAuthStore();

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal('login');
    }
  }, [isAuthenticated, openAuthModal]);

  // Fetch cart on mount
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Redirect if cart is empty (after fetch completes)
  useEffect(() => {
    // Only redirect after cart has been fetched and it's truly empty
    // Small delay to avoid redirecting before fetch completes
    const timer = setTimeout(() => {
      if (isAuthenticated && items.length === 0) {
        navigate('/cart', { replace: true });
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [items, isAuthenticated, navigate]);

  // Delivery fee
  const deliveryFee = deliveryType === 'delivery' ? 15.0 : 0;
  const total = subtotal + deliveryFee;

  // Validation
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 0) {
      // Delivery step
      if (deliveryType === 'delivery') {
        if (!address.trim()) newErrors.address = 'Delivery address is required';
        if (!city.trim()) newErrors.city = 'City is required';
        if (!province.trim()) newErrors.province = 'Province is required';
      }
    }

    if (step === 1) {
      // Payment step
      if (!paymentMethod) newErrors.paymentMethod = 'Please select a payment method';
      const selectedMethod = PAYMENT_METHODS.find((m) => m.key === paymentMethod);
      if (selectedMethod?.requiresPhone && !paymentPhone.trim()) {
        newErrors.paymentPhone = 'Phone number is required for this payment method';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      const orderData = {
        delivery_type: deliveryType,
        payment_method: paymentMethod,
        customer_notes: customerNotes.trim() || undefined,
      };

      if (deliveryType === 'delivery') {
        orderData.delivery_address = address.trim();
        orderData.delivery_city = city.trim();
        orderData.delivery_province = province.trim();
        orderData.delivery_notes = deliveryNotes.trim() || undefined;
      }

      // 1. Create the order
      const { data: order } = await shopApi.checkout(orderData);

      // 2. Initiate payment (skip for cash — go straight to confirmation)
      if (paymentMethod === 'cash') {
        toast.success('Order placed successfully!');
        navigate(`/order-confirmation/${order.order_number}`, { replace: true });
        return;
      }

      try {
        const paymentData = {
          order_number: order.order_number,
          method: paymentMethod,
        };

        const selectedMethod = PAYMENT_METHODS.find((m) => m.key === paymentMethod);
        if (selectedMethod?.requiresPhone) {
          paymentData.phone = paymentPhone.trim();
        }

        const { data: payment } = await paymentsApi.initiate(paymentData);

        // Payment explicitly failed on the backend (e.g. Paynow couldn't build
        // a checkout URL or poll URL) — stop here so the user doesn't think
        // they paid.
        if (payment?.status === 'failed') {
          toast.error(payment.failure_reason || 'Payment failed to initialise.');
          navigate(`/order-confirmation/${order.order_number}`, { replace: true });
          return;
        }

        // Explicit dispatch per method — no silent fall-through.
        const MOBILE = ['ecocash', 'onemoney', 'innbucks'];
        const WEB = ['card', 'zimswitch', 'bank_transfer'];

        if (WEB.includes(paymentMethod)) {
          if (!payment.gateway_redirect_url) {
            toast.error('Payment gateway did not return a checkout URL. Please try a different method.');
            navigate(`/order-confirmation/${order.order_number}`, { replace: true });
            return;
          }
          toast.success('Redirecting to Paynow checkout...');
          window.location.href = payment.gateway_redirect_url;
          return;
        }

        if (MOBILE.includes(paymentMethod)) {
          toast.success('Check your phone to authorise the payment.');
          navigate(`/payment/status/${payment.reference}`, {
            replace: true,
            state: { orderNumber: order.order_number },
          });
          return;
        }

        // Stripe fallback (kept for compatibility if ever re-enabled)
        if (payment.stripe_client_secret) {
          navigate(`/payment/${payment.reference}`, {
            replace: true,
            state: { clientSecret: payment.stripe_client_secret, orderNumber: order.order_number },
          });
          return;
        }

        // Unknown — don't pretend success
        toast.error('Payment method not recognised.');
        navigate(`/order-confirmation/${order.order_number}`, { replace: true });
      } catch (payError) {
        // Order was created but payment failed — navigate to order page
        const msg = payError.response?.data?.error || 'Payment initiation failed. You can retry from your orders.';
        toast.error(msg);
        navigate(`/order-confirmation/${order.order_number}`, { replace: true });
      }
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.detail || 'Failed to place order. Please try again.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-taqon-cream dark:bg-taqon-dark"
    >
      {/* Header */}
      <section className="pt-32 pb-6 lg:pt-40 lg:pb-8">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
              Checkout
            </span>
            <h1 className="mt-2 text-3xl lg:text-4xl font-bold font-syne text-taqon-charcoal dark:text-white">
              Complete Your Order
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Step Indicators */}
      <section className="pb-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = idx < currentStep;
              const isCurrent = idx === currentStep;

              return (
                <div key={step.key} className="flex items-center flex-1">
                  <button
                    onClick={() => {
                      if (idx < currentStep) setCurrentStep(idx);
                    }}
                    className={`flex items-center gap-2 sm:gap-3 transition-all ${
                      idx < currentStep ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-emerald-500 text-white'
                          : isCurrent
                          ? 'bg-taqon-orange text-white shadow-lg shadow-taqon-orange/30'
                          : 'bg-gray-100 dark:bg-white/5 border border-warm-200 dark:border-white/10 text-gray-400 dark:text-white/30'
                      }`}
                    >
                      {isCompleted ? <Check size={18} /> : <Icon size={18} />}
                    </div>
                    <span
                      className={`hidden sm:block text-sm font-medium transition-colors ${
                        isCompleted
                          ? 'text-emerald-400'
                          : isCurrent
                          ? 'text-taqon-charcoal dark:text-white'
                          : 'text-gray-400 dark:text-white/30'
                      }`}
                    >
                      {step.label}
                    </span>
                  </button>

                  {idx < STEPS.length - 1 && (
                    <div className="flex-1 mx-3 sm:mx-4">
                      <div
                        className={`h-0.5 rounded-full transition-colors ${
                          idx < currentStep ? 'bg-emerald-500' : 'bg-warm-200 dark:bg-white/10'
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Step Content */}
      <section className="pb-16 lg:pb-24">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Area */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {/* Step 1: Delivery */}
                {currentStep === 0 && (
                  <motion.div
                    key="delivery"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm"
                  >
                    <h2 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white mb-6 flex items-center gap-2">
                      <Truck size={22} className="text-taqon-orange" />
                      Delivery Method
                    </h2>

                    {/* Delivery type toggle */}
                    <div className="grid grid-cols-2 gap-3 mb-8">
                      <button
                        onClick={() => setDeliveryType('delivery')}
                        className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all ${
                          deliveryType === 'delivery'
                            ? 'border-taqon-orange bg-taqon-orange/10 text-taqon-charcoal dark:text-white'
                            : 'border-warm-200 dark:border-white/10 text-gray-500 dark:text-white/50 hover:border-warm-300 dark:hover:border-white/20 hover:text-gray-700 dark:hover:text-white/70'
                        }`}
                      >
                        <Truck size={24} />
                        <span className="font-semibold text-sm">Delivery</span>
                        <span className="text-xs opacity-60">To your door</span>
                      </button>
                      <button
                        onClick={() => setDeliveryType('pickup')}
                        className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all ${
                          deliveryType === 'pickup'
                            ? 'border-taqon-orange bg-taqon-orange/10 text-taqon-charcoal dark:text-white'
                            : 'border-warm-200 dark:border-white/10 text-gray-500 dark:text-white/50 hover:border-warm-300 dark:hover:border-white/20 hover:text-gray-700 dark:hover:text-white/70'
                        }`}
                      >
                        <Storefront size={24} />
                        <span className="font-semibold text-sm">Pickup</span>
                        <span className="text-xs opacity-60">Collect from store</span>
                      </button>
                    </div>

                    {/* Address fields (delivery only) */}
                    {deliveryType === 'delivery' && (
                      <div className="space-y-5">
                        <div>
                          <label className="block text-gray-700 dark:text-white/70 text-sm mb-2">
                            <MapPin size={14} className="inline mr-1" />
                            Delivery Address
                          </label>
                          <input
                            type="text"
                            value={address}
                            onChange={(e) => {
                              setAddress(e.target.value);
                              if (errors.address) setErrors((prev) => ({ ...prev, address: '' }));
                            }}
                            placeholder="123 Main Street, Suburb"
                            className={`w-full bg-taqon-cream dark:bg-white/5 border rounded-xl px-4 py-3.5 text-taqon-charcoal dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-taqon-orange/50 focus:ring-1 focus:ring-taqon-orange/50 transition-all ${
                              errors.address ? 'border-red-500/50' : 'border-warm-300 dark:border-white/10'
                            }`}
                          />
                          {errors.address && (
                            <p className="text-red-400 text-xs mt-1.5">{errors.address}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-gray-700 dark:text-white/70 text-sm mb-2">City</label>
                            <input
                              type="text"
                              value={city}
                              onChange={(e) => {
                                setCity(e.target.value);
                                if (errors.city) setErrors((prev) => ({ ...prev, city: '' }));
                              }}
                              placeholder="Harare"
                              className={`w-full bg-taqon-cream dark:bg-white/5 border rounded-xl px-4 py-3.5 text-taqon-charcoal dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-taqon-orange/50 focus:ring-1 focus:ring-taqon-orange/50 transition-all ${
                                errors.city ? 'border-red-500/50' : 'border-warm-300 dark:border-white/10'
                              }`}
                            />
                            {errors.city && (
                              <p className="text-red-400 text-xs mt-1.5">{errors.city}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-gray-700 dark:text-white/70 text-sm mb-2">Province</label>
                            <input
                              type="text"
                              value={province}
                              onChange={(e) => {
                                setProvince(e.target.value);
                                if (errors.province) setErrors((prev) => ({ ...prev, province: '' }));
                              }}
                              placeholder="Harare Metropolitan"
                              className={`w-full bg-taqon-cream dark:bg-white/5 border rounded-xl px-4 py-3.5 text-taqon-charcoal dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-taqon-orange/50 focus:ring-1 focus:ring-taqon-orange/50 transition-all ${
                                errors.province ? 'border-red-500/50' : 'border-warm-300 dark:border-white/10'
                              }`}
                            />
                            {errors.province && (
                              <p className="text-red-400 text-xs mt-1.5">{errors.province}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-gray-700 dark:text-white/70 text-sm mb-2">
                            Delivery Notes
                            <span className="text-gray-400 dark:text-white/30 ml-1">(optional)</span>
                          </label>
                          <textarea
                            value={deliveryNotes}
                            onChange={(e) => setDeliveryNotes(e.target.value)}
                            placeholder="Gate code, landmarks, special instructions..."
                            rows={3}
                            className="w-full bg-taqon-cream dark:bg-white/5 border border-warm-300 dark:border-white/10 rounded-xl px-4 py-3.5 text-taqon-charcoal dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-taqon-orange/50 focus:ring-1 focus:ring-taqon-orange/50 transition-all resize-none"
                          />
                        </div>
                      </div>
                    )}

                    {deliveryType === 'pickup' && (
                      <div className="bg-taqon-orange/5 border border-taqon-orange/20 rounded-xl p-5">
                        <div className="flex items-start gap-3">
                          <Storefront size={20} className="text-taqon-orange flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-taqon-charcoal dark:text-white font-semibold text-sm">Pickup Location</p>
                            <p className="text-gray-500 dark:text-white/50 text-sm mt-1">
                              Taqon Electrico, Harare, Zimbabwe
                            </p>
                            <p className="text-gray-400 dark:text-white/40 text-xs mt-2">
                              You will receive an email when your order is ready for collection.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Step 2: Payment */}
                {currentStep === 1 && (
                  <motion.div
                    key="payment"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm"
                  >
                    <h2 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white mb-6 flex items-center gap-2">
                      <CreditCard size={22} className="text-taqon-orange" />
                      Payment Method
                    </h2>

                    {errors.paymentMethod && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6"
                      >
                        <p className="text-red-400 text-sm flex items-center gap-2">
                          <WarningCircle size={14} />
                          {errors.paymentMethod}
                        </p>
                      </motion.div>
                    )}

                    <div className="space-y-3">
                      {PAYMENT_METHODS.map((method) => {
                        const Icon = method.icon;
                        const isSelected = paymentMethod === method.key;

                        return (
                          <button
                            key={method.key}
                            onClick={() => {
                              setPaymentMethod(method.key);
                              if (errors.paymentMethod) setErrors((prev) => ({ ...prev, paymentMethod: '' }));
                            }}
                            className={`w-full flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-left ${
                              isSelected
                                ? 'border-taqon-orange bg-taqon-orange/10'
                                : 'border-warm-200 dark:border-white/10 hover:border-warm-300 dark:hover:border-white/20'
                            }`}
                          >
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                                isSelected
                                  ? 'bg-taqon-orange text-white'
                                  : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/40'
                              }`}
                            >
                              <Icon size={20} />
                            </div>
                            <div className="flex-1">
                              <p
                                className={`font-semibold text-sm transition-colors ${
                                  isSelected ? 'text-taqon-charcoal dark:text-white' : 'text-gray-700 dark:text-white/70'
                                }`}
                              >
                                {method.label}
                              </p>
                              <p className="text-gray-400 dark:text-white/40 text-xs mt-0.5">{method.description}</p>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'border-taqon-orange bg-taqon-orange'
                                  : 'border-warm-300 dark:border-white/20'
                              }`}
                            >
                              {isSelected && <Check size={12} className="text-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Phone number for mobile money */}
                    {PAYMENT_METHODS.find((m) => m.key === paymentMethod)?.requiresPhone && (
                      <div className="mt-6">
                        <label className="block text-gray-700 dark:text-white/70 text-sm mb-2">
                          <DeviceMobile size={14} className="inline mr-1" />
                          Mobile Money Phone Number
                        </label>
                        <input
                          type="tel"
                          value={paymentPhone}
                          onChange={(e) => {
                            setPaymentPhone(e.target.value);
                            if (errors.paymentPhone) setErrors((prev) => ({ ...prev, paymentPhone: '' }));
                          }}
                          placeholder="+263771234567"
                          className={`w-full bg-taqon-cream dark:bg-white/5 border rounded-xl px-4 py-3.5 text-taqon-charcoal dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-taqon-orange/50 focus:ring-1 focus:ring-taqon-orange/50 transition-all ${
                            errors.paymentPhone ? 'border-red-500/50' : 'border-warm-300 dark:border-white/10'
                          }`}
                        />
                        {errors.paymentPhone && (
                          <p className="text-red-400 text-xs mt-1.5">{errors.paymentPhone}</p>
                        )}
                        <p className="text-gray-400 dark:text-white/30 text-xs mt-1">Enter your mobile money number in international format</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Step 3: Review */}
                {currentStep === 2 && (
                  <motion.div
                    key="review"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Order items */}
                    <div className="bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
                      <h2 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white mb-5 flex items-center gap-2">
                        <Package size={22} className="text-taqon-orange" />
                        Order Items ({items.length})
                      </h2>

                      <div className="space-y-4">
                        {items.map((item) => {
                          const product = item.product || {};
                          const unitPrice = parseFloat(item.price || product.price || 0);
                          const lineTotal = parseFloat(item.total || unitPrice * item.quantity);

                          return (
                            <div
                              key={item.id}
                              className="flex items-center gap-4 py-3 border-b border-warm-100 dark:border-white/5 last:border-0"
                            >
                              <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-white/5 flex-shrink-0">
                                <img
                                  src={product.primary_image?.image_url || product.primary_image?.image || ''}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-taqon-charcoal dark:text-white text-sm font-medium line-clamp-1">
                                  {product.name}
                                </p>
                                <p className="text-gray-400 dark:text-white/40 text-xs mt-0.5">
                                  Qty: {item.quantity} x ${unitPrice.toFixed(2)}
                                </p>
                              </div>
                              <span className="text-taqon-charcoal dark:text-white font-bold text-sm font-syne flex-shrink-0">
                                ${lineTotal.toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Delivery info summary */}
                    <div className="bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold font-syne text-taqon-charcoal dark:text-white flex items-center gap-2">
                          <Truck size={18} className="text-taqon-orange" />
                          Delivery
                        </h3>
                        <button
                          onClick={() => setCurrentStep(0)}
                          className="text-taqon-orange text-xs font-medium hover:underline"
                        >
                          Edit
                        </button>
                      </div>

                      {deliveryType === 'delivery' ? (
                        <div className="text-sm space-y-1">
                          <p className="text-taqon-charcoal dark:text-white">{address}</p>
                          <p className="text-gray-600 dark:text-white/60">
                            {city}, {province}
                          </p>
                          {deliveryNotes && (
                            <p className="text-gray-400 dark:text-white/40 text-xs mt-2 italic">
                              Note: {deliveryNotes}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-600 dark:text-white/60 text-sm">Store Pickup - Taqon Electrico, Harare</p>
                      )}
                    </div>

                    {/* Payment method summary */}
                    <div className="bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold font-syne text-taqon-charcoal dark:text-white flex items-center gap-2">
                          <CreditCard size={18} className="text-taqon-orange" />
                          Payment
                        </h3>
                        <button
                          onClick={() => setCurrentStep(1)}
                          className="text-taqon-orange text-xs font-medium hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                      <p className="text-gray-600 dark:text-white/60 text-sm">
                        {PAYMENT_METHODS.find((m) => m.key === paymentMethod)?.label || 'Not selected'}
                      </p>
                    </div>

                    {/* Customer notes */}
                    <div className="bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
                      <h3 className="text-lg font-bold font-syne text-taqon-charcoal dark:text-white mb-4 flex items-center gap-2">
                        <Notepad size={18} className="text-taqon-orange" />
                        Order Notes
                        <span className="text-gray-400 dark:text-white/30 text-sm font-normal">(optional)</span>
                      </h3>
                      <textarea
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                        placeholder="Any special requests or notes about your order..."
                        rows={3}
                        className="w-full bg-taqon-cream dark:bg-white/5 border border-warm-300 dark:border-white/10 rounded-xl px-4 py-3.5 text-taqon-charcoal dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-taqon-orange/50 focus:ring-1 focus:ring-taqon-orange/50 transition-all resize-none text-sm"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-8">
                {currentStep > 0 ? (
                  <button
                    onClick={handleBack}
                    className="inline-flex items-center gap-2 text-gray-500 dark:text-white/50 hover:text-taqon-charcoal dark:hover:text-white transition-colors text-sm font-medium"
                  >
                    <CaretLeft size={18} />
                    Back
                  </button>
                ) : (
                  <Link
                    to="/cart"
                    className="inline-flex items-center gap-2 text-gray-500 dark:text-white/50 hover:text-taqon-charcoal dark:hover:text-white transition-colors text-sm font-medium"
                  >
                    <CaretLeft size={18} />
                    Back to Cart
                  </Link>
                )}

                {currentStep < STEPS.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="inline-flex items-center gap-2 bg-taqon-orange text-white px-8 py-3 rounded-xl font-semibold hover:bg-taqon-orange/90 transition-all active:scale-[0.98]"
                  >
                    Continue
                    <CaretRight size={18} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 bg-taqon-orange text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-taqon-orange/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <>
                        <CircleNotch size={18} className="animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      <>
                        <Bag size={18} />
                        Place Order
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-2xl p-6 backdrop-blur-sm sticky top-32">
                <h3 className="text-lg font-bold font-syne text-taqon-charcoal dark:text-white mb-5">Order Summary</h3>

                {/* Items preview */}
                <div className="space-y-3 mb-5 max-h-60 overflow-y-auto pr-1">
                  {items.map((item) => {
                    const product = item.product || {};
                    const lineTotal = parseFloat(item.total || (parseFloat(item.price || product.price || 0) * item.quantity));

                    return (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-white/5 flex-shrink-0">
                          <img
                            src={product.primary_image?.image_url || product.primary_image?.image || ''}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-taqon-charcoal dark:text-white text-xs font-medium line-clamp-1">
                            {product.name}
                          </p>
                          <p className="text-gray-400 dark:text-white/40 text-[10px]">x{item.quantity}</p>
                        </div>
                        <span className="text-taqon-charcoal dark:text-white text-xs font-semibold flex-shrink-0">
                          ${lineTotal.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div className="space-y-3 text-sm border-t border-warm-200 dark:border-white/10 pt-4">
                  <div className="flex justify-between text-gray-600 dark:text-white/60">
                    <span>Subtotal</span>
                    <span className="text-taqon-charcoal dark:text-white font-medium">${subtotal.toFixed(2)}</span>
                  </div>

                  {totalSavings > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Savings</span>
                      <span className="font-medium">-${totalSavings.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-600 dark:text-white/60">
                    <span>Delivery</span>
                    <span className="text-taqon-charcoal dark:text-white font-medium">
                      {deliveryType === 'pickup' ? 'Free' : `$${deliveryFee.toFixed(2)}`}
                    </span>
                  </div>

                  <div className="border-t border-warm-200 dark:border-white/10 pt-3">
                    <div className="flex justify-between">
                      <span className="text-taqon-charcoal dark:text-white font-semibold">Total</span>
                      <span className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trust badges */}
                <div className="mt-5 pt-4 border-t border-warm-200 dark:border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-gray-400 dark:text-white/40 text-xs">
                    <Shield size={14} className="text-taqon-orange flex-shrink-0" />
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 dark:text-white/40 text-xs">
                    <Package size={14} className="text-taqon-orange flex-shrink-0" />
                    <span>Quality guaranteed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
