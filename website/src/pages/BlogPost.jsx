import React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, User, Tag, ArrowLeft, ArrowRight,
  ShareNetwork, CaretRight, WarningCircle
} from '@phosphor-icons/react';
import AnimatedSection from '../components/AnimatedSection';
import CommentSection from '../components/CommentSection';
import { confirmExternalNavigation } from '../components/ContentLink';
import SEO from '../components/SEO';
import { blogPosts } from '../data/blogData';

function ShareButtons({ title, url }) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shares = [
    {
      name: 'WhatsApp',
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      color: 'bg-green-500 hover:bg-green-600',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
    },
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: 'bg-blue-600 hover:bg-blue-700',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: 'Twitter',
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      color: 'bg-black hover:bg-gray-800',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex items-center gap-2">
      <ShareNetwork size={16} className="text-taqon-muted" />
      {shares.map((s) => (
        <a
          key={s.name}
          href={s.href}
          onClick={(e) => confirmExternalNavigation(s.href, e)}
          className={`w-8 h-8 rounded-full ${s.color} text-white flex items-center justify-center transition-colors cursor-pointer`}
          title={`Share on ${s.name}`}
        >
          {s.icon}
        </a>
      ))}
    </div>
  );
}

function TableOfContents({ headings, activeId }) {
  if (headings.length === 0) return null;

  return (
    <nav className="bg-white dark:bg-taqon-charcoal rounded-2xl p-5 border border-gray-100 dark:border-white/10 sticky top-24">
      <h4 className="font-bold font-syne text-taqon-charcoal dark:text-white text-sm mb-3">
        Table of Contents
      </h4>
      <ul className="space-y-2">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className={`text-sm block py-1 border-l-2 pl-3 transition-colors ${
                activeId === heading.id
                  ? 'border-taqon-orange text-taqon-orange font-medium'
                  : 'border-gray-200 dark:border-white/10 text-taqon-muted hover:text-taqon-orange hover:border-taqon-orange/50'
              }`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function BlogPost() {
  const { slug } = useParams();
  const [activeHeading, setActiveHeading] = useState('');

  const post = blogPosts.find((p) => p.slug === slug);

  const headings = useMemo(() => {
    if (!post) return [];
    const regex = /<h2[^>]*>(.*?)<\/h2>/gi;
    const matches = [];
    let match;
    while ((match = regex.exec(post.content)) !== null) {
      const text = match[1].replace(/<[^>]*>/g, '');
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      matches.push({ id, text });
    }
    return matches;
  }, [post]);

  const processedContent = useMemo(() => {
    if (!post) return '';
    let html = post.content;
    headings.forEach((h) => {
      const regex = new RegExp(`<h2([^>]*)>${h.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</h2>`, 'i');
      html = html.replace(regex, `<h2 id="${h.id}"$1>${h.text}</h2>`);
    });
    return html;
  }, [post, headings]);

  const relatedPosts = useMemo(() => {
    if (!post) return [];
    return post.relatedPosts
      .map((id) => blogPosts.find((p) => p.id === id))
      .filter(Boolean);
  }, [post]);

  useEffect(() => {
    if (headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-ZW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  // 404 state
  if (!post) {
    return (
      <>
        <SEO title="Article Not Found" description="The article you are looking for could not be found." />
        <section className="min-h-screen flex items-center justify-center bg-taqon-cream dark:bg-taqon-dark">
          <div className="text-center px-4">
            <WarningCircle size={64} className="text-taqon-orange mx-auto mb-6" />
            <h1 className="text-4xl font-bold font-syne text-taqon-charcoal dark:text-white">
              Article Not Found
            </h1>
            <p className="mt-3 text-taqon-muted max-w-md mx-auto">
              The blog post you are looking for does not exist or may have been moved.
            </p>
            <Link
              to="/blog"
              className="mt-6 inline-flex items-center gap-2 bg-taqon-orange text-white px-6 py-3 rounded-full font-semibold hover:bg-taqon-orange/90 transition-colors"
            >
              <ArrowLeft size={16} /> Back to Blog
            </Link>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <SEO
        title={post.title}
        description={post.excerpt}
        keywords={post.tags.join(', ')}
        canonical={`https://www.taqon.co.zw/blog/${post.slug}`}
      />

      {/* Hero Image */}
      <section className="relative min-h-[50vh] lg:min-h-[60vh] flex items-end bg-taqon-dark overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover opacity-40"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-taqon-dark via-taqon-dark/60 to-transparent" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 pb-12 pt-32 w-full">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <Link
              to="/blog"
              className="inline-flex items-center gap-1 text-white/60 hover:text-taqon-orange transition-colors text-sm mb-6"
            >
              <ArrowLeft size={14} /> Back to Blog
            </Link>
            <span className="inline-block px-3 py-1 bg-taqon-orange/20 text-taqon-orange text-xs font-semibold rounded-full mb-4">
              {post.category}
            </span>
            <h1 className="text-3xl lg:text-5xl font-bold font-syne text-white leading-tight">
              {post.title}
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Metadata Bar */}
      <div className="bg-white dark:bg-taqon-charcoal border-b border-gray-100 dark:border-white/10 sticky top-16 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4 text-sm text-taqon-muted">
            <span className="flex items-center gap-1.5">
              <User size={14} />
              <span className="font-medium text-taqon-charcoal dark:text-white">
                {post.author.name}
              </span>
              <span className="hidden sm:inline">- {post.author.role}</span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={14} /> {formatDate(post.date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} /> {post.readTime}
            </span>
          </div>
          <ShareButtons title={post.title} url={currentUrl} />
        </div>
      </div>

      {/* Content */}
      <section className="py-12 lg:py-16 bg-taqon-cream dark:bg-taqon-dark">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-[1fr_280px] gap-8 lg:gap-12">
            {/* Article Content */}
            <AnimatedSection>
              <article
                className="prose prose-lg max-w-none
                  prose-headings:font-syne prose-headings:font-bold prose-headings:text-taqon-charcoal dark:prose-headings:text-white
                  prose-h2:text-2xl prose-h2:lg:text-[1.75rem] prose-h2:mt-12 prose-h2:mb-5 prose-h2:border-l-4 prose-h2:border-taqon-orange prose-h2:pl-4
                  prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                  prose-p:text-taqon-charcoal/80 dark:prose-p:text-white/70 prose-p:leading-[1.8] prose-p:mb-5
                  prose-a:text-taqon-orange prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-taqon-charcoal dark:prose-strong:text-white
                  prose-li:text-taqon-charcoal/80 dark:prose-li:text-white/70
                  prose-blockquote:not-italic
                  prose-figcaption:text-center
                  prose-img:rounded-2xl
                  [&_h2]:scroll-mt-24"
                dangerouslySetInnerHTML={{ __html: processedContent }}
              />

              {/* Tags */}
              <div className="mt-10 pt-8 border-t border-gray-200 dark:border-white/10">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag size={16} className="text-taqon-muted" />
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-100 dark:bg-white/10 text-taqon-muted text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Share (bottom) */}
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-taqon-muted">Share this article:</p>
                <ShareButtons title={post.title} url={currentUrl} />
              </div>
            </AnimatedSection>

            {/* Sidebar: Table of Contents */}
            <aside className="hidden lg:block">
              <TableOfContents headings={headings} activeId={activeHeading} />
            </aside>
          </div>
        </div>
      </section>

      {/* Comments */}
      <CommentSection type="article" slug={post.slug} title={post.title} />

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-16 bg-white dark:bg-taqon-charcoal">
          <div className="max-w-7xl mx-auto px-4">
            <AnimatedSection className="text-center mb-10">
              <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
                Keep Reading
              </span>
              <h2 className="mt-2 text-2xl lg:text-3xl font-bold font-syne text-taqon-charcoal dark:text-white">
                Related Articles
              </h2>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((related, i) => (
                <AnimatedSection key={related.id} delay={i * 0.1}>
                  <Link to={`/blog/${related.slug}`} className="group block h-full">
                    <div className="bg-taqon-cream dark:bg-taqon-dark rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 hover:border-taqon-orange/20 hover:shadow-lg transition-all duration-500 h-full flex flex-col">
                      <div className="aspect-[16/10] overflow-hidden">
                        <img
                          src={related.image}
                          alt={related.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <span className="text-xs text-taqon-orange font-semibold mb-2">
                          {related.category}
                        </span>
                        <h3 className="font-bold font-syne text-taqon-charcoal dark:text-white group-hover:text-taqon-orange transition-colors line-clamp-2 flex-1">
                          {related.title}
                        </h3>
                        <div className="mt-3 flex items-center gap-2 text-taqon-orange text-sm font-medium">
                          Read more
                          <CaretRight
                            size={14}
                            className="group-hover:translate-x-1 transition-transform"
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
