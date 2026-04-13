from django.urls import path
from . import views

app_name = 'solar_config'

urlpatterns = [
    # Appliances (public)
    path('appliances/', views.ApplianceListView.as_view(), name='appliance-list'),
    path('appliances/categories/', views.ApplianceCategoriesView.as_view(), name='appliance-categories'),

    # Package Families (public)
    path('families/', views.PackageFamilyListView.as_view(), name='family-list'),
    path('families/<slug:slug>/', views.PackageFamilyDetailView.as_view(), name='family-detail'),

    # Recommendation Engine (public)
    path('recommend/', views.RecommendView.as_view(), name='recommend'),
    path('instant-quote/', views.InstantQuoteView.as_view(), name='instant-quote'),

    # Package Price Calculator (public)
    path('packages/<slug:slug>/price/', views.PackagePriceView.as_view(), name='package-price'),

    # Components (public)
    path('components/', views.ComponentListView.as_view(), name='component-list'),
    path('components/categories/', views.ComponentCategoriesView.as_view(), name='component-categories'),
    path('components/<slug:slug>/', views.ComponentDetailView.as_view(), name='component-detail'),

    # Package Templates (public)
    path('packages/', views.PackageListView.as_view(), name='package-list'),
    path('packages/<slug:slug>/', views.PackageDetailView.as_view(), name='package-detail'),

    # User Configurations (authenticated)
    path('configurations/', views.ConfigurationListView.as_view(), name='config-list'),
    path('configurations/create/', views.CreateConfigurationView.as_view(), name='config-create'),
    path('configurations/<uuid:pk>/', views.ConfigurationDetailView.as_view(), name='config-detail'),
    path('configurations/<uuid:pk>/update/', views.UpdateConfigurationView.as_view(), name='config-update'),
    path('configurations/<uuid:pk>/delete/', views.DeleteConfigurationView.as_view(), name='config-delete'),
    path('configurations/<uuid:pk>/items/', views.UpdateConfigItemsView.as_view(), name='config-items-replace'),
    path('configurations/<uuid:pk>/items/add/', views.AddConfigItemView.as_view(), name='config-item-add'),
    path('configurations/<uuid:pk>/items/<uuid:item_pk>/', views.UpdateConfigItemQuantityView.as_view(), name='config-item-update'),
    path('configurations/<uuid:pk>/items/<uuid:item_pk>/remove/', views.RemoveConfigItemView.as_view(), name='config-item-remove'),
    path('configurations/<uuid:pk>/duplicate/', views.DuplicateConfigurationView.as_view(), name='config-duplicate'),
    path('configurations/<uuid:pk>/convert-to-quote/', views.ConvertConfigToQuoteView.as_view(), name='config-to-quote'),

    # Admin — Components
    path('admin/components/', views.AdminComponentListView.as_view(), name='admin-component-list'),
    path('admin/components/create/', views.AdminComponentCreateView.as_view(), name='admin-component-create'),
    path('admin/components/<slug:slug>/', views.AdminComponentUpdateView.as_view(), name='admin-component-detail'),
    path('admin/components/<slug:slug>/delete/', views.AdminComponentDeleteView.as_view(), name='admin-component-delete'),

    # Admin — Packages
    path('admin/packages/', views.AdminPackageListView.as_view(), name='admin-package-list'),
    path('admin/packages/create/', views.AdminPackageCreateView.as_view(), name='admin-package-create'),
    path('admin/packages/<slug:slug>/', views.AdminPackageUpdateView.as_view(), name='admin-package-detail'),
    path('admin/packages/<slug:slug>/delete/', views.AdminPackageDeleteView.as_view(), name='admin-package-delete'),
    path('admin/packages/<slug:slug>/items/', views.AdminPackageItemsView.as_view(), name='admin-package-items'),
    path('admin/packages/<slug:slug>/items/<int:item_id>/', views.AdminPackageItemDetailView.as_view(), name='admin-package-item-detail'),
    path('admin/packages/<slug:slug>/recalculate/', views.AdminPackageRecalculateView.as_view(), name='admin-package-recalculate'),

    # Admin — Configurations
    path('admin/configurations/', views.AdminConfigurationListView.as_view(), name='admin-config-list'),

    # Admin — Appliances
    path('admin/appliances/', views.AdminApplianceListView.as_view(), name='admin-appliance-list'),
    path('admin/appliances/create/', views.AdminApplianceCreateView.as_view(), name='admin-appliance-create'),
    path('admin/appliances/<slug:slug>/', views.AdminApplianceUpdateView.as_view(), name='admin-appliance-detail'),
    path('admin/appliances/<slug:slug>/delete/', views.AdminApplianceDeleteView.as_view(), name='admin-appliance-delete'),

    # Admin — Families
    path('admin/families/', views.AdminFamilyListView.as_view(), name='admin-family-list'),
    path('admin/families/create/', views.AdminFamilyCreateView.as_view(), name='admin-family-create'),
    path('admin/families/<slug:slug>/', views.AdminFamilyUpdateView.as_view(), name='admin-family-detail'),
    path('admin/families/<slug:slug>/delete/', views.AdminFamilyDeleteView.as_view(), name='admin-family-delete'),

    # Admin — Tracking
    path('admin/instant-quotes/', views.AdminInstantQuotesView.as_view(), name='admin-instant-quotes'),
    path('admin/advisor-sessions/', views.AdminAdvisorSessionsView.as_view(), name='admin-advisor-sessions'),
]
