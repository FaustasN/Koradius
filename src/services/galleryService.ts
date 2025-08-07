import { executeQuery } from './database';

export interface GalleryItem {
  id: number;
  title: string;
  location: string;
  category: string;
  imageUrl: string;
  photographer: string;
  date: string;
  likes: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateGalleryItemData {
  title: string;
  location: string;
  category: string;
  imageUrl: string;
  photographer: string;
}

export interface UpdateGalleryItemData extends Partial<CreateGalleryItemData> {
  id: number;
}

// Get all gallery items
export const getAllGalleryItems = async (): Promise<GalleryItem[]> => {
  try {
    const query = `
      SELECT 
        id,
        title,
        location,
        category,
        image_url as "imageUrl",
        photographer,
        date,
        likes,
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM gallery 
      WHERE is_active = true 
      ORDER BY created_at DESC
    `;
    
    const rows = await executeQuery(query);
    return rows.map((row: any) => ({
      ...row,
      date: row.date?.toISOString().split('T')[0] || '',
      createdAt: row.createdAt?.toISOString() || '',
      updatedAt: row.updatedAt?.toISOString() || ''
    }));
  } catch (error) {
    console.error('Error fetching gallery items:', error);
    throw error;
  }
};

// Get gallery item by ID
export const getGalleryItemById = async (id: number): Promise<GalleryItem | null> => {
  try {
    const query = `
      SELECT 
        id,
        title,
        location,
        category,
        image_url as "imageUrl",
        photographer,
        date,
        likes,
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM gallery 
      WHERE id = $1 AND is_active = true
    `;
    
    const rows = await executeQuery(query, [id]);
    
    if (rows.length === 0) {
      return null;
    }
    
    const row = rows[0];
    return {
      ...row,
      date: row.date?.toISOString().split('T')[0] || '',
      createdAt: row.createdAt?.toISOString() || '',
      updatedAt: row.updatedAt?.toISOString() || ''
    };
  } catch (error) {
    console.error('Error fetching gallery item:', error);
    throw error;
  }
};

// Create new gallery item
export const createGalleryItem = async (data: CreateGalleryItemData): Promise<GalleryItem> => {
  try {
    const query = `
      INSERT INTO gallery (title, location, category, image_url, photographer)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING 
        id,
        title,
        location,
        category,
        image_url as "imageUrl",
        photographer,
        date,
        likes,
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;
    
    const rows = await executeQuery(query, [
      data.title,
      data.location,
      data.category,
      data.imageUrl,
      data.photographer
    ]);
    
    const row = rows[0];
    return {
      ...row,
      date: row.date?.toISOString().split('T')[0] || '',
      createdAt: row.createdAt?.toISOString() || '',
      updatedAt: row.updatedAt?.toISOString() || ''
    };
  } catch (error) {
    console.error('Error creating gallery item:', error);
    throw error;
  }
};

// Update gallery item
export const updateGalleryItem = async (data: UpdateGalleryItemData): Promise<GalleryItem | null> => {
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
    
    if (data.category !== undefined) {
      updateFields.push(`category = $${paramIndex++}`);
      values.push(data.category);
    }
    
    if (data.imageUrl !== undefined) {
      updateFields.push(`image_url = $${paramIndex++}`);
      values.push(data.imageUrl);
    }
    
    if (data.photographer !== undefined) {
      updateFields.push(`photographer = $${paramIndex++}`);
      values.push(data.photographer);
    }
    
    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }
    
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(data.id);
    
    const query = `
      UPDATE gallery 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND is_active = true
      RETURNING 
        id,
        title,
        location,
        category,
        image_url as "imageUrl",
        photographer,
        date,
        likes,
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
      date: row.date?.toISOString().split('T')[0] || '',
      createdAt: row.createdAt?.toISOString() || '',
      updatedAt: row.updatedAt?.toISOString() || ''
    };
  } catch (error) {
    console.error('Error updating gallery item:', error);
    throw error;
  }
};

// Delete gallery item (soft delete)
export const deleteGalleryItem = async (id: number): Promise<boolean> => {
  try {
    const query = `
      UPDATE gallery 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_active = true
    `;
    
    const result = await executeQuery(query, [id]);
    return true; // Assuming success if no error thrown
  } catch (error) {
    console.error('Error deleting gallery item:', error);
    throw error;
  }
};

// Get gallery items by category
export const getGalleryItemsByCategory = async (category: string): Promise<GalleryItem[]> => {
  try {
    const query = `
      SELECT 
        id,
        title,
        location,
        category,
        image_url as "imageUrl",
        photographer,
        date,
        likes,
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM gallery 
      WHERE category = $1 AND is_active = true 
      ORDER BY created_at DESC
    `;
    
    const rows = await executeQuery(query, [category]);
    return rows.map((row: any) => ({
      ...row,
      date: row.date?.toISOString().split('T')[0] || '',
      createdAt: row.createdAt?.toISOString() || '',
      updatedAt: row.updatedAt?.toISOString() || ''
    }));
  } catch (error) {
    console.error('Error fetching gallery items by category:', error);
    throw error;
  }
};

// Update likes count for gallery item
export const updateGalleryItemLikes = async (id: number, likes: number): Promise<boolean> => {
  try {
    const query = `
      UPDATE gallery 
      SET likes = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND is_active = true
    `;
    
    await executeQuery(query, [likes, id]);
    return true;
  } catch (error) {
    console.error('Error updating gallery item likes:', error);
    throw error;
  }
};

// Get gallery statistics
export const getGalleryStats = async () => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN category = 'beach' THEN 1 END) as beach_count,
        COUNT(CASE WHEN category = 'city' THEN 1 END) as city_count,
        COUNT(CASE WHEN category = 'nature' THEN 1 END) as nature_count,
        SUM(likes) as total_likes
      FROM gallery 
      WHERE is_active = true
    `;
    
    const rows = await executeQuery(query);
    return rows[0] || {
      total_items: 0,
      beach_count: 0,
      city_count: 0,
      nature_count: 0,
      total_likes: 0
    };
  } catch (error) {
    console.error('Error fetching gallery stats:', error);
    throw error;
  }
};

export default {
  getAllGalleryItems,
  getGalleryItemById,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  getGalleryItemsByCategory,
  updateGalleryItemLikes,
  getGalleryStats
}; 