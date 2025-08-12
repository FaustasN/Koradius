import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, MapPin, Camera, Heart, Share2, Download } from 'lucide-react';
import { galleryApi, transformGalleryItem } from '../services/apiService';

const GalleryPage = () => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Database state
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleUploadPhotos = () => {
    navigate('/contact?subject=Įkelti nuotraukas');
  };

  const handleLearnMore = () => {
    navigate('/about');
  };

  const handleParticipateContest = () => {
    navigate('/contact?subject=Dalyvauti konkurse');
  };

  // Fallback images data in case the API is not available  
  const filters = [
    { id: 'all', label: 'Visos nuotraukos', icon: Camera, count: images.length },
    { id: 'beach', label: 'Paplūdimiai', icon: Camera, count: images.filter(img => img.category === 'beach').length },
    { id: 'city', label: 'Miestai', icon: Camera, count: images.filter(img => img.category === 'city').length },
    { id: 'nature', label: 'Gamta', icon: Camera, count: images.filter(img => img.category === 'nature').length }
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
              Kelionių <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-teal-600">galerija</span>
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Pažiūrėkite, kur jau apsilankė mūsų klientai ir įkvėpkitės savo kitai kelionei
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-teal-600 mb-2">{images.length}</div>
            <div className="text-gray-600">Nuotraukų</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-teal-600 mb-2">15</div>
            <div className="text-gray-600">Šalių</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-teal-600 mb-2">
              {images.reduce((sum, img) => sum + img.likes, 0)}
            </div>
            <div className="text-gray-600">Patinka</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-teal-600 mb-2">50+</div>
            <div className="text-gray-600">Fotografų</div>
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
            <span className="ml-4 text-gray-600 text-lg">Kraunamos nuotraukos...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-16">
            <div className="text-red-600 mb-4 text-lg">{error}</div>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300"
            >
              Bandyti dar kartą
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
                    <div className="flex items-center space-x-1">
                      <Heart size={16} className="text-red-400" />
                      <span className="text-sm">{image.likes}</span>
                    </div>
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
                    <button className="flex items-center space-x-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg transition-colors duration-300">
                      <Heart size={18} />
                      <span>{selectedImageData.likes}</span>
                    </button>
                    <button className="flex items-center space-x-2 bg-teal-50 hover:bg-teal-100 text-teal-600 px-4 py-2 rounded-lg transition-colors duration-300">
                      <Share2 size={18} />
                      <span>Dalintis</span>
                    </button>
                    <button className="flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 text-gray-600 px-4 py-2 rounded-lg transition-colors duration-300">
                      <Download size={18} />
                      <span>Atsisiųsti</span>
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Autorius: {selectedImageData.photographer}</span>
                  <span>Data: {selectedImageData.date}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="mt-20 bg-gradient-to-r from-teal-500 to-teal-600 rounded-3xl p-12 text-white text-center">
          <Camera size={64} className="mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl font-bold mb-4">Pasidalinkite savo kelionių nuotraukomis</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Norite, kad jūsų nuotraukos atsidurtų mūsų galerijoje? Siųskite jas mums į <a href="koradiustravel@gmail.com" className="text-white hover:text-teal-100">koradiustravel@gmail.com</a> ir įkvėpkite kitus keliautojus!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
          </div>
        </div>

        {/* Photo Contest */}
        <div className="mt-16 bg-white rounded-3xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Mėnesio nuotraukų <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-teal-600">konkursas</span>
            </h2>
            <p className="text-lg text-gray-600">
              Kiekvieną mėnesį renkame geriausią kelionės nuotrauką ir apdovanojame autorių!
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl">
              <div className="text-4xl mb-4">🥇</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">1 vieta</h3>
              <p className="text-gray-600 mb-4">Kelionė į pasirinktą šalį</p>
              <div className="text-2xl font-bold text-yellow-600">500€ vertės</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
              <div className="text-4xl mb-4">🥈</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">2 vieta</h3>
              <p className="text-gray-600 mb-4">Savaitgalio kelionė</p>
              <div className="text-2xl font-bold text-gray-600">300€ vertės</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl">
              <div className="text-4xl mb-4">🥉</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">3 vieta</h3>
              <p className="text-gray-600 mb-4">Kelionių kuponas</p>
              <div className="text-2xl font-bold text-orange-600">150€ vertės</div>
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