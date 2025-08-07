import { executeQuery } from './database';

export interface Notification {
  id: number;
  type: 'review' | 'order' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt?: string;
}

export interface CreateNotificationData {
  type: 'review' | 'order' | 'system';
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface UpdateNotificationData {
  id: number;
  isRead?: boolean;
  priority?: 'low' | 'medium' | 'high';
}

// Get all notifications
export const getAllNotifications = async (): Promise<Notification[]> => {
  try {
    const query = `
      SELECT 
        id,
        type,
        title,
        message,
        timestamp,
        is_read as "isRead",
        priority,
        created_at as "createdAt"
      FROM notifications 
      ORDER BY timestamp DESC
    `;
    
    const rows = await executeQuery(query);
    return rows.map((row: any) => ({
      ...row,
      timestamp: row.timestamp?.toISOString() || '',
      createdAt: row.createdAt?.toISOString() || ''
    }));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// Get unread notifications
export const getUnreadNotifications = async (): Promise<Notification[]> => {
  try {
    const query = `
      SELECT 
        id,
        type,
        title,
        message,
        timestamp,
        is_read as "isRead",
        priority,
        created_at as "createdAt"
      FROM notifications 
      WHERE is_read = false
      ORDER BY timestamp DESC
    `;
    
    const rows = await executeQuery(query);
    return rows.map((row: any) => ({
      ...row,
      timestamp: row.timestamp?.toISOString() || '',
      createdAt: row.createdAt?.toISOString() || ''
    }));
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    throw error;
  }
};

// Get notification by ID
export const getNotificationById = async (id: number): Promise<Notification | null> => {
  try {
    const query = `
      SELECT 
        id,
        type,
        title,
        message,
        timestamp,
        is_read as "isRead",
        priority,
        created_at as "createdAt"
      FROM notifications 
      WHERE id = $1
    `;
    
    const rows = await executeQuery(query, [id]);
    
    if (rows.length === 0) {
      return null;
    }
    
    const row = rows[0];
    return {
      ...row,
      timestamp: row.timestamp?.toISOString() || '',
      createdAt: row.createdAt?.toISOString() || ''
    };
  } catch (error) {
    console.error('Error fetching notification:', error);
    throw error;
  }
};

// Create new notification
export const createNotification = async (data: CreateNotificationData): Promise<Notification> => {
  try {
    const query = `
      INSERT INTO notifications (type, title, message, priority)
      VALUES ($1, $2, $3, $4)
      RETURNING 
        id,
        type,
        title,
        message,
        timestamp,
        is_read as "isRead",
        priority,
        created_at as "createdAt"
    `;
    
    const rows = await executeQuery(query, [
      data.type,
      data.title,
      data.message,
      data.priority || 'medium'
    ]);
    
    const row = rows[0];
    return {
      ...row,
      timestamp: row.timestamp?.toISOString() || '',
      createdAt: row.createdAt?.toISOString() || ''
    };
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Update notification
export const updateNotification = async (data: UpdateNotificationData): Promise<Notification | null> => {
  try {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (data.isRead !== undefined) {
      updateFields.push(`is_read = $${paramIndex++}`);
      values.push(data.isRead);
    }
    
    if (data.priority !== undefined) {
      updateFields.push(`priority = $${paramIndex++}`);
      values.push(data.priority);
    }
    
    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }
    
    values.push(data.id);
    
    const query = `
      UPDATE notifications 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING 
        id,
        type,
        title,
        message,
        timestamp,
        is_read as "isRead",
        priority,
        created_at as "createdAt"
    `;
    
    const rows = await executeQuery(query, values);
    
    if (rows.length === 0) {
      return null;
    }
    
    const row = rows[0];
    return {
      ...row,
      timestamp: row.timestamp?.toISOString() || '',
      createdAt: row.createdAt?.toISOString() || ''
    };
  } catch (error) {
    console.error('Error updating notification:', error);
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (id: number): Promise<boolean> => {
  try {
    const query = `
      UPDATE notifications 
      SET is_read = true
      WHERE id = $1
    `;
    
    await executeQuery(query, [id]);
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (): Promise<boolean> => {
  try {
    const query = `
      UPDATE notifications 
      SET is_read = true
      WHERE is_read = false
    `;
    
    await executeQuery(query);
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Delete notification
export const deleteNotification = async (id: number): Promise<boolean> => {
  try {
    const query = `
      DELETE FROM notifications 
      WHERE id = $1
    `;
    
    await executeQuery(query, [id]);
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Get notifications by type
export const getNotificationsByType = async (type: 'review' | 'order' | 'system'): Promise<Notification[]> => {
  try {
    const query = `
      SELECT 
        id,
        type,
        title,
        message,
        timestamp,
        is_read as "isRead",
        priority,
        created_at as "createdAt"
      FROM notifications 
      WHERE type = $1
      ORDER BY timestamp DESC
    `;
    
    const rows = await executeQuery(query, [type]);
    return rows.map((row: any) => ({
      ...row,
      timestamp: row.timestamp?.toISOString() || '',
      createdAt: row.createdAt?.toISOString() || ''
    }));
  } catch (error) {
    console.error('Error fetching notifications by type:', error);
    throw error;
  }
};

// Get notifications by priority
export const getNotificationsByPriority = async (priority: 'low' | 'medium' | 'high'): Promise<Notification[]> => {
  try {
    const query = `
      SELECT 
        id,
        type,
        title,
        message,
        timestamp,
        is_read as "isRead",
        priority,
        created_at as "createdAt"
      FROM notifications 
      WHERE priority = $1
      ORDER BY timestamp DESC
    `;
    
    const rows = await executeQuery(query, [priority]);
    return rows.map((row: any) => ({
      ...row,
      timestamp: row.timestamp?.toISOString() || '',
      createdAt: row.createdAt?.toISOString() || ''
    }));
  } catch (error) {
    console.error('Error fetching notifications by priority:', error);
    throw error;
  }
};

// Get notification statistics
export const getNotificationStats = async () => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_notifications,
        COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count,
        COUNT(CASE WHEN type = 'review' THEN 1 END) as review_count,
        COUNT(CASE WHEN type = 'order' THEN 1 END) as order_count,
        COUNT(CASE WHEN type = 'system' THEN 1 END) as system_count,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_count,
        COUNT(CASE WHEN priority = 'medium' THEN 1 END) as medium_priority_count,
        COUNT(CASE WHEN priority = 'low' THEN 1 END) as low_priority_count
      FROM notifications
    `;
    
    const rows = await executeQuery(query);
    return rows[0] || {
      total_notifications: 0,
      unread_count: 0,
      review_count: 0,
      order_count: 0,
      system_count: 0,
      high_priority_count: 0,
      medium_priority_count: 0,
      low_priority_count: 0
    };
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    throw error;
  }
};

// Create system notification
export const createSystemNotification = async (title: string, message: string, priority: 'low' | 'medium' | 'high' = 'medium'): Promise<Notification> => {
  return createNotification({
    type: 'system',
    title,
    message,
    priority
  });
};

// Create review notification
export const createReviewNotification = async (title: string, message: string, priority: 'low' | 'medium' | 'high' = 'medium'): Promise<Notification> => {
  return createNotification({
    type: 'review',
    title,
    message,
    priority
  });
};

// Create order notification
export const createOrderNotification = async (title: string, message: string, priority: 'low' | 'medium' | 'high' = 'medium'): Promise<Notification> => {
  return createNotification({
    type: 'order',
    title,
    message,
    priority
  });
};

// Get recent notifications (last 24 hours)
export const getRecentNotifications = async (hours: number = 24): Promise<Notification[]> => {
  try {
    const query = `
      SELECT 
        id,
        type,
        title,
        message,
        timestamp,
        is_read as "isRead",
        priority,
        created_at as "createdAt"
      FROM notifications 
      WHERE timestamp >= NOW() - INTERVAL '${hours} hours'
      ORDER BY timestamp DESC
    `;
    
    const rows = await executeQuery(query);
    return rows.map((row: any) => ({
      ...row,
      timestamp: row.timestamp?.toISOString() || '',
      createdAt: row.createdAt?.toISOString() || ''
    }));
  } catch (error) {
    console.error('Error fetching recent notifications:', error);
    throw error;
  }
};

export default {
  getAllNotifications,
  getUnreadNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationsByType,
  getNotificationsByPriority,
  getNotificationStats,
  createSystemNotification,
  createReviewNotification,
  createOrderNotification,
  getRecentNotifications
}; 