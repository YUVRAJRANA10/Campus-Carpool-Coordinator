import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Star, 
  MessageCircle, 
  CheckCircle, 
  SkipForward,
  Clock,
  MapPin
} from 'lucide-react'

const RideCompletionModal = ({ 
  liveRide, 
  userType, 
  onSubmitReview, 
  onSkipReview, 
  onClose 
}) => {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitReview = async () => {
    if (rating < 1 || rating > 5) return
    
    setIsSubmitting(true)
    try {
      await onSubmitReview({
        rating,
        comment,
        ride_id: liveRide.ride_id,
        reviewed_user_id: userType === 'driver' 
          ? liveRide.passenger_id 
          : liveRide.driver_id,
        reviewer_type: userType
      })
    } catch (error) {
      console.error('Error submitting review:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const tripDuration = liveRide.completed_at && liveRide.pickup_time 
    ? Math.round((new Date(liveRide.completed_at) - new Date(liveRide.pickup_time)) / 60000)
    : 'N/A'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto">
        {/* Header */}
        <div className="bg-green-500 text-white p-6 rounded-t-2xl text-center">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold">Trip Completed!</h2>
          <p className="text-green-100 mt-2">Thank you for using Campus Carpool</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Trip Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-800">Trip Summary</h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-gray-600">Duration</p>
                  <p className="font-medium">{tripDuration} mins</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-gray-600">Distance</p>
                  <p className="font-medium">{liveRide.ride?.distance || 'N/A'} km</p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Fare</span>
                <span className="text-lg font-bold text-green-600">
                  ₹{liveRide.ride?.fare || '0'}
                </span>
              </div>
            </div>
          </div>

          {/* Rating Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">
              Rate your {userType === 'driver' ? 'passenger' : 'driver'}
            </h3>
            
            {/* Star Rating */}
            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`w-10 h-10 rounded-full transition-all ${
                    star <= rating 
                      ? 'text-yellow-500 transform scale-110' 
                      : 'text-gray-300 hover:text-yellow-400'
                  }`}
                >
                  <Star className="w-8 h-8 mx-auto fill-current" />
                </button>
              ))}
            </div>

            <p className="text-center text-sm text-gray-600">
              {rating === 5 ? 'Excellent!' : 
               rating === 4 ? 'Very Good!' : 
               rating === 3 ? 'Good' : 
               rating === 2 ? 'Fair' : 'Needs Improvement'}
            </p>

            {/* Comment Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add a comment (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={`How was your experience with ${
                  userType === 'driver' 
                    ? liveRide.passenger?.full_name?.split(' ')[0] || 'the passenger' 
                    : liveRide.driver?.full_name?.split(' ')[0] || 'the driver'
                }?`}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">{comment.length}/200</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleSubmitReview}
              disabled={isSubmitting}
              className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 ${
                isSubmitting
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-5 h-5" />
                  <span>Submit Review</span>
                </>
              )}
            </button>

            <button
              onClick={onSkipReview}
              className="w-full py-3 border-2 border-gray-300 text-gray-600 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
            >
              <SkipForward className="w-5 h-5" />
              <span>Skip Review</span>
            </button>
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Your feedback helps improve our community
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default RideCompletionModal