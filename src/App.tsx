import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';


import GalleryPage from './pages/GalleryPage';
import ReviewsPage from './pages/ReviewsPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import SearchPage from './pages/SearchPage';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />


        <Route path="gallery" element={<GalleryPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="search" element={<SearchPage />} />
      </Route>
    </Routes>
  );
};

export default App;
