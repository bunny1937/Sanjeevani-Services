
import { useState, useEffect } from 'react'

const Reports = () => {
  const [reportData, setReportData] = useState([])
  const [selectedReport, setSelectedReport] = useState('Client Report')

  useEffect(() => {
    fetchReportData()
  }, [selectedReport])

  const fetchReportData = async () => {
    try {
      const response = await fetch(`/api/reports?type=${selectedReport}`)
      const data = await response.json()
      setReportData(data)
    } catch (error) {
      console.error('Error fetching report data:', error)
    }
  }

  const handleExportCSV = () => {
    alert('Export CSV functionality will be added')
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
            <p className="text-gray-600">Revenue analysis, expense tracking, and profit calculations</p>
          </div>
          <button
            onClick={handleExportCSV}
            className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 flex items-center"
          >
            📄 Export CSV
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="Client Report">Client Report</option>
              <option value="Service Report">Service Report</option>
              <option value="Financial Report">Financial Report</option>
              <option value="Labor Report">Labor Report</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">{selectedReport}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Reminder</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No data available for the selected report. Add some data to generate reports.
                  </td>
                </tr>
              ) : (
                reportData.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.propertyName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.clientName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.serviceType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.lastService}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.nextReminder}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.amount}</td>
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

export default Reports
