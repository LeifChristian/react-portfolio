// src/components/Portfolio.tsx
import React, {useEffect} from 'react';
import PortfolioCard from './PortfolioCard';
import { portfolioData } from './portfolioData';

const Portfolio = () => {

  useEffect(()=> {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [])

  return (
    <div className="container mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {portfolioData.map((project, idx) => (
        <PortfolioCard key={idx} {...project}/>
      ))}
    </div>
  );
};

export default Portfolio;
