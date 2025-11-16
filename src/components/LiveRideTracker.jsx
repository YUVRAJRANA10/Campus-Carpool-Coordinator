import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Phone, 
  MessageCircle, 
  Car, 
  CheckCircle,
  User,
  Star
} from 'lucide-react'

const LiveRideTracker = ({ liveRide, userType, onUpdateStatus, onCompleteRide }) => {
  const [driverLocation, setDriverLocation] = useState(null)
  const [estimatedTime, setEstimatedTime] = useState('5 mins')

  const getRideStatusInfo = (status) => {
    const statusMap = {
      confirmed: {
        title: 'Ride Confirmed',
        description: userType === 'driver' ? 'Navigate to pickup location' : 'Driver is coming to pick you up',
        color: 'bg-blue-500',
        icon: CheckCircle
      },
      driver_arriving: {
        title: 'Driver Arriving',
        description: userType === 'driver' ? 'Heading to pickup point' : 'Driver is on the way',
        color: 'bg-yellow-500',
        icon: Navigation
      },
      arrived: {
        title: 'Driver Arrived',
        description: userType === 'driver' ? 'Waiting for passenger' : 'Your driver has arrived',
        color: 'bg-green-500',
        icon: MapPin
      },
      pickup_complete: {
        title: 'Trip Started',
        description: 'En route to destination',
        color: 'bg-purple-500',
        icon: Car
      },
      in_transit: {
        title: 'In Transit',
        description: 'Heading to destination',
        color: 'bg-indigo-500',
        icon: Navigation
      },
      completed: {
        title: 'Trip Completed',
        description: 'You have reached your destination',
        color: 'bg-green-600',
        icon: CheckCircle
      }
    }
    return statusMap[status] || statusMap.confirmed
  }

  const statusInfo = getRideStatusInfo(liveRide.ride_status)
  const StatusIcon = statusInfo.icon

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto">
        {/* Header */}
        <div className={`${statusInfo.color} text-white p-6 rounded-t-2xl`}>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-full">
              <StatusIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{statusInfo.title}</h2>
              <p className="text-white text-opacity-90">{statusInfo.description}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Trip Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Pickup</p>
                  <p className="font-semibold">{liveRide.ride?.origin_name}</p>
                </div>
              </div>
              <div className="border-l-2 border-dashed border-gray-300 ml-1.5 h-4"></div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Destination</p>
                  <p className="font-semibold">{liveRide.ride?.destination_name}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Driver/Passenger Info */}
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                {userType === 'driver' ? liveRide.passenger?.full_name : liveRide.driver?.full_name}
              </p>
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="text-sm text-gray-600">
                  {userType === 'driver' ? '4.8' : (liveRide.driver?.rating || '4.8')}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors">
                <Phone className="w-5 h-5" />
              </button>
              <button className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Time and Status */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">
                {liveRide.ride_status === 'confirmed' || liveRide.ride_status === 'driver_arriving' 
                  ? `ETA: ${estimatedTime}` 
                  : 'In Progress'
                }
              </span>
            </div>
            {liveRide.verification_code && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Verification Code</p>
                <p className="text-lg font-bold text-blue-600">{liveRide.verification_code}</p>
              </div>
            )}
          </div>

          {/* Action Buttons for Driver */}
          {userType === 'driver' && (
            <div className="space-y-3">
              {liveRide.ride_status === 'confirmed' && (
                <button
                  onClick={() => onUpdateStatus('driver_arriving')}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Start Journey to Pickup
                </button>
              )}
              
              {liveRide.ride_status === 'driver_arriving' && (
                <button
                  onClick={() => onUpdateStatus('arrived')}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  I've Arrived at Pickup
                </button>
              )}
              
              {liveRide.ride_status === 'arrived' && (
                <button
                  onClick={() => onUpdateStatus('pickup_complete')}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                >
                  Start Trip
                </button>
              )}
              
              {(liveRide.ride_status === 'pickup_complete' || liveRide.ride_status === 'in_transit') && (
                <button
                  onClick={() => onCompleteRide()}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Complete Trip
                </button>
              )}
            </div>
          )}

          {/* Passenger waiting info */}
          {userType === 'passenger' && liveRide.ride_status !== 'completed' && (
            <div className="text-center text-gray-600">
              <p className="text-sm">
                {liveRide.ride_status === 'confirmed' && 'Your driver will be there soon'}
                {liveRide.ride_status === 'driver_arriving' && 'Driver is on the way'}
                {liveRide.ride_status === 'arrived' && 'Driver has arrived at pickup location'}
                {(liveRide.ride_status === 'pickup_complete' || liveRide.ride_status === 'in_transit') && 'Enjoy your ride!'}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default LiveRideTracker