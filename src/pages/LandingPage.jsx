import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import { Car, Search, Shield, Star, DollarSign, Leaf, Smartphone, Bus } from 'lucide-react'

const LandingPage = () => {
  const features = [
    {
      icon: Car,
      title: 'Offer Rides',
      description: 'Share your daily commute with fellow students and staff. Set your route, schedule, and available seats in seconds.'
    },
    {
      icon: Search,
      title: 'Smart Matching',
      description: 'Advanced algorithms match you with rides based on your location, schedule, and preferences.'
    },
    {
      icon: Shield,
      title: 'Official Shuttles',
      description: 'Access official campus transportation schedules and book seats on university shuttles.'
    }
  ]

  const benefits = [
    {
      icon: Shield,
      title: 'Secure & Verified',
      description: 'University email verification ensures you\'re connecting only with verified Chitkara community members.'
    },
    {
      icon: DollarSign,
      title: 'Cost Effective',
      description: 'Share travel costs and make commuting more affordable. Save up to 70% on transportation.'
    },
    {
      icon: Leaf,
      title: 'Eco-Friendly',
      description: 'Reduce carbon footprint by sharing rides. Join the sustainable transportation movement.'
    },
    {
      icon: Star,
      title: 'Smart Technology',
      description: 'AI-powered matching system, real-time tracking, and seamless booking experience.'
    },
    {
      icon: Smartphone,
      title: 'Mobile Ready',
      description: 'Access anywhere, anytime. Responsive design works perfectly on all your devices.'
    },
    {
      icon: Bus,
      title: 'Official Campus Shuttles',
      description: 'Book official university shuttles alongside peer rides for complete transportation solution.'
    }
  ]

  const stats = [
    { number: '500+', label: 'Active Users' },
    { number: '1000+', label: 'Rides Completed' },
    { number: '₹50,000+', label: 'Money Saved' },
    { number: '24/7', label: 'Platform Access' }
  ]

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="page-container main-content">
        {/* Hero Section */}
        <section className="py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl lg:text-6xl font-bold text-slate-800 mb-6 leading-tight">
                Smart Campus
                <span className="block bg-gradient-to-r from-cu-red to-cu-orange bg-clip-text text-transparent">
                  Transportation
                </span>
              </h1>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                Connect with peers, share rides, and access official campus shuttles. 
                Your convenient and safe way to travel within and around Chitkara University.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/auth" className="btn-primary text-center">
                  + Offer a Ride
                </Link>
                <Link to="/auth" className="btn-secondary text-center">
                  🔍 Find Rides
                </Link>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="glass-card p-8 text-center overflow-hidden">
                <img 
                  src="/carpool_chitkara.jpg" 
                  alt="Campus Carpool at Chitkara University" 
                  className="w-full h-auto rounded-lg shadow-lg object-cover"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20">
          <h2 className="text-4xl font-bold text-center text-slate-800 mb-16">
            Platform Features
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="glass-card p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-cu-red to-cu-orange rounded-full flex items-center justify-center mx-auto mb-6">
                    <Icon size={32} className="text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-4">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="glass-card-strong p-12 text-center"
          >
            <h2 className="text-4xl font-bold text-slate-800 mb-6">
              Why Choose Campus Carpool?
            </h2>
            <p className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto">
              Join Chitkara University's most trusted transportation community. 
              Connect, save, and travel smart with your fellow students and staff.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="bg-white/60 rounded-xl p-6 hover:bg-white/80 transition-all duration-300"
                  >
                    <Icon size={48} className="text-cu-red mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-800 mb-3">{benefit.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{benefit.description}</p>
                  </motion.div>
                )
              })}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12 p-8 bg-gradient-to-r from-cu-red/10 to-cu-orange/10 rounded-xl border border-cu-red/20">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="text-3xl font-bold text-cu-red">{stat.number}</div>
                  <div className="text-slate-600 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <div className="bg-white/80 rounded-xl p-8 border border-white/60">
              <h3 className="text-2xl font-semibold text-slate-800 mb-4">
                Ready to Start Your Journey?
              </h3>
              <p className="text-slate-600 mb-6">
                Join thousands of Chitkara students and staff who trust Campus Carpool for their daily transportation needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth" className="btn-primary">Join Now</Link>
                <Link to="/auth" className="btn-secondary">Explore Rides</Link>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800/20 backdrop-blur-md border-t border-white/20 mt-20">
        <div className="page-container py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <img src="/cu_logo.png" alt="Chitkara University" className="h-10 w-10" />
                <div>
                  <h3 className="font-semibold text-slate-800">Campus Carpool</h3>
                  <p className="text-sm text-slate-600">Chitkara University</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Smart transportation solution connecting the Chitkara University community 
                through secure ride-sharing and official campus shuttles.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-800 mb-4">Quick Links</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="block text-slate-600 hover:text-cu-red transition-colors">Find Rides</a>
                <a href="#" className="block text-slate-600 hover:text-cu-red transition-colors">Offer Ride</a>
                <a href="#" className="block text-slate-600 hover:text-cu-red transition-colors">Dashboard</a>
                <Link to="/auth" className="block text-slate-600 hover:text-cu-red transition-colors">Sign In</Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-800 mb-4">Support</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="block text-slate-600 hover:text-cu-red transition-colors">Help Center</a>
                <a href="#" className="block text-slate-600 hover:text-cu-red transition-colors">Safety Guidelines</a>
                <a href="#" className="block text-slate-600 hover:text-cu-red transition-colors">Community Rules</a>
                <a href="#" className="block text-slate-600 hover:text-cu-red transition-colors">Contact Support</a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-800 mb-4">University</h4>
              <div className="space-y-2 text-sm">
                <a href="https://www.chitkara.edu.in" target="_blank" rel="noopener noreferrer" className="block text-slate-600 hover:text-cu-red transition-colors">Chitkara University</a>
                <a href="https://www.chitkara.edu.in/admissions/" target="_blank" rel="noopener noreferrer" className="block text-slate-600 hover:text-cu-red transition-colors">Admissions</a>
                <a href="https://www.chitkara.edu.in/student-portal/" target="_blank" rel="noopener noreferrer" className="block text-slate-600 hover:text-cu-red transition-colors">Student Portal</a>
                <a href="https://www.chitkara.edu.in/campus-life/" target="_blank" rel="noopener noreferrer" className="block text-slate-600 hover:text-cu-red transition-colors">Campus Life</a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/20 pt-8 mt-8 text-center">
            <p className="text-slate-600 text-sm">
              © 2025 Campus Carpool Coordinator. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage