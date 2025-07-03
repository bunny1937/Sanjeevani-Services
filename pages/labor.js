
import { useState, useEffect } from 'react'

const Labor = () => {
  const [laborers, setLaborers] = useState([])
  const [stats, setStats] = useState({
    totalLaborers: 0,
    activeLaborers: 0,
    monthlyPayroll: 0,
    totalDaysWorked: 0
  })

  useEffect(() => {
    fetchLaborers()
    fetchStats()
  }, [])

  const fetchLaborers = async () => {
    try {
      const response = await fetch('/api/laborers')
      const data = await response.json()
      setLaborers(data)
    } catch (error) {
      console.error('Error fetching laborers:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/laborers-stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleMarkAttendance = () => {
    alert('Mark attendance functionality will be added')
  }

  const handleAddLaborer = () => {
    alert('Add laborer form will be added')
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Labor Management</h1>
            <p className="text-gray-600">Manage laborers, track attendance, and monitor payroll</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleMarkAttendance}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center"
            >
              📋 Mark Attendance
            </button>
            <button
              onClick={handleAddLaborer}
              className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 flex items-center"
            >
              ➕ Add Laborer
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Laborers</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalLaborers}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xs">👷</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Laborers</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeLaborers}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-xs">✅</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Payroll</p>
              <p className="text-2xl font-bold text-purple-600">₹{stats.monthlyPayroll}</p>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-xs">💰</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Days Worked</p>
              <p className="text-2xl font-bold text-orange-600">{stats.totalDaysWorked}</p>
            </div>
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-xs">📅</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <input
          type="text"
          placeholder="Search laborers by name or phone..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Labor Database */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Labor Database</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joining Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Worked (This Month)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Pay</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Attendance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {laborers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    No laborers found. Add your first laborer to get started.
                  </td>
                </tr>
              ) : (
                laborers.map((laborer) => (
                  <tr key={laborer._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{laborer.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{laborer.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{laborer.joiningDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{laborer.daysWorked}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{laborer.monthlyPay}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{laborer.lastAttendance}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        laborer.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {laborer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-blue-600 hover:text-blue-900 mr-2">✏️</button>
                      <button className="text-green-600 hover:text-green-900 mr-2">👁️</button>
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

export default Labor
