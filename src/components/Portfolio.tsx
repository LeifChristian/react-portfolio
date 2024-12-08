import React, { useEffect, useRef } from 'react';
import PortfolioCard from './PortfolioCard';
import { portfolioData } from './portfolioData';

const Portfolio = () => {
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll everything to top
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, []);

  return (
    <div 
      ref={mainRef}
      className="container mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4"
    >
      {portfolioData.map((project, idx) => (
        <PortfolioCard key={idx} {...project} />
      ))}
    </div>
  );
};

export default Portfolio;