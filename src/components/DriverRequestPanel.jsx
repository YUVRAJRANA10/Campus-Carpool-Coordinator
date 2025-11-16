import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, MapPin, MessageCircle, Check, XCircle, Phone, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const DriverRequestPanel = ({ bookingRequests, onAccept, onDecline, onGenerateCode }) => {
  const [expandedRequest, setExpandedRequest] = useState(null)
  const [loading, setLoading] = useState({})

  const handleAccept = async (requestId) => {
    setLoading(prev => ({ ...prev, [requestId]: 'accepting' }))
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase()
      await onAccept(requestId, code)
      await onGenerateCode(requestId, code)
      toast.success('Booking request accepted! Code generated.')
    } catch (error) {
      console.error('Error accepting request:', error)
      toast.error('Failed to accept request')
    } finally {
      setLoading(prev => ({ ...prev, [requestId]: null }))
    }
  }

  const handleDecline = async (requestId) => {
    setLoading(prev => ({ ...prev, [requestId]: 'declining' }))
    try {
      await onDecline(requestId)
      toast.success('Booking request declined')
    } catch (error) {
      console.error('Error declining request:', error)
      toast.error('Failed to decline request')
    } finally {
      setLoading(prev => ({ ...prev, [requestId]: null }))
    }
  }

  if (!bookingRequests || bookingRequests.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Car className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2">No Booking Requests</h3>
        <p className="text-slate-600">When passengers request to join your rides, they'll appear here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Booking Requests</h2>
        <div className="bg-cu-red text-white px-3 py-1 rounded-full text-sm font-semibold">
          {bookingRequests.filter(req => req.status === 'pending').length} Pending
        </div>
      </div>

      {bookingRequests.map((request) => (
        <motion.div
          key={request.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`glass-card overflow-hidden transition-all duration-200 ${
            request.status === 'pending' ? 'border-l-4 border-orange-400' : 
            request.status === 'confirmed' ? 'border-l-4 border-green-400' :
            'border-l-4 border-red-400'
          }`}
        >
          {/* Request Header */}
          <div className="p-6">
            <div className="flex items-start justify-between">
              {/* Passenger Info */}
              <div className="flex items-start space-x-4">
                <div className="w-14 h-14 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {(request.passenger?.full_name || 'P').charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-800">
                    {request.passenger?.full_name || 'Passenger'}
                  </h3>
                  <p className="text-slate-600 text-sm">
                    {request.passenger?.department} • {request.passenger?.university_year || 'Student'}
                  </p>
                  
                  {/* Ride Details */}
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin size={14} className="text-green-600" />
                      <span className="font-medium">{request.ride?.title}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <User size={14} />
                      <span>{request.seats_booked} seat{request.seats_booked > 1 ? 's' : ''}</span>
                      <span className="mx-2">•</span>
                      <span className="font-semibold text-cu-red">₹{request.total_amount}</span>
                    </div>
                    {request.pickup_point && request.pickup_point !== request.ride?.origin_name && (
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <MapPin size={14} className="text-blue-600" />
                        <span>Pickup: {request.pickup_point}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status & Actions */}
              <div className="text-right space-y-3">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  request.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                  request.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </div>

                <div className="text-xs text-slate-500">
                  <Clock size={12} className="inline mr-1" />
                  {new Date(request.created_at).toLocaleString()}
                </div>

                {/* Action Buttons */}
                {request.status === 'pending' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDecline(request.id)}
                      disabled={loading[request.id]}
                      className="btn-ghost text-red-600 hover:bg-red-50 px-3 py-1 text-sm disabled:opacity-50"
                    >
                      {loading[request.id] === 'declining' ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <><XCircle size={14} className="mr-1" />Decline</>
                      )}
                    </button>
                    <button
                      onClick={() => handleAccept(request.id)}
                      disabled={loading[request.id]}
                      className="btn-primary px-3 py-1 text-sm disabled:opacity-50"
                    >
                      {loading[request.id] === 'accepting' ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <><Check size={14} className="mr-1" />Accept</>
                      )}
                    </button>
                  </div>
                )}

                {request.status === 'confirmed' && request.verification_code && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                    <div className="text-xs text-green-800 font-medium mb-1">Verification Code:</div>
                    <div className="text-lg font-bold text-green-800 tracking-wider">
                      {request.verification_code}
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Share this code with the passenger for verification
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Message from Passenger */}
            {request.message && (
              <div className="mt-4 p-3 bg-white/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <MessageCircle size={14} className="text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">Message:</span>
                </div>
                <p className="text-sm text-slate-600">{request.message}</p>
              </div>
            )}

            {/* Contact Info (only for confirmed bookings) */}
            {request.status === 'confirmed' && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Phone size={14} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Contact Info:</span>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(request.passenger?.phone || 'No phone number')
                      toast.success('Phone number copied!')
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Copy Phone
                  </button>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  {request.passenger?.phone || 'Phone number not available'}
                </p>
              </div>
            )}

            {/* Expand/Collapse Button */}
            <button
              onClick={() => setExpandedRequest(expandedRequest === request.id ? null : request.id)}
              className="mt-4 text-sm text-cu-red hover:text-cu-red-dark font-medium"
            >
              {expandedRequest === request.id ? 'Show Less' : 'Show More Details'}
            </button>

            {/* Expanded Details */}
            <AnimatePresence>
              {expandedRequest === request.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 space-y-3 border-t border-white/20 pt-4"
                >
                  {/* Passenger Rating */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Passenger Rating:</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-500">★</span>
                      <span className="text-sm">{request.passenger?.rating || 5.0}</span>
                      <span className="text-xs text-slate-500">
                        ({request.passenger?.total_rides || 0} rides)
                      </span>
                    </div>
                  </div>

                  {/* Ride Timeline */}
                  <div className="text-sm">
                    <div className="font-medium mb-2">Ride Timeline:</div>
                    <div className="space-y-1 text-slate-600">
                      <div>Departure: {new Date(request.ride?.departure_time).toLocaleString()}</div>
                      <div>Route: {request.ride?.origin_name} → {request.ride?.destination_name}</div>
                      <div>Type: {request.ride?.ride_type}</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default DriverRequestPanel