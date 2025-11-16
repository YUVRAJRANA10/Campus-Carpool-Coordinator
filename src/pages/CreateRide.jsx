import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useRides } from '../contexts/ProductionRideContext'
import Navbar from '../components/Navbar'
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Car, 
  DollarSign,
  Plus,
  ArrowRight,
  Check
} from 'lucide-react'
import toast from 'react-hot-toast'

// Predefined locations for Chitkara University
const PREDEFINED_LOCATIONS = [
  'Chitkara University Main Gate',
  'Chitkara University Hostel',
  'Chitkara University Staff Parking',
  'Chandigarh Sector 17',
  'Chandigarh Railway Station',
  'Chandigarh Airport',
  'Mohali Phase 8B',
  'Mohali Phase 10',
  'Panchkula Sector 5',
  'Zirakpur Market',
  'Dera Bassi',
  'Ambala',
  'Kurukshetra',
  'Delhi',
  'Shimla'
]

const CreateRide = () => {
  const navigate = useNavigate()
  const { createRide, loading } = useRides()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rideData, setRideData] = useState({
    title: '',
    description: '',
    origin_name: '',
    destination_name: '',
    departure_time: '',
    available_seats: 1,
    price_per_seat: '',
    car_model: '',
    car_color: '',
    car_license: '',
    ride_type: 'one-way',
    preferences: {
      music_allowed: true,
      smoking_allowed: false,
      pets_allowed: false,
      luggage_space: true
    }
  })
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false)
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false)

  const steps = [
    { number: 1, title: 'Route & Schedule', icon: MapPin },
    { number: 2, title: 'Vehicle & Pricing', icon: Car },
    { number: 3, title: 'Preferences & Details', icon: Check }
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setRideData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePreferenceChange = (preference) => {
    setRideData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [preference]: !prev.preferences[preference]
      }
    }))
  }

  const handleLocationSelect = (location, field) => {
    setRideData(prev => ({
      ...prev,
      [field]: location
    }))
    if (field === 'origin_name') setShowOriginSuggestions(false)
    if (field === 'destination_name') setShowDestinationSuggestions(false)
  }

  const getFilteredLocations = (query) => {
    if (!query) return PREDEFINED_LOCATIONS
    return PREDEFINED_LOCATIONS.filter(loc => 
      loc.toLowerCase().includes(query.toLowerCase())
    )
  }

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return rideData.origin_name && rideData.destination_name && rideData.departure_time
      case 2:
        return rideData.available_seats && rideData.price_per_seat && rideData.car_model
      case 3:
        return rideData.title && rideData.description
      default:
        return false
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1)
      } else {
        handleSubmit()
      }
    } else {
      toast.error('Please fill in all required fields')
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (isSubmitting) {
      console.log('Submit already in progress')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Validate required fields
      if (!rideData.origin_name || !rideData.destination_name) {
        toast.error('Please fill in origin and destination')
        return
      }
      if (!rideData.departure_time) {
        toast.error('Please select departure time')
        return
      }
      if (!rideData.available_seats || rideData.available_seats < 1) {
        toast.error('Please specify available seats')
        return
      }

      // Create clean ride object
      const rideWithCoordinates = {
        title: rideData.title || `${rideData.origin_name} to ${rideData.destination_name}`,
        description: rideData.description || '',
        origin_name: rideData.origin_name.trim(),
        destination_name: rideData.destination_name.trim(),
        departure_time: rideData.departure_time,
        available_seats: parseInt(rideData.available_seats),
        price_per_seat: parseFloat(rideData.price_per_seat) || 0,
        car_model: rideData.car_model || '',
        car_color: rideData.car_color || '',
        car_license: rideData.car_license || '',
        ride_type: rideData.ride_type || 'one-way',
        preferences: [
          rideData.music_allowed ? 'Music Allowed' : '',
          rideData.smoking_allowed ? 'Smoking Allowed' : '',
          rideData.pets_allowed ? 'Pets Allowed' : '',
          rideData.luggage_space ? 'Luggage Space' : ''
        ].filter(Boolean).join(', '),
        origin_lat: 30.5167, // Chitkara University coordinates
        origin_lng: 76.6833,
        destination_lat: rideData.destination_name.includes('Chandigarh') ? 30.7333 : 30.6000,
        destination_lng: rideData.destination_name.includes('Chandigarh') ? 76.7794 : 76.8000
      }
      
      console.log('Submitting ride:', rideWithCoordinates)
      const result = await createRide(rideWithCoordinates)
      
      if (result && result.success) {
        toast.success('🎉 Ride created successfully! It\'s now live and visible to other users.')
        navigate('/dashboard')
      } else {
        const errorMsg = result?.error || 'Unknown error occurred'
        toast.error(`Failed to create ride: ${errorMsg}`)
      }
    } catch (error) {
      console.error('Error creating ride:', error)
      toast.error('Failed to create ride. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="page-container py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            🚗 Offer a Ride
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Share your journey and help fellow students save money while reducing carbon footprint
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass-card p-6 mb-8"
        >
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.number
              const isCompleted = currentStep > step.number
              
              return (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-all $\{
                    isActive ? 'bg-cu-red text-white' : 
                    isCompleted ? 'bg-green-500 text-white' : 
                    'bg-white/30 text-slate-600'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center $\{
                      isActive || isCompleted ? 'bg-white/20' : 'bg-slate-200'
                    }`}>
                      {isCompleted ? (
                        <Check size={16} />
                      ) : (
                        <Icon size={16} />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">Step {step.number}</div>
                      <div className="text-sm opacity-75">{step.title}</div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight size={20} className="mx-4 text-slate-400" />
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="glass-card p-8"
        >
          {/* Step 1: Route & Schedule */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-slate-800 mb-6">Route & Schedule</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">From *</label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-3 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      name="origin_name"
                      value={rideData.origin_name}
                      onChange={handleInputChange}
                      onFocus={() => setShowOriginSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowOriginSuggestions(false), 200)}
                      className="input-glass pl-10 w-full"
                      placeholder="Starting point"
                      required
                    />
                    {showOriginSuggestions && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {getFilteredLocations(rideData.origin_name).map((location, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleLocationSelect(location, 'origin_name')}
                            className="w-full text-left px-4 py-2 hover:bg-cu-red/10 hover:text-cu-red transition-colors"
                          >
                            <MapPin size={14} className="inline mr-2" />
                            {location}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">To *</label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-3 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      name="destination_name"
                      value={rideData.destination_name}
                      onChange={handleInputChange}
                      onFocus={() => setShowDestinationSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowDestinationSuggestions(false), 200)}
                      className="input-glass pl-10 w-full"
                      placeholder="Destination"
                      required
                    />
                    {showDestinationSuggestions && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {getFilteredLocations(rideData.destination_name).map((location, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleLocationSelect(location, 'destination_name')}
                            className="w-full text-left px-4 py-2 hover:bg-cu-red/10 hover:text-cu-red transition-colors"
                          >
                            <MapPin size={14} className="inline mr-2" />
                            {location}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Departure Date & Time *</label>
                  <div className="relative">
                    <Calendar size={18} className="absolute left-3 top-3.5 text-slate-400" />
                    <input
                      type="datetime-local"
                      name="departure_time"
                      value={rideData.departure_time}
                      onChange={handleInputChange}
                      className="input-glass pl-10 w-full"
                      min={new Date().toISOString().slice(0, 16)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Trip Type</label>
                  <select
                    name="ride_type"
                    value={rideData.ride_type}
                    onChange={handleInputChange}
                    className="input-glass w-full"
                  >
                    <option value="one-way">One-way</option>
                    <option value="round-trip">Round-trip</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Vehicle & Pricing */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-slate-800 mb-6">Vehicle & Pricing</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Available Seats *</label>
                  <div className="relative">
                    <Users size={18} className="absolute left-3 top-3.5 text-slate-400" />
                    <select
                      name="available_seats"
                      value={rideData.available_seats}
                      onChange={handleInputChange}
                      className="input-glass pl-10 w-full"
                      required
                    >
                      <option value={1}>1 Seat</option>
                      <option value={2}>2 Seats</option>
                      <option value={3}>3 Seats</option>
                      <option value={4}>4 Seats</option>
                      <option value={5}>5+ Seats</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Price per Seat (₹) *</label>
                  <div className="relative">
                    <DollarSign size={18} className="absolute left-3 top-3.5 text-slate-400" />
                    <input
                      type="number"
                      name="price_per_seat"
                      value={rideData.price_per_seat}
                      onChange={handleInputChange}
                      className="input-glass pl-10 w-full"
                      placeholder="e.g., 150"
                      min="0"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Car Model *</label>
                  <div className="relative">
                    <Car size={18} className="absolute left-3 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      name="car_model"
                      value={rideData.car_model}
                      onChange={handleInputChange}
                      className="input-glass pl-10 w-full"
                      placeholder="e.g., Honda City"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Car Color</label>
                  <input
                    type="text"
                    name="car_color"
                    value={rideData.car_color}
                    onChange={handleInputChange}
                    className="input-glass w-full"
                    placeholder="e.g., White"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">License Plate</label>
                  <input
                    type="text"
                    name="car_license"
                    value={rideData.car_license}
                    onChange={handleInputChange}
                    className="input-glass w-full"
                    placeholder="e.g., HR05AB1234"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Preferences & Details */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-slate-800 mb-6">Preferences & Details</h2>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Ride Title *</label>
                <input
                  type="text"
                  name="title"
                  value={rideData.title}
                  onChange={handleInputChange}
                  className="input-glass w-full"
                  placeholder="e.g., Daily commute to Chandigarh"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Description *</label>
                <textarea
                  name="description"
                  value={rideData.description}
                  onChange={handleInputChange}
                  className="input-glass w-full h-24 resize-none"
                  placeholder="Add any additional details about the ride, pickup points, or special instructions..."
                  required
                />
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700">Ride Preferences</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(rideData.preferences).map(([key, value]) => (
                    <label key={key} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={() => handlePreferenceChange(key)}
                        className="rounded border-slate-300 text-cu-red focus:ring-cu-red"
                      />
                      <span className="text-sm text-slate-700 capitalize">
                        {key.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-8 border-t border-white/20">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
            
            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting || loading || !validateStep(currentStep)}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting || (loading && currentStep === 3) ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : currentStep === 3 ? (
                <>
                  <Plus size={18} className="mr-2" />
                  Create Ride
                </>
              ) : (
                <>
                  Next
                  <ArrowRight size={18} className="ml-2" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

export default CreateRide