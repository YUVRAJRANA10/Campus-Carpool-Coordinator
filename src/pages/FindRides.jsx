import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRides } from '../contexts/RideContext'
import { useRealTimeRides } from '../contexts/RealTimeRideContext'
import Navbar from '../components/Navbar'
import BookingRequestModal from '../components/BookingRequestModal'
import MobileBookingFlow from '../components/MobileBookingFlow'
import { 
  Search, 
  MapPin, 
  Clock, 
  Users, 
  Star, 
  Car,
  Calendar,
  Filter,
  MessageCircle,
  ChevronDown,
  Plus,
  Smartphone
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

const FindRides = () => {
  const { rides, bookRide, loading } = useRides()
  const { rideStatus, activeBooking } = useRealTimeRides()
  const [searchData, setSearchData] = useState({
    from: '',
    to: '',
    date: '',
    seats: 1
  })
  const [filteredRides, setFilteredRides] = useState([])
  const [showFromSuggestions, setShowFromSuggestions] = useState(false)
  const [showToSuggestions, setShowToSuggestions] = useState(false)
  const [selectedRide, setSelectedRide] = useState(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showMobileBooking, setShowMobileBooking] = useState(false)

  useEffect(() => {
    // Filter rides based on search criteria
    let filtered = rides || []
    
    if (searchData.from) {
      filtered = filtered.filter(ride => 
        (ride.origin_name || '').toLowerCase().includes(searchData.from.toLowerCase())
      )
    }
    
    if (searchData.to) {
      filtered = filtered.filter(ride => 
        (ride.destination_name || '').toLowerCase().includes(searchData.to.toLowerCase())
      )
    }
    
    if (searchData.date) {
      filtered = filtered.filter(ride => {
        const rideDate = new Date(ride.departure_time).toDateString()
        const searchDate = new Date(searchData.date).toDateString()
        return rideDate === searchDate
      })
    }
    
    if (searchData.seats) {
      filtered = filtered.filter(ride => ride.available_seats >= parseInt(searchData.seats))
    }
    
    setFilteredRides(filtered)
  }, [rides, searchData])

  const handleInputChange = (e) => {
    setSearchData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleLocationSelect = (location, field) => {
    setSearchData(prev => ({
      ...prev,
      [field]: location
    }))
    if (field === 'from') setShowFromSuggestions(false)
    if (field === 'to') setShowToSuggestions(false)
  }

  const getFilteredLocations = (query) => {
    if (!query) return PREDEFINED_LOCATIONS
    return PREDEFINED_LOCATIONS.filter(loc => 
      loc.toLowerCase().includes(query.toLowerCase())
    )
  }

  const handleBookRide = (ride) => {
    setSelectedRide(ride)
    setShowBookingModal(true)
  }

  const handleConfirmBooking = async (bookingData) => {
    const result = await bookRide(selectedRide.id, bookingData)
    if (result) {
      setShowBookingModal(false)
      setSelectedRide(null)
    }
    return result
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="page-container py-20">
          <div className="flex items-center justify-center">
            <div className="glass-card p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cu-red mx-auto mb-4"></div>
              <p className="text-slate-600">Loading available rides...</p>
            </div>
          </div>
        </div>
      </div>
    )
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
            🔍 Find Rides
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-6">
            Search for available rides or create a ride request to find travel companions.
          </p>
          
          {/* Mobile-First Booking Button */}
          <motion.button
            onClick={() => setShowMobileBooking(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center mx-auto mb-4"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Smartphone className="w-6 h-6 mr-2" />
            Quick Book Ride
          </motion.button>
          
          <p className="text-sm text-gray-500">New! Mobile-friendly booking experience ✨</p>
        </motion.div>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass-card p-8 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">From</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="text"
                  name="from"
                  value={searchData.from}
                  onChange={handleInputChange}
                  onFocus={() => setShowFromSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowFromSuggestions(false), 200)}
                  className="input-glass pl-10 w-full"
                  placeholder="Departure location"
                />
                {showFromSuggestions && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {getFilteredLocations(searchData.from).map((location, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleLocationSelect(location, 'from')}
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
              <label className="block text-sm font-medium text-slate-700">To</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="text"
                  name="to"
                  value={searchData.to}
                  onChange={handleInputChange}
                  onFocus={() => setShowToSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowToSuggestions(false), 200)}
                  className="input-glass pl-10 w-full"
                  placeholder="Destination"
                />
                {showToSuggestions && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {getFilteredLocations(searchData.to).map((location, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleLocationSelect(location, 'to')}
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
              <label className="block text-sm font-medium text-slate-700">Date</label>
              <div className="relative">
                <Calendar size={18} className="absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="date"
                  name="date"
                  value={searchData.date}
                  onChange={handleInputChange}
                  className="input-glass pl-10 w-full"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Seats</label>
              <div className="relative">
                <Users size={18} className="absolute left-3 top-3.5 text-slate-400" />
                <select
                  name="seats"
                  value={searchData.seats}
                  onChange={handleInputChange}
                  className="input-glass pl-10 w-full"
                >
                  <option value={1}>1 Seat</option>
                  <option value={2}>2 Seats</option>
                  <option value={3}>3 Seats</option>
                  <option value={4}>4+ Seats</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-end">
              <button className="btn-primary w-full flex items-center justify-center">
                <Search size={18} className="mr-2" />
                Search
              </button>
            </div>
          </div>
        </motion.div>

        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-slate-800">
            Available Rides ({filteredRides.length})
          </h2>
          <button className="btn-ghost flex items-center">
            <Filter size={18} className="mr-2" />
            Filters
          </button>
        </div>

        {/* Rides List */}
        <div className="space-y-6">
          {filteredRides.length > 0 ? (
            filteredRides.map((ride, index) => (
              <motion.div
                key={ride.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`glass-card p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                  ride.is_official ? 'border-l-4 border-cu-red' : ''
                }`}
              >
                {ride.is_official && (
                  <div className="inline-block bg-cu-red text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
                    🏛️ Official Shuttle
                  </div>
                )}
                
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  {/* Driver Info */}
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-cu-red text-white rounded-full flex items-center justify-center font-bold text-xl">
                      {(ride.driver?.full_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-800">
                        {ride.driver?.full_name || 'Driver'}
                      </h3>
                      <p className="text-slate-600">
                        {ride.driver?.department || 'Student'}
                      </p>
                      <div className="flex items-center text-sm text-slate-500 mt-1">
                        <Star size={14} className="text-yellow-500 mr-1" />
                        <span>{ride.driver?.rating || 4.8} ({ride.driver?.total_rides || 0} rides)</span>
                      </div>
                    </div>
                  </div>

                  {/* Route */}
                  <div className="flex-1 max-w-md">
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                        <div className="font-semibold text-slate-800">{ride.origin_name}</div>
                        <div className="text-sm text-slate-600">{formatTime(ride.departure_time)}</div>
                      </div>
                      
                      <div className="flex-1 relative mx-4">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t-2 border-dashed border-slate-300"></div>
                        </div>
                        <div className="relative flex justify-center">
                          <Car size={16} className="bg-white text-slate-400 px-1" />
                        </div>
                        <div className="text-center text-xs text-slate-500 mt-1">
                          {ride.ride_type === 'one-way' ? 'One-way' : 'Round trip'}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-2"></div>
                        <div className="font-semibold text-slate-800">{ride.destination_name}</div>
                        <div className="text-sm text-slate-600">~{Math.round(Math.random() * 30 + 15)} min</div>
                      </div>
                    </div>
                  </div>

                  {/* Details & Actions */}
                  <div className="text-right space-y-4">
                    <div>
                      <div className="text-2xl font-bold text-cu-red">
                        ₹{ride.price_per_seat}
                      </div>
                      <div className="text-sm text-slate-600">per seat</div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex items-center justify-end">
                        <Calendar size={14} className="mr-1" />
                        {formatDate(ride.departure_time)}
                      </div>
                      <div className="flex items-center justify-end">
                        <Users size={14} className="mr-1" />
                        {ride.available_seats} seats available
                      </div>
                      <div className="flex items-center justify-end">
                        <Car size={14} className="mr-1" />
                        {ride.car_model || 'Vehicle info'}
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button 
                        className="btn-ghost flex items-center text-sm"
                        onClick={() => toast.info('Messaging feature coming soon!')}
                      >
                        <MessageCircle size={16} className="mr-1" />
                        Message
                      </button>
                      <button
                        onClick={() => handleBookRide(ride)}
                        disabled={ride.available_seats < searchData.seats}
                        className="btn-primary flex items-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        🎫 Request Booking
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="glass-card p-12 text-center"
            >
              <Search size={64} className="text-slate-400 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-slate-600 mb-4">
                No rides found
              </h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">
                Try adjusting your search criteria or create a ride request to let drivers know you're looking for a ride.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => setSearchData({ from: '', to: '', date: '', seats: 1 })}
                  className="btn-secondary"
                >
                  Clear Filters
                </button>
                <button className="btn-primary">Create Ride Request</button>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Booking Request Modal */}
      <BookingRequestModal
        isOpen={showBookingModal}
        onClose={() => {
          setShowBookingModal(false)
          setSelectedRide(null)
        }}
        ride={selectedRide}
        onConfirmBooking={handleConfirmBooking}
      />

      {/* Mobile Booking Flow */}
      <AnimatePresence>
        {showMobileBooking && (
          <MobileBookingFlow onClose={() => setShowMobileBooking(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

export default FindRides