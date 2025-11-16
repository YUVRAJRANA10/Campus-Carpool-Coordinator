import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRides } from '../contexts/ProductionRideContext'
import { useAuth } from '../contexts/AuthContext'
import { 
  MapPin, 
  Navigation, 
  Car, 
  Clock, 
  Star, 
  User,
  Phone,
  MessageCircle,
  X,
  ArrowLeft,
  ChevronRight,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

const MobileBookingFlow = ({ onClose }) => {
  const { user } = useAuth()
  const {
    rideStatus,
    currentRide,
    rides,
    bookRide,
    loading,
    generateVerificationCode
  } = useRides()

  const [step, setStep] = useState(1) // 1: Locations, 2: Vehicle Choice, 3: Confirmation, 4: Tracking
  const [bookingData, setBookingData] = useState({
    from: '',
    to: '',
    departureTime: '',
    selectedVehicle: null,
    estimatedFare: 0,
    estimatedTime: 0
  })
  const [nearbyDrivers, setNearbyDrivers] = useState([
    {
      id: 1,
      name: 'Rahul Kumar',
      rating: 4.8,
      eta: '2 mins',
      distance: '0.5 km',
      vehicle: 'Honda City',
      price: 120
    },
    {
      id: 2,
      name: 'Priya Singh',
      rating: 4.9,
      eta: '4 mins',
      distance: '1.2 km',
      vehicle: 'Maruti Swift',
      price: 115
    }
  ])
  const [demoRideStatus, setDemoRideStatus] = useState('searching')
  const [demoCurrentRide, setDemoCurrentRide] = useState(null)

  // Local ride estimation function
  const getRideEstimation = async (fromLocation, toLocation) => {
    // Simulate API call for price estimation
    const basePrice = 50
    const distanceMultiplier = Math.random() * 20 + 10 // 10-30 km simulation
    const estimatedFare = Math.round(basePrice + distanceMultiplier * 8)
    const estimatedTime = Math.round(distanceMultiplier * 2) // 2 mins per km
    
    return {
      estimatedFare,
      estimatedTime,
      distance: distanceMultiplier.toFixed(1) + ' km'
    }
  }

  // Auto-progress based on ride status
  useEffect(() => {
    if (rideStatus === 'searching') {
      setStep(4) // Move to tracking when searching
    } else if (rideStatus === 'matched') {
      setStep(4) // Stay on tracking when matched
    }
  }, [rideStatus])

  // Demo ride progression when reaching step 4
  useEffect(() => {
    if (step === 4) {
      setDemoRideStatus('searching')
      
      // Simulate finding a driver after 3 seconds
      const timer1 = setTimeout(() => {
        setDemoRideStatus('matched')
        setDemoCurrentRide({
          driver: nearbyDrivers[0],
          pickupTime: '5 mins',
          vehicle: nearbyDrivers[0].vehicle,
          plateNumber: 'HR-05-1234'
        })
      }, 3000)
      
      // Simulate driver arriving after 8 seconds
      const timer2 = setTimeout(() => {
        setDemoRideStatus('driver_arriving')
      }, 8000)
      
      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
      }
    }
  }, [step, nearbyDrivers])

  const handleLocationSubmit = async () => {
    if (!bookingData.from || !bookingData.to) return
    
    const estimation = await getRideEstimation(bookingData.from, bookingData.to)
    setBookingData(prev => ({
      ...prev,
      ...estimation
    }))
    setStep(2)
  }

  const handleVehicleSelect = (vehicle) => {
    setBookingData(prev => ({
      ...prev,
      selectedVehicle: vehicle,
      estimatedFare: vehicle.price
    }))
    setStep(3)
  }

  const handleConfirmBooking = async () => {
    try {
      // Find a ride that's not the user's own ride and matches the route
      const availableRide = rides.find(ride => 
        ride.driver_id !== user?.id && 
        ride.available_seats > 0 &&
        (ride.origin_name?.toLowerCase().includes(bookingData.from.toLowerCase()) ||
         ride.destination_name?.toLowerCase().includes(bookingData.to.toLowerCase()) ||
         bookingData.from.toLowerCase().includes(ride.origin_name?.toLowerCase() || '') ||
         bookingData.to.toLowerCase().includes(ride.destination_name?.toLowerCase() || ''))
      )
      
      if (!availableRide) {
        // Create a mock ride for demo purposes
        const mockRide = {
          id: `mock_${Date.now()}`,
          driver_id: 'demo_driver',
          origin_name: bookingData.from,
          destination_name: bookingData.to,
          available_seats: 3,
          price_per_seat: Math.round(bookingData.estimatedFare)
        }
        
        // Simulate booking success
        setStep(4)
        return
      }
      
      const result = await bookRide(availableRide.id, {
        seats_requested: bookingData.passengers || 1,
        pickup_point: bookingData.from,
        message: `Booking for ${bookingData.passengers || 1} passenger(s)`,
        total_amount: bookingData.estimatedFare
      })
      
      if (result) {
        setStep(4)
      }
    } catch (error) {
      console.error('Booking error:', error)
      // For demo, still proceed to next step
      setStep(4)
    }
  }

  const slideVariants = {
    enter: { x: 300, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -300, opacity: 0 }
  }

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      className="fixed inset-0 bg-white z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <button
          onClick={() => step > 1 ? setStep(step - 1) : onClose()}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold">
          {step === 1 && 'Where to?'}
          {step === 2 && 'Choose Vehicle'}
          {step === 3 && 'Confirm Booking'}
          {step === 4 && 'Your Ride'}
        </h1>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center py-4 bg-gray-50">
        {[1, 2, 3, 4].map((stepNumber) => (
          <div key={stepNumber} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= stepNumber 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-500'
            }`}>
              {stepNumber}
            </div>
            {stepNumber < 4 && (
              <div className={`w-12 h-0.5 mx-2 ${
                step > stepNumber ? 'bg-blue-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* Step 1: Location Selection */}
          {step === 1 && (
            <motion.div
              key="step1"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="p-6 space-y-6"
            >
              <div className="space-y-4">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Pickup location"
                    value={bookingData.from}
                    onChange={(e) => setBookingData(prev => ({ ...prev, from: e.target.value }))}
                    className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="relative">
                  <Navigation className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Drop-off location"
                    value={bookingData.to}
                    onChange={(e) => setBookingData(prev => ({ ...prev, to: e.target.value }))}
                    className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5" />
                  <input
                    type="datetime-local"
                    value={bookingData.departureTime}
                    onChange={(e) => setBookingData(prev => ({ ...prev, departureTime: e.target.value }))}
                    className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Recent locations</h3>
                {['Chitkara University', 'Academic Block A', 'Library', 'Hostel Complex'].map((location) => (
                  <button
                    key={location}
                    onClick={() => setBookingData(prev => ({ ...prev, to: location }))}
                    className="flex items-center space-x-3 w-full p-3 text-left hover:bg-gray-50 rounded-lg"
                  >
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span>{location}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={handleLocationSubmit}
                disabled={!bookingData.from || !bookingData.to}
                className="w-full py-4 bg-blue-500 text-white text-lg font-medium rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                Continue
                <ChevronRight className="w-5 h-5 ml-2" />
              </button>
            </motion.div>
          )}

          {/* Step 2: Vehicle Selection */}
          {step === 2 && (
            <motion.div
              key="step2"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="p-6 space-y-6"
            >
              <div className="space-y-4">
                {[
                  {
                    type: 'economy',
                    name: 'Economy',
                    description: 'Affordable rides',
                    price: bookingData.estimatedFare,
                    eta: bookingData.estimatedTime,
                    capacity: '4 seats',
                    icon: '🚗'
                  },
                  {
                    type: 'comfort',
                    name: 'Comfort',
                    description: 'More space & comfort',
                    price: bookingData.estimatedFare + 30,
                    eta: bookingData.estimatedTime + 2,
                    capacity: '4 seats',
                    icon: '🚙'
                  },
                  {
                    type: 'premium',
                    name: 'Premium',
                    description: 'Luxury vehicles',
                    price: bookingData.estimatedFare + 60,
                    eta: bookingData.estimatedTime + 3,
                    capacity: '4 seats',
                    icon: '🏎️'
                  }
                ].map((vehicle) => (
                  <button
                    key={vehicle.type}
                    onClick={() => handleVehicleSelect(vehicle)}
                    className={`w-full p-4 border-2 rounded-xl text-left hover:border-blue-500 transition-colors ${
                      bookingData.selectedVehicle?.type === vehicle.type 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-3xl">{vehicle.icon}</div>
                        <div>
                          <h3 className="font-medium text-gray-900">{vehicle.name}</h3>
                          <p className="text-sm text-gray-600">{vehicle.description}</p>
                          <p className="text-xs text-gray-500">{vehicle.capacity}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">₹{vehicle.price}</p>
                        <p className="text-sm text-gray-600">{vehicle.eta} min</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep(3)}
                disabled={!bookingData.selectedVehicle}
                className="w-full py-4 bg-blue-500 text-white text-lg font-medium rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Select {bookingData.selectedVehicle?.name}
              </button>
            </motion.div>
          )}

          {/* Step 3: Booking Confirmation */}
          {step === 3 && (
            <motion.div
              key="step3"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="p-6 space-y-6"
            >
              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">From</span>
                  <span className="font-medium">{bookingData.from}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">To</span>
                  <span className="font-medium">{bookingData.to}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Vehicle</span>
                  <span className="font-medium">{bookingData.selectedVehicle?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Estimated Time</span>
                  <span className="font-medium">{bookingData.estimatedTime} mins</span>
                </div>
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Total Fare</span>
                  <span>₹{bookingData.estimatedFare}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Payment Method</h3>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-6 bg-blue-500 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">VISA</span>
                    </div>
                    <span>•••• 4562</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              <button
                onClick={handleConfirmBooking}
                disabled={loading}
                className="w-full py-4 bg-blue-500 text-white text-lg font-medium rounded-xl hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Confirm Booking'
                )}
              </button>
            </motion.div>
          )}

          {/* Step 4: Ride Tracking */}
          {step === 4 && (
            <motion.div
              key="step4"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex flex-col h-full"
            >
              <RideTrackingScreen 
                rideStatus={demoRideStatus}
                currentRide={demoCurrentRide}
                nearbyDrivers={nearbyDrivers}
                onCancel={() => setStep(1)}
                bookingData={bookingData}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

const RideTrackingScreen = ({ rideStatus, currentRide, nearbyDrivers, onCancel, bookingData }) => {
  const renderContent = () => {
    switch (rideStatus) {
      case 'searching':
        return (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full mb-6"
            />
            <h2 className="text-xl font-semibold mb-2">Finding your driver</h2>
            <p className="text-gray-600 mb-8">We're matching you with nearby drivers</p>
            
            {nearbyDrivers.length > 0 && (
              <div className="w-full space-y-3">
                <h3 className="font-medium text-left">Available drivers</h3>
                {nearbyDrivers.map((driver) => (
                  <motion.div
                    key={driver.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                        {driver.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{driver.name}</p>
                        <p className="text-sm text-gray-600">{driver.vehicle}</p>
                        <div className="flex items-center space-x-2 text-sm">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span>{driver.rating}</span>
                          <span className="text-gray-400">•</span>
                          <span>{driver.distance}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{driver.price}</p>
                      <p className="text-sm text-gray-600">{driver.eta}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            
            <button
              onClick={onCancel}
              className="mt-6 px-6 py-3 border border-red-500 text-red-500 rounded-xl hover:bg-red-50"
            >
              Cancel Search
            </button>
          </div>
        )

      case 'matched':
        return (
          <div className="p-6 space-y-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Driver Found!</h2>
              <p className="text-gray-600">Your driver is on the way</p>
            </div>

            {currentRide?.driver && (
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-medium">
                    {currentRide.driver.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{currentRide.driver.name}</h3>
                    <p className="text-gray-600">{currentRide.driver.vehicle}</p>
                    <div className="flex items-center space-x-2 text-sm">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span>{currentRide.driver.rating}</span>
                      <span className="text-gray-400">•</span>
                      <span>{currentRide.driver.eta} away</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-3 bg-green-100 text-green-600 rounded-full">
                      <Phone className="w-5 h-5" />
                    </button>
                    <button className="p-3 bg-blue-100 text-blue-600 rounded-full">
                      <MessageCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Pickup</span>
                    <span className="font-medium">{bookingData.from}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Destination</span>
                    <span className="font-medium">{bookingData.to}</span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={onCancel}
              className="w-full py-3 border border-red-500 text-red-500 rounded-xl hover:bg-red-50"
            >
              Cancel Ride
            </button>
          </div>
        )

      case 'driver_arriving':
        return (
          <div className="p-6 space-y-6">
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Car className="w-8 h-8" />
              </motion.div>
              <h2 className="text-xl font-semibold mb-2">Driver Arriving</h2>
              <p className="text-gray-600">Your driver will be there in 2 minutes</p>
            </div>

            {currentRide?.driver && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white text-xl font-medium">
                    {currentRide.driver.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{currentRide.driver.name}</h3>
                    <p className="text-gray-600">{currentRide.plateNumber || 'HR-05-1234'}</p>
                    <div className="flex items-center space-x-2 text-sm">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span>{currentRide.driver.rating}</span>
                      <span className="text-gray-400">•</span>
                      <span>2 mins away</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-3 bg-green-100 text-green-600 rounded-full">
                      <Phone className="w-5 h-5" />
                    </button>
                    <button className="p-3 bg-blue-100 text-blue-600 rounded-full">
                      <MessageCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-3 mb-3">
                  <p className="text-sm font-medium text-orange-800 mb-1">Pickup Instructions</p>
                  <p className="text-sm text-gray-600">Wait near the main gate. Driver will call when arrived.</p>
                </div>
              </div>
            )}

            <button
              onClick={onCancel}
              className="w-full py-3 border border-red-500 text-red-500 rounded-xl hover:bg-red-50"
            >
              Cancel Ride
            </button>
          </div>
        )

      case 'ongoing':
        return (
          <div className="p-6 space-y-6">
            <div className="text-center">
              <Car className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Ride in Progress</h2>
              <p className="text-gray-600">Enjoy your journey!</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-blue-800 font-medium">Estimated arrival in 15 minutes</p>
            </div>
          </div>
        )

      case 'completed':
        return (
          <div className="p-6 space-y-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Ride Completed!</h2>
            <p className="text-gray-600">Thank you for using Campus Carpool</p>
            
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-medium mb-3">Rate your experience</h3>
              <div className="flex justify-center space-x-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} className="p-1">
                    <Star className="w-8 h-8 text-yellow-500 fill-current" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full mb-6"
            />
            <h2 className="text-xl font-semibold mb-2">Finding your driver</h2>
            <p className="text-gray-600 mb-8">We're matching you with nearby drivers</p>
            
            <button
              onClick={onCancel}
              className="px-6 py-3 border border-red-500 text-red-500 rounded-xl hover:bg-red-50"
            >
              Cancel Search
            </button>
          </div>
        )
    }
  }

  return renderContent()
}

export default MobileBookingFlow