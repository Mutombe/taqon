import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { packagesDetailed, getPackageBySlug } from '../data/packagesData';
import PackageDetailTemplate from '../components/PackageDetailTemplate';
import SEO from '../components/SEO';
import { usePackageDetail, usePackagePrice, useFamilyDetail } from '../hooks/useQueries';

export default function PackageDetail() {
  const { slug } = useParams();

  const staticPkg = getPackageBySlug(slug);

  // React Query: package detail and price load in parallel (both only need slug).
  // Family detail depends on family_slug from the package response, so it uses
  // `enabled` to start as soon as that data is available — no manual waterfall.
  const { data: apiPackage, isLoading: pkgLoading } = usePackageDetail(slug);
  const { data: priceBreakdown } = usePackagePrice(slug, { distance_km: 10 });
  const { data: familyData } = useFamilyDetail(apiPackage?.family_slug);

  const siblings = familyData?.packages || [];
  const loading = pkgLoading;

  // Use API package if available, else static
  const hasApi = apiPackage && !loading;

  if (!hasApi && !staticPkg && !loading) {
    return <Navigate to="/packages" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark">
        <div className="bg-taqon-dark pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-24 mb-4" />
            <div className="h-10 bg-white/10 rounded-lg w-72 mb-3" />
            <div className="h-5 bg-white/10 rounded w-48" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-10 animate-pulse">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-48 bg-gray-200 dark:bg-white/10 rounded-2xl" />
              <div className="h-32 bg-gray-200 dark:bg-white/10 rounded-2xl" />
            </div>
            <div className="space-y-4">
              <div className="h-64 bg-gray-200 dark:bg-white/10 rounded-2xl" />
              <div className="h-12 bg-gray-200 dark:bg-white/10 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If we have API data, build an enhanced package object for the template
  if (hasApi) {
    const enhancedPkg = {
      slug: apiPackage.slug,
      name: apiPackage.name,
      kvaRating: `${apiPackage.inverter_kva || ''}kVA`,
      tier: apiPackage.tier,
      capacityPercent: Math.min(100, Math.max(10, parseFloat(apiPackage.inverter_kva || 0) / 25 * 100)),
      price: apiPackage.price > 0 ? `From $${parseFloat(apiPackage.price).toLocaleString()}` : 'Contact for Price',
      description: apiPackage.short_description || apiPackage.description?.substring(0, 200) || '',
      fullDescription: apiPackage.description || '',
      popular: apiPackage.is_popular,
      features: apiPackage.features || [],
      suitable_for: apiPackage.suitable_for || [],
      // Build includes from actual component items
      includes: buildIncludesFromItems(apiPackage.items || []),
      // Use features as appliances placeholder
      appliances: (apiPackage.features || []).slice(0, 8),
      cantPower: [],
      relatedPackages: buildRelatedFromSiblings(siblings, apiPackage.slug),
      // Extended data for price breakdown
      _apiData: apiPackage,
      _priceBreakdown: priceBreakdown,
      _siblings: siblings,
    };

    return (
      <>
        <SEO
          title={`${apiPackage.name} Solar Package`}
          description={enhancedPkg.description}
          keywords={`${apiPackage.name}, ${enhancedPkg.kvaRating} solar system, solar package Zimbabwe, ${apiPackage.tier} solar`}
          canonical={`https://www.taqon.co.zw/packages/${apiPackage.slug}`}
        />
        <PackageDetailTemplate package={enhancedPkg} allPackages={packagesDetailed} />
      </>
    );
  }

  // Static fallback
  return (
    <>
      <SEO
        title={`${staticPkg.name} Solar Package`}
        description={staticPkg.description}
        keywords={`${staticPkg.name}, ${staticPkg.kvaRating} solar system, solar package Zimbabwe, ${staticPkg.tier} solar`}
        canonical={`https://www.taqon.co.zw/packages/${staticPkg.slug}`}
      />
      <PackageDetailTemplate package={staticPkg} allPackages={packagesDetailed} />
    </>
  );
}

function buildIncludesFromItems(items) {
  if (!items || items.length === 0) {
    return [
      { name: 'Solar System', description: 'Complete solar package with all components.', warranty: 'Warranty Included', icon: 'SolarPanel' },
    ];
  }

  // Group items by component category
  const groups = {};
  for (const item of items) {
    const cat = item.component?.category || 'accessory';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }

  // Categories shown with full component details (brand, quantity, each spec visible)
  const DETAIL_CATS = new Set(['inverter', 'battery', 'panel']);

  // Categories rolled up into "Installation & Mounting" bucket
  const INSTALL_CATS = new Set(['mounting', 'cable', 'charger']);

  // Everything else (accessory) is "Accessories" bucket

  const iconMap = {
    panel: 'SolarPanel',
    inverter: 'Lightning',
    battery: 'Battery',
  };

  const labelMap = {
    panel: 'Solar Panels',
    inverter: 'Inverter',
    battery: 'Battery Storage',
  };

  const descMap = {
    installation: 'Mounting rails, rooftop brackets, solar cables, and charge controllers — everything needed to safely install and interconnect your system.',
    accessories: 'Distribution boards, breakers, fuses, isolators, surge protectors, lugs, and finishing materials that complete your installation.',
  };

  const result = [];

  // 1. Detailed cards for inverter / battery / panel
  for (const cat of ['inverter', 'battery', 'panel']) {
    if (!groups[cat]) continue;
    const catItems = groups[cat];
    const names = catItems.map((i) => `${i.component.name} x${i.quantity}`).join(', ');
    const totalValue = catItems.reduce((sum, i) => sum + parseFloat(i.line_total || 0), 0);
    result.push({
      name: labelMap[cat],
      description: names,
      warranty: totalValue > 0 ? `$${totalValue.toLocaleString()}` : 'Included',
      icon: iconMap[cat],
    });
  }

  // 2. Rolled-up "Installation & Mounting" — combines mounting + cable + charger
  const installItems = [];
  for (const cat of INSTALL_CATS) {
    if (groups[cat]) installItems.push(...groups[cat]);
  }
  if (installItems.length > 0) {
    const installTotal = installItems.reduce((sum, i) => sum + parseFloat(i.line_total || 0), 0);
    result.push({
      name: 'Installation & Mounting',
      description: descMap.installation,
      warranty: `$${installTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: 'Wrench',
    });
  }

  // 3. Rolled-up "Accessories"
  if (groups.accessory) {
    const accessoryTotal = groups.accessory.reduce((sum, i) => sum + parseFloat(i.line_total || 0), 0);
    result.push({
      name: 'Accessories',
      description: descMap.accessories,
      warranty: `$${accessoryTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: 'BookOpen',
    });
  }

  return result;
}

function buildRelatedFromSiblings(siblings, currentSlug) {
  if (!siblings || siblings.length < 2) return [null, null];
  const idx = siblings.findIndex((s) => s.slug === currentSlug);
  const prev = idx > 0 ? siblings[idx - 1].slug : null;
  const next = idx < siblings.length - 1 ? siblings[idx + 1].slug : null;
  return [prev, next];
}
