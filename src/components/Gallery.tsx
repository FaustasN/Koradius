import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, MapPin, Camera } from 'lucide-react';
import { galleryApi, transformGalleryItem } from '../services/apiService';

const Gallery = () => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Database state
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load gallery images from database
  useEffect(() => {
    const loadGalleryImages = async () => {
      try {
        setLoading(true);
        const galleryItems = await galleryApi.getAll();
        const transformedImages = galleryItems.map(transformGalleryItem);
        // Get first 12 images for homepage gallery
        setImages(transformedImages.slice(0, 12));
      } catch (err) {
        console.error('Error loading gallery images:', err);
      } finally {
        setLoading(false);
      }
    };

    loadGalleryImages();
  }, []);

  const handlePlanTrip = () => {
    navigate('/search');
  };

  // Fallback images data in case the API is not available
  const filters = [
    { id: 'all', label: 'Visos nuotraukos', icon: Camera },
    { id: 'beach', label: 'Paplūdimiai', icon: Camera },
    { id: 'city', label: 'Miestai', icon: Camera },
    { id: 'nature', label: 'Gamta', icon: Camera }
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
    <section id="gallery" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Camera className="text-teal-500" size={32} />
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800">
              Kelionių <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-teal-600">galerija</span>
            </h2>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Pažiūrėkite, kur jau apsilankė mūsų klientai ir įkvėpkitės savo kitai kelionei
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {filters.map((filter) => {
            const IconComponent = filter.icon;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 btn-hover-smooth ${
                  activeFilter === filter.id
                    ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-teal-50 hover:text-teal-600 shadow-md'
                }`}
              >
                <IconComponent size={18} />
                <span>{filter.label}</span>
              </button>
            );
          })}
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            <span className="ml-3 text-gray-600">Kraunamos nuotraukos...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                style={{ minHeight: index % 7 === 0 || index % 7 === 3 ? '400px' : '200px' }}
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin size={16} />
                    <span className="text-sm">{image.location}</span>
                  </div>
                  <h3 className="font-bold text-lg">{image.title}</h3>
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
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white hover:text-teal-400 transition-colors duration-300 z-10 btn-hover-smooth"
            >
              <X size={32} />
            </button>

            {/* Navigation Buttons */}
            <button
              onClick={() => navigateImage('prev')}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-teal-400 transition-colors duration-300 z-10 btn-hover-smooth"
            >
              <ChevronLeft size={48} />
            </button>
            
            <button
              onClick={() => navigateImage('next')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-teal-400 transition-colors duration-300 z-10 btn-hover-smooth"
            >
              <ChevronRight size={48} />
            </button>

            {/* Image */}
            <div className="max-w-4xl max-h-full">
              <img
                src={selectedImageData.src}
                alt={selectedImageData.title}
                className="max-w-full max-h-full object-contain"
              />
              
              {/* Image Info */}
              <div className="text-center mt-4 text-white">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <MapPin size={18} />
                  <span>{selectedImageData.location}</span>
                </div>
                <h3 className="text-xl font-bold">{selectedImageData.title}</h3>
              </div>
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center mt-16">
          <p className="text-lg text-gray-600 mb-6">
            Norite, kad jūsų nuotraukos atsidurtų mūsų galerijoje?
          </p>
          <button 
            onClick={handlePlanTrip}
            className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg btn-hover-smooth"
          >
            Planuoti kelionę
          </button>
        </div>
      </div>
    </section>
  );
};

export default Gallery;