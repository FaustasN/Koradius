import { executeQuery } from './database';

export interface TravelPacket {
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
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTravelPacketData {
  title: string;
  location: string;
  duration: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category: string;
  badge: string;
  description: string;
  includes: string[];
  availableSpots: number;
  departure: string;
}

export interface UpdateTravelPacketData extends Partial<CreateTravelPacketData> {
  id: number;
}

// Get all travel packets
export const getAllTravelPackets = async (): Promise<TravelPacket[]> => {
  try {
    const query = `
      SELECT 
        id,
        title,
        location,
        duration,
        price,
        original_price as "originalPrice",
        rating,
        reviews,
        image_url as "imageUrl",
        category,
        badge,
        description,
        includes,
        available_spots as "availableSpots",
        departure,
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM travel_packets 
      WHERE is_active = true 
      ORDER BY created_at DESC
    `;
    
    const rows = await executeQuery(query);
    return rows.map((row: any) => ({
      ...row,
      departure: row.departure?.toISOString().split('T')[0] || '',
      createdAt: row.createdAt?.toISOString() || '',
      updatedAt: row.updatedAt?.toISOString() || ''
    }));
  } catch (error) {
    console.error('Error fetching travel packets:', error);
    throw error;
  }
};

// Get travel packet by ID
export const getTravelPacketById = async (id: number): Promise<TravelPacket | null> => {
  try {
    const query = `
      SELECT 
        id,
        title,
        location,
        duration,
        price,
        original_price as "originalPrice",
        rating,
        reviews,
        image_url as "imageUrl",
        category,
        badge,
        description,
        includes,
        available_spots as "availableSpots",
        departure,
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM travel_packets 
      WHERE id = $1 AND is_active = true
    `;
    
    const rows = await executeQuery(query, [id]);
    
    if (rows.length === 0) {
      return null;
    }
    
    const row = rows[0];
    return {
      ...row,
      departure: row.departure?.toISOString().split('T')[0] || '',
      createdAt: row.createdAt?.toISOString() || '',
      updatedAt: row.updatedAt?.toISOString() || ''
    };
  } catch (error) {
    console.error('Error fetching travel packet:', error);
    throw error;
  }
};

// Create new travel packet
export const createTravelPacket = async (data: CreateTravelPacketData): Promise<TravelPacket> => {
  try {
    const query = `
      INSERT INTO travel_packets (
        title, location, duration, price, original_price, 
        image_url, category, badge, description, includes, 
        available_spots, departure
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING 
        id,
        title,
        location,
        duration,
        price,
        original_price as "originalPrice",
        rating,
        reviews,
        image_url as "imageUrl",
        category,
        badge,
        description,
        includes,
        available_spots as "availableSpots",
        departure,
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;
    
    const rows = await executeQuery(query, [
      data.title,
      data.location,
      data.duration,
      data.price,
      data.originalPrice,
      data.imageUrl,
      data.category,
      data.badge,
      data.description,
      data.includes,
      data.availableSpots,
      data.departure
    ]);
    
    const row = rows[0];
    return {
      ...row,
      departure: row.departure?.toISOString().split('T')[0] || '',
      createdAt: row.createdAt?.toISOString() || '',
      updatedAt: row.updatedAt?.toISOString() || ''
    };
  } catch (error) {
    console.error('Error creating travel packet:', error);
    throw error;
  }
};

// Update travel packet
export const updateTravelPacket = async (data: UpdateTravelPacketData): Promise<TravelPacket | null> => {
  try {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (data.title !== undefined) {
      updateFields.push(`title = $${paramIndex++}`);
      values.push(data.title);
    }
    
    if (data.location !== undefined) {
      updateFields.push(`location = $${paramIndex++}`);
      values.push(data.location);
    }
    
    if (data.duration !== undefined) {
      updateFields.push(`duration = $${paramIndex++}`);
      values.push(data.duration);
    }
    
    if (data.price !== undefined) {
      updateFields.push(`price = $${paramIndex++}`);
      values.push(data.price);
    }
    
    if (data.originalPrice !== undefined) {
      updateFields.push(`original_price = $${paramIndex++}`);
      values.push(data.originalPrice);
    }
    
    if (data.imageUrl !== undefined) {
      updateFields.push(`image_url = $${paramIndex++}`);
      values.push(data.imageUrl);
    }
    
    if (data.category !== undefined) {
      updateFields.push(`category = $${paramIndex++}`);
      values.push(data.category);
    }
    
    if (data.badge !== undefined) {
      updateFields.push(`badge = $${paramIndex++}`);
      values.push(data.badge);
    }
    
    if (data.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    
    if (data.includes !== undefined) {
      updateFields.push(`includes = $${paramIndex++}`);
      values.push(data.includes);
    }
    
    if (data.availableSpots !== undefined) {
      updateFields.push(`available_spots = $${paramIndex++}`);
      values.push(data.availableSpots);
    }
    
    if (data.departure !== undefined) {
      updateFields.push(`departure = $${paramIndex++}`);
      values.push(data.departure);
    }
    
    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }
    
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(data.id);
    
    const query = `
      UPDATE travel_packets 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND is_active = true
      RETURNING 
        id,
        title,
        location,
        duration,
        price,
        original_price as "originalPrice",
        rating,
        reviews,
        image_url as "imageUrl",
        category,
        badge,
        description,
        includes,
        available_spots as "availableSpots",
        departure,
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;
    
    const rows = await executeQuery(query, values);
    
    if (rows.length === 0) {
      return null;
    }
    
    const row = rows[0];
    return {
      ...row,
      departure: row.departure?.toISOString().split('T')[0] || '',
      createdAt: row.createdAt?.toISOString() || '',
      updatedAt: row.updatedAt?.toISOString() || ''
    };
  } catch (error) {
    console.error('Error updating travel packet:', error);
    throw error;
  }
};

// Delete travel packet (soft delete)
export const deleteTravelPacket = async (id: number): Promise<boolean> => {
  try {
    const query = `
      UPDATE travel_packets 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_active = true
    `;
    
    await executeQuery(query, [id]);
    return true;
  } catch (error) {
    console.error('Error deleting travel packet:', error);
    throw error;
  }
};

// Get travel packets by category
export const getTravelPacketsByCategory = async (category: string): Promise<TravelPacket[]> => {
  try {
    const query = `
      SELECT 
        id,
        title,
        location,
        duration,
        price,
        original_price as "originalPrice",
        rating,
        reviews,
        image_url as "imageUrl",
        category,
        badge,
        description,
        includes,
        available_spots as "availableSpots",
        departure,
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM travel_packets 
      WHERE category = $1 AND is_active = true 
      ORDER BY created_at DESC
    `;
    
    const rows = await executeQuery(query, [category]);
    return rows.map((row: any) => ({
      ...row,
      departure: row.departure?.toISOString().split('T')[0] || '',
      createdAt: row.createdAt?.toISOString() || '',
      updatedAt: row.updatedAt?.toISOString() || ''
    }));
  } catch (error) {
    console.error('Error fetching travel packets by category:', error);
    throw error;
  }
};

// Update travel packet rating and reviews
export const updateTravelPacketRating = async (id: number, rating: number, reviews: number): Promise<boolean> => {
  try {
    const query = `
      UPDATE travel_packets 
      SET rating = $1, reviews = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND is_active = true
    `;
    
    await executeQuery(query, [rating, reviews, id]);
    return true;
  } catch (error) {
    console.error('Error updating travel packet rating:', error);
    throw error;
  }
};

// Update available spots
export const updateAvailableSpots = async (id: number, availableSpots: number): Promise<boolean> => {
  try {
    const query = `
      UPDATE travel_packets 
      SET available_spots = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND is_active = true
    `;
    
    await executeQuery(query, [availableSpots, id]);
    return true;
  } catch (error) {
    console.error('Error updating available spots:', error);
    throw error;
  }
};

// Get travel packet statistics
export const getTravelPacketStats = async () => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_packets,
        COUNT(CASE WHEN category = 'weekend' THEN 1 END) as weekend_count,
        COUNT(CASE WHEN category = 'vacation' THEN 1 END) as vacation_count,
        COUNT(CASE WHEN category = 'medical' THEN 1 END) as medical_count,
        COUNT(CASE WHEN category = 'nature' THEN 1 END) as nature_count,
        AVG(price) as avg_price,
        SUM(available_spots) as total_available_spots
      FROM travel_packets 
      WHERE is_active = true
    `;
    
    const rows = await executeQuery(query);
    return rows[0] || {
      total_packets: 0,
      weekend_count: 0,
      vacation_count: 0,
      medical_count: 0,
      nature_count: 0,
      avg_price: 0,
      total_available_spots: 0
    };
  } catch (error) {
    console.error('Error fetching travel packet stats:', error);
    throw error;
  }
};

// Search travel packets
export const searchTravelPackets = async (searchTerm: string): Promise<TravelPacket[]> => {
  try {
    const query = `
      SELECT 
        id,
        title,
        location,
        duration,
        price,
        original_price as "originalPrice",
        rating,
        reviews,
        image_url as "imageUrl",
        category,
        badge,
        description,
        includes,
        available_spots as "availableSpots",
        departure,
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM travel_packets 
      WHERE is_active = true 
        AND (title ILIKE $1 OR location ILIKE $1 OR description ILIKE $1)
      ORDER BY created_at DESC
    `;
    
    const rows = await executeQuery(query, [`%${searchTerm}%`]);
    return rows.map((row: any) => ({
      ...row,
      departure: row.departure?.toISOString().split('T')[0] || '',
      createdAt: row.createdAt?.toISOString() || '',
      updatedAt: row.updatedAt?.toISOString() || ''
    }));
  } catch (error) {
    console.error('Error searching travel packets:', error);
    throw error;
  }
};

export default {
  getAllTravelPackets,
  getTravelPacketById,
  createTravelPacket,
  updateTravelPacket,
  deleteTravelPacket,
  getTravelPacketsByCategory,
  updateTravelPacketRating,
  updateAvailableSpots,
  getTravelPacketStats,
  searchTravelPackets
}; 