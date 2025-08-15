import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ChevronLeft, ChevronRight, Quote, Filter, Calendar, MapPin, ThumbsUp, ChevronDown, X, Send, CheckCircle } from 'lucide-react';
import { sendFeedbackEmail } from '../services/emailService';
import { reviewsAPI } from '../services/adminApiService';

interface Review {
  id: number;
  name: string;
  email: string;
  rating: number;
  comment: string;
  trip_reference?: string;
  is_approved: boolean;
  created_at: string;
}

const ReviewsPage = () => {

  const handleWriteReview = () => {
    setShowReviewForm(true);
    setShowReviewForm(true);
  };

  const [currentReview, setCurrentReview] = useState(0);
  const [filterRating, setFilterRating] = useState('all');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    name: '',
    email: '',
    description: '',
    rating: 0,
    category: 'vacation',
    tripReference: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApprovedReviews();
  }, []);

  const loadApprovedReviews = async () => {
    try {
      setLoading(true);
      const data = await reviewsAPI.getApproved();
      setReviews(data);
    } catch (error) {
      console.error('Error loading approved reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const ratings = [
    { id: 'all', label: 'Visi įvertinimai' },
    { id: '5', label: '5 žvaigždutės' },
    { id: '4', label: '4 žvaigždutės' },
    { id: '3', label: '3 žvaigždutės' }
  ];

  // Filter reviews based on rating only since we don't have category in the API response
  const filteredReviews = reviews
    .filter(review => filterRating === 'all' || review.rating.toString() === filterRating);

  const nextReview = () => {
    setCurrentReview((prev) => (prev + 1) % filteredReviews.length);
  };

  const prevReview = () => {
    setCurrentReview((prev) => (prev - 1 + filteredReviews.length) % filteredReviews.length);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={20}
        className={`${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const renderRatingStars = (rating: number, interactive: boolean = false, onRatingChange?: (rating: number) => void) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={interactive ? 32 : 20}
        className={`${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        } ${interactive ? 'cursor-pointer hover:scale-110 transition-transform duration-200' : ''}`}
        onClick={() => interactive && onRatingChange && onRatingChange(index + 1)}
      />
    ));
  };

  const handleRatingChange = (rating: number) => {
    setReviewForm(prev => ({ ...prev, rating }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reviewForm.name.trim() || !reviewForm.email.trim() || !reviewForm.description.trim() || reviewForm.rating === 0) {
      alert('Prašome užpildyti visus laukus ir pasirinkti įvertinimą');
      return;
    }

    if (reviewForm.description.trim().length < 50) {
      alert('Atsiliepimas turi būti bent 50 simbolių ilgio');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Submit review to backend API
      await reviewsAPI.submit({
        name: reviewForm.name,
        email: reviewForm.email,
        rating: reviewForm.rating,
        comment: reviewForm.description,
        tripReference: reviewForm.tripReference || undefined
      });

      // Send email with feedback
      await sendFeedbackEmail({
        name: reviewForm.name,
        email: reviewForm.email,
        description: reviewForm.description,
        rating: reviewForm.rating,
        category: reviewForm.category
      });

      // Reset form and close
      setReviewForm({
        name: '',
        email: '',
        description: '',
        rating: 0,
        category: 'vacation',
        tripReference: ''
      });
      setShowReviewForm(false);
      
      // Show beautiful success notification
      setShowSuccessNotification(true);
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setShowSuccessNotification(false);
      }, 5000);
      
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Atsiprašome, įvyko klaida. Bandykite dar kartą.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormClose = () => {
    setShowReviewForm(false);
    setReviewForm({
      name: '',
      email: '',
      description: '',
      rating: 0,
      category: 'vacation',
      tripReference: ''
    });
  };

  const averageRating = reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  const totalReviews = reviews.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Kraunami atsiliepimai...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      {/* Success Notification */}
      {showSuccessNotification && (
        <div className="fixed top-24 right-4 z-50 animate-slide-in-right">
          <div className="bg-white rounded-2xl shadow-2xl border-l-4 border-green-500 p-6 max-w-sm transform transition-all duration-500 ease-out">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  Ačiū už atsiliepimą!
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Jūsų atsiliepimas buvo sėkmingai išsiųstas ir bus peržiūrėtas. Jis padės kitiems keliautojams pasirinkti tinkamą kelionę.
                </p>
              </div>
              <button
                onClick={() => setShowSuccessNotification(false)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Progress bar */}
            <div className="mt-4 w-full bg-gray-200 rounded-full h-1">
              <div className="bg-green-500 h-1 rounded-full animate-progress-bar"></div>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showSuccessNotification && (
        <div className="fixed top-24 right-4 z-50 animate-slide-in-right">
          <div className="bg-white rounded-2xl shadow-2xl border-l-4 border-green-500 p-6 max-w-sm transform transition-all duration-500 ease-out">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  Ačiū už atsiliepimą!
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Jūsų atsiliepimas buvo sėkmingai išsiųstas ir bus peržiūrėtas. Jis padės kitiems keliautojams pasirinkti tinkamą kelionę.
                </p>
              </div>
              <button
                onClick={() => setShowSuccessNotification(false)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Progress bar */}
            <div className="mt-4 w-full bg-gray-200 rounded-full h-1">
              <div className="bg-green-500 h-1 rounded-full animate-progress-bar"></div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Quote className="text-teal-500" size={32} />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
              Klientų <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-teal-600">atsiliepimai</span>
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Sužinokite, ką sako mūsų klientai apie keliones su Koradius Travel
          </p>
        </div>

        {/* Review Form Modal */}
        {showReviewForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-3 rounded-full">
                    <Quote className="text-white" size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Rašyti atsiliepimą</h2>
                </div>
                <button
                  onClick={handleFormClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
                {/* Name Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Jūsų vardas *
                  </label>
                  <input
                    type="text"
                    value={reviewForm.name}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                    placeholder="Įveskite savo vardą"
                    required
                  />
                </div>

                {/* Email Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    El. paštas *
                  </label>
                  <input
                    type="email"
                    value={reviewForm.email}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                    placeholder="Įveskite savo el. paštą"
                    required
                  />
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Kelionės tipas *
                  </label>
                  <select
                    value={reviewForm.category}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                    required
                  >
                    <option value="vacation">Poilsinės kelionės</option>
                    <option value="weekend">Savaitgalio kelionės</option>
                    <option value="medical">Medicininis turizmas</option>
                    <option value="nature">Gamtos kelionės</option>
                  </select>
                </div>

                {/* Trip Reference Input (optional) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Kelionės numeris (nebūtina)
                  </label>
                  <input
                    type="text"
                    value={reviewForm.tripReference}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, tripReference: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                    placeholder="Pvz.: KT2024-001"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Kelionės numeris padės mums geriau suprasti jūsų patirtį
                  </p>
                </div>

                {/* Rating Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Įvertinimas *
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="flex space-x-2">
                      {renderRatingStars(reviewForm.rating, true, handleRatingChange)}
                    </div>
                    <span className="text-lg font-semibold text-gray-600">
                      {reviewForm.rating > 0 ? `${reviewForm.rating}/5` : 'Pasirinkite įvertinimą'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Kiek žvaigždžių suteiktumėte mūsų paslaugoms?
                  </p>
                </div>

                {/* Description Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Jūsų atsiliepimas *
                  </label>
                  <textarea
                    value={reviewForm.description}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="Pasidalinkite savo patirtimi, kaip praėjo kelionė, kas patiko, kas galėtų būti geriau..."
                    required
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-gray-500">
                      Minimalus ilgis: 50 simbolių
                    </p>
                    <p className={`text-sm font-medium ${
                      reviewForm.description.length >= 50 ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {reviewForm.description.length}/50 simbolių
                    </p>
                  </div>
                </div>

                {/* Auto-generated Date Info */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar size={16} />
                    <span className="text-sm">
                      Atsiliepimo data bus automatiškai nustatyta: {new Date().toLocaleDateString('lt-LT')}
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={handleFormClose}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                  >
                    Atšaukti
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center space-x-2"
                  >
                    <Send size={20} />
                    <span>{isSubmitting ? 'Siunčiama...' : 'Siųsti atsiliepimą'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Overall Stats */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-teal-600 mb-2">{averageRating.toFixed(1)}</div>
              <div className="flex justify-center mb-2">
                {renderStars(Math.round(averageRating))}
              </div>
              <div className="text-gray-600">Vidutinis įvertinimas</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-teal-600 mb-2">{totalReviews}</div>
              <div className="text-gray-600">Atsiliepimų</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-teal-600 mb-2">98%</div>
              <div className="text-gray-600">Rekomenduoja draugams</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-teal-600 mb-2">85%</div>
              <div className="text-gray-600">Grįžta pakartotinai</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Įvertinimas</label>
              <div className="flex flex-wrap gap-2">
                {ratings.map((rating) => (
                  <button
                    key={rating.id}
                    onClick={() => setFilterRating(rating.id)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                      filterRating === rating.id
                        ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-teal-50 hover:text-teal-600'
                    }`}
                  >
                    {rating.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Featured Review Carousel */}
        {filteredReviews.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">Išskirtiniai atsiliepimai</h2>
            
            <div className="relative max-w-4xl mx-auto">
              <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-yellow-100 to-yellow-200 rounded-full translate-y-12 -translate-x-12 opacity-50"></div>

                <div className="relative z-10">
                  {/* Quote Icon */}
                  <div className="flex justify-center mb-6">
                    <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-4 rounded-full">
                      <Quote className="text-white" size={32} />
                    </div>
                  </div>

                  {/* Review Text */}
                  <blockquote className="text-lg md:text-xl text-gray-700 leading-relaxed text-center mb-8 italic">
                    "{filteredReviews[currentReview]?.comment}"
                  </blockquote>

                  {/* Rating */}
                  <div className="flex justify-center mb-6">
                    <div className="flex space-x-1">
                      {renderStars(filteredReviews[currentReview]?.rating || 5)}
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="flex items-center justify-center space-x-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center text-teal-600 font-bold text-xl">
                      {filteredReviews[currentReview]?.name?.charAt(0)}
                    </div>
                    <div className="text-center">
                      <h4 className="font-bold text-gray-800 text-lg">
                        {filteredReviews[currentReview]?.name}
                      </h4>
                      <p className="text-gray-600">{filteredReviews[currentReview]?.email}</p>
                      {filteredReviews[currentReview]?.trip_reference && (
                        <p className="text-sm text-teal-600 font-semibold mt-1">
                          {filteredReviews[currentReview]?.trip_reference}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(filteredReviews[currentReview]?.created_at || '').toLocaleDateString('lt-LT')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Arrows */}
              {filteredReviews.length > 1 && (
                <>
                  <button
                    onClick={prevReview}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white hover:bg-teal-50 text-teal-600 p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 z-20"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  
                  <button
                    onClick={nextReview}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white hover:bg-teal-50 text-teal-600 p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 z-20"
                  >
                    <ChevronRight size={24} />
                  </button>

                  {/* Dots Indicator */}
                  <div className="flex justify-center space-x-2 mt-8">
                    {filteredReviews.map((_, index) => (
                      <button
                        key={`dot-${index}`}
                        onClick={() => setCurrentReview(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          index === currentReview
                            ? 'bg-teal-500 w-8'
                            : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* All Reviews Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">
            Visi atsiliepimai ({filteredReviews.length})
          </h2>
          
          {filteredReviews.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Quote className="text-gray-400" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Atsiliepimų nėra</h3>
              <p className="text-gray-500">
                {filterRating !== 'all' 
                  ? 'Nėra atsiliepimų atitinkančių pasirinktą reitingą' 
                  : 'Kol kas nėra patvirtintų atsiliepimų'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  {/* Header */}
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center text-teal-600 font-bold">
                      {review.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800">{review.name}</h4>
                      <div className="text-sm text-gray-600">
                        {review.email}
                      </div>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="flex space-x-1">
                      {renderStars(review.rating)}
                    </div>
                    <span className="text-sm text-gray-600">
                      {review.rating}/5
                    </span>
                  </div>

                  {/* Trip Info */}
                  {review.trip_reference && (
                    <div className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-sm font-medium mb-4 inline-block">
                      {review.trip_reference}
                    </div>
                  )}

                  {/* Review Text */}
                  <p className="text-gray-700 leading-relaxed mb-4 line-clamp-4">
                    {review.comment}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-1">
                      <Calendar size={14} />
                      <span>{new Date(review.created_at).toLocaleDateString('lt-LT')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Write Review CTA */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-3xl p-12 text-white text-center">
          <Quote size={64} className="mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl font-bold mb-4">Pasidalinkite savo patirtimi</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Jūsų atsiliepimas padės kitiems keliautojams pasirinkti tinkamą kelionę
          </p>
          <button 
            onClick={handleWriteReview}
            className="bg-white hover:bg-gray-100 text-teal-600 font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg btn-hover-smooth"
          >
            Rašyti atsiliepimą
          </button>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-2xl shadow-lg">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="text-green-600" size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Patikimi atsiliepimai</h3>
            <p className="text-gray-600">Visi atsiliepimai yra tikrinti ir patvirtinti</p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-2xl shadow-lg">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Quote className="text-blue-600" size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Tikri klientai</h3>
            <p className="text-gray-600">Tik tikrų klientų nuomonės ir patirtys</p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-2xl shadow-lg">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ThumbsUp className="text-purple-600" size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Aukštas įvertinimas</h3>
            <p className="text-gray-600">98% klientų rekomenduoja mūsų paslaugas</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewsPage;