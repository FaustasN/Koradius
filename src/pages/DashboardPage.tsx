import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings, Image, MessageSquare, Clock, Plus, Edit, Trash2, Eye, Bell, Package, Database, Search, Filter, Star, Phone, Mail, User } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';
import { notificationsAPI, contactsAPI, reviewsAPI, galleryAPI, travelPacketsAPI } from '../services/adminApiService';

// Types for our data structures
interface GalleryItem {
  id: number;
  title: string;
  location: string;
  category: string;
  imageUrl: string;
  photographer: string;
  date: string;
  likes: number;
  isActive: boolean;
}

interface TravelPacket {
  id: number;
  title: string;
  location: string;
  duration: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  imageUrl: string;
  category: string;
  badge: string;
  description: string;
  includes: string[];
  availableSpots: number;
  departure: string;
  isActive: boolean;
}

interface Notification {
  id: number;
  type: 'review' | 'order' | 'system' | 'contact';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface Contact {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  preferred_contact: string;
  urgency: string;
  is_resolved: boolean;
  resolved_at?: string;
  created_at: string;
}

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

interface Message {
  id: string;
  type: 'contact' | 'review';
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  preferred_contact?: string;
  urgency?: string;
  rating?: number;
  is_resolved?: boolean;
  resolved_at?: string;
  created_at: string;
}

const DashboardPage = () => {
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<{ username: string; role: string; exp: number } | null>(null);
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'gallery' | 'packets' | 'notifications' | 'messages'>('notifications');
  const [isLoading, setIsLoading] = useState(false);

  // Data state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Message filtering state
  const [messageFilter, setMessageFilter] = useState<'all' | 'contact' | 'review'>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'normal' | 'urgent' | 'emergency'>('all');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [contactMethodFilter, setContactMethodFilter] = useState<'all' | 'email' | 'phone' | 'both'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);

