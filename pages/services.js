
import { useState, useEffect } from 'react'

const Services = () => {
  const [services, setServices] = useState([])
  const [activeServices, setActiveServices] = useState(3)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/services')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setServices(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching services:', error)
      setError(error.message)
      setServices([])
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveDuplicates = () => {
    alert('Remove duplicates functionality will be added')
  }

  const handleAddService = () => {
    alert('Add service form will be added')
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Services</h1>
            <p className="text-gray-600">Manage the services offered by Sanjeevani Services</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleRemoveDuplicates}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center"
            >
              🔄 Remove Duplicates
            </button>
            <button
              onClick={handleAddService}
              className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 flex items-center"
            >
              ➕ Add Service
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Active Services</p>
            <p className="text-2xl font-bold text-blue-600">{activeServices}</p>
            <p className="text-xs text-gray-500">Active services currently offered</p>
          </div>
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-xs">🔧</span>
          </div>
        </div>
      </div>

      {/* Services List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Active Services List</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                    Loading services...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center text-red-500">
                    Error loading services: {error}
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Pest Control</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Default service for Pest Control</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">✏️</button>
                      <button className="text-red-600 hover:text-red-900">🗑️</button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Water Tank Cleaning</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Default service for Water Tank Cleaning</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">✏️</button>
                      <button className="text-red-600 hover:text-red-900">🗑️</button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Motor Repairing & Rewinding</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Default service for Motor Repairing</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">✏️</button>
                      <button className="text-red-600 hover:text-red-900">🗑️</button>
                    </td>
                  </tr>
                </>
              ) : (
                (services || []).map((service) => (
                  <tr key={service._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{service.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{service.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">✏️</button>
                      <button className="text-red-600 hover:text-red-900">🗑️</button>
                    </td>
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

export default Services
