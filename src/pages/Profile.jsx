import Navbar from '../components/Navbar'

const Profile = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="page-container py-8">
        <div className="glass-card p-8 text-center">
          <h1 className="text-3xl font-bold text-slate-800 mb-4">👤 Profile</h1>
          <p className="text-slate-600 mb-8">Profile management coming soon!</p>
          <div className="animate-pulse bg-slate-200 h-64 rounded-lg"></div>
        </div>
      </main>
    </div>
  )
}

export default Profile