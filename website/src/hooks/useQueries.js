/**
 * React Query hooks for all API data fetching.
 *
 * WHY: Replaces raw useEffect+useState patterns with proper cache-aware fetching.
 * Every hook shares a single QueryClient cache, so navigating between pages that
 * use the same data (e.g. categories in Shop and Navbar) is instant — zero spinners.
 *
 * staleTime controls how long data is considered fresh (no refetch).
 * gcTime (formerly cacheTime) controls how long unused data stays in memory.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shopApi } from '../api/shop';
import { solarConfigApi } from '../api/solarConfig';
import { coursesApi } from '../api/courses';
import { supportApi } from '../api/support';
import { notificationsApi } from '../api/notifications';
import { technicianApi } from '../api/technician';
import { quotationsApi } from '../api/quotations';
import { paymentsApi } from '../api/payments';
import { authApi } from '../api/auth';
import { adminApi } from '../api/admin';

// ─── Cache time presets (ms) ───────────────────────────────────────────
const STATIC = { staleTime: 30 * 60_000, gcTime: 60 * 60_000 };   // 30min stale, 1hr gc — rarely changes
const SEMI = { staleTime: 5 * 60_000, gcTime: 30 * 60_000 };      // 5min stale — changes occasionally
const DYNAMIC = { staleTime: 60_000, gcTime: 10 * 60_000 };       // 1min stale — changes frequently
const REALTIME = { staleTime: 10_000, gcTime: 5 * 60_000 };       // 10s stale — needs near-realtime

// ─── Shop ──────────────────────────────────────────────────────────────

export function useProducts(params) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => shopApi.getProducts(params).then(r => r.data),
    ...SEMI,
    placeholderData: (prev) => prev, // keep previous data while refetching (no flicker)
  });
}

export function useProduct(slug) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => shopApi.getProduct(slug).then(r => r.data),
    ...SEMI,
    enabled: !!slug,
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => shopApi.getFeatured().then(r => r.data),
    ...SEMI,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => shopApi.getCategories().then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : d?.results || [];
    }),
    ...STATIC, // categories almost never change
  });
}

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: () => shopApi.getBrands().then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : d?.results || [];
    }),
    ...STATIC,
  });
}

export function useProductReviews(slug, params) {
  return useQuery({
    queryKey: ['productReviews', slug, params],
    queryFn: () => shopApi.getProductReviews(slug, params).then(r => r.data),
    ...DYNAMIC,
    enabled: !!slug,
  });
}

export function useCart() {
  return useQuery({
    queryKey: ['cart'],
    queryFn: () => shopApi.getCart().then(r => r.data),
    ...REALTIME,
  });
}

export function useWishlist() {
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: () => shopApi.getWishlist().then(r => r.data),
    ...DYNAMIC,
  });
}

export function useOrders(params) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => shopApi.getOrders(params).then(r => r.data),
    ...DYNAMIC,
  });
}

export function useOrder(orderNumber) {
  return useQuery({
    queryKey: ['order', orderNumber],
    queryFn: () => shopApi.getOrder(orderNumber).then(r => r.data),
    ...DYNAMIC,
    enabled: !!orderNumber,
  });
}

// ─── Solar Config ──────────────────────────────────────────────────────

export function usePackages(params) {
  return useQuery({
    queryKey: ['packages', params],
    queryFn: () => solarConfigApi.getPackages(params).then(r => r.data),
    ...SEMI,
  });
}

export function usePackageDetail(slug) {
  return useQuery({
    queryKey: ['package', slug],
    queryFn: () => solarConfigApi.getPackageDetail(slug).then(r => r.data),
    ...SEMI,
    enabled: !!slug,
  });
}

export function usePackagePrice(slug, params) {
  return useQuery({
    queryKey: ['packagePrice', slug, params],
    queryFn: () => solarConfigApi.getPackagePrice(slug, params).then(r => r.data),
    ...SEMI,
    enabled: !!slug,
  });
}

export function useFamilies() {
  return useQuery({
    queryKey: ['families'],
    queryFn: () => solarConfigApi.getFamilies().then(r => r.data),
    ...STATIC,
  });
}

export function useFamilyDetail(slug) {
  return useQuery({
    queryKey: ['family', slug],
    queryFn: () => solarConfigApi.getFamilyDetail(slug).then(r => r.data),
    ...SEMI,
    enabled: !!slug,
  });
}

export function useComponents(params) {
  return useQuery({
    queryKey: ['components', params],
    queryFn: () => solarConfigApi.getComponents(params).then(r => r.data),
    ...SEMI,
  });
}

export function useAppliances(params) {
  return useQuery({
    queryKey: ['appliances', params],
    queryFn: () => solarConfigApi.getAppliances(params).then(r => r.data),
    ...STATIC,
  });
}

// ─── Courses ───────────────────────────────────────────────────────────

export function useCourses(params) {
  return useQuery({
    queryKey: ['courses', params],
    queryFn: () => coursesApi.getCourses(params).then(r => r.data),
    ...SEMI,
  });
}

export function useCourse(slug) {
  return useQuery({
    queryKey: ['course', slug],
    queryFn: () => coursesApi.getCourse(slug).then(r => r.data),
    ...SEMI,
    enabled: !!slug,
  });
}

export function useCourseCategories() {
  return useQuery({
    queryKey: ['courseCategories'],
    queryFn: () => coursesApi.getCategories().then(r => r.data),
    ...STATIC,
  });
}

export function useMyEnrollments(params) {
  return useQuery({
    queryKey: ['myEnrollments', params],
    queryFn: () => coursesApi.getMyEnrollments(params).then(r => r.data),
    ...DYNAMIC,
  });
}

// ─── Support ───────────────────────────────────────────────────────────

export function useFAQs(params) {
  return useQuery({
    queryKey: ['faqs', params],
    queryFn: () => supportApi.getFAQs(params).then(r => r.data),
    ...STATIC,
  });
}

export function useFAQCategories() {
  return useQuery({
    queryKey: ['faqCategories'],
    queryFn: () => supportApi.getFAQCategories().then(r => r.data),
    ...STATIC,
  });
}

export function useMyTickets(params) {
  return useQuery({
    queryKey: ['myTickets', params],
    queryFn: () => supportApi.getMyTickets(params).then(r => r.data),
    ...DYNAMIC,
  });
}

export function useTicket(ticketNumber) {
  return useQuery({
    queryKey: ['ticket', ticketNumber],
    queryFn: () => supportApi.getTicket(ticketNumber).then(r => r.data),
    ...DYNAMIC,
    enabled: !!ticketNumber,
  });
}

// ─── Notifications ─────────────────────────────────────────────────────

export function useNotifications(params) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationsApi.getNotifications(params).then(r => r.data),
    ...REALTIME,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['unreadCount'],
    queryFn: () => notificationsApi.getUnreadCount().then(r => r.data),
    ...REALTIME,
    refetchInterval: 30_000, // poll every 30s
  });
}

// ─── Technician ────────────────────────────────────────────────────────

export function useTechDashboard() {
  return useQuery({
    queryKey: ['techDashboard'],
    queryFn: () => technicianApi.getDashboard().then(r => r.data),
    ...DYNAMIC,
  });
}

export function useTechJobs(params) {
  return useQuery({
    queryKey: ['techJobs', params],
    queryFn: () => technicianApi.getJobs(params).then(r => r.data),
    ...DYNAMIC,
  });
}

export function useTechJob(jobNumber) {
  return useQuery({
    queryKey: ['techJob', jobNumber],
    queryFn: () => technicianApi.getJob(jobNumber).then(r => r.data),
    ...DYNAMIC,
    enabled: !!jobNumber,
  });
}

export function useTechSchedule(params) {
  return useQuery({
    queryKey: ['techSchedule', params],
    queryFn: () => technicianApi.getSchedule(params).then(r => r.data),
    ...DYNAMIC,
  });
}

// ─── Quotations ────────────────────────────────────────────────────────

export function useMyQuotations(params) {
  return useQuery({
    queryKey: ['myQuotations', params],
    queryFn: () => quotationsApi.getMyQuotations(params).then(r => r.data),
    ...DYNAMIC,
  });
}

export function useQuotation(number) {
  return useQuery({
    queryKey: ['quotation', number],
    queryFn: () => quotationsApi.getQuotation(number).then(r => r.data),
    ...DYNAMIC,
    enabled: !!number,
  });
}

export function useMyInvoices(params) {
  return useQuery({
    queryKey: ['myInvoices', params],
    queryFn: () => quotationsApi.getMyInvoices(params).then(r => r.data),
    ...DYNAMIC,
  });
}

export function useInvoice(number) {
  return useQuery({
    queryKey: ['invoice', number],
    queryFn: () => quotationsApi.getInvoice(number).then(r => r.data),
    ...DYNAMIC,
    enabled: !!number,
  });
}

// ─── Auth ──────────────────────────────────────────────────────────────

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.getProfile().then(r => r.data),
    ...DYNAMIC,
  });
}

export function useAccountSummary() {
  return useQuery({
    queryKey: ['accountSummary'],
    queryFn: () => authApi.getSummary().then(r => r.data),
    ...DYNAMIC,
  });
}

export function useAddresses() {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: () => authApi.getAddresses().then(r => r.data),
    ...DYNAMIC,
  });
}

// ─── Admin ─────────────────────────────────────────────────────────────

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['adminDashboard'],
    queryFn: () => adminApi.getDashboard().then(r => r.data),
    ...DYNAMIC,
  });
}

export function useAdminRecentActivity(params) {
  return useQuery({
    queryKey: ['adminActivity', params],
    queryFn: () => adminApi.getRecentActivity(params).then(r => r.data),
    ...DYNAMIC,
  });
}

export function useAdminRevenue(params) {
  return useQuery({
    queryKey: ['adminRevenue', params],
    queryFn: () => adminApi.getRevenue(params).then(r => r.data),
    ...DYNAMIC,
  });
}

export function useAdminUsers(params) {
  return useQuery({
    queryKey: ['adminUsers', params],
    queryFn: () => adminApi.getUsers(params).then(r => r.data),
    ...DYNAMIC,
    placeholderData: (prev) => prev,
  });
}

export function useAdminOrderAnalytics(params) {
  return useQuery({
    queryKey: ['adminOrderAnalytics', params],
    queryFn: () => adminApi.getOrderAnalytics(params).then(r => r.data),
    ...DYNAMIC,
  });
}

export function useAdminProducts(params) {
  return useQuery({
    queryKey: ['adminProducts', params],
    queryFn: () => adminApi.getAdminProducts(params).then(r => r.data),
    ...DYNAMIC,
    placeholderData: (prev) => prev,
  });
}

export function useAdminBlogPosts(params) {
  return useQuery({
    queryKey: ['adminBlogPosts', params],
    queryFn: () => adminApi.getAdminBlogPosts(params).then(r => r.data),
    ...DYNAMIC,
    placeholderData: (prev) => prev,
  });
}

export function useAdminBlogPost(slug) {
  return useQuery({
    queryKey: ['adminBlogPost', slug],
    queryFn: () => adminApi.getBlogPost(slug).then(r => r.data),
    ...SEMI,
    enabled: !!slug,
  });
}

export function useAdminBlogCategories() {
  return useQuery({
    queryKey: ['adminBlogCategories'],
    queryFn: () => adminApi.getBlogCategories().then(r => r.data),
    ...STATIC,
  });
}

export function useAdminPackages() {
  return useQuery({
    queryKey: ['adminPackages'],
    queryFn: () => adminApi.getAdminPackages().then(r => r.data),
    ...SEMI,
  });
}

export function useAdminMedia(params) {
  return useQuery({
    queryKey: ['adminMedia', params],
    queryFn: () => adminApi.getMedia(params).then(r => r.data),
    ...DYNAMIC,
    placeholderData: (prev) => prev,
  });
}

export function useAdminUserAnalytics(params) {
  return useQuery({
    queryKey: ['adminUserAnalytics', params],
    queryFn: () => adminApi.getUserAnalytics(params).then(r => r.data),
    ...DYNAMIC,
  });
}

export function useAdminSupportAnalytics(params) {
  return useQuery({
    queryKey: ['adminSupportAnalytics', params],
    queryFn: () => adminApi.getSupportAnalytics(params).then(r => r.data),
    ...DYNAMIC,
  });
}

// ─── Prefetch helpers ──────────────────────────────────────────────────
// Call these on hover/focus to warm the cache before navigation.

export function usePrefetch() {
  const queryClient = useQueryClient();

  return {
    prefetchProduct: (slug) => {
      if (!slug) return;
      queryClient.prefetchQuery({
        queryKey: ['product', slug],
        queryFn: () => shopApi.getProduct(slug).then(r => r.data),
        ...SEMI,
      });
    },

    prefetchPackage: (slug) => {
      if (!slug) return;
      queryClient.prefetchQuery({
        queryKey: ['package', slug],
        queryFn: () => solarConfigApi.getPackageDetail(slug).then(r => r.data),
        ...SEMI,
      });
    },

    prefetchCourse: (slug) => {
      if (!slug) return;
      queryClient.prefetchQuery({
        queryKey: ['course', slug],
        queryFn: () => coursesApi.getCourse(slug).then(r => r.data),
        ...SEMI,
      });
    },

    prefetchCategories: () => {
      queryClient.prefetchQuery({
        queryKey: ['categories'],
        queryFn: () => shopApi.getCategories().then(r => {
          const d = r.data;
          return Array.isArray(d) ? d : d?.results || [];
        }),
        ...STATIC,
      });
    },

    prefetchFamilies: () => {
      queryClient.prefetchQuery({
        queryKey: ['families'],
        queryFn: () => solarConfigApi.getFamilies().then(r => r.data),
        ...STATIC,
      });
    },

    prefetchProducts: (params) => {
      queryClient.prefetchQuery({
        queryKey: ['products', params],
        queryFn: () => shopApi.getProducts(params).then(r => r.data),
        ...SEMI,
      });
    },
  };
}