  // Gallery state
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<GalleryItem | null>(null);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryFormData, setGalleryFormData] = useState({
    title: '',
    location: '',
    category: 'beach',
    imageUrl: '',
    photographer: ''
  });

  // Travel packets state
  const [travelPackets, setTravelPackets] = useState<TravelPacket[]>([]);
  const [selectedPacket, setSelectedPacket] = useState<TravelPacket | null>(null);
  const [showPacketModal, setShowPacketModal] = useState(false);
  const [packetFormData, setPacketFormData] = useState({
    title: '',
    location: '',
    duration: '',
    price: '',
    originalPrice: '',
    category: 'weekend',
    badge: '',
    description: '',
    includes: '',
    availableSpots: '',
    departure: '',
    imageUrl: ''
  });

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  useEffect(() => {
    // Get user info from JWT token
    const getCookie = (name: string): string | null => {
      const nameEQ = name + "=";
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
      }
      return null;
    };

    const verifyJWT = (token: string): any | null => {
      try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        
        const payload = JSON.parse(atob(parts[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        if (payload.exp && payload.exp < currentTime) {
          return null; // Token expired
        }
        
        return payload;
      } catch (error) {
        return null;
      }
    };

    const token = getCookie('adminToken');
    if (token) {
      const payload = verifyJWT(token);
      if (payload) {
        setUserInfo(payload);
      }
    }
  }, []);

  useEffect(() => {
    if (userInfo?.exp) {
      const updateTimeUntilExpiry = () => {
        const currentTime = Math.floor(Date.now() / 1000);
        const timeLeft = userInfo.exp - currentTime;
        
        if (timeLeft <= 0) {
          setTimeUntilExpiry('Expired');
          logout();
          navigate('/dashboard/login');
          return;
        }
        
        const hours = Math.floor(timeLeft / 3600);
        const minutes = Math.floor((timeLeft % 3600) / 60);
        setTimeUntilExpiry(`${hours}h ${minutes}m`);
      };

      updateTimeUntilExpiry();
      const interval = setInterval(updateTimeUntilExpiry, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [userInfo, logout, navigate]);

  // Load all data when component mounts and user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated]); // Run when authentication state changes

  // Set up real-time notification polling
  useEffect(() => {
    if (isAuthenticated) {
      // Poll for new notifications every 30 seconds
      const notificationInterval = setInterval(() => {
        loadNotifications();
      }, 30000); // 30 seconds

      return () => clearInterval(notificationInterval);
    }
  }, [isAuthenticated]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      // Load all data in parallel
      await Promise.all([
        loadGalleryItems(),
        loadTravelPackets(),
        loadNotifications(),
        loadContacts(),
        loadReviews()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // API service functions
  const loadGalleryItems = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/gallery');
      
      if (response.ok) {
        const data = await response.json();
        
        // Transform API data to match our interface
        const transformedData: GalleryItem[] = data.map((item: any) => ({
          id: item.id,
          title: item.title,
          location: item.location,
          category: item.category,
          imageUrl: item.image_url,
          photographer: item.photographer,
          date: item.date,
          likes: item.likes,
          isActive: item.is_active
        }));
        
        setGalleryItems(transformedData);
      } else {
        throw new Error('Failed to fetch gallery items');
      }
    } catch (error) {
      console.error('Error loading gallery items:', error);
    }
  };

  const loadTravelPackets = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/travel-packets');
      
      if (response.ok) {
        const data = await response.json();
        
        // Transform API data to match our interface
        const transformedData: TravelPacket[] = data.map((item: any) => ({
          id: item.id,
          title: item.title,
          location: item.location,
          duration: item.duration,
          price: parseFloat(item.price),
          originalPrice: item.original_price ? parseFloat(item.original_price) : undefined,
          rating: parseFloat(item.rating),
          reviews: item.reviews,
          imageUrl: item.image_url,
          category: item.category,
          badge: item.badge,
          description: item.description,
          includes: item.includes || [],
          availableSpots: item.available_spots,
          departure: item.departure,
          isActive: item.is_active
        }));
        
        setTravelPackets(transformedData);
      } else {
        throw new Error('Failed to fetch travel packets');
      }
    } catch (error) {
      console.error('Error loading travel packets:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const data = await notificationsAPI.getAll();
      
      // Transform API data to match our interface
      const transformedData: Notification[] = data.map((item: any) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        message: item.message,
        timestamp: item.timestamp,
        isRead: item.is_read,
        priority: item.priority
      }));
      
      // Check if we have new notifications
      const currentCount = notifications.filter(n => !n.isRead).length;
        const newCount = transformedData.filter(n => !n.isRead).length;
        
      // If we have more unread notifications, show a visual indicator
      if (newCount > currentCount && currentCount > 0) {
        setHasNewNotifications(true);
        // Reset the indicator after 5 seconds
        setTimeout(() => setHasNewNotifications(false), 5000);
        console.log(`New notification received! Total unread: ${newCount}`);
      }
      
      setNotifications(transformedData);
      setUnreadCount(newCount);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadContacts = async () => {
    try {
      const data = await contactsAPI.getAll();
      setContacts(data);
      combineMessages(data, reviews);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const loadReviews = async () => {
    try {
      const data = await reviewsAPI.getAll();
      setReviews(data);
      combineMessages(contacts, data);
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  const combineMessages = (contactsData: Contact[], reviewsData: Review[]) => {
    const combinedMessages: Message[] = [
      ...contactsData.map(contact => ({
        id: `contact-${contact.id}`,
        type: 'contact' as const,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        subject: contact.subject,
        message: contact.message,
        preferred_contact: contact.preferred_contact,
        urgency: contact.urgency,
        is_resolved: contact.is_resolved,
        resolved_at: contact.resolved_at,
        created_at: contact.created_at
      })),
      ...reviewsData.map(review => ({
        id: `review-${review.id}`,
        type: 'review' as const,
        name: review.name,
        email: review.email,
        message: review.comment,
        rating: review.rating,
        created_at: review.created_at
      }))
    ];
    
    // Sort by created_at descending (newest first)
    combinedMessages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setMessages(combinedMessages);
  };

  const getFilteredMessages = () => {
    return messages.filter(message => {
      // Type filter
      if (messageFilter !== 'all' && message.type !== messageFilter) return false;
      
      // Urgency filter (only for contact messages)
      if (urgencyFilter !== 'all' && message.type === 'contact' && message.urgency !== urgencyFilter) return false;
      
      // Subject filter (only for contact messages)
      if (subjectFilter && message.type === 'contact' && !message.subject?.toLowerCase().includes(subjectFilter.toLowerCase())) return false;
      
      // Contact method filter (only for contact messages)
      if (contactMethodFilter !== 'all' && message.type === 'contact' && message.preferred_contact !== contactMethodFilter) return false;
      
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          message.name.toLowerCase().includes(query) ||
          message.email.toLowerCase().includes(query) ||
          message.message.toLowerCase().includes(query) ||
          (message.phone && message.phone.toLowerCase().includes(query)) ||
          (message.subject && message.subject.toLowerCase().includes(query))
        );
      }
      
      return true;
    });
  };

  const getUrgencyBadgeColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return 'bg-red-100 text-red-800';
      case 'urgent': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return 'Labai skubus';
      case 'urgent': return 'Skubus';
      case 'normal': return 'Įprastas';
      default: return urgency;
    }
  };

  const getContactMethodLabel = (method: string) => {
    switch (method) {
      case 'email': return 'El. paštas';
      case 'phone': return 'Telefonas';
      case 'both': return 'Abu būdai';
      default: return method;
    }
  };

  const getCookie = (name: string): string | null => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  const handleLogout = () => {
    logout();
    navigate('/dashboard/login');
  };

  // Gallery functions
  const handleAddGalleryItem = () => {
    setSelectedGalleryItem(null);
    setGalleryFormData({
      title: '',
      location: '',
      category: 'beach',
      imageUrl: '',
      photographer: ''
    });
    setShowGalleryModal(true);
  };

  const handleEditGalleryItem = (item: GalleryItem) => {
    setSelectedGalleryItem(item);
    setGalleryFormData({
      title: item.title,
      location: item.location,
      category: item.category,
      imageUrl: item.imageUrl,
      photographer: item.photographer
    });
    setShowGalleryModal(true);
  };

  const handleSaveGalleryItem = async () => {
    try {
      const method = selectedGalleryItem ? 'PUT' : 'POST';
      const url = selectedGalleryItem 
        ? `http://localhost:3001/api/gallery/${selectedGalleryItem.id}` 
        : 'http://localhost:3001/api/gallery';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(galleryFormData)
      });

      if (response.ok) {
        setShowGalleryModal(false);
        loadGalleryItems();
      } else {
        throw new Error('Failed to save gallery item');
      }
    } catch (error) {
      console.error('Error saving gallery item:', error);
    }
  };

  const handleDeleteGalleryItem = async (id: number) => {
    if (window.confirm('Ar tikrai norite ištrinti šią nuotrauką?')) {
      try {
        const response = await fetch(`http://localhost:3001/api/gallery/${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          loadGalleryItems();
        } else {
          throw new Error('Failed to delete gallery item');
        }
      } catch (error) {
        console.error('Error deleting gallery item:', error);
      }
    }
  };

  // Travel packets functions
  const handleAddPacket = () => {
    setSelectedPacket(null);
    setPacketFormData({
      title: '',
      location: '',
      duration: '',
      price: '',
      originalPrice: '',
      category: 'weekend',
      badge: '',
      description: '',
      includes: '',
      availableSpots: '',
      departure: '',
      imageUrl: ''
    });
    setShowPacketModal(true);
  };

  const handleEditPacket = (packet: TravelPacket) => {
    setSelectedPacket(packet);
    setPacketFormData({
      title: packet.title,
      location: packet.location,
      duration: packet.duration,
      price: packet.price.toString(),
      originalPrice: packet.originalPrice?.toString() || '',
      category: packet.category,
      badge: packet.badge,
      description: packet.description,
      includes: packet.includes.join(', '),
      availableSpots: packet.availableSpots.toString(),
      departure: packet.departure,
      imageUrl: packet.imageUrl
    });
    setShowPacketModal(true);
  };

  const handleSavePacket = async () => {
    try {
      const includes = packetFormData.includes.split(',').map(item => item.trim());
      const price = parseFloat(packetFormData.price);
      const originalPrice = packetFormData.originalPrice ? parseFloat(packetFormData.originalPrice) : null;
      const availableSpots = parseInt(packetFormData.availableSpots);
      
      const packetData = {
        ...packetFormData,
        price,
        originalPrice,
        includes,
        availableSpots
      };
      
      const method = selectedPacket ? 'PUT' : 'POST';
      const url = selectedPacket 
        ? `http://localhost:3001/api/travel-packets/${selectedPacket.id}` 
        : 'http://localhost:3001/api/travel-packets';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(packetData)
      });

      if (response.ok) {
        setShowPacketModal(false);
        loadTravelPackets();
      } else {
        throw new Error('Failed to save travel packet');
      }
    } catch (error) {
      console.error('Error saving travel packet:', error);
    }
  };

  const handleDeletePacket = async (id: number) => {
    if (window.confirm('Ar tikrai norite ištrinti šį kelionės paketą?')) {
      try {
        const response = await fetch(`http://localhost:3001/api/travel-packets/${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          loadTravelPackets();
        } else {
          throw new Error('Failed to delete travel packet');
        }
      } catch (error) {
        console.error('Error deleting travel packet:', error);
      }
    }
  };

  // Notification functions
  const markNotificationAsRead = async (id: number) => {
    try {
      await notificationsAPI.markAsRead(id);
      loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'review': return <MessageSquare size={16} />;
      case 'order': return <Package size={16} />;
      case 'system': return <Settings size={16} />;
      default: return <Bell size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Koradius Admin</h1>
                <p className="text-sm text-gray-500">Administratoriaus skydelis</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="flex items-center space-x-1 text-orange-600">
                  <Clock className="h-4 w-4" />
                  <span>{timeUntilExpiry}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors duration-200"
              >
                <LogOut className="h-4 w-4" />
                <span>Atsijungti</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Image className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Galerijos nuotraukos</p>
                <p className="text-2xl font-bold text-gray-900">{galleryItems.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Kelionės paketai</p>
                <p className="text-2xl font-bold text-gray-900">{travelPackets.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Bell className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Naujos notifikacijos</p>
                <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Database className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Duomenų bazė</p>
                <p className="text-2xl font-bold text-gray-900">PostgreSQL</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'gallery'
                  ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Image className="h-5 w-5" />
                <span>Galerija</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('packets')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'packets'
                  ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Kelionės paketai</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'messages'
                  ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Žinutės</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'notifications'
                  ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Bell className="h-5 w-5" />
                                 <span>Pranešimai</span>
                 {unreadCount > 0 && (
                   <span className={`text-white text-xs rounded-full px-2 py-1 min-w-[20px] ${
                     hasNewNotifications 
                       ? 'bg-red-500 animate-pulse' 
                       : 'bg-red-500'
                   }`}>
                     {unreadCount}
                   </span>
                 )}
              </div>
            </button>
          </div>

                     {/* Tab Content */}
           <div className="p-6">
             {isLoading && galleryItems.length === 0 && travelPackets.length === 0 && notifications.length === 0 && messages.length === 0 ? (
               <div className="flex items-center justify-center py-12">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
               </div>
             ) : (
              <>
                {/* Gallery Tab */}
                {activeTab === 'gallery' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">Galerijos valdymas</h3>
                      <button
                        onClick={handleAddGalleryItem}
                        className="flex items-center space-x-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors duration-200"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Pridėti nuotrauką</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {galleryItems.map((item) => (
                        <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-48 object-cover"
                          />
                          <div className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">{item.location}</p>
                            <p className="text-xs text-gray-500 mb-3">Autorius: {item.photographer}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded-full">
                                {item.category}
                              </span>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditGalleryItem(item)}
                                  className="p-1 text-blue-600 hover:text-blue-800"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteGalleryItem(item.id)}
                                  className="p-1 text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Travel Packets Tab */}
                {activeTab === 'packets' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">Kelionės paketų valdymas</h3>
                      <button
                        onClick={handleAddPacket}
                        className="flex items-center space-x-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors duration-200"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Pridėti paketą</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {travelPackets.map((packet) => (
                        <div key={packet.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                          <img
                            src={packet.imageUrl}
                            alt={packet.title}
                            className="w-full h-48 object-cover"
                          />
                          <div className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-2">{packet.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">{packet.location}</p>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-teal-600">{packet.price}€</span>
                              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                                {packet.badge}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mb-3">{packet.duration} • {packet.availableSpots} vietos</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {packet.category}
                              </span>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditPacket(packet)}
                                  className="p-1 text-blue-600 hover:text-blue-800"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeletePacket(packet.id)}
                                  className="p-1 text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages Tab (Unified Contacts & Reviews) */}
                {activeTab === 'messages' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">Žinutės</h3>
                      <button
                        onClick={() => { loadContacts(); loadReviews(); }}
                        className="text-teal-600 hover:text-teal-800 text-sm font-medium"
                      >
                        Atnaujinti
                      </button>
                    </div>

                    {/* Filter Controls */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-4">
                      {/* Search Bar */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                          type="text"
                          placeholder="Ieškoti pagal vardą, el. paštą, žinutę..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>

                      {/* Filter Dropdowns */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tipas</label>
                          <select
                            value={messageFilter}
                            onChange={(e) => setMessageFilter(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          >
                            <option value="all">Visi</option>
                            <option value="contact">Kontaktai</option>
                            <option value="review">Atsiliepimai</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Skubumas</label>
                          <select
                            value={urgencyFilter}
                            onChange={(e) => setUrgencyFilter(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          >
                            <option value="all">Visi</option>
                            <option value="normal">Įprastas</option>
                            <option value="urgent">Skubus</option>
                            <option value="emergency">Labai skubus</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tema</label>
                          <input
                            type="text"
                            placeholder="Filtruoti pagal temą"
                            value={subjectFilter}
                            onChange={(e) => setSubjectFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Ryšio būdas</label>
                          <select
                            value={contactMethodFilter}
                            onChange={(e) => setContactMethodFilter(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          >
                            <option value="all">Visi</option>
                            <option value="email">El. paštas</option>
                            <option value="phone">Telefonas</option>
                            <option value="both">Abu būdai</option>
                          </select>
                        </div>
                      </div>

                      {/* Active Filters Display */}
                      {(searchQuery || messageFilter !== 'all' || urgencyFilter !== 'all' || subjectFilter || contactMethodFilter !== 'all') && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Aktyvūs filtrai:</span>
                          {searchQuery && (
                            <span className="px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded-full">
                              Paieška: {searchQuery}
                            </span>
                          )}
                          {messageFilter !== 'all' && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              Tipas: {messageFilter === 'contact' ? 'Kontaktai' : 'Atsiliepimai'}
                            </span>
                          )}
                          {urgencyFilter !== 'all' && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                              Skubumas: {urgencyFilter}
                            </span>
                          )}
                          {subjectFilter && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                              Tema: {subjectFilter}
                            </span>
                          )}
                          {contactMethodFilter !== 'all' && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Ryšys: {getContactMethodLabel(contactMethodFilter)}
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setSearchQuery('');
                              setMessageFilter('all');
                              setUrgencyFilter('all');
                              setSubjectFilter('');
                              setContactMethodFilter('all');
                            }}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-gray-200"
                          >
                            Išvalyti visus
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {getFilteredMessages().length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          {searchQuery || messageFilter !== 'all' || urgencyFilter !== 'all' || subjectFilter || contactMethodFilter !== 'all' 
                            ? 'Nerasta žinučių atitinkančių filtro kriterijus'
                            : 'Žinučių nėra'
                          }
                        </div>
                      ) : (
                        getFilteredMessages().map((message) => (
                          <div
                            key={message.id}
                            onClick={() => { setSelectedMessage(message); setShowMessageModal(true); }}
                            className="p-4 rounded-lg border bg-white border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h4 className="font-semibold text-gray-900">{message.name}</h4>
                                  <span className="text-sm text-gray-500">({message.email})</span>
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    message.type === 'contact' 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-purple-100 text-purple-800'
                                  }`}>
                                    {message.type === 'contact' ? 'Kontaktas' : 'Atsiliepimas'}
                                  </span>
                                  
                                  {/* Additional badges for contact messages */}
                                  {message.type === 'contact' && message.urgency && (
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUrgencyBadgeColor(message.urgency)}`}>
                                      {message.urgency === 'emergency' ? 'Labai skubus' : 
                                       message.urgency === 'urgent' ? 'Skubus' : 'Įprastas'}
                                    </span>
                                  )}
                                  
                                  {/* Rating for review messages */}
                                  {message.type === 'review' && message.rating && (
                                    <div className="flex items-center space-x-1">
                                      {Array.from({ length: 5 }, (_, i) => (
                                        <Star
                                          key={i}
                                          className={`h-4 w-4 ${
                                            i < message.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                          }`}
                                        />
                                      ))}
                                      <span className="text-sm text-gray-500 ml-1">({message.rating}/5)</span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Subject line for contacts */}
                                {message.type === 'contact' && message.subject && (
                                  <p className="text-sm font-medium text-gray-700 mb-1">Tema: {message.subject}</p>
                                )}
                                
                                {/* Message preview */}
                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                  {message.message.length > 120 
                                    ? `${message.message.substring(0, 120)}...` 
                                    : message.message
                                  }
                                </p>
                                
                                {/* Additional contact info */}
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <span>{new Date(message.created_at).toLocaleString('lt-LT')}</span>
                                  {message.phone && (
                                    <span className="flex items-center space-x-1">
                                      <Phone className="h-3 w-3" />
                                      <span>{message.phone}</span>
                                    </span>
                                  )}
                                  {message.type === 'contact' && message.preferred_contact && (
                                    <span className="flex items-center space-x-1">
                                      <Mail className="h-3 w-3" />
                                      <span>Pageidauja: {getContactMethodLabel(message.preferred_contact)}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Eye className="h-4 w-4 text-teal-600" />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">Pranešimai</h3>
                      <button
                        onClick={loadNotifications}
                        className="text-teal-600 hover:text-teal-800 text-sm font-medium"
                      >
                        Atnaujinti
                      </button>
                    </div>

                    <div className="space-y-4">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 rounded-lg border transition-colors duration-200 ${
                            notification.isRead
                              ? 'bg-gray-50 border-gray-200'
                              : 'bg-white border-teal-200 shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <div className={`p-2 rounded-lg ${getPriorityColor(notification.priority)}`}>
                                {getTypeIcon(notification.type)}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-1">{notification.title}</h4>
                                <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(notification.timestamp).toLocaleString('lt-LT')}
                                </p>
                              </div>
                            </div>
                            {!notification.isRead && (
                              <button
                                onClick={() => markNotificationAsRead(notification.id)}
                                className="text-teal-600 hover:text-teal-800 text-sm font-medium"
                              >
                                Pažymėti kaip perskaitytą
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Message Detail Modal */}
      {showMessageModal && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {selectedMessage.type === 'contact' ? 'Kontakto detalės' : 'Atsiliepimo detalės'}
              </h3>
              <button
                onClick={() => setShowMessageModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Eye className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Header Info */}
              <div className="border-b border-gray-200 pb-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{selectedMessage.name}</h4>
                    <p className="text-gray-600">{selectedMessage.email}</p>
                    {selectedMessage.phone && (
                      <p className="text-gray-600 flex items-center space-x-1">
                        <Phone size={14} />
                        <span>{selectedMessage.phone}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Type Badge */}
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    selectedMessage.type === 'contact' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {selectedMessage.type === 'contact' ? 'Kontaktas' : 'Atsiliepimas'}
                  </span>

                  {/* Urgency Badge for contacts */}
                  {selectedMessage.type === 'contact' && selectedMessage.urgency && (
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getUrgencyBadgeColor(selectedMessage.urgency)}`}>
                      {getUrgencyLabel(selectedMessage.urgency)}
                    </span>
                  )}

                  {/* Rating for reviews */}
                  {selectedMessage.type === 'review' && selectedMessage.rating && (
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          size={20}
                          className={`${
                            i < selectedMessage.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="text-sm text-gray-600 ml-2">({selectedMessage.rating}/5)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Details */}
              {selectedMessage.type === 'contact' && (
                <div>
                  <h5 className="text-sm font-semibold text-gray-900 mb-3">Kontakto informacija</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedMessage.subject && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Tema</label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedMessage.subject}</p>
                      </div>
                    )}
                    {selectedMessage.preferred_contact && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Pageidaujamas ryšio būdas</label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{getContactMethodLabel(selectedMessage.preferred_contact)}</p>
                      </div>
                    )}
                    {selectedMessage.urgency && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Skubumas</label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{getUrgencyLabel(selectedMessage.urgency)}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Pateikimo data</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {new Date(selectedMessage.created_at).toLocaleString('lt-LT')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Message Content */}
              <div>
                <h5 className="text-sm font-semibold text-gray-900 mb-3">
                  {selectedMessage.type === 'contact' ? 'Žinutė' : 'Atsiliepimas'}
                </h5>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                {selectedMessage.type === 'contact' && (
                  <>
                    <button
                      onClick={() => window.location.href = `mailto:${selectedMessage.email}`}
                      className="flex items-center space-x-2 px-4 py-2 text-teal-600 hover:text-teal-800 border border-teal-600 hover:border-teal-800 rounded-lg transition-colors"
                    >
                      <Mail size={16} />
                      <span>Atsakyti el. paštu</span>
                    </button>
                    {selectedMessage.phone && (
                      <button
                        onClick={() => window.location.href = `tel:${selectedMessage.phone}`}
                        className="flex items-center space-x-2 px-4 py-2 text-green-600 hover:text-green-800 border border-green-600 hover:border-green-800 rounded-lg transition-colors"
                      >
                        <Phone size={16} />
                        <span>Skambinti</span>
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Uždaryti
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Modal */}
      {showGalleryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedGalleryItem ? 'Redaguoti nuotrauką' : 'Pridėti nuotrauką'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pavadinimas</label>
                <input
                  type="text"
                  value={galleryFormData.title}
                  onChange={(e) => setGalleryFormData({...galleryFormData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vieta</label>
                <input
                  type="text"
                  value={galleryFormData.location}
                  onChange={(e) => setGalleryFormData({...galleryFormData, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategorija</label>
                <select
                  value={galleryFormData.category}
                  onChange={(e) => setGalleryFormData({...galleryFormData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="beach">Paplūdimiai</option>
                  <option value="city">Miestai</option>
                  <option value="nature">Gamta</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nuotrauka</label>
                <ImageUpload
                  value={galleryFormData.imageUrl}
                  onChange={(url) => setGalleryFormData({...galleryFormData, imageUrl: url})}
                  uploadType="gallery"
                  placeholder="Įkelkite nuotrauką arba įveskite URL"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fotografas</label>
                <input
                  type="text"
                  value={galleryFormData.photographer}
                  onChange={(e) => setGalleryFormData({...galleryFormData, photographer: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowGalleryModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Atšaukti
              </button>
              <button
                onClick={handleSaveGalleryItem}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                Išsaugoti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Travel Packet Modal */}
      {showPacketModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedPacket ? 'Redaguoti kelionės paketą' : 'Pridėti kelionės paketą'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pavadinimas</label>
                <input
                  type="text"
                  value={packetFormData.title}
                  onChange={(e) => setPacketFormData({...packetFormData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vieta</label>
                <input
                  type="text"
                  value={packetFormData.location}
                  onChange={(e) => setPacketFormData({...packetFormData, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trukmė</label>
                <input
                  type="text"
                  value={packetFormData.duration}
                  onChange={(e) => setPacketFormData({...packetFormData, duration: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kaina (€)</label>
                <input
                  type="number"
                  value={packetFormData.price}
                  onChange={(e) => setPacketFormData({...packetFormData, price: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Originali kaina (€)</label>
                <input
                  type="number"
                  value={packetFormData.originalPrice}
                  onChange={(e) => setPacketFormData({...packetFormData, originalPrice: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategorija</label>
                <select
                  value={packetFormData.category}
                  onChange={(e) => setPacketFormData({...packetFormData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="weekend">Savaitgalio kelionės</option>
                  <option value="vacation">Poilsinės kelionės</option>
                  <option value="medical">Medicininis turizmas</option>
                  <option value="nature">Gamtos kelionės</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ženklelis</label>
                <input
                  type="text"
                  value={packetFormData.badge}
                  onChange={(e) => setPacketFormData({...packetFormData, badge: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dostupų vietų skaičius</label>
                <input
                  type="number"
                  value={packetFormData.availableSpots}
                  onChange={(e) => setPacketFormData({...packetFormData, availableSpots: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Išvykimo data</label>
                <input
                  type="date"
                  value={packetFormData.departure}
                  onChange={(e) => setPacketFormData({...packetFormData, departure: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nuotrauka</label>
                <ImageUpload
                  value={packetFormData.imageUrl}
                  onChange={(url) => setPacketFormData({...packetFormData, imageUrl: url})}
                  uploadType="travel-packets"
                  placeholder="Įkelkite kelionės nuotrauką arba įveskite URL"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Aprašymas</label>
                <textarea
                  value={packetFormData.description}
                  onChange={(e) => setPacketFormData({...packetFormData, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Kas įtraukta (atskirti kableliais)</label>
                <input
                  type="text"
                  value={packetFormData.includes}
                  onChange={(e) => setPacketFormData({...packetFormData, includes: e.target.value})}
                  placeholder="Skrydžiai, 3* viešbutis, Pusryčiai, Gidas"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPacketModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Atšaukti
              </button>
              <button
                onClick={handleSavePacket}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                Išsaugoti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage; 