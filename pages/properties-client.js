
import { useState, useEffect } from 'react'

const PropertiesClient = () => {
  const [properties, setProperties] = useState([])
  const [stats, setStats] = useState({
    totalProperties: 0,
    uniqueLocations: 0
  })

  useEffect(() => {
    fetchProperties()
    fetchStats()
  }, [])

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/properties')
      const data = await response.json()
      setProperties(data)
    } catch (error) {
      console.error('Error fetching properties:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/properties-stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleImportCSV = () => {
    // Will be implemented later
    alert('CSV import functionality will be added')
  }

  const handleAddProperty = () => {
    // Will be implemented later
    alert('Add property form will be added')
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Properties & Clients</h1>
            <p className="text-gray-600">Manage your property database and client information</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleImportCSV}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center"
            >
              📄 Export CSV
            </button>
            <button
              onClick={handleAddProperty}
              className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 flex items-center"
            >
              ➕ Add Property
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Properties</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalProperties}</p>
              <p className="text-xs text-gray-500">Properties served till date</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xs">🏠</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unique Locations</p>
              <p className="text-2xl font-bold text-green-600">{stats.uniqueLocations}</p>
              <p className="text-xs text-gray-500">Number of locations served</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-xs">📍</span>
            </div>
          </div>
        </div>
      </div>

      {/* Properties Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Properties Database ({properties.length} records)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key Person</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Service</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {properties.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No properties found. Add your first property to get started.
                  </td>
                </tr>
              ) : (
                properties.map((property) => (
                  <tr key={property._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{property.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{property.keyPerson}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{property.contact}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{property.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{property.serviceType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{property.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{property.lastService}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default PropertiesClient
