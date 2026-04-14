import React from 'react';

export default function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function localBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Taqon Electrico',
    description: "Zimbabwe's premier solar and electrical engineering company. Expert solar installations, electrical maintenance, and renewable energy solutions.",
    url: 'https://www.taqon.co.zw',
    telephone: '+263 77 277 1036',
    email: 'info@taqon.co.zw',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '203 Sherwood Drive, Strathaven',
      addressLocality: 'Harare',
      addressCountry: 'ZW',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -17.82,
      longitude: 31.05,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '16:30',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '08:00',
        closes: '13:00',
      },
    ],
    priceRange: '$$',
    image: 'https://www.taqon.co.zw/fav.png',
    sameAs: [],
  };
}

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Taqon Electrico',
    url: 'https://www.taqon.co.zw',
    logo: 'https://www.taqon.co.zw/fav.png',
    description: "Zimbabwe's premier solar and electrical engineering company.",
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+263 77 277 1036',
      contactType: 'customer service',
      availableLanguage: ['English', 'Shona', 'Ndebele'],
    },
  };
}

export function productSchema(product) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    brand: { '@type': 'Brand', name: product.brand },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    ...(product.warranty && { warranty: product.warranty }),
  };
}

export function faqSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function articleSchema(post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.image,
    datePublished: post.date,
    author: {
      '@type': 'Person',
      name: post.author?.name || 'Taqon Electrico',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Taqon Electrico',
      logo: { '@type': 'ImageObject', url: 'https://www.taqon.co.zw/fav.png' },
    },
  };
}

export function breadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
