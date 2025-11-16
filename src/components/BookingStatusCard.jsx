import React from 'react'
import { motion } from 'framer-motion'
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

const BookingStatusCard = ({ booking, type = 'passenger' }) => {
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          color: 'text-yellow-600 bg-yellow-50',
          borderColor: 'border-yellow-200',
          text: 'Pending',
          description: type === 'passenger' 
            ? 'Waiting for driver confirmation' 
            : 'Awaiting your response'
        }
      case 'confirmed':
        return {
          icon: CheckCircle,
          color: 'text-green-600 bg-green-50',
          borderColor: 'border-green-200',
          text: 'Confirmed',
          description: type === 'passenger' 
            ? 'Booking confirmed!' 
            : 'You approved this booking'
        }
      case 'cancelled':
        return {
          icon: XCircle,
          color: 'text-red-600 bg-red-50',
          borderColor: 'border-red-200',
          text: 'Cancelled',
          description: type === 'passenger' 
            ? 'Booking was declined' 
            : 'You declined this booking'
        }
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-600 bg-gray-50',
          borderColor: 'border-gray-200',
          text: status,
          description: 'Unknown status'
        }
    }
  }

  const statusInfo = getStatusInfo(booking.status)
  const StatusIcon = statusInfo.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-lg border ${statusInfo.borderColor} ${statusInfo.color.split(' ')[1]} mb-4`}
    >
      <div className="flex items-start space-x-3">
        <div className={`p-2 rounded-full ${statusInfo.color}`}>
          <StatusIcon className="w-5 h-5" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {type === 'passenger' ? 'Your Booking' : 'Booking Request'}
            </h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
              {statusInfo.text}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mt-1">
            {statusInfo.description}
          </p>
          
          {/* Ride Details */}
          <div className="mt-3 p-3 bg-white rounded-md border border-gray-100">
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <span className="font-medium">Route:</span>
              <span>{booking.ride?.origin_name} → {booking.ride?.destination_name}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
              <span>Seats:</span>
              <span>{booking.seats_booked}</span>
              <span>•</span>
              <span>Amount: ₹{booking.total_amount}</span>
            </div>
            
            {booking.verification_code && (
              <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                <span className="text-sm font-medium text-green-800">
                  Verification Code: {booking.verification_code}
                </span>
              </div>
            )}
          </div>
          
          {/* Passenger Info for Drivers */}
          {type === 'driver' && booking.passenger && (
            <div className="mt-3 flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-800">
                  {booking.passenger.full_name?.charAt(0) || 'P'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {booking.passenger.full_name || 'Passenger'}
                </p>
                <p className="text-xs text-gray-500">
                  {booking.passenger.department || 'Student'}
                </p>
              </div>
            </div>
          )}
          
          <div className="mt-2 text-xs text-gray-400">
            Booked on {new Date(booking.created_at).toLocaleDateString()} at{' '}
            {new Date(booking.created_at).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default BookingStatusCard