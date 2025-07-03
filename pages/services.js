import { useState, useEffect } from 'react'
import styles from './Services.module.css'

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

  const handleCreateService = () => {
    // Add service creation logic here
    console.log('Create new service')
  }

  const handleEditService = (id) => {
    // Add service editing logic here
    console.log('Edit service:', id)
  }

  const handleDeleteService = (id) => {
    // Add service deletion logic here
    console.log('Delete service:', id)
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderContent}>
          <div>
            <h1>Services</h1>
            <p>Manage your service offerings and pricing</p>
          </div>
          <div className={styles.pageActions}>
            <button 
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={handleCreateService}
            >
              ➕ Add Service
            </button>
            <button 
              className={`${styles.btn} ${styles.btnSecondary}`}
            >
              📊 Service Report
            </button>
          </div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
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
                <td colSpan="3" className={styles.loadingState}>
                  Loading services...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="3" className={styles.errorState}>
                  Error loading services: {error}
                </td>
              </tr>
            ) : services.length === 0 ? (
              <>
                <tr>
                  <td>Pest Control</td>
                  <td>Professional pest control and extermination services</td>
                  <td>
                    <button onClick={() => handleEditService('default-1')}>✏️</button>
                    <button onClick={() => handleDeleteService('default-1')}>🗑️</button>
                  </td>
                </tr>
                <tr>
                  <td>Water Tank Cleaning</td>
                  <td>Complete water tank cleaning and sanitization</td>
                  <td>
                    <button onClick={() => handleEditService('default-2')}>✏️</button>
                    <button onClick={() => handleDeleteService('default-2')}>🗑️</button>
                  </td>
                </tr>
                <tr>
                  <td>Plumbing Services</td>
                  <td>Residential and commercial plumbing solutions</td>
                  <td>
                    <button onClick={() => handleEditService('default-3')}>✏️</button>
                    <button onClick={() => handleDeleteService('default-3')}>🗑️</button>
                  </td>
                </tr>
              </>
            ) : (
              (services || []).map((service) => (
                <tr key={service._id}>
                  <td>{service.name}</td>
                  <td>{service.description}</td>
                  <td>
                    <button onClick={() => handleEditService(service._id)}>✏️</button>
                    <button onClick={() => handleDeleteService(service._id)}>🗑️</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Services