import Navbar from '../components/Navbar'

const RideDetails = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="page-container py-8">
        <div className="glass-card p-8 text-center">
          <h1 className="text-3xl font-bold text-slate-800 mb-4">Ride Details</h1>
          <p className="text-slate-600 mb-8">Ride details page coming soon!</p>
          <div className="animate-pulse bg-slate-200 h-64 rounded-lg"></div>
        </div>
      </main>
    </div>
  )
}

export default RideDetails