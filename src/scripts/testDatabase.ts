// Database test script
// This script tests the database connection and retrieves sample data

import { initializeDatabase, executeQuery, closeDatabase } from '../services/database';

const testDatabase = async () => {
  try {
    console.log('🧪 Testing database connection and data retrieval...');
    
    // Initialize database connection
    await initializeDatabase();
    
    // Test gallery items
    console.log('\n📸 Testing gallery items...');
    const galleryItems = await executeQuery('SELECT * FROM gallery ORDER BY id LIMIT 3');
    console.log(`Found ${galleryItems.length} gallery items:`);
    galleryItems.forEach(item => {
      console.log(`  - ${item.title} (${item.location})`);
    });
    
    // Test travel packets
    console.log('\n✈️ Testing travel packets...');
    const travelPackets = await executeQuery('SELECT * FROM travel_packets ORDER BY id LIMIT 3');
    console.log(`Found ${travelPackets.length} travel packets:`);
    travelPackets.forEach(packet => {
      console.log(`  - ${packet.title} (${packet.location}) - $${packet.price}`);
    });
    
    // Test notifications
    console.log('\n🔔 Testing notifications...');
    const notifications = await executeQuery('SELECT * FROM notifications ORDER BY id LIMIT 3');
    console.log(`Found ${notifications.length} notifications:`);
    notifications.forEach(notification => {
      console.log(`  - ${notification.title} (${notification.type})`);
    });
    
    // Test reviews
    console.log('\n⭐ Testing reviews...');
    const reviews = await executeQuery('SELECT * FROM reviews ORDER BY id LIMIT 3');
    console.log(`Found ${reviews.length} reviews:`);
    reviews.forEach(review => {
      console.log(`  - ${review.name} (${review.rating}/5 stars) - ${review.trip}`);
    });
    
    // Test unread notifications count
    console.log('\n📊 Testing statistics...');
    const unreadCount = await executeQuery('SELECT COUNT(*) as count FROM notifications WHERE is_read = false');
    console.log(`Unread notifications: ${unreadCount[0].count}`);
    
    const totalGalleryItems = await executeQuery('SELECT COUNT(*) as count FROM gallery WHERE is_active = true');
    console.log(`Active gallery items: ${totalGalleryItems[0].count}`);
    
    const totalTravelPackets = await executeQuery('SELECT COUNT(*) as count FROM travel_packets WHERE is_active = true');
    console.log(`Active travel packets: ${totalTravelPackets[0].count}`);
    
    console.log('\n✅ All database tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    throw error;
  } finally {
    // Close the database connection
    await closeDatabase();
  }
};

// Run the test if this script is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  testDatabase()
    .then(() => {
      console.log('🎉 Database test complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database test failed:', error);
      process.exit(1);
    });
}

export default testDatabase; 