import React from 'react';
import { ViewState } from '../../App';
import { Hero } from './Hero';
import { ProcessSection } from './ProcessSection';
import { ImportantDates } from './ImportantDates';

interface HomeProps {
  onNavigate?: (view: ViewState) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  // Không cần handle functions trung gian để tránh lỗi scope
  return (
    <>
      <Hero
        onSubmitPaper={() => onNavigate?.('submit-paper')}
        onViewCallForPapers={() => onNavigate?.('call-for-papers')}
      />
      <ImportantDates />
      <ProcessSection />
    </>
  );
};
