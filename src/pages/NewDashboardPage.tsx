import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  Bell, 
  Users, 
  Star, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Image, 
  Package,
  Calendar,
  Mail,
  Phone,
  User
} from 'lucide-react';
import { notificationsAPI, contactsAPI, reviewsAPI, galleryAPI, travelPacketsAPI } from '../services/adminApiService';

// Types
interface Notification {
  id: number;
  type: 'contact' | 'review' | 'order' | 'system';
  title: string;
  message: string;
  reference_id?: number;
  reference_type?: string;
  timestamp: string;
  is_read: boolean;
  read_by?: number;
  read_by_username?: string;
  read_at?: string;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
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
  ip_address: string;
  is_resolved: boolean;
  resolved_by?: number;
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
  ip_address: string;
  is_approved: boolean;
  is_featured: boolean;
  approved_by?: number;
  approved_at?: string;
  created_at: string;
}

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

type TabType = 'notifications' | 'contacts' | 'reviews' | 'gallery' | 'packets';

const DashboardPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('notifications');
  const [isLoading, setIsLoading] = useState(false);

  // Data states
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [travelPackets, setTravelPackets] = useState<TravelPacket[]>([]);

  // Counts
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unresolvedContacts, setUnresolvedContacts] = useState(0);
  const [pendingReviews, setPendingReviews] = useState(0);

  // Load all data on mount
  useEffect(() => {
    loadAllData();
    
    // Set up periodic refresh for notifications
    const interval = setInterval(loadNotifications, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadNotifications(),
        loadContacts(),
        loadReviews(),
        loadGalleryItems(),
        loadTravelPackets(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const data = await notificationsAPI.getAll();
      setNotifications(data);
      setUnreadNotifications(data.filter((n: Notification) => !n.is_read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadContacts = async () => {
    try {
      const data = await contactsAPI.getAll();
      setContacts(data);
      setUnresolvedContacts(data.filter((c: Contact) => !c.is_resolved).length);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const loadReviews = async () => {
    try {
      const data = await reviewsAPI.getAll();
      setReviews(data);
      setPendingReviews(data.filter((r: Review) => !r.is_approved).length);
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  const loadGalleryItems = async () => {
    try {
      const data = await galleryAPI.getAll();
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
      const data = await travelPacketsAPI.getAll();
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

  // Action handlers
  const handleMarkNotificationRead = async (id: number) => {
    try {
      await notificationsAPI.markAsRead(id);
      await loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      await loadNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleResolveContact = async (id: number) => {
    try {
      await contactsAPI.resolve(id);
      await loadContacts();
    } catch (error) {
      console.error('Error resolving contact:', error);
    }
  };

  const handleApproveReview = async (id: number, featured = false) => {
    try {
      await reviewsAPI.approve(id, featured);
      await loadReviews();
    } catch (error) {
      console.error('Error approving review:', error);
    }
  };

  const handleDeleteReview = async (id: number) => {
    try {
      await reviewsAPI.delete(id);
      await loadReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/dashboard/login');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return 'text-red-600 bg-red-100';
      case 'urgent': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Koradius Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Manage your travel business</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { 
                id: 'notifications' as TabType, 
                name: 'Notifications', 
                icon: Bell, 
                count: unreadNotifications,
                color: 'red'
              },
              { 
                id: 'contacts' as TabType, 
                name: 'Contacts', 
                icon: Users, 
                count: unresolvedContacts,
                color: 'blue'
              },
              { 
                id: 'reviews' as TabType, 
                name: 'Reviews', 
                icon: Star, 
                count: pendingReviews,
                color: 'yellow'
              },
              { 
                id: 'gallery' as TabType, 
                name: 'Gallery', 
                icon: Image, 
                count: galleryItems.length,
                color: 'green'
              },
              { 
                id: 'packets' as TabType, 
                name: 'Travel Packages', 
                icon: Package, 
                count: travelPackets.length,
                color: 'purple'
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={20} />
                  <span>{tab.name}</span>
                  {tab.count > 0 && (
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      (() => {
                        if (tab.id === 'notifications' && tab.count > 0) return 'bg-red-500 text-white';
                        if (tab.id === 'contacts' && tab.count > 0) return 'bg-blue-500 text-white';
                        if (tab.id === 'reviews' && tab.count > 0) return 'bg-yellow-500 text-white';
                        return 'bg-gray-200 text-gray-700';
                      })()
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Notifications</h2>
                  {unreadNotifications > 0 && (
                    <button
                      onClick={handleMarkAllNotificationsRead}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Mark All Read
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border ${
                        notification.is_read ? 'bg-gray-50' : 'bg-white border-blue-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(notification.priority)}`}>
                              {notification.priority.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500">{notification.type}</span>
                            <span className="text-xs text-gray-500">{formatDate(notification.timestamp)}</span>
                          </div>
                          <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                          <p className="text-gray-600 mt-1">{notification.message}</p>
                        </div>
                        {!notification.is_read && (
                          <button
                            onClick={() => handleMarkNotificationRead(notification.id)}
                            className="ml-4 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="text-center py-8">
                      <Bell className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                      <p className="mt-1 text-sm text-gray-500">You're all caught up!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contacts Tab */}
            {activeTab === 'contacts' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Contact Messages</h2>
                  <div className="text-sm text-gray-500">
                    {unresolvedContacts} unresolved of {contacts.length} total
                  </div>
                </div>
                <div className="space-y-4">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className={`p-6 rounded-lg border ${
                        contact.is_resolved ? 'bg-gray-50' : 'bg-white border-blue-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-3">
                            <div className="flex items-center space-x-2">
                              <User size={16} />
                              <span className="font-medium">{contact.name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Mail size={16} />
                              <span className="text-gray-600">{contact.email}</span>
                            </div>
                            {contact.phone && (
                              <div className="flex items-center space-x-2">
                                <Phone size={16} />
                                <span className="text-gray-600">{contact.phone}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mb-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${getUrgencyColor(contact.urgency)}`}>
                              {contact.urgency.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500">
                              Preferred contact: {contact.preferred_contact}
                            </span>
                            <span className="text-xs text-gray-500">{formatDate(contact.created_at)}</span>
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-2">{contact.subject}</h3>
                          <p className="text-gray-600 whitespace-pre-wrap">{contact.message}</p>
                          <div className="mt-2 text-xs text-gray-400">
                            IP: {contact.ip_address}
                          </div>
                        </div>
                        {!contact.is_resolved && (
                          <button
                            onClick={() => handleResolveContact(contact.id)}
                            className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                          >
                            <CheckCircle size={16} />
                            <span>Resolve</span>
                          </button>
                        )}
                        {contact.is_resolved && (
                          <div className="ml-4 px-4 py-2 bg-green-100 text-green-800 rounded-lg flex items-center space-x-2">
                            <CheckCircle size={16} />
                            <span>Resolved</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {contacts.length === 0 && (
                    <div className="text-center py-8">
                      <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No contact messages</h3>
                      <p className="mt-1 text-sm text-gray-500">Contact messages will appear here.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Customer Reviews</h2>
                  <div className="text-sm text-gray-500">
                    {pendingReviews} pending approval of {reviews.length} total
                  </div>
                </div>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className={`p-6 rounded-lg border ${
                        review.is_approved ? 'bg-gray-50' : 'bg-white border-yellow-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-3">
                            <div className="flex items-center space-x-2">
                              <User size={16} />
                              <span className="font-medium">{review.name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Mail size={16} />
                              <span className="text-gray-600">{review.email}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={`star-${review.id}-${i}`}
                                  size={16}
                                  className={i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}
                                />
                              ))}
                              <span className="ml-1 text-sm text-gray-600">{review.rating}/5</span>
                            </div>
                          </div>
                          {review.trip_reference && (
                            <div className="mb-3">
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                Trip: {review.trip_reference}
                              </span>
                            </div>
                          )}
                          <p className="text-gray-700 whitespace-pre-wrap mb-3">{review.comment}</p>
                          <div className="text-xs text-gray-400">
                            Submitted: {formatDate(review.created_at)} | IP: {review.ip_address}
                          </div>
                          {review.is_featured && (
                            <div className="mt-2">
                              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                                ⭐ Featured Review
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4 flex flex-col space-y-2">
                          {!review.is_approved ? (
                            <>
                              <button
                                onClick={() => handleApproveReview(review.id, false)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                              >
                                <CheckCircle size={16} />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleApproveReview(review.id, true)}
                                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center space-x-2"
                              >
                                <Star size={16} />
                                <span>Feature</span>
                              </button>
                              <button
                                onClick={() => handleDeleteReview(review.id)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
                              >
                                <XCircle size={16} />
                                <span>Delete</span>
                              </button>
                            </>
                          ) : (
                            <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg flex items-center space-x-2">
                              <CheckCircle size={16} />
                              <span>Approved</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {reviews.length === 0 && (
                    <div className="text-center py-8">
                      <Star className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews</h3>
                      <p className="mt-1 text-sm text-gray-500">Customer reviews will appear here.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Gallery Tab */}
            {activeTab === 'gallery' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Gallery Management</h2>
                  <div className="text-sm text-gray-500">
                    {galleryItems.length} gallery items
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {galleryItems.map((item) => (
                    <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900">{item.title}</h3>
                        <p className="text-gray-600 text-sm">{item.location}</p>
                        <p className="text-gray-500 text-xs mt-2">By {item.photographer}</p>
                        <div className="flex justify-between items-center mt-3">
                          <span className="text-xs text-gray-500">{item.likes} likes</span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {item.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {galleryItems.length === 0 && (
                  <div className="text-center py-8">
                    <Image className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No gallery items</h3>
                    <p className="mt-1 text-sm text-gray-500">Gallery items will appear here.</p>
                  </div>
                )}
              </div>
            )}

            {/* Travel Packages Tab */}
            {activeTab === 'packets' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Travel Packages</h2>
                  <div className="text-sm text-gray-500">
                    {travelPackets.length} travel packages
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {travelPackets.map((packet) => (
                    <div key={packet.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                      <img
                        src={packet.imageUrl}
                        alt={packet.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900">{packet.title}</h3>
                          {packet.badge && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              {packet.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{packet.location}</p>
                        <p className="text-gray-500 text-sm mb-3">{packet.duration}</p>
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-xl font-bold text-green-600">€{packet.price}</span>
                            {packet.originalPrice && (
                              <span className="text-sm text-gray-500 line-through">€{packet.originalPrice}</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star size={16} className="text-yellow-500 fill-current" />
                            <span className="text-sm text-gray-600">{packet.rating}</span>
                            <span className="text-sm text-gray-500">({packet.reviews})</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <span>{packet.availableSpots} spots available</span>
                          <div className="flex items-center space-x-1">
                            <Calendar size={16} />
                            <span>{packet.departure}</span>
                          </div>
                        </div>
                        <div className="mt-3">
                          <span className={`px-2 py-1 text-xs rounded ${
                            packet.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {packet.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {travelPackets.length === 0 && (
                  <div className="text-center py-8">
                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No travel packages</h3>
                    <p className="mt-1 text-sm text-gray-500">Travel packages will appear here.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
