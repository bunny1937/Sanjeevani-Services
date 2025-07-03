
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
      <div className="page-header">
        <div className="page-header-content">
          <div>
            <h1>Services</h1>
            <p>Manage the services offered by Sanjeevani Services</p>
          </div>
          <div className="page-actions">
            <button
              onClick={handleRemoveDuplicates}
              className="btn btn-secondary"
            >
              🔄 Remove Duplicates
            </button>
            <button
              onClick={handleAddService}
              className="btn btn-primary"
            >
              ➕ Add Service
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <p>Active Services</p>
              <p className="stat-value">{activeServices}</p>
              <p className="stat-description">Active services currently offered</p>
            </div>
            <div className="stat-icon blue">
              <span>🔧</span>
            </div>
          </div>
        </div>
      </div>

      {/* Services List */}
      <div className="table-container">
        <div className="card-header">
          <h2>Active Services List</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Service Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="3" className="text-center">
                    Loading services...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="3" className="text-center error">
                    Error loading services: {error}
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <>
                  <tr>
                    <td>Pest Control</td>
                    <td>Default service for Pest Control</td>
                    <td>
                      <div className="table-actions">
                        <button title="Edit">✏️</button>
                        <button title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>Water Tank Cleaning</td>
                    <td>Default service for Water Tank Cleaning</td>
                    <td>
                      <div className="table-actions">
                        <button title="Edit">✏️</button>
                        <button title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>Motor Repairing & Rewinding</td>
                    <td>Default service for Motor Repairing</td>
                    <td>
                      <div className="table-actions">
                        <button title="Edit">✏️</button>
                        <button title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                </>
              ) : (
                (services || []).map((service) => (
                  <tr key={service._id}>
                    <td>{service.name}</td>
                    <td>{service.description}</td>
                    <td>
                      <div className="table-actions">
                        <button title="Edit">✏️</button>
                        <button title="Delete">🗑️</button>
                      </div>
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
