import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings, Image, MessageSquare, Clock, Plus, Edit, Trash2, Bell, Package, Database, Search, Star, Phone, Mail, Home, CheckCircle, Eye, EyeOff, ChevronUp, ChevronDown, BarChart3, Server } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';
import GoogleAnalytics from '../components/GoogleAnalytics';
import EnhancedServerMonitoring from '../components/EnhancedServerMonitoring';
import { notificationsAPI, contactsAPI, reviewsAPI, serverAPI } from '../services/adminApiService';
import { galleryApi, travelPacketsApi } from '../services/apiService';
import { useNotificationManager } from '../utils/notificationUtils';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

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
  is_read?: boolean; // Add read status
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

interface BackendHealthStatus {
  backends: Array<{
    id: string;
    name: string;
    url: string;
    status: 'healthy' | 'unhealthy' | 'down' | 'unknown';
    lastCheck: string | null;
    lastSeen: string | null;
    responseTime: number | null;
    consecutiveFailures: number;
    errorMessage: string | null;
    downtime: number | null;
  }>;
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
    down: number;
    unknown: number;
  };
  isMonitoring: boolean;
  lastUpdate: string;
}

const DashboardPage = () => {
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const notificationManager = useNotificationManager();
  const [userInfo, setUserInfo] = useState<{ username: string; role: string; exp: number } | null>(null);
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'gallery' | 'packets' | 'zinutes' | 'atsiliepimai' | 'notifications' | 'analytics' | 'server'>('gallery');
  const [isLoading, setIsLoading] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  // Data state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Contact filtering state (for Žinutės tab)
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'normal' | 'urgent' | 'emergency'>('all');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [contactMethodFilter, setContactMethodFilter] = useState<'all' | 'email' | 'phone' | 'both'>('all');
  const [readStatusFilter, setReadStatusFilter] = useState<'all' | 'read' | 'unread'>('all');
  const [resolvedStatusFilter, setResolvedStatusFilter] = useState<'all' | 'resolved' | 'unresolved'>('all');
  
  // Review filtering state (for Atsiliepimai tab)
  const [reviewSearchQuery, setReviewSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<'all' | '1' | '2' | '3' | '4' | '5'>('all');
  const [approvalFilter, setApprovalFilter] = useState<'all' | 'approved' | 'pending'>('all');
  
  // Review management state
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [reviewToApprove, setReviewToApprove] = useState<Review | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [reviewToEdit, setReviewToEdit] = useState<Review | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    rating: 5,
    comment: '',
    trip_reference: ''
  });

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
  const [dropdownNotifications, setDropdownNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationSortBy, setNotificationSortBy] = useState<'date' | 'priority' | 'type'>('date');
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  // Backend health state
  const [backendHealth, setBackendHealth] = useState<BackendHealthStatus | null>(null);

  // Item highlighting state for notification navigation
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);

  // Contact expansion and read status
  const [expandedContactId, setExpandedContactId] = useState<number | null>(null);
  const [readContacts, setReadContacts] = useState<Set<number>>(() => {
    // Load read status from localStorage
    const saved = localStorage.getItem('readContacts');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Save read status to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('readContacts', JSON.stringify([...readContacts]));
  }, [readContacts]);

  // Notification loading functions - placed here to avoid hoisting issues
  const loadNotifications = async () => {
    try {
      const data = await notificationsAPI.getAll(notificationSortBy);
      
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
      const currentUnreadIds = new Set(notifications.filter(n => !n.isRead).map(n => n.id));
      const newUnreadNotifications = transformedData.filter(n => !n.isRead && !currentUnreadIds.has(n.id));
      const newCount = transformedData.filter(n => !n.isRead).length;
        
        // Handle new notifications (only if we actually have new ones, not on initial load)
        if (newUnreadNotifications.length > 0 && notifications.length > 0) {
          setHasNewNotifications(true);
          // Reset the indicator after 5 seconds
          setTimeout(() => setHasNewNotifications(false), 5000);
          
          // Request permission and show browser notification if granted
          try {
            const hasPermission = await notificationManager.requestPermission();
            if (hasPermission) {
              const notificationTitle = `New ${newUnreadNotifications[0].type} notification`;
              notificationManager.showBrowserNotification(
                notificationTitle,
                newUnreadNotifications[0].message,
                newUnreadNotifications[0].priority
              );
            }
          } catch {
            // Silent failure
          }
        }      setNotifications(transformedData);
      setUnreadCount(newCount);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  // Separate function for dropdown notifications (always sorted by date)
  const loadDropdownNotifications = async () => {
    try {
      const data = await notificationsAPI.getAll('date');
      
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
      
      // Update dropdown notifications state (separate from tab notifications)
      setDropdownNotifications(transformedData);
      
      // Always update unread count
      const newCount = transformedData.filter(n => !n.isRead).length;
      setUnreadCount(newCount);
      
      // Check for new notifications for browser notifications
      const currentUnreadIds = new Set(dropdownNotifications.filter(n => !n.isRead).map(n => n.id));
      const newUnreadNotifications = transformedData.filter(n => !n.isRead && !currentUnreadIds.has(n.id));
      
      if (newUnreadNotifications.length > 0 && dropdownNotifications.length > 0) {
        setHasNewNotifications(true);
        setTimeout(() => setHasNewNotifications(false), 5000);
        
        try {
          const hasPermission = await notificationManager.requestPermission();
          if (hasPermission) {
            const notificationTitle = `New ${newUnreadNotifications[0].type} notification`;
            notificationManager.showBrowserNotification(
              notificationTitle,
              newUnreadNotifications[0].message,
              newUnreadNotifications[0].priority
            );
          }
        } catch {
          // Silent failure
        }
      }
    } catch (error) {
      console.error('Error loading dropdown notifications:', error);
    }
  };

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

  // Initialize notification manager (without asking for permission immediately)
  useEffect(() => {
    // Just cleanup on unmount, don't request permission yet
    return () => {
      notificationManager.dispose();
    };
  }, [notificationManager]);

  // Update browser title based on unread notifications
  useEffect(() => {
    if (unreadCount > 0) {
      notificationManager.updateTitleWithCount(unreadCount);
      // Start flashing for high priority notifications or when count > 5
      const hasHighPriorityUnread = notifications.some(n => !n.isRead && n.priority === 'high');
      if (hasHighPriorityUnread || unreadCount > 5) {
        notificationManager.startTitleFlashing(unreadCount);
      }
    } else {
      notificationManager.stopTitleFlashing();
    }
  }, [unreadCount, notifications, notificationManager]);

  // Load all data when component mounts and user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated]); // Run when authentication state changes

  // Set up real-time notification polling and auto-refresh
  useEffect(() => {
    if (isAuthenticated) {
      // Poll for new notifications every 30 seconds
      const notificationInterval = setInterval(() => {
        // Use appropriate loading function based on current tab
        if (activeTab === 'notifications') {
          loadNotifications();
        } else {
          loadDropdownNotifications();
        }
      }, 30000); // 30 seconds

      // Auto-refresh current tab data every 60 seconds
      const dataRefreshInterval = setInterval(() => {
        // Always refresh backend health for overview card
        loadBackendHealth().catch(error => console.error('Error auto-refreshing backend health:', error));
        
        switch (activeTab) {
          case 'gallery':
            loadGalleryItems().catch(error => console.error('Error auto-refreshing gallery:', error));
            break;
          case 'packets':
            loadTravelPackets().catch(error => console.error('Error auto-refreshing packets:', error));
            break;
          case 'zinutes':
            loadContacts().catch(error => console.error('Error auto-refreshing contacts:', error));
            break;
          case 'atsiliepimai':
            loadReviews().catch(error => console.error('Error auto-refreshing reviews:', error));
            break;
          case 'notifications':
            loadNotifications().catch(error => console.error('Error auto-refreshing notifications:', error));
            break;
        }
      }, 60000); // 60 seconds

      return () => {
        clearInterval(notificationInterval);
        clearInterval(dataRefreshInterval);
      };
    }
  }, [isAuthenticated, activeTab]);

  // Reload notifications when sort order changes (only for notifications tab)
  useEffect(() => {
    if (isAuthenticated && activeTab === 'notifications') {
      loadNotifications();
    }
  }, [notificationSortBy, isAuthenticated, activeTab]);

  // Load notifications with current sort when switching to notifications tab
  useEffect(() => {
    if (isAuthenticated && activeTab === 'notifications') {
      loadNotifications();
    } else if (isAuthenticated && activeTab !== 'notifications') {
      // Load dropdown notifications for other tabs
      loadDropdownNotifications();
    }
  }, [activeTab, isAuthenticated]);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showNotificationsDropdown && !target.closest('.notifications-dropdown')) {
        setShowNotificationsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotificationsDropdown]);

  // Auto-fetch data when entering a tab
  useEffect(() => {
    if (!isAuthenticated) return;

    switch (activeTab) {
      case 'gallery':
        loadGalleryItems();
        break;
      case 'packets':
        loadTravelPackets();
        break;
      case 'zinutes':
        loadContacts();
        break;
      case 'atsiliepimai':
        loadReviews();
        break;
    }
  }, [activeTab, isAuthenticated]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      // Load all data in parallel
      await Promise.all([
        loadGalleryItems(),
        loadTravelPackets(),
        loadDropdownNotifications(), // Use dropdown notifications for initial load
        loadContacts(),
        loadReviews(),
        loadBackendHealth()
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
      const data = await galleryApi.getAll();
      
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
    } catch (error) {
      console.error('Error loading gallery items:', error);
    }
  };

  const loadTravelPackets = async () => {
    try {
      const data = await travelPacketsApi.getAll();
      
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
    } catch (error) {
      console.error('Error loading travel packets:', error);
    }
  };

  const loadBackendHealth = async () => {
    try {
      const data = await serverAPI.getBackendHealth();
      setBackendHealth(data);
    } catch (error) {
      console.error('Error loading backend health:', error);
      // Set a default state if the API fails
      setBackendHealth({
        backends: [],
        summary: {
          total: 0,
          healthy: 0,
          unhealthy: 0,
          down: 0,
          unknown: 0
        },
        isMonitoring: false,
        lastUpdate: new Date().toISOString()
      });
    }
  };

  // Check if notification has actionable content (can navigate somewhere)
  const hasNotificationAction = (notification: Notification) => {
    return ['contact', 'review', 'order'].includes(notification.type);
  };

  // Handle notification clicks - navigate to relevant tab and mark as read
  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark notification as read
      await notificationsAPI.markAsRead(notification.id);
      
      // Update both tab and dropdown notifications state
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      );
      setDropdownNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Navigate to appropriate tab based on notification type
      let targetTab: 'gallery' | 'packets' | 'zinutes' | 'atsiliepimai' | 'notifications' | 'analytics' | null = null;
      
      switch (notification.type) {
        case 'contact':
          targetTab = 'zinutes';
          break;
        case 'review':
          targetTab = 'atsiliepimai';
          break;
        case 'order':
          targetTab = 'packets';
          break;
        case 'system':
        default:
          // Stay on current tab for system notifications
          break;
      }
      
      if (targetTab) {
        setActiveTab(targetTab);
        
        // Set highlighting effect based on notification type and try to match the specific item
        if (notification.type === 'contact') {
          // Try to find a contact that matches the notification (by recent timestamp or content)
          const recentContact = contacts.find(contact => 
            Math.abs(new Date(contact.created_at).getTime() - new Date(notification.timestamp).getTime()) < 60000 // Within 1 minute
          );
          if (recentContact) {
            setHighlightedItemId(`contact-${recentContact.id}`);
          }
        } else if (notification.type === 'review') {
          // Try to find a review that matches the notification (by recent timestamp or content)
          const recentReview = reviews.find(review => 
            Math.abs(new Date(review.created_at).getTime() - new Date(notification.timestamp).getTime()) < 60000 // Within 1 minute
          );
          if (recentReview) {
            setHighlightedItemId(`review-${recentReview.id}`);
          }
        }
        
        // Clear highlighting after 3 seconds
        setTimeout(() => {
          setHighlightedItemId(null);
        }, 3000);
      }
      
      // Close notifications dropdown
      setShowNotificationsDropdown(false);
      
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      
      // Update both tab and dropdown notifications state
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );
      setDropdownNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
      
      // Close notifications dropdown
      setShowNotificationsDropdown(false);
      
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
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

  // Separate filtering functions for the new tabs
  const getFilteredContacts = () => {
    return contacts.filter(contact => {
      // Urgency filter
      if (urgencyFilter !== 'all' && contact.urgency !== urgencyFilter) return false;
      
      // Subject filter
      if (subjectFilter && !contact.subject?.toLowerCase().includes(subjectFilter.toLowerCase())) return false;
      
      // Contact method filter
      if (contactMethodFilter !== 'all' && contact.preferred_contact !== contactMethodFilter) return false;
      
      // Read status filter
      if (readStatusFilter !== 'all') {
        const isRead = readContacts.has(contact.id);
        if (readStatusFilter === 'read' && !isRead) return false;
        if (readStatusFilter === 'unread' && isRead) return false;
      }
      
      // Resolved status filter
      if (resolvedStatusFilter !== 'all') {
        if (resolvedStatusFilter === 'resolved' && !contact.is_resolved) return false;
        if (resolvedStatusFilter === 'unresolved' && contact.is_resolved) return false;
      }
      
      // Search query filter
      if (contactSearchQuery) {
        const query = contactSearchQuery.toLowerCase();
        return (
          contact.name.toLowerCase().includes(query) ||
          contact.email.toLowerCase().includes(query) ||
          contact.message.toLowerCase().includes(query) ||
          (contact.phone && contact.phone.toLowerCase().includes(query)) ||
          contact.subject.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  };

  const getFilteredReviews = () => {
    return reviews.filter(review => {
      // Rating filter
      if (ratingFilter !== 'all' && review.rating.toString() !== ratingFilter) return false;
      
      // Approval filter
      if (approvalFilter !== 'all') {
        if (approvalFilter === 'approved' && !review.is_approved) return false;
        if (approvalFilter === 'pending' && review.is_approved) return false;
      }
      
      // Search query filter
      if (reviewSearchQuery) {
        const query = reviewSearchQuery.toLowerCase();
        return (
          review.name.toLowerCase().includes(query) ||
          review.email.toLowerCase().includes(query) ||
          review.comment.toLowerCase().includes(query) ||
          (review.trip_reference && review.trip_reference.toLowerCase().includes(query))
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

  const handleLogout = () => {
    logout();
    navigate('/dashboard/login');
  };

  const handleGoToHome = () => {
    navigate('/');
  };

  // Contact handling functions
  const handleContactClick = (contactId: number) => {
    // Toggle expansion
    setExpandedContactId(expandedContactId === contactId ? null : contactId);
    
    // Mark as read when clicked
    if (!readContacts.has(contactId)) {
      setReadContacts(prev => new Set([...prev, contactId]));
    }
  };

  const toggleContactReadStatus = (contactId: number) => {
    setReadContacts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contactId)) {
        newSet.delete(contactId);
      } else {
        newSet.add(contactId);
      }
      return newSet;
    });
  };

  const getUnreadContactsCount = () => {
    return getFilteredContacts().filter(contact => !readContacts.has(contact.id)).length;
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
        ? `${API_BASE_URL}/gallery/${selectedGalleryItem.id}` 
        : `${API_BASE_URL}/gallery`;
      
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
        const response = await fetch(`${API_BASE_URL}/gallery/${id}`, {
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
        ? `${API_BASE_URL}/travel-packets/${selectedPacket.id}` 
        : `${API_BASE_URL}/travel-packets`;
      
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
        const response = await fetch(`${API_BASE_URL}/travel-packets/${id}`, {
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

  // Contact handlers
  const handleResolveContact = async (id: number) => {
    try {
      await contactsAPI.resolve(id);
      loadContacts(); // Reload contacts to reflect the changes
    } catch (error) {
      console.error('Error resolving contact:', error);
    }
  };

  const handleUnresolveContact = async (id: number) => {
    try {
      await contactsAPI.unresolve(id);
      loadContacts(); // Reload contacts to reflect the changes
    } catch (error) {
      console.error('Error unresolving contact:', error);
    }
  };

  // Review handlers
  const openApprovalModal = (review: Review) => {
    setReviewToApprove(review);
    setShowApprovalModal(true);
  };

  const handleApproveReview = async () => {
    if (!reviewToApprove) return;
    
    try {
      await reviewsAPI.approve(reviewToApprove.id);
      loadReviews(); // Reload reviews to reflect the changes
      setShowApprovalModal(false);
      setReviewToApprove(null);
    } catch (error) {
      console.error('Error approving review:', error);
    }
  };

  const handleUnapproveReview = async (id: number) => {
    if (window.confirm('Ar tikrai norite panaikinti šio atsiliepimo patvirtinimą? Jis neberodysis viešoje svetainėje.')) {
      try {
        await reviewsAPI.unapprove(id);
        loadReviews(); // Reload reviews to reflect the changes
      } catch (error) {
        console.error('Error unapproving review:', error);
      }
    }
  };

  const openEditModal = (review: Review) => {
    setReviewToEdit(review);
    setEditForm({
      name: review.name,
      email: review.email,
      rating: review.rating,
      comment: review.comment,
      trip_reference: review.trip_reference || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewToEdit) return;

    try {
      await reviewsAPI.update(reviewToEdit.id, editForm);
      loadReviews(); // Reload reviews to reflect the changes
      setShowEditModal(false);
      setReviewToEdit(null);
    } catch (error) {
      console.error('Error updating review:', error);
    }
  };

  const handleDeleteReview = async (id: number) => {
    if (window.confirm('Ar tikrai norite ištrinti šį atsiliepimą?')) {
      try {
        await reviewsAPI.delete(id);
        loadReviews(); // Reload reviews to reflect the changes
      } catch (error) {
        console.error('Error deleting review:', error);
      }
    }
  };

  // Notification functions
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
              
              {/* Notifications Dropdown */}
              <div className="relative notifications-dropdown">
                <button
                  onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                  className="relative flex items-center space-x-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className={`absolute -top-1 -right-1 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center ${
                      hasNewNotifications 
                        ? 'bg-red-500 animate-pulse' 
                        : 'bg-red-500'
                    }`}>
                      {unreadCount}
                    </span>
                  )}
                </button>
                
                {/* Notifications Dropdown */}
                {showNotificationsDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Pranešimai</h3>
                          {unreadCount > 0 && (
                            <p className="text-sm text-gray-500">{unreadCount} neperskaityti</p>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllNotificationsAsRead}
                            className="text-xs bg-teal-600 text-white px-3 py-1 rounded-lg hover:bg-teal-700 transition-colors duration-200"
                          >
                            Pažymėti viską
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {dropdownNotifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p>Nėra pranešimų</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {dropdownNotifications.slice(0, 10).map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-4 transition-colors duration-200 ${
                                hasNotificationAction(notification) 
                                  ? 'hover:bg-gray-50 cursor-pointer' 
                                  : 'cursor-default'
                              } ${
                                !notification.isRead ? 'bg-blue-50' : ''
                              }`}
                              onClick={() => hasNotificationAction(notification) && handleNotificationClick(notification)}
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`p-1 rounded-full ${getPriorityColor(notification.priority)}`}>
                                  {getTypeIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium text-gray-900 truncate">
                                      {notification.title}
                                    </h4>
                                    <span className="text-xs text-gray-500 ml-2">
                                      {new Date(notification.timestamp).toLocaleDateString('lt-LT')}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  {!notification.isRead && (
                                    <div className="flex items-center mt-2">
                                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                      <span className="text-xs text-blue-600 font-medium">Nauja</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Home Button */}
              <button
                onClick={handleGoToHome}
                className="flex items-center space-x-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors duration-200"
              >
                <Home className="h-4 w-4" />
                <span>Pagrindinis</span>
              </button>
              
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
              <div className={`p-2 rounded-lg ${
                backendHealth 
                  ? backendHealth.summary.down > 0 
                    ? 'bg-red-100' 
                    : backendHealth.summary.unhealthy > 0 
                      ? 'bg-yellow-100' 
                      : 'bg-green-100'
                  : 'bg-gray-100'
              }`}>
                <Server className={`h-6 w-6 ${
                  backendHealth 
                    ? backendHealth.summary.down > 0 
                      ? 'text-red-600' 
                      : backendHealth.summary.unhealthy > 0 
                        ? 'text-yellow-600' 
                        : 'text-green-600'
                    : 'text-gray-600'
                }`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Backend status</p>
                <p className="text-2xl font-bold text-gray-900">
                  {backendHealth 
                    ? `${backendHealth.summary.healthy}/${backendHealth.summary.total}`
                    : '0/0'
                  }
                </p>
                <p className="text-xs text-gray-500">
                  {backendHealth 
                    ? backendHealth.summary.down > 0 
                      ? `${backendHealth.summary.down} down`
                      : backendHealth.summary.unhealthy > 0 
                        ? `${backendHealth.summary.unhealthy} unhealthy`
                        : 'All healthy'
                    : 'Loading...'
                  }
                </p>
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
              onClick={() => setActiveTab('zinutes')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'zinutes'
                  ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Žinutės</span>
                {getUnreadContactsCount() > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                    {getUnreadContactsCount()}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('atsiliepimai')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'atsiliepimai'
                  ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Star className="h-5 w-5" />
                <span>Atsiliepimai</span>
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
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'analytics'
                  ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Analytics</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('server')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'server'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Server className="h-5 w-5" />
                <span>Server</span>
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

                {/* Contacts Tab (Žinutės) */}
                {activeTab === 'zinutes' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">Kontaktai</h3>
                      <button
                        onClick={loadContacts}
                        className="text-teal-600 hover:text-teal-800 text-sm font-medium"
                      >
                        Atnaujinti
                      </button>
                    </div>

                    {/* Filter Controls for Contacts */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-4">
                      {/* Search Bar */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                          type="text"
                          placeholder="Ieškoti pagal vardą, el. paštą, žinutę..."
                          value={contactSearchQuery}
                          onChange={(e) => setContactSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>

                      {/* Filter Dropdowns */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Perskaitytos</label>
                          <select
                            value={readStatusFilter}
                            onChange={(e) => setReadStatusFilter(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          >
                            <option value="all">Visos</option>
                            <option value="unread">Neperskaitytos</option>
                            <option value="read">Perskaitytos</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Išspręstos</label>
                          <select
                            value={resolvedStatusFilter}
                            onChange={(e) => setResolvedStatusFilter(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          >
                            <option value="all">Visos</option>
                            <option value="unresolved">Neišspręstos</option>
                            <option value="resolved">Išspręstos</option>
                          </select>
                        </div>
                      </div>

                      {/* Active Filters Display */}
                      {(contactSearchQuery || urgencyFilter !== 'all' || subjectFilter || contactMethodFilter !== 'all' || readStatusFilter !== 'all' || resolvedStatusFilter !== 'all') && (
                        <div className="flex items-center space-x-2 flex-wrap">
                          <span className="text-sm text-gray-600">Aktyvūs filtrai:</span>
                          {contactSearchQuery && (
                            <span className="px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded-full">
                              Paieška: {contactSearchQuery}
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
                          {readStatusFilter !== 'all' && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              Skaitymas: {readStatusFilter === 'read' ? 'Perskaitytos' : 'Neperskaitytos'}
                            </span>
                          )}
                          {resolvedStatusFilter !== 'all' && (
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                              Sprendimas: {resolvedStatusFilter === 'resolved' ? 'Išspręstos' : 'Neišspręstos'}
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setContactSearchQuery('');
                              setUrgencyFilter('all');
                              setSubjectFilter('');
                              setContactMethodFilter('all');
                              setReadStatusFilter('all');
                              setResolvedStatusFilter('all');
                            }}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-gray-200"
                          >
                            Išvalyti visus
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {getFilteredContacts().length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          {contactSearchQuery || urgencyFilter !== 'all' || subjectFilter || contactMethodFilter !== 'all' || readStatusFilter !== 'all' || resolvedStatusFilter !== 'all'
                            ? 'Nerasta kontaktų atitinkančių filtro kriterijus'
                            : 'Kontaktų nėra'
                          }
                        </div>
                      ) : (
                        getFilteredContacts().map((contact) => {
                          const isRead = readContacts.has(contact.id);
                          const isExpanded = expandedContactId === contact.id;
                          
                          return (
                            <div
                              key={contact.id}
                              className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                                highlightedItemId === `contact-${contact.id}` 
                                  ? 'ring-2 ring-teal-500 bg-teal-50 animate-pulse' 
                                  : isRead 
                                    ? 'bg-white border-gray-200 hover:shadow-md'
                                    : 'bg-blue-50 border-blue-200 hover:shadow-lg'
                              }`}
                              onClick={() => handleContactClick(contact.id)}
                            >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  {!isRead && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  )}
                                  <h4 className="font-semibold text-gray-900">{contact.name}</h4>
                                  <span className="text-sm text-gray-500">({contact.email})</span>
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUrgencyBadgeColor(contact.urgency)}`}>
                                    {getUrgencyLabel(contact.urgency)}
                                  </span>
                                  {contact.is_resolved && (
                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                      Išspręsta
                                    </span>
                                  )}
                                  {isRead && (
                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                                      Perskaityta
                                    </span>
                                  )}
                                </div>
                                
                                <p className="text-sm font-medium text-gray-700 mb-1">Tema: {contact.subject}</p>
                                
                                {isExpanded ? (
                                  <div className="text-sm text-gray-600 mb-2 whitespace-pre-wrap">
                                    {contact.message}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                    {contact.message.length > 120 
                                      ? `${contact.message.substring(0, 120)}...` 
                                      : contact.message
                                    }
                                  </p>
                                )}
                                
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <span>{new Date(contact.created_at).toLocaleString('lt-LT')}</span>
                                  {contact.phone && (
                                    <span className="flex items-center space-x-1">
                                      <Phone className="h-3 w-3" />
                                      <span>{contact.phone}</span>
                                    </span>
                                  )}
                                  <span className="flex items-center space-x-1">
                                    <Mail className="h-3 w-3" />
                                    <span>Pageidauja: {getContactMethodLabel(contact.preferred_contact)}</span>
                                  </span>
                                </div>

                                {isExpanded && (
                                  <div className="mt-4 pt-4 border-t border-gray-200">
                                    <h5 className="text-sm font-semibold text-gray-800 mb-2">Išsami informacija:</h5>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <span className="font-medium text-gray-600">Vardas:</span>
                                        <span className="ml-2 text-gray-900">{contact.name}</span>
                                      </div>
                                      <div>
                                        <span className="font-medium text-gray-600">El. paštas:</span>
                                        <span className="ml-2 text-gray-900">{contact.email}</span>
                                      </div>
                                      {contact.phone && (
                                        <div>
                                          <span className="font-medium text-gray-600">Telefonas:</span>
                                          <span className="ml-2 text-gray-900">{contact.phone}</span>
                                        </div>
                                      )}
                                      <div>
                                        <span className="font-medium text-gray-600">Skubumas:</span>
                                        <span className="ml-2 text-gray-900">{getUrgencyLabel(contact.urgency)}</span>
                                      </div>
                                      <div>
                                        <span className="font-medium text-gray-600">Kontaktas:</span>
                                        <span className="ml-2 text-gray-900">{getContactMethodLabel(contact.preferred_contact)}</span>
                                      </div>
                                      <div>
                                        <span className="font-medium text-gray-600">Sukurta:</span>
                                        <span className="ml-2 text-gray-900">{new Date(contact.created_at).toLocaleString('lt-LT')}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleContactReadStatus(contact.id);
                                  }}
                                  className={`p-2 rounded-lg transition-colors ${
                                    isRead 
                                      ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-50' 
                                      : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                                  }`}
                                  title={isRead ? "Pažymėti kaip neperskaitytą" : "Pažymėti kaip perskaitytą"}
                                >
                                  {isRead ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (contact.is_resolved) {
                                      handleUnresolveContact(contact.id);
                                    } else {
                                      handleResolveContact(contact.id);
                                    }
                                  }}
                                  className={`p-2 rounded-lg transition-colors ${
                                    contact.is_resolved
                                      ? 'text-orange-600 hover:text-orange-800 hover:bg-orange-50'
                                      : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                                  }`}
                                  title={contact.is_resolved ? "Pažymėti kaip neišspręstą" : "Pažymėti kaip išspręstą"}
                                >
                                  {contact.is_resolved ? <Clock className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                </button>
                                <div className="text-gray-400">
                                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Reviews Tab (Atsiliepimai) */}
                {activeTab === 'atsiliepimai' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">Atsiliepimai</h3>
                      <button
                        onClick={loadReviews}
                        className="text-teal-600 hover:text-teal-800 text-sm font-medium"
                      >
                        Atnaujinti
                      </button>
                    </div>

                    {/* Filter Controls for Reviews */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-4">
                      {/* Search Bar */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                          type="text"
                          placeholder="Ieškoti pagal vardą, el. paštą, komentarą..."
                          value={reviewSearchQuery}
                          onChange={(e) => setReviewSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>

                      {/* Filter Dropdowns */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Reitingas</label>
                          <select
                            value={ratingFilter}
                            onChange={(e) => setRatingFilter(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          >
                            <option value="all">Visi</option>
                            <option value="5">5 žvaigždutės</option>
                            <option value="4">4 žvaigždutės</option>
                            <option value="3">3 žvaigždutės</option>
                            <option value="2">2 žvaigždutės</option>
                            <option value="1">1 žvaigždutė</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Patvirtinimas</label>
                          <select
                            value={approvalFilter}
                            onChange={(e) => setApprovalFilter(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          >
                            <option value="all">Visi</option>
                            <option value="approved">Patvirtinti</option>
                            <option value="pending">Laukia patvirtinimo</option>
                          </select>
                        </div>
                      </div>

                      {/* Active Filters Display */}
                      {(reviewSearchQuery || ratingFilter !== 'all' || approvalFilter !== 'all') && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Aktyvūs filtrai:</span>
                          {reviewSearchQuery && (
                            <span className="px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded-full">
                              Paieška: {reviewSearchQuery}
                            </span>
                          )}
                          {ratingFilter !== 'all' && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                              Reitingas: {ratingFilter} ⭐
                            </span>
                          )}
                          {approvalFilter !== 'all' && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              Statusas: {approvalFilter === 'approved' ? 'Patvirtinti' : 'Laukia patvirtinimo'}
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setReviewSearchQuery('');
                              setRatingFilter('all');
                              setApprovalFilter('all');
                            }}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-gray-200"
                          >
                            Išvalyti visus
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {getFilteredReviews().length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          {reviewSearchQuery || ratingFilter !== 'all' || approvalFilter !== 'all'
                            ? 'Nerasta atsiliepimų atitinkančių filtro kriterijus'
                            : 'Atsiliepimų nėra'
                          }
                        </div>
                      ) : (
                        getFilteredReviews().map((review) => (
                          <div
                            key={review.id}
                            className={`p-4 rounded-lg border bg-white border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden ${highlightedItemId === `review-${review.id}` ? 'ring-2 ring-teal-500 bg-teal-50 animate-pulse' : ''}`}
                          >
                            <div className="flex flex-col space-y-3 min-w-0">
                              {/* Header with name, email, rating and status */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 flex-wrap min-w-0 flex-1">
                                  <h4 className="font-semibold text-gray-900 break-words">{review.name}</h4>
                                  <span className="text-sm text-gray-500 break-all">({review.email})</span>
                                  <div className="flex items-center space-x-1">
                                    {Array.from({ length: 5 }, (_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                    <span className="text-sm text-gray-500 ml-1">({review.rating}/5)</span>
                                  </div>
                                  {review.is_approved ? (
                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                      Patvirtintas
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                                      Laukia patvirtinimo
                                    </span>
                                  )}
                                </div>
                                
                                {/* Action buttons - always visible */}
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                  {!review.is_approved && (
                                    <button
                                      onClick={() => openApprovalModal(review)}
                                      className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50"
                                      title="Patvirtinti atsiliepimą"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </button>
                                  )}
                                  {review.is_approved && (
                                    <button
                                      onClick={() => handleUnapproveReview(review.id)}
                                      className="text-orange-600 hover:text-orange-800 p-2 rounded-lg hover:bg-orange-50"
                                      title="Panaikinti patvirtinimą"
                                    >
                                      <EyeOff className="h-4 w-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => openEditModal(review)}
                                    className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50"
                                    title="Redaguoti atsiliepimą"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteReview(review.id)}
                                    className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50"
                                    title="Ištrinti atsiliepimą"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                              
                              {/* Trip reference */}
                              {review.trip_reference && (
                                <p className="text-sm font-medium text-gray-700 break-words">Kelionė: {review.trip_reference}</p>
                              )}
                              
                              {/* Comment */}
                              <p className="text-sm text-gray-600 break-words overflow-wrap-anywhere">
                                {review.comment}
                              </p>
                              
                              {/* Timestamp */}
                              <div className="text-xs text-gray-500">
                                <span>{new Date(review.created_at).toLocaleString('lt-LT')}</span>
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
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <label className="text-sm font-medium text-gray-700">Rūšiuoti pagal:</label>
                          <select
                            value={notificationSortBy}
                            onChange={(e) => setNotificationSortBy(e.target.value as 'date' | 'priority' | 'type')}
                            className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                          >
                            <option value="date">Datą</option>
                            <option value="priority">Prioritetą</option>
                            <option value="type">Tipą</option>
                          </select>
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllNotificationsAsRead}
                            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors duration-200 text-sm font-medium"
                          >
                            Pažymėti viską kaip perskaityta
                          </button>
                        )}
                        <button
                          onClick={loadNotifications}
                          className="text-teal-600 hover:text-teal-800 text-sm font-medium"
                        >
                          Atnaujinti
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {notifications.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                          <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <h4 className="text-lg font-medium text-gray-900 mb-2">Nėra pranešimų</h4>
                          <p className="text-gray-500">Visi pranešimai bus rodomi čia</p>
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`bg-white rounded-lg shadow-sm border-l-4 p-6 transition-all duration-200 hover:shadow-md ${
                                !notification.isRead 
                                  ? 'border-l-blue-500 bg-blue-50/30' 
                                  : 'border-l-gray-200'
                              } ${
                                notification.priority === 'high' 
                                  ? 'border-l-red-500' 
                                  : notification.priority === 'medium'
                                  ? 'border-l-orange-500'
                                  : 'border-l-green-500'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4 flex-1">
                                  <div className={`p-2 rounded-full ${
                                    notification.priority === 'high' 
                                      ? 'bg-red-100 text-red-600' 
                                      : notification.priority === 'medium'
                                      ? 'bg-orange-100 text-orange-600'
                                      : 'bg-green-100 text-green-600'
                                  }`}>
                                    {getTypeIcon(notification.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <h4 className="text-lg font-semibold text-gray-900">
                                        {notification.title}
                                      </h4>
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        notification.priority === 'high' 
                                          ? 'bg-red-100 text-red-800' 
                                          : notification.priority === 'medium'
                                          ? 'bg-orange-100 text-orange-800'
                                          : 'bg-green-100 text-green-800'
                                      }`}>
                                        {notification.priority === 'high' ? 'Aukštas' : 
                                         notification.priority === 'medium' ? 'Vidutinis' : 'Žemas'} prioritetas
                                      </span>
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        notification.type === 'contact' ? 'bg-blue-100 text-blue-800' :
                                        notification.type === 'review' ? 'bg-purple-100 text-purple-800' :
                                        notification.type === 'order' ? 'bg-green-100 text-green-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {notification.type === 'contact' ? 'Kontaktas' :
                                         notification.type === 'review' ? 'Atsiliepimas' :
                                         notification.type === 'order' ? 'Užsakymas' : 'Sistema'}
                                      </span>
                                    </div>
                                    <p className="text-gray-700 mb-3 leading-relaxed">
                                      {notification.message}
                                    </p>
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-gray-500">
                                        {new Date(notification.timestamp).toLocaleString('lt-LT')}
                                      </span>
                                      {!notification.isRead && (
                                        <span className="inline-flex items-center text-blue-600 text-sm font-medium">
                                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                          Nauja
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 ml-4">
                                  {!notification.isRead && (
                                    <button
                                      onClick={() => handleNotificationClick(notification)}
                                      className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors duration-200"
                                    >
                                      Pažymėti perskaityta
                                    </button>
                                  )}
                                  {hasNotificationAction(notification) && (
                                    <button
                                      onClick={() => handleNotificationClick(notification)}
                                      className="text-teal-600 hover:text-teal-800 text-sm font-medium px-3 py-1 rounded-lg border border-teal-200 hover:bg-teal-50 transition-colors duration-200"
                                    >
                                      Peržiūrėti
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                  <GoogleAnalytics />
                )}

                {/* Server Monitoring Tab */}
                {activeTab === 'server' && (
                  <EnhancedServerMonitoring />
                )}

              </>
            )}
          </div>
        </div>
      </main>

      {/* Message Detail Modal - Removed as it's no longer needed with separated tabs */}

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

      {/* Review Approval Confirmation Modal */}
      {showApprovalModal && reviewToApprove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Patvirtinti atsiliepimą
            </h3>
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">Klientas:</p>
                <p className="font-medium">{reviewToApprove.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Įvertinimas:</p>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < reviewToApprove.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-sm text-gray-500 ml-1">({reviewToApprove.rating}/5)</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Atsiliepimas:</p>
                <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg">
                  {reviewToApprove.comment}
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setReviewToApprove(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Atšaukti
              </button>
              <button
                onClick={handleApproveReview}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Patvirtinti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Edit Modal */}
      {showEditModal && reviewToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Redaguoti atsiliepimą
            </h3>
            <form onSubmit={handleUpdateReview} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vardas</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">El. paštas</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Įvertinimas</label>
                  <select
                    value={editForm.rating}
                    onChange={(e) => setEditForm({...editForm, rating: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  >
                    <option value={1}>1 žvaigždutė</option>
                    <option value={2}>2 žvaigždutės</option>
                    <option value={3}>3 žvaigždutės</option>
                    <option value={4}>4 žvaigždutės</option>
                    <option value={5}>5 žvaigždutės</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kelionės numeris</label>
                  <input
                    type="text"
                    value={editForm.trip_reference}
                    onChange={(e) => setEditForm({...editForm, trip_reference: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Pvz.: KT2024-001"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Atsiliepimas</label>
                <textarea
                  value={editForm.comment}
                  onChange={(e) => setEditForm({...editForm, comment: e.target.value})}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setReviewToEdit(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Atšaukti
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Išsaugoti
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage; 