import React from 'react';
import Hero from '../components/Hero';
import FeaturedTours from '../components/FeaturedToursWithPayment';
import WhyChooseUs from '../components/WhyChooseUs';
import QuickStats from '../components/QuickStats';

const HomePage = () => {
  return (
    <div>
      <Hero />
      <FeaturedTours />
      <WhyChooseUs />
      <QuickStats />
    </div>
  );
};

export default HomePage;