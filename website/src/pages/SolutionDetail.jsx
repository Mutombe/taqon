import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import SEO from '../components/SEO';
import SolutionPageTemplate from '../components/SolutionPageTemplate';
import { solutionsData } from '../data/solutionsData';

export default function SolutionDetail() {
  const { slug } = useParams();

  const solution = solutionsData.find((s) => s.slug === slug);

  // Redirect solar-calculator to the calculator page
  if (solution && solution.redirectTo) {
    return <Navigate to={solution.redirectTo} replace />;
  }

  // 404 — redirect to solutions index if slug not found
  if (!solution) {
    return <Navigate to="/solutions" replace />;
  }

  return (
    <>
      <SEO
        title={solution.title}
        description={solution.heroDescription}
        keywords={`${solution.title}, Taqon Electrico, solar Zimbabwe, ${solution.slug.replace(/-/g, ' ')}`}
        canonical={`https://www.taqon.co.zw/solutions/${solution.slug}`}
      />
      <SolutionPageTemplate solution={solution} allSolutions={solutionsData} />
    </>
  );
}
