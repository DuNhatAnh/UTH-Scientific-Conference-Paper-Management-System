
import React from 'react';
import { Hero } from './Hero';
import { ProcessSection } from './ProcessSection';
import { ImportantDates } from './ImportantDates';

export const Home: React.FC = () => {
  return (
    <>
      <Hero />
      <ImportantDates />
      <ProcessSection />
    </>
  );
};