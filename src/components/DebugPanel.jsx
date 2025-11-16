import React, { useState } from 'react'
import { useRides } from '../contexts/ProductionRideContext'
import { useAuth } from '../contexts/AuthContext'
import { Bug, Database, User, Car, Calendar } from 'lucide-react'

const DebugPanel = () => {
  const { user } = useAuth()
  const { 
    rides, 
    myRides, 
    myBookings, 
    bookingRequests, 
    isSupabaseConfigured, 
    loading,
    addNotification 
  } = useRides()
  
  const [showDebug, setShowDebug] = useState(false)

  const debugInfo = {
    user: user ? {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || 'No name set'
    } : null,
    counts: {
      allRides: rides?.length || 0,
      myRides: myRides?.length || 0,
      myBookings: myBookings?.length || 0,
      bookingRequests: bookingRequests?.length || 0
    },
    config: {
      supabaseConfigured: isSupabaseConfigured(),
      loading: loading
    }
  }

  const testBooking = async () => {
    try {
      // Find a ride that's not yours
      const availableRide = rides?.find(ride => 
        ride.driver_id !== user?.id && 
        ride.available_seats > 0 && 
        ride.status === 'active'
      )
      
      if (!availableRide) {
        addNotification('❌ No rides available from other drivers. Create a second user account to test.', 'error')
        return
      }
      
      addNotification(`🧪 Testing booking for ride: ${availableRide.origin_name} → ${availableRide.destination_name}`, 'info')
      
      // This would trigger the actual booking
      console.log('Would book ride:', availableRide)
      
    } catch (error) {
      console.error('Test booking error:', error)
    }
  }

  if (!showDebug) {
    return (
      <button
        onClick={() => setShowDebug(true)}
        className="fixed bottom-4 right-4 bg-red-500 text-white p-3 rounded-full shadow-lg hover:bg-red-600 transition-colors z-50"
        title="Show Debug Panel"
      >
        <Bug className="w-5 h-5" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-xl p-4 max-w-md z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 flex items-center">
          <Bug className="w-4 h-4 mr-2" />
          Debug Panel
        </h3>
        <button
          onClick={() => setShowDebug(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>

      <div className="space-y-3 text-sm">
        {/* User Info */}
        <div className="bg-blue-50 p-2 rounded">
          <div className="flex items-center text-blue-700 mb-1">
            <User className="w-3 h-3 mr-1" />
            Current User
          </div>
          {debugInfo.user ? (
            <div className="text-xs text-gray-600">
              <div>ID: {debugInfo.user.id.substring(0, 8)}...</div>
              <div>Email: {debugInfo.user.email}</div>
              <div>Name: {debugInfo.user.name}</div>
            </div>
          ) : (
            <div className="text-red-600 text-xs">Not logged in</div>
          )}
        </div>

        {/* Data Counts */}
        <div className="bg-green-50 p-2 rounded">
          <div className="flex items-center text-green-700 mb-1">
            <Database className="w-3 h-3 mr-1" />
            Data Status
          </div>
          <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
            <div>All Rides: {debugInfo.counts.allRides}</div>
            <div>My Rides: {debugInfo.counts.myRides}</div>
            <div>My Bookings: {debugInfo.counts.myBookings}</div>
            <div>Requests: {debugInfo.counts.bookingRequests}</div>
          </div>
        </div>

        {/* Configuration */}
        <div className="bg-yellow-50 p-2 rounded">
          <div className="flex items-center text-yellow-700 mb-1">
            <Calendar className="w-3 h-3 mr-1" />
            Configuration
          </div>
          <div className="text-xs text-gray-600">
            <div>Supabase: {debugInfo.config.supabaseConfigured ? '✅' : '❌'}</div>
            <div>Loading: {debugInfo.config.loading ? '⏳' : '✅'}</div>
          </div>
        </div>

        {/* Current Rides */}
        {rides && rides.length > 0 && (
          <div className="bg-purple-50 p-2 rounded">
            <div className="flex items-center text-purple-700 mb-1">
              <Car className="w-3 h-3 mr-1" />
              Available Rides
            </div>
            <div className="max-h-20 overflow-y-auto text-xs">
              {rides.slice(0, 3).map((ride, index) => (
                <div key={ride.id} className="text-gray-600 border-b border-gray-200 py-1">
                  <div>{ride.origin_name} → {ride.destination_name}</div>
                  <div className="text-gray-500">
                    {ride.driver_id === user?.id ? '(Your ride)' : '(Other driver)'}
                    {' • '}₹{ride.price_per_seat}
                    {' • '}{ride.available_seats} seats
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="border-t pt-2">
          <button
            onClick={testBooking}
            className="w-full bg-blue-500 text-white text-xs py-1 rounded hover:bg-blue-600 transition-colors"
          >
            Test Booking Flow
          </button>
        </div>

        {/* Issues */}
        <div className="bg-red-50 p-2 rounded text-xs">
          <div className="text-red-700 font-medium mb-1">Common Issues:</div>
          <div className="text-gray-600 space-y-1">
            <div>• No booking requests? Use 2 different users</div>
            <div>• Database errors? Run fixDatabaseIssues.sql</div>
            <div>• Can't book? Don't book your own rides</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DebugPanel