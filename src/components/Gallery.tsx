import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, MapPin, Camera } from 'lucide-react';

const Gallery = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const images = [
    {
      id: 1,
      src: "https://images.pexels.com/photos/1371360/pexels-photo-1371360.jpeg?auto=compress&cs=tinysrgb&w=800",
      location: "Maldivai",
      category: "beach",
      title: "Kristalinio vandens lagūna"
    },
    {
      id: 2,
      src: "https://images.pexels.com/photos/161853/eiffel-tower-paris-france-tower-161853.jpeg?auto=compress&cs=tinysrgb&w=800",
      location: "Paryžius",
      category: "city",
      title: "Eifelio bokštas saulėlydyje"
    },
    {
      id: 3,
      src: "https://images.pexels.com/photos/1433052/pexels-photo-1433052.jpeg?auto=compress&cs=tinysrgb&w=800",
      location: "Islandija",
      category: "nature",
      title: "Šiaurės pašvaistė"
    },
    {
      id: 4,
      src: "https://images.pexels.com/photos/2506923/pexels-photo-2506923.jpeg?auto=compress&cs=tinysrgb&w=800",
      location: "Tokijas",
      category: "city",
      title: "Naktinis miesto vaizdas"
    },
    {
      id: 5,
      src: "https://images.pexels.com/photos/161815/santorini-travel-greece-island-161815.jpeg?auto=compress&cs=tinysrgb&w=800",
      location: "Santorini",
      category: "beach",
      title: "Baltieji namai ir mėlynas jūra"
    },
    {
      id: 6,
      src: "https://images.pexels.com/photos/1470405/pexels-photo-1470405.jpeg?auto=compress&cs=tinysrgb&w=800",
      location: "Dubajus",
      category: "city",
      title: "Dangoraižių mišklas"
    },
    {
      id: 7,
      src: "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
      location: "Bali",
      category: "nature",
      title: "Tropinė džiunglė"
    },
    {
      id: 8,
      src: "https://images.pexels.com/photos/1174732/pexels-photo-1174732.jpeg?auto=compress&cs=tinysrgb&w=800",
      location: "Tenerifė",
      category: "beach",
      title: "Vulkaninis paplūdimys"
    },
    {
      id: 9,
      src: "https://images.pexels.com/photos/2064827/pexels-photo-2064827.jpeg?auto=compress&cs=tinysrgb&w=800",
      location: "Roma",
      category: "city",
      title: "Koliziejus"
    },
    {
      id: 10,
      src: "https://images.pexels.com/photos/1287460/pexels-photo-1287460.jpeg?auto=compress&cs=tinysrgb&w=800",
      location: "Maldivai",
      category: "beach",
      title: "Vandens vila"
    },
    {
      id: 11,
      src: "https://images.pexels.com/photos/1486222/pexels-photo-1486222.jpeg?auto=compress&cs=tinysrgb&w=800",
      location: "Stambulas",
      category: "city",
      title: "Aya Sofija"
    },
    {
      id: 12,
      src: "https://images.pexels.com/photos/1701595/pexels-photo-1701595.jpeg?auto=compress&cs=tinysrgb&w=800",
      location: "Budapeštas",
      category: "city",
      title: "Parlamentas prie Dunojaus"
    }
  ];

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
                className={`flex items-center space-x-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 ${
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

        {/* Lightbox */}
        {selectedImage && selectedImageData && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white hover:text-teal-400 transition-colors duration-300 z-10"
            >
              <X size={32} />
            </button>

            {/* Navigation Buttons */}
            <button
              onClick={() => navigateImage('prev')}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-teal-400 transition-colors duration-300 z-10"
            >
              <ChevronLeft size={48} />
            </button>
            
            <button
              onClick={() => navigateImage('next')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-teal-400 transition-colors duration-300 z-10"
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
          <button className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
            Planuoti kelionę
          </button>
        </div>
      </div>
    </section>
  );
};

export default Gallery;