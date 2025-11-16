// Create test rides if database is empty
import dbHelpers from '../src/utils/supabase.js'

const testRides = [
  {
    driver_id: 'test-user-1',
    origin_name: 'Main Campus',
    destination_name: 'City Center',
    departure_time: '2024-11-17 09:00:00',
    available_seats: 3,
    price_per_seat: 50,
    vehicle_details: 'Honda City',
    additional_info: 'Comfortable ride to city center',
    status: 'active'
  },
  {
    driver_id: 'test-user-2', 
    origin_name: 'Hostel Block A',
    destination_name: 'Metro Station',
    departure_time: '2024-11-17 14:00:00',
    available_seats: 2,
    price_per_seat: 30,
    vehicle_details: 'Maruti Swift',
    additional_info: 'Quick ride to metro',
    status: 'active'
  },
  {
    driver_id: 'test-user-3',
    origin_name: 'Library',
    destination_name: 'Shopping Mall',
    departure_time: '2024-11-17 18:00:00',
    available_seats: 4,
    price_per_seat: 40,
    vehicle_details: 'Toyota Innova',
    additional_info: 'Evening shopping trip',
    status: 'active'
  }
]

async function createTestRides() {
  console.log('🚗 Creating test rides...')
  
  try {
    for (const ride of testRides) {
      console.log('Creating ride:', ride.origin_name, '->', ride.destination_name)
      const result = await dbHelpers.createRide(ride)
      if (result) {
        console.log('✅ Created ride:', result.id)
      } else {
        console.log('❌ Failed to create ride')
      }
    }
    
    // Test fetching rides
    console.log('🔍 Fetching rides after creation...')
    const allRides = await dbHelpers.getRides()
    console.log('📊 Total rides:', allRides?.length || 0)
    
    return allRides
  } catch (error) {
    console.error('❌ Error creating test rides:', error)
  }
}

// Make it available globally for testing
if (typeof window !== 'undefined') {
  window.createTestRides = createTestRides
  console.log('🧪 Run createTestRides() in browser console to create test data')
}

export default createTestRides