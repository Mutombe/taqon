from django.urls import path
from . import views, admin_views

app_name = 'shop'

urlpatterns = [
    # Product catalog
    path('products/', views.ProductListView.as_view(), name='product-list'),
    path('products/featured/', views.FeaturedProductsView.as_view(), name='product-featured'),
    path('products/on-sale/', views.OnSaleProductsView.as_view(), name='product-on-sale'),
    path('products/search/', views.ProductSearchView.as_view(), name='product-search'),
    path('products/<slug:slug>/', views.ProductDetailView.as_view(), name='product-detail'),
    path('products/<slug:slug>/reviews/', views.ProductReviewListView.as_view(), name='product-reviews'),
    path('products/<slug:slug>/reviews/create/', views.ProductReviewCreateView.as_view(), name='product-review-create'),

    # Categories & Brands
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    path('categories/<slug:slug>/', views.CategoryDetailView.as_view(), name='category-detail'),
    path('brands/', views.BrandListView.as_view(), name='brand-list'),
    path('brands/<slug:slug>/', views.BrandDetailView.as_view(), name='brand-detail'),

    # Cart
    path('cart/', views.CartView.as_view(), name='cart'),
    path('cart/items/', views.CartAddItemView.as_view(), name='cart-add'),
    path('cart/items/<uuid:pk>/', views.CartUpdateItemView.as_view(), name='cart-update'),
    path('cart/items/<uuid:pk>/remove/', views.CartRemoveItemView.as_view(), name='cart-remove'),
    path('cart/clear/', views.CartClearView.as_view(), name='cart-clear'),
    path('cart/summary/', views.CartSummaryView.as_view(), name='cart-summary'),
    path('cart/merge/', views.CartMergeView.as_view(), name='cart-merge'),

    # Wishlist
    path('wishlist/', views.WishlistListView.as_view(), name='wishlist-list'),
    path('wishlist/add/', views.WishlistAddView.as_view(), name='wishlist-add'),
    path('wishlist/<uuid:product_id>/', views.WishlistRemoveView.as_view(), name='wishlist-remove'),
    path('wishlist/move-to-cart/<uuid:product_id>/', views.WishlistMoveToCartView.as_view(), name='wishlist-move-to-cart'),

    # Orders
    path('orders/checkout/', views.CheckoutView.as_view(), name='checkout'),
    path('orders/', views.OrderListView.as_view(), name='order-list'),
    path('orders/admin/', views.AdminOrderListView.as_view(), name='admin-order-list'),
    path('orders/<str:order_number>/', views.OrderDetailView.as_view(), name='order-detail'),
    path('orders/<str:order_number>/cancel/', views.OrderCancelView.as_view(), name='order-cancel'),
    path('orders/admin/<str:order_number>/status/', views.AdminOrderStatusUpdateView.as_view(), name='admin-order-status'),

    # Admin — Product CRUD
    path('admin/products/', admin_views.AdminProductListView.as_view(), name='admin-product-list'),
    path('admin/products/create/', admin_views.AdminProductCreateView.as_view(), name='admin-product-create'),
    path('admin/products/<slug:slug>/', admin_views.AdminProductUpdateView.as_view(), name='admin-product-detail'),
    path('admin/products/<slug:slug>/delete/', admin_views.AdminProductDeleteView.as_view(), name='admin-product-delete'),
    path('admin/products/<slug:slug>/images/', admin_views.AdminProductImageUploadView.as_view(), name='admin-product-image-upload'),
    path('admin/products/<slug:slug>/images/<uuid:image_id>/delete/', admin_views.AdminProductImageDeleteView.as_view(), name='admin-product-image-delete'),
    path('admin/products/<slug:slug>/images/<uuid:image_id>/set-primary/', admin_views.AdminProductImageSetPrimaryView.as_view(), name='admin-product-image-set-primary'),

    # Admin — Category & Brand CRUD
    path('admin/categories/', admin_views.AdminCategoryListCreateView.as_view(), name='admin-category-list'),
    path('admin/categories/<slug:slug>/', admin_views.AdminCategoryUpdateView.as_view(), name='admin-category-detail'),
    path('admin/brands/', admin_views.AdminBrandListCreateView.as_view(), name='admin-brand-list'),
    path('admin/brands/<slug:slug>/', admin_views.AdminBrandUpdateView.as_view(), name='admin-brand-detail'),

    # Admin — Media Management
    path('admin/media/', admin_views.AdminMediaListView.as_view(), name='admin-media-list'),
    path('admin/media/upload/', admin_views.AdminMediaUploadView.as_view(), name='admin-media-upload'),
    path('admin/media/<uuid:image_id>/delete/', admin_views.AdminMediaDeleteView.as_view(), name='admin-media-delete'),
]
