
import { useState, useEffect } from 'react'

const DailyBook = () => {
  const [entries, setEntries] = useState([])
  const [stats, setStats] = useState({
    totalEntries: 0,
    totalAmount: 0
  })

  useEffect(() => {
    fetchEntries()
    fetchStats()
  }, [])

  const fetchEntries = async () => {
    try {
      const response = await fetch('/api/daily-book')
      const data = await response.json()
      setEntries(data)
    } catch (error) {
      console.error('Error fetching entries:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/daily-book-stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleExportCSV = () => {
    alert('Export CSV functionality will be added')
  }

  const handleAddEntry = () => {
    alert('Add entry form will be added')
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Daily Book</h1>
            <p className="text-gray-600">Record daily transactions and service entries</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleExportCSV}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center"
            >
              📄 Export CSV
            </button>
            <button
              onClick={handleAddEntry}
              className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 flex items-center"
            >
              ➕ Add Entry
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Entries</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalEntries}</p>
              <p className="text-xs text-gray-500">Daily book entries recorded</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xs">📖</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-green-600">₹{stats.totalAmount}</p>
              <p className="text-xs text-gray-500">Total revenue recorded</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-xs">💰</span>
            </div>
          </div>
        </div>
      </div>

      {/* Entries Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Daily Book Entries ({entries.length} records)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key Person</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    No entries found. Add your first daily book entry to get started.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.property}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.keyPerson}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.contact}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.service}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{entry.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.remarks}</td>
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

export default DailyBook
