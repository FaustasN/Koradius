// Central API service for communicating with the backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export interface GalleryItem {
  id: number;
  title: string;
  location: string;
  category: string;
  image_url: string;
  photographer: string;
  date: string;
  likes: number;
  is_active: boolean;
}

export interface TravelPacket {
  id: number;
  title: string;
  location: string;
  duration: string;
  price: number;
  original_price?: number;
  rating: number;
  reviews: number;
  image_url: string;
  category: string;
  badge: string;
  description: string;
  includes: string[];
  available_spots: number;
  departure: string;
  is_active: boolean;
}

export interface Notification {
  id: number;
  type: 'review' | 'order' | 'system';
  title: string;
  message: string;
  timestamp: string;
  is_read: boolean;
  priority: 'low' | 'medium' | 'high';
}

// Gallery API calls
export const galleryApi = {
  getAll: async (): Promise<GalleryItem[]> => {
    const response = await fetch(`${API_BASE_URL}/gallery`);
    if (!response.ok) throw new Error('Failed to fetch gallery items');
    return response.json();
  },

  getById: async (id: number): Promise<GalleryItem> => {
    const response = await fetch(`${API_BASE_URL}/gallery/${id}`);
    if (!response.ok) throw new Error('Failed to fetch gallery item');
    return response.json();
  },

  getByCategory: async (category: string): Promise<GalleryItem[]> => {
    const response = await fetch(`${API_BASE_URL}/gallery?category=${category}`);
    if (!response.ok) throw new Error('Failed to fetch gallery items');
    return response.json();
  }
};

// Travel packets API calls
export const travelPacketsApi = {
  getAll: async (): Promise<TravelPacket[]> => {
    const response = await fetch(`${API_BASE_URL}/travel-packets`);
    if (!response.ok) throw new Error('Failed to fetch travel packets');
    return response.json();
  },

  getById: async (id: number): Promise<TravelPacket> => {
    const response = await fetch(`${API_BASE_URL}/travel-packets/${id}`);
    if (!response.ok) throw new Error('Failed to fetch travel packet');
    return response.json();
  },

  getByCategory: async (category: string): Promise<TravelPacket[]> => {
    const response = await fetch(`${API_BASE_URL}/travel-packets?category=${category}`);
    if (!response.ok) throw new Error('Failed to fetch travel packets');
    return response.json();
  },

  search: async (searchTerm: string): Promise<TravelPacket[]> => {
    const response = await fetch(`${API_BASE_URL}/travel-packets?search=${encodeURIComponent(searchTerm)}`);
    if (!response.ok) throw new Error('Failed to search travel packets');
    return response.json();
  }
};

// Notifications API calls
export const notificationsApi = {
  getAll: async (): Promise<Notification[]> => {
    const response = await fetch(`${API_BASE_URL}/notifications`);
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
  },

  markAsRead: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PUT'
    });
    if (!response.ok) throw new Error('Failed to mark notification as read');
  }
};

// Transform functions to convert API data to frontend format
export const transformGalleryItem = (item: GalleryItem) => ({
  id: item.id,
  src: item.image_url,
  location: item.location,
  category: item.category,
  title: item.title,
  photographer: item.photographer,
  date: item.date,
  likes: item.likes
});

export const transformTravelPacket = (packet: TravelPacket) => ({
  id: packet.id,
  title: packet.title,
  location: packet.location,
  duration: packet.duration,
  price: packet.price.toString(),
  originalPrice: packet.original_price?.toString(),
  rating: packet.rating,
  reviews: packet.reviews,
  image: packet.image_url,
  category: packet.category,
  badge: packet.badge,
  description: packet.description,
  includes: packet.includes,
  availableSpots: packet.available_spots,
  departure: packet.departure
});

export default {
  galleryApi,
  travelPacketsApi,
  notificationsApi,
  transformGalleryItem,
  transformTravelPacket
};
