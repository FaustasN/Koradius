import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, MapPin, Camera, Heart, Share2, Download } from 'lucide-react';
import { galleryApi, transformGalleryItem } from '../services/apiService';
import { useLanguage } from '../hooks/useLanguage';

const GalleryPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Database state
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Like state
  const [likedImages, setLikedImages] = useState<Set<number>>(new Set());
  const [likeLoading, setLikeLoading] = useState<number | null>(null);

  // Load gallery images from database
  useEffect(() => {
    const loadImages = async () => {
      try {
        setLoading(true);
        setError(null);
        const galleryItems = await galleryApi.getAll();
        const transformedImages = galleryItems.map(transformGalleryItem);
        setImages(transformedImages);
      } catch (err) {
        console.error('Error loading gallery images:', err);
        setError('Failed to load gallery images. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, []);

  // Load liked images from localStorage
  useEffect(() => {
    const savedLikes = localStorage.getItem('galleryLikes');
    if (savedLikes) {
      try {
        const likedIds = JSON.parse(savedLikes);
        setLikedImages(new Set(likedIds));
      } catch (error) {
        console.error('Error parsing saved likes:', error);
      }
    }
  }, []);

  // Save liked images to localStorage when they change
  useEffect(() => {
    localStorage.setItem('galleryLikes', JSON.stringify(Array.from(likedImages)));
  }, [likedImages]);

  const handleUploadPhotos = () => {
    navigate('/contact?subject=Įkelti nuotraukas');
  };

  const handleLearnMore = () => {
    navigate('/about');
  };

  const handleParticipateContest = () => {
    navigate('/contact?subject=Dalyvauti konkurse');
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      return date.toLocaleDateString('lt-LT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return '';
    }
  };

  // Handle like/unlike functionality
  const handleLike = async (imageId: number) => {
    if (likeLoading === imageId) return; // Prevent multiple clicks
    
    try {
      setLikeLoading(imageId);
      const isLiked = likedImages.has(imageId);
      const action = isLiked ? 'unlike' : 'like';
      
      const result = await galleryApi.like(imageId, action);
      
      // Update local state
      setImages(prevImages => 
        prevImages.map(img => 
          img.id === imageId ? { ...img, likes: result.likes } : img
        )
      );
      
      // Update liked state
      if (isLiked) {
        setLikedImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(imageId);
          return newSet;
        });
      } else {
        setLikedImages(prev => new Set(prev).add(imageId));
      }
    } catch (error) {
      console.error('Error updating likes:', error);
      // You could add a toast notification here
    } finally {
      setLikeLoading(null);
    }
  };

  // Fallback images data in case the API is not available  
  const filters = [
    { id: 'all', label: t('gallery.filters.all'), icon: Camera, count: images.length },
    { id: 'beach', label: t('gallery.filters.beach'), icon: Camera, count: images.filter(img => img.category === 'beach').length },
    { id: 'city', label: t('gallery.filters.city'), icon: Camera, count: images.filter(img => img.category === 'city').length },
    { id: 'nature', label: t('gallery.filters.nature'), icon: Camera, count: images.filter(img => img.category === 'nature').length }
  ];

  const filteredImages = activeFilter === 'all' 
    ? images 
    : images.filter(img => img.category === activeFilter);

  const openLightbox = (imageId: number) => {
    setSelectedImage(imageId);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'unset';
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (selectedImage === null) return;
    
    const currentIndex = filteredImages.findIndex(img => img.id === selectedImage);
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : filteredImages.length - 1;
    } else {
      newIndex = currentIndex < filteredImages.length - 1 ? currentIndex + 1 : 0;
    }
    
    setSelectedImage(filteredImages[newIndex].id);
  };

  const selectedImageData = selectedImage 
    ? filteredImages.find(img => img.id === selectedImage)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Camera className="text-teal-500" size={32} />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
              {t('gallery.galleryPage.title.firstPart')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-teal-600">{t('gallery.galleryPage.title.secondPart')}</span>
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {t('gallery.galleryPage.subtitle')}
          </p>
        </div>

        {/* Stats */}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-teal-600 mb-2">{images.length}</div>
            <div className="text-gray-600">{t('gallery.galleryPage.stats.photos')}</div>
          </div>
       
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-teal-600 mb-2">
              {images.reduce((sum, img) => sum + img.likes, 0)}
            </div>
            <div className="text-gray-600">{t('gallery.galleryPage.stats.likes')}</div>
          </div>
        
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {filters.map((filter) => {
            const IconComponent = filter.icon;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 ${
                  activeFilter === filter.id
                    ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-teal-50 hover:text-teal-600 shadow-md'
                }`}
              >
                <IconComponent size={18} />
                <span>{filter.label} ({filter.count})</span>
              </button>
            );
          })}
        </div>

        {/* Gallery Grid */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            <span className="ml-4 text-gray-600 text-lg">{t('gallery.galleryPage.loading')}</span>
          </div>
        )}

        {error && (
          <div className="text-center py-16">
            <div className="text-red-600 mb-4 text-lg">{error}</div>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300"
            >
              {t('gallery.galleryPage.retryButton')}
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredImages.map((image, index) => (
            <div
              key={image.id}
              className={`relative group cursor-pointer overflow-hidden rounded-2xl transition-all duration-500 hover:shadow-2xl transform hover:-translate-y-2 ${
                index % 7 === 0 || index % 7 === 3 ? 'md:col-span-2 md:row-span-2' : ''
              }`}
              onClick={() => openLightbox(image.id)}
            >
              <img
                src={image.src}
                alt={image.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                style={{ minHeight: index % 7 === 0 || index % 7 === 3 ? '400px' : '250px' }}
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin size={16} />
                    <span className="text-sm">{image.location}</span>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{image.title}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm opacity-90">Autorius: {image.photographer}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(image.id);
                      }}
                      disabled={likeLoading === image.id}
                      className={`flex items-center space-x-1 p-1 rounded transition-colors duration-300 ${
                        likedImages.has(image.id)
                          ? 'text-red-500 hover:text-red-400'
                          : 'text-red-400 hover:text-red-500'
                      }`}
                    >
                      <Heart 
                        size={16} 
                        className={likeLoading === image.id ? 'animate-pulse' : ''}
                        fill={likedImages.has(image.id) ? 'currentColor' : 'none'}
                      />
                      <span className="text-sm">{image.likes}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          ))}
        </div>
        )}

        {/* Lightbox */}
        {selectedImage && selectedImageData && (
          <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white hover:text-teal-400 transition-colors duration-300 z-10 bg-black/50 rounded-full p-2"
            >
              <X size={32} />
            </button>

            {/* Navigation Buttons */}
            <button
              onClick={() => navigateImage('prev')}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-teal-400 transition-colors duration-300 z-10 bg-black/50 rounded-full p-3"
            >
              <ChevronLeft size={48} />
            </button>
            
            <button
              onClick={() => navigateImage('next')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-teal-400 transition-colors duration-300 z-10 bg-black/50 rounded-full p-3"
            >
              <ChevronRight size={48} />
            </button>

            {/* Image Container */}
            <div className="max-w-6xl max-h-full flex flex-col">
              <img
                src={selectedImageData.src}
                alt={selectedImageData.title}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
              
              {/* Image Info */}
              <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 mt-4 text-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin size={18} className="text-teal-600" />
                      <span className="font-semibold">{selectedImageData.location}</span>
                    </div>
                    <h3 className="text-2xl font-bold">{selectedImageData.title}</h3>
                  </div>
                                     <div className="flex items-center space-x-4">
                     <button 
                       onClick={() => handleLike(selectedImageData.id)}
                       disabled={likeLoading === selectedImageData.id}
                       className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-300 ${
                         likedImages.has(selectedImageData.id)
                           ? 'bg-red-500 text-white hover:bg-red-600'
                           : 'bg-red-50 hover:bg-red-100 text-red-600'
                       }`}
                     >
                       <Heart 
                         size={18} 
                         className={likeLoading === selectedImageData.id ? 'animate-pulse' : ''}
                         fill={likedImages.has(selectedImageData.id) ? 'currentColor' : 'none'}
                       />
                       <span>{selectedImageData.likes}</span>
                     </button>
                   </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Autorius: {selectedImageData.photographer}</span>
                  <span className="ml-1">Data: {formatDate(selectedImageData.date)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="mt-20 bg-gradient-to-r from-teal-500 to-teal-600 rounded-3xl p-12 text-white text-center">
          <Camera size={64} className="mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl font-bold mb-4">{t('gallery.uploadSection.title')}</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            {t('gallery.uploadSection.description')}{' '}
            <a 
              href="mailto:koradiustravel@gmail.com" 
              className="text-black hover:text-gray-800 underline transition-colors duration-200"
            >
              koradiustravel@gmail.com
            </a>{' '}
            {t('gallery.uploadSection.and')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
          </div>
        </div>

        {/* Photo Contest */}
        <div className="mt-16 bg-white rounded-3xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              {t('gallery.photoContest.title.firstPart')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-teal-600">{t('gallery.photoContest.title.secondPart')}</span>
            </h2>
            <p className="text-lg text-gray-600">
              {t('gallery.photoContest.description')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl">
              <div className="text-4xl mb-4">🥇</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{t('gallery.photoContest.firstPlace.title')}</h3>
              <p className="text-gray-600 mb-4">{t('gallery.photoContest.firstPlace.description')}</p>
              <div className="text-2xl font-bold text-yellow-600">{t('gallery.photoContest.firstPlace.value')}</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
              <div className="text-4xl mb-4">🥈</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{t('gallery.photoContest.secondPlace.title')}</h3>
              <p className="text-gray-600 mb-4">{t('gallery.photoContest.secondPlace.description')}</p>
              <div className="text-2xl font-bold text-gray-600">{t('gallery.photoContest.secondPlace.value')}</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl">
              <div className="text-4xl mb-4">🥉</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{t('gallery.photoContest.thirdPlace.title')}</h3>
              <p className="text-gray-600 mb-4">{t('gallery.photoContest.thirdPlace.description')}</p>
              <div className="text-2xl font-bold text-orange-600">{t('gallery.photoContest.thirdPlace.value')}</div>
            </div>
          </div>
          
          <div className="text-center mt-8">
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryPage;