import { Link } from 'react-router-dom';
import { ArrowUpRight } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { crossLinks } from '../data/crossLinksData';

/**
 * confirmExternalNavigation — shows a toast confirmation before navigating
 * to an external website. Auto-navigates after 4 seconds if no action taken.
 */
export function confirmExternalNavigation(url, e) {
  if (e) e.preventDefault();

  let domain;
  try {
    domain = new URL(url).hostname.replace('www.', '');
  } catch {
    domain = url;
  }

  let navigated = false;
  const navigate = () => {
    if (navigated) return;
    navigated = true;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  toast('Leaving Taqon Electrico', {
    description: `Taking you to ${domain}`,
    duration: 4000,
    action: {
      label: 'Proceed',
      onClick: navigate,
    },
    cancel: {
      label: 'Cancel',
      onClick: () => {},
    },
    onAutoClose: navigate,
  });
}

/**
 * ContentLink — inline cross-link component for the "solar wikipedia" system.
 *
 * Usage:
 *   <ContentLink to="/solutions/solar-installations">solar installations</ContentLink>
 *   <ContentLink href="https://zera.co.zw" external>ZERA</ContentLink>
 */
export default function ContentLink({ to, href, external, children, className = '' }) {
  // Dotted underline → solid on hover, subtle bg highlight on hover
  const baseClasses = `
    inline-flex items-baseline gap-0.5
    text-taqon-orange dark:text-taqon-amber font-medium
    underline decoration-dotted decoration-taqon-orange/40 decoration-1 underline-offset-[3px]
    hover:decoration-solid hover:decoration-taqon-orange hover:decoration-2
    hover:bg-taqon-orange/[0.06] dark:hover:bg-taqon-amber/10
    rounded-sm px-0.5 -mx-0.5
    transition-all duration-200
    ${className}
  `.trim();

  // External link
  if (href || external) {
    const targetUrl = href || to;
    return (
      <a
        href={targetUrl}
        onClick={(e) => confirmExternalNavigation(targetUrl, e)}
        className={`${baseClasses} cursor-pointer`}
      >
        {children}
        <ArrowUpRight size={12} weight="bold" className="inline-block opacity-50 -ml-0.5 self-center" />
      </a>
    );
  }

  // Internal link
  return (
    <Link to={to} className={baseClasses}>
      {children}
    </Link>
  );
}

/**
 * autoLink — automatically converts known keywords in a text string into
 * ContentLink components. Used in solution pages, package pages, blog, etc.
 *
 * Usage:
 *   <p>{autoLink('We offer solar installations and electrical maintenance.')}</p>
 *
 * Options:
 *   maxLinks: max number of links to create per call (default 5, avoids over-linking)
 *   exclude:  array of keys to skip (e.g. the current page's own keyword)
 */
export function autoLink(text, { maxLinks = 5, exclude = [] } = {}) {
  if (!text || typeof text !== 'string') return text;

  // Build sorted keyword list (longest first to match "solar installations" before "solar")
  const keywords = Object.keys(crossLinks)
    .filter((k) => !exclude.includes(k))
    .sort((a, b) => b.length - a.length);

  // Find all matches with their positions
  const matches = [];
  const lowerText = text.toLowerCase();

  for (const keyword of keywords) {
    if (matches.length >= maxLinks) break;
    const lowerKw = keyword.toLowerCase();
    let searchFrom = 0;

    while (searchFrom < lowerText.length) {
      const idx = lowerText.indexOf(lowerKw, searchFrom);
      if (idx === -1) break;

      // Word boundary check: ensure we're not matching inside another word
      const before = idx > 0 ? lowerText[idx - 1] : ' ';
      const after = idx + lowerKw.length < lowerText.length ? lowerText[idx + lowerKw.length] : ' ';
      const isWordBoundary = /[\s,.:;!?()\-/]/.test(before) && /[\s,.:;!?()\-/]/.test(after);

      if (isWordBoundary) {
        // Check this doesn't overlap an existing match
        const overlaps = matches.some(
          (m) => idx < m.end && idx + lowerKw.length > m.start
        );
        if (!overlaps) {
          matches.push({
            start: idx,
            end: idx + lowerKw.length,
            keyword,
            originalText: text.slice(idx, idx + lowerKw.length),
          });
          break; // Only link first occurrence of each keyword
        }
      }
      searchFrom = idx + 1;
    }
  }

  if (matches.length === 0) return text;

  // Sort matches by position
  matches.sort((a, b) => a.start - b.start);

  // Build result array of text and link elements
  const result = [];
  let lastEnd = 0;

  matches.forEach((match, i) => {
    // Text before this match
    if (match.start > lastEnd) {
      result.push(text.slice(lastEnd, match.start));
    }

    const linkData = crossLinks[match.keyword];
    if (linkData.href) {
      result.push(
        <ContentLink key={i} href={linkData.href} external>
          {match.originalText}
        </ContentLink>
      );
    } else {
      result.push(
        <ContentLink key={i} to={linkData.to}>
          {match.originalText}
        </ContentLink>
      );
    }

    lastEnd = match.end;
  });

  // Remaining text after last match
  if (lastEnd < text.length) {
    result.push(text.slice(lastEnd));
  }

  return result;
}
