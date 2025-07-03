
import { useState, useEffect } from 'react'

const Reminders = () => {
  const [reminders, setReminders] = useState([])
  const [stats, setStats] = useState({
    totalReminders: 0,
    overdue: 0,
    dueToday: 0
  })

  useEffect(() => {
    fetchReminders()
    fetchStats()
  }, [])

  const fetchReminders = async () => {
    try {
      const response = await fetch('/api/reminders')
      const data = await response.json()
      setReminders(data)
    } catch (error) {
      console.error('Error fetching reminders:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/reminders-stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reminders</h1>
        <p className="text-gray-600">Track properties due for service and manage follow ups</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Reminders</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalReminders}</p>
              <p className="text-xs text-gray-500">Properties due for service</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xs">⏰</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              <p className="text-xs text-gray-500">Past due date</p>
            </div>
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-xs">🔴</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Due Today</p>
              <p className="text-2xl font-bold text-orange-600">{stats.dueToday}</p>
              <p className="text-xs text-gray-500">Due today</p>
            </div>
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-xs">📅</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reminders Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Service Reminders ({reminders.length} total)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key Person</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Called</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reminders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    No reminders found. Reminders are automatically generated when properties are added with service dates.
                  </td>
                </tr>
              ) : (
                reminders.map((reminder) => (
                  <tr key={reminder._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{reminder.propertyName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reminder.keyPerson}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reminder.contact}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reminder.lastService}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reminder.dueDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reminder.called ? 'Yes' : 'No'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reminder.scheduled ? 'Yes' : 'No'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-blue-600 hover:text-blue-900 mr-2">📞</button>
                      <button className="text-green-600 hover:text-green-900">✅</button>
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

export default Reminders
