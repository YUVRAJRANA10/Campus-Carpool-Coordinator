import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, DollarSign, Clock, MapPin, MessageCircle, Check } from 'lucide-react'

const BookingRequestModal = ({ isOpen, onClose, ride, onConfirmBooking }) => {
  const [bookingData, setBookingData] = useState({
    seats_requested: 1,
    message: '',
    pickup_point: ride?.origin_name || ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (bookingData.seats_requested > ride.available_seats) {
      alert(`Only ${ride.available_seats} seats available!`)
      return
    }
    
    if (bookingData.seats_requested < 1) {
      alert('Please select at least 1 seat')
      return
    }

    setLoading(true)
    
    try {
      await onConfirmBooking({
        ...bookingData,
        ride_id: ride.id,
        total_amount: ride.price_per_seat * bookingData.seats_requested
      })
      onClose()
    } catch (error) {
      console.error('Booking failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalAmount = ride?.price_per_seat * bookingData.seats_requested || 0

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Book Ride</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Ride Info Summary */}
            <div className="bg-white/20 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-cu-red text-white rounded-full flex items-center justify-center font-bold">
                  {(ride?.driver?.full_name || 'D').charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{ride?.driver?.full_name}</h3>
                  <p className="text-sm text-slate-600">{ride?.driver?.department}</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <MapPin size={14} className="text-green-600" />
                  <span>{ride?.origin_name}</span>
                  <span className="text-slate-500">→</span>
                  <span>{ride?.destination_name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock size={14} className="text-blue-600" />
                  <span>{new Date(ride?.departure_time).toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users size={14} className="text-purple-600" />
                  <span>{ride?.available_seats} seats available</span>
                </div>
              </div>
            </div>

            {/* Booking Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Number of Seats *
                </label>
                <select
                  value={bookingData.seats_requested}
                  onChange={(e) => setBookingData(prev => ({ ...prev, seats_requested: parseInt(e.target.value) }))}
                  className="input-glass w-full"
                  required
                >
                  {[...Array(Math.min(ride?.available_seats || 1, 4))].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} Seat{i + 1 > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Pickup Point
                </label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={bookingData.pickup_point}
                    onChange={(e) => setBookingData(prev => ({ ...prev, pickup_point: e.target.value }))}
                    className="input-glass pl-10 w-full"
                    placeholder="Specific pickup location"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Message to Driver (Optional)
                </label>
                <div className="relative">
                  <MessageCircle size={18} className="absolute left-3 top-3.5 text-slate-400" />
                  <textarea
                    value={bookingData.message}
                    onChange={(e) => setBookingData(prev => ({ ...prev, message: e.target.value }))}
                    className="input-glass pl-10 w-full h-20 resize-none"
                    placeholder="Any special requests or information..."
                  />
                </div>
              </div>

              {/* Price Summary */}
              <div className="bg-white/20 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Price per seat:</span>
                  <span>₹{ride?.price_per_seat}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Seats:</span>
                  <span>{bookingData.seats_requested}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t border-white/20 pt-2">
                  <span>Total Amount:</span>
                  <span className="text-cu-red">₹{totalAmount}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary flex-1"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 flex items-center justify-center"
                  disabled={loading || bookingData.seats_requested > (ride?.available_seats || 0)}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Booking...
                    </>
                  ) : (
                    <>
                      <Check size={18} className="mr-2" />
                      Request Booking
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Info Note */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> Your booking request will be sent to the driver. 
                You'll be notified once they accept or decline your request.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default BookingRequestModal