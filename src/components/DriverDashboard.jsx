import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRides } from '../contexts/ProductionRideContext'
import toast from 'react-hot-toast'
import { 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  MessageCircle,
  CheckCircle,
  XCircle,
  Car,
  Navigation,
  StarIcon,
  Loader2
} from 'lucide-react'

const DriverDashboard = () => {
  const {
    bookingRequests,
    respondToBookingRequest,
    generateVerificationCode,
    loading,
    notifications
  } = useRides()

  const [activeRequest, setActiveRequest] = useState(null)
  const [showRequestModal, setShowRequestModal] = useState(false)

  // Auto-show modal for new requests
  useEffect(() => {
    if (bookingRequests.length > 0 && !activeRequest) {
      const latestRequest = bookingRequests[0]
      setActiveRequest(latestRequest)
      setShowRequestModal(true)
    }
  }, [bookingRequests, activeRequest])

  const handleAccept = async (requestId) => {
    try {
      const verificationCode = generateVerificationCode()
      const result = await respondToBookingRequest(requestId, 'accept', verificationCode)
      if (result.success) {
        setShowRequestModal(false)
        setActiveRequest(null)
        toast.success(`🎉 Booking accepted! Code: ${verificationCode}`)
      }
    } catch (error) {
      toast.error('Failed to accept booking request')
    }
  }

  const handleDecline = async (requestId) => {
    try {
      const result = await respondToBookingRequest(requestId, 'decline')
      if (result.success) {
        setShowRequestModal(false)
        setActiveRequest(null)
        toast.success('Booking request declined')
      }
    } catch (error) {
      toast.error('Failed to decline booking request')
    }
  }

  return (
    <>
      {/* Incoming Request Modal */}
      <AnimatePresence>
        {showRequestModal && activeRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-md rounded-t-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">New Ride Request!</h2>
                <div className="flex items-center space-x-1 text-yellow-500">
                  <StarIcon className="w-4 h-4 fill-current" />
                  <span className="text-sm font-medium">4.8</span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {activeRequest.passenger_name?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{activeRequest.passenger_name}</h3>
                    <p className="text-gray-600 text-sm">Wants {activeRequest.seats_requested} seat(s)</p>
                  </div>
                </div>

                <div className="space-y-3 bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600">Pickup</p>
                      <p className="font-medium">{activeRequest.pickup_point || 'Main Gate'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Navigation className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="text-sm text-gray-600">Destination</p>
                      <p className="font-medium">{activeRequest.destination || 'Academic Block A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600">Time</p>
                      <p className="font-medium">Now • 2 min away</p>
                    </div>
                  </div>
                </div>

                {activeRequest.message && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-blue-800 text-sm">
                      💬 "{activeRequest.message}"
                    </p>
                  </div>
                )}

                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-green-700 font-medium">Estimated Earning</span>
                    <span className="text-green-700 font-bold text-lg">₹45</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleDecline(activeRequest.id)}
                  disabled={loading}
                  className="flex items-center justify-center py-4 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 mr-2" />
                      Decline
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleAccept(activeRequest.id)}
                  disabled={loading}
                  className="flex items-center justify-center py-4 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Accept
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <button className="flex items-center justify-center py-3 border border-gray-300 rounded-xl hover:bg-gray-50">
                  <Phone className="w-5 h-5 mr-2 text-gray-600" />
                  <span className="text-gray-600">Call</span>
                </button>
                <button className="flex items-center justify-center py-3 border border-gray-300 rounded-xl hover:bg-gray-50">
                  <MessageCircle className="w-5 h-5 mr-2 text-gray-600" />
                  <span className="text-gray-600">Message</span>
                </button>
              </div>

              <p className="text-center text-gray-500 text-sm mt-4">
                Request expires in 30 seconds
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Driver Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Driver Status</h2>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-600 font-medium">Online</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{bookingRequests.length}</p>
            <p className="text-sm text-gray-600">Pending Requests</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">5</p>
            <p className="text-sm text-gray-600">Today's Rides</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">₹240</p>
            <p className="text-sm text-gray-600">Today's Earning</p>
          </div>
        </div>
      </motion.div>

      {/* Recent Requests */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
      >
        <h2 className="text-lg font-semibold mb-4">Recent Requests</h2>
        
        {bookingRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Car className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="font-medium">No pending requests</p>
            <p className="text-sm">New ride requests will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookingRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                    {request.passenger_name?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <p className="font-medium">{request.passenger_name}</p>
                    <p className="text-sm text-gray-600">{request.pickup_point} → Destination</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600">₹45</p>
                  <p className="text-xs text-gray-500">2 min ago</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Live Notifications */}
      <AnimatePresence>
        {notifications.slice(0, 3).map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-20 right-4 bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-40 max-w-sm"
          >
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-full ${
                notification.type === 'ride_request' ? 'bg-blue-100 text-blue-600' :
                notification.type === 'success' ? 'bg-green-100 text-green-600' :
                'bg-gray-100 text-gray-600'
              }`}>
                {notification.type === 'ride_request' ? <User className="w-4 h-4" /> :
                 notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> :
                 <MessageCircle className="w-4 h-4" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                <p className="text-xs text-gray-500">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </>
  )
}

export default DriverDashboard