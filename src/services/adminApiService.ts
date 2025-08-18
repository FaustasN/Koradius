// API service for Koradius backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Get auth token from cookie
const getAuthToken = (): string | null => {
  const nameEQ = "adminToken=";
  const ca = document.cookie.split(';');
  for (const cookie of ca) {
    let c = cookie;
    while (c.startsWith(' ')) c = c.substring(1, c.length);
    if (c.startsWith(nameEQ)) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

// Create authenticated request headers
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

// Auth API
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    return response.json();
  },

  validate: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/validate`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Token validation failed');
    }
    
    return response.json();
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return response.json();
  },
};

// Notifications API
export const notificationsAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
  },

  markAsRead: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to mark notification as read');
    return response.json();
  },

  markAllAsRead: async () => {
    const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to mark all notifications as read');
    return response.json();
  },

  getUnreadCount: async () => {
    const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch unread count');
    return response.json();
  },
};

// Contacts API
export const contactsAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/contacts`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch contacts');
    return response.json();
  },

  resolve: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/admin/contacts/${id}/resolve`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to resolve contact');
    return response.json();
  },

  unresolve: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/admin/contacts/${id}/unresolve`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to unresolve contact');
    return response.json();
  },

  submit: async (contactData: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    preferredContact?: string;
    urgency?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contactData),
    });
    if (!response.ok) throw new Error('Failed to submit contact form');
    return response.json();
  },
};

// Reviews API
export const reviewsAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/reviews`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch reviews');
    return response.json();
  },

  approve: async (id: number, featured = false) => {
    const response = await fetch(`${API_BASE_URL}/admin/reviews/${id}/approve`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ featured }),
    });
    if (!response.ok) throw new Error('Failed to approve review');
    return response.json();
  },

  unapprove: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/admin/reviews/${id}/unapprove`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to unapprove review');
    return response.json();
  },

  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/admin/reviews/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete review');
    return response.json();
  },

  getApproved: async () => {
    const response = await fetch(`${API_BASE_URL}/reviews/approved`);
    if (!response.ok) throw new Error('Failed to fetch approved reviews');
    return response.json();
  },

  submit: async (reviewData: {
    name: string;
    email: string;
    rating: number;
    comment: string;
    tripReference?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData),
    });
    if (!response.ok) throw new Error('Failed to submit review');
    return response.json();
  },

  update: async (id: number, reviewData: {
    name: string;
    email: string;
    rating: number;
    comment: string;
    trip_reference?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/admin/reviews/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(reviewData),
    });
    if (!response.ok) throw new Error('Failed to update review');
    return response.json();
  },
};

// Gallery API (keeping existing functionality)
export const galleryAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/gallery`);
    if (!response.ok) throw new Error('Failed to fetch gallery items');
    return response.json();
  },

  create: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/gallery`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create gallery item');
    return response.json();
  },

  update: async (id: number, data: any) => {
    const response = await fetch(`${API_BASE_URL}/gallery/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update gallery item');
    return response.json();
  },

  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/gallery/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete gallery item');
    return response.json();
  },
};

// Travel Packets API (keeping existing functionality)
export const travelPacketsAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/travel-packets`);
    if (!response.ok) throw new Error('Failed to fetch travel packets');
    return response.json();
  },

  create: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/travel-packets`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create travel packet');
    return response.json();
  },

  update: async (id: number, data: any) => {
    const response = await fetch(`${API_BASE_URL}/travel-packets/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update travel packet');
    return response.json();
  },

  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/travel-packets/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete travel packet');
    return response.json();
  },
};
