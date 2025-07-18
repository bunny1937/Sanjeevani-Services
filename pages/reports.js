"use client";

import { useState, useEffect } from "react";
import styles from "./Reports.module.css";

const Reports = () => {
  const [reportData, setReportData] = useState([]);
  const [selectedReport, setSelectedReport] = useState("Client Report");
  const [loading, setLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchReportData();
  }, [selectedReport]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports?type=${selectedReport}`);
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (reportData.length === 0) {
      alert("No data to export");
      return;
    }
    const headers = getTableHeaders();
    const csvContent = [
      headers.join(","),
      ...reportData.map((item) =>
        getRowData(item)
          .map((cell) => `"${cell}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedReport.replace(" ", "_")}_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const getTableHeaders = () => {
    switch (selectedReport) {
      case "Client Report":
        return [
          "Property Name",
          "Client Name",
          "Contact",
          "Location",
          "Service Type",
          "Last Service",
          "Next Reminder",
          "Amount",
          "Status",
        ];
      case "Service Report":
        return [
          "Service Name",
          "Description",
          "Default Price",
          "Status",
          "Total Bookings",
          "Total Revenue",
          "Average Amount",
        ];
      case "Financial Report":
        return ["Month", "Revenue", "Expenses", "Profit", "Transactions"];
      case "Labor Report":
        return [
          "Name",
          "Phone",
          "Joining Date",
          "Status",
          "Monthly Pay",
          "Present Days",
          "Absent Days",
          "Attendance %",
          "Current Salary",
        ];
      default:
        return [];
    }
  };

  const getRowData = (item) => {
    switch (selectedReport) {
      case "Client Report":
        return [
          item.propertyName || "",
          item.clientName || "",
          item.contact || "",
          item.location || "",
          item.serviceType || "",
          item.lastService || "",
          item.nextReminder || "",
          item.amount || 0,
          item.status || "",
        ];
      case "Service Report":
        return [
          item.serviceName || "",
          item.description || "",
          item.defaultPrice || 0,
          item.status || "",
          item.totalBookings || 0,
          item.totalRevenue || 0,
          item.averageAmount || 0,
        ];
      case "Financial Report":
        return [
          item.month || "",
          item.revenue || 0,
          item.expenses || 0,
          item.profit || 0,
          item.transactions || 0,
        ];
      case "Labor Report":
        return [
          item.name || "",
          item.phone || "",
          item.joiningDate || "",
          item.status || "",
          item.monthlyPay || 0,
          item.currentMonthStats?.presentDays || 0,
          item.currentMonthStats?.absentDays || 0,
          item.currentMonthStats?.attendancePercentage || 0,
          item.currentMonthStats?.currentSalary || 0,
        ];
      default:
        return [];
    }
  };

  const renderTableContent = () => {
    switch (selectedReport) {
      case "Client Report":
        return renderClientReport();
      case "Service Report":
        return renderServiceReport();
      case "Financial Report":
        return renderFinancialReport();
      case "Labor Report":
        return renderLaborReport();
      default:
        return renderClientReport();
    }
  };

  const renderClientReport = () => (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Property Name</th>
          <th>Client Name</th>
          <th>Contact</th>
          <th>Location</th>
          <th>Service Type</th>
          <th>Last Service</th>
          <th>Next Reminder</th>
          <th>Amount</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {reportData.length === 0 ? (
          <tr>
            <td colSpan="10" className={styles.noData}>
              No client data available. Add some properties to generate reports.
            </td>
          </tr>
        ) : (
          reportData.map((item, index) => (
            <tr key={index}>
              <td className={styles.nameCell}>{item.propertyName}</td>
              <td>{item.clientName}</td>
              <td>{item.contact}</td>
              <td>{item.location}</td>
              <td>
                <span className={styles.serviceTag}>{item.serviceType}</span>
              </td>
              <td>{item.lastService}</td>
              <td>{item.nextReminder}</td>
              <td className={styles.amountCell}>
                ₹{item.amount?.toLocaleString()}
              </td>
              <td>
                <span
                  className={`${styles.statusTag} ${
                    item.status === "Overdue" ? styles.overdue : styles.active
                  }`}
                >
                  {item.status}
                </span>
              </td>
              <td>
                <button
                  className={styles.viewBtn}
                  onClick={() => handleViewDetails(item)}
                >
                  View
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );

  const renderServiceReport = () => (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Service Name</th>
          <th>Description</th>
          <th>Default Price</th>
          <th>Status</th>
          <th>Total Bookings</th>
          <th>Total Revenue</th>
          <th>Avg. Amount</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {reportData.length === 0 ? (
          <tr>
            <td colSpan="8" className={styles.noData}>
              No service data available. Add some services to generate reports.
            </td>
          </tr>
        ) : (
          reportData.map((item, index) => (
            <tr key={index}>
              <td className={styles.nameCell}>{item.serviceName}</td>
              <td>{item.description}</td>
              <td>₹{item.defaultPrice?.toLocaleString()}</td>
              <td>
                <span
                  className={`${styles.statusTag} ${
                    item.status === "Active" ? styles.active : styles.inactive
                  }`}
                >
                  {item.status}
                </span>
              </td>
              <td>{item.totalBookings}</td>
              <td className={styles.amountCell}>
                ₹{item.totalRevenue?.toLocaleString()}
              </td>
              <td>₹{item.averageAmount?.toLocaleString()}</td>
              <td>
                <button
                  className={styles.viewBtn}
                  onClick={() => handleViewDetails(item)}
                >
                  View
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );

  const renderFinancialReport = () => (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Month</th>
          <th>Revenue</th>
          <th>Expenses</th>
          <th>Profit</th>
          <th>Transactions</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {reportData.length === 0 ? (
          <tr>
            <td colSpan="6" className={styles.noData}>
              No financial data available. Add some transactions to generate
              reports.
            </td>
          </tr>
        ) : (
          reportData.map((item, index) => (
            <tr key={index}>
              <td>{item.month}</td>
              <td className={styles.amountCell}>
                ₹{item.revenue?.toLocaleString()}
              </td>
              <td className={styles.amountCell}>
                ₹{item.expenses?.toLocaleString()}
              </td>
              <td
                className={`${styles.amountCell} ${
                  item.profit >= 0 ? styles.profit : styles.loss
                }`}
              >
                ₹{item.profit?.toLocaleString()}
              </td>
              <td>{item.transactions}</td>
              <td>
                <button
                  className={styles.viewBtn}
                  onClick={() => handleViewDetails(item)}
                >
                  View
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );

  const renderLaborReport = () => (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Name</th>
          <th>Phone</th>
          <th>Joining Date</th>
          <th>Status</th>
          <th>Monthly Pay</th>
          <th>Present Days</th>
          <th>Attendance %</th>
          <th>Current Salary</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {reportData.length === 0 ? (
          <tr>
            <td colSpan="9" className={styles.noData}>
              No labor data available. Add some laborers to generate reports.
            </td>
          </tr>
        ) : (
          reportData.map((item, index) => (
            <tr key={index}>
              <td className={styles.nameCell}>{item.name}</td>
              <td>{item.phone}</td>
              <td>{item.joiningDate}</td>
              <td>
                <span
                  className={`${styles.statusTag} ${
                    item.status === "Active" ? styles.active : styles.inactive
                  }`}
                >
                  {item.status}
                </span>
              </td>
              <td>₹{item.monthlyPay?.toLocaleString()}</td>
              <td>{item.currentMonthStats?.presentDays || 0}</td>
              <td>{item.currentMonthStats?.attendancePercentage || 0}%</td>
              <td className={styles.amountCell}>
                ₹{item.currentMonthStats?.currentSalary?.toLocaleString()}
              </td>
              <td>
                <button
                  className={styles.viewBtn}
                  onClick={() => handleViewDetails(item)}
                >
                  View
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );

  const renderViewModal = () => {
    if (!showViewModal || !selectedItem) return null;

    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <div className={styles.modalHeader}>
            <h3>{selectedReport} Details</h3>
            <button
              className={styles.closeBtn}
              onClick={() => setShowViewModal(false)}
            >
              ×
            </button>
          </div>
          <div className={styles.modalContent}>
            {selectedReport === "Client Report" && (
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <label>Property Name:</label>
                  <span>{selectedItem.propertyName}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Client Name:</label>
                  <span>{selectedItem.clientName}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Contact:</label>
                  <span>{selectedItem.contact}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Location:</label>
                  <span>{selectedItem.location}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Service Type:</label>
                  <span>{selectedItem.serviceType}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Last Service:</label>
                  <span>{selectedItem.lastService}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Next Reminder:</label>
                  <span>{selectedItem.nextReminder}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Amount:</label>
                  <span>₹{selectedItem.amount?.toLocaleString()}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Status:</label>
                  <span
                    className={`${styles.statusTag} ${
                      selectedItem.status === "Overdue"
                        ? styles.overdue
                        : styles.active
                    }`}
                  >
                    {selectedItem.status}
                  </span>
                </div>
              </div>
            )}
            {selectedReport === "Service Report" && (
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <label>Service Name:</label>
                  <span>{selectedItem.serviceName}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Description:</label>
                  <span>{selectedItem.description}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Default Price:</label>
                  <span>₹{selectedItem.defaultPrice?.toLocaleString()}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Status:</label>
                  <span
                    className={`${styles.statusTag} ${
                      selectedItem.status === "Active"
                        ? styles.active
                        : styles.inactive
                    }`}
                  >
                    {selectedItem.status}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <label>Total Bookings:</label>
                  <span>{selectedItem.totalBookings}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Total Revenue:</label>
                  <span>₹{selectedItem.totalRevenue?.toLocaleString()}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Average Amount:</label>
                  <span>₹{selectedItem.averageAmount?.toLocaleString()}</span>
                </div>
                {selectedItem.recentBookings &&
                  selectedItem.recentBookings.length > 0 && (
                    <div className={styles.recentBookings}>
                      <h4>Recent Bookings:</h4>
                      {selectedItem.recentBookings.map((booking, index) => (
                        <div key={index} className={styles.bookingItem}>
                          <span>{booking.date}</span>
                          <span>{booking.property}</span>
                          <span>₹{booking.amount?.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            )}
            {selectedReport === "Financial Report" && (
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <label>Month:</label>
                  <span>{selectedItem.month}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Revenue:</label>
                  <span>₹{selectedItem.revenue?.toLocaleString()}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Expenses:</label>
                  <span>₹{selectedItem.expenses?.toLocaleString()}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Profit:</label>
                  <span
                    className={
                      selectedItem.profit >= 0 ? styles.profit : styles.loss
                    }
                  >
                    ₹{selectedItem.profit?.toLocaleString()}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <label>Transactions:</label>
                  <span>{selectedItem.transactions}</span>
                </div>
              </div>
            )}
            {selectedReport === "Labor Report" && (
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <label>Name:</label>
                  <span>{selectedItem.name}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Phone:</label>
                  <span>{selectedItem.phone}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Joining Date:</label>
                  <span>{selectedItem.joiningDate}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Status:</label>
                  <span
                    className={`${styles.statusTag} ${
                      selectedItem.status === "Active"
                        ? styles.active
                        : styles.inactive
                    }`}
                  >
                    {selectedItem.status}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <label>Monthly Pay:</label>
                  <span>₹{selectedItem.monthlyPay?.toLocaleString()}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Present Days (This Month):</label>
                  <span>
                    {selectedItem.currentMonthStats?.presentDays || 0}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <label>Absent Days (This Month):</label>
                  <span>{selectedItem.currentMonthStats?.absentDays || 0}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Attendance Percentage:</label>
                  <span>
                    {selectedItem.currentMonthStats?.attendancePercentage || 0}%
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <label>Current Salary:</label>
                  <span>
                    ₹
                    {selectedItem.currentMonthStats?.currentSalary?.toLocaleString()}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <label>Total Days Worked:</label>
                  <span>{selectedItem.overallStats?.totalDaysWorked || 0}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Days Since Joining:</label>
                  <span>{selectedItem.overallStats?.joiningDaysAgo || 0}</span>
                </div>
              </div>
            )}
          </div>
          <div className={styles.modalFooter}>
            <button
              className={styles.secondaryBtn}
              onClick={() => setShowViewModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const reportTypes = [
    { value: "Client Report", label: "Client Report" },
    { value: "Service Report", label: "Service Report" },
    { value: "Financial Report", label: "Financial Report" },
    { value: "Labor Report", label: "Labor Report" },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Business Reports</h1>
          <p>Comprehensive analysis and reporting for your business</p>
        </div>
        <button onClick={handleExportCSV} className={styles.primaryBtn}>
          Export CSV
        </button>
      </div>

      <div className={styles.filterContainer}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Report Type</label>
          <select
            value={selectedReport}
            onChange={(e) => setSelectedReport(e.target.value)}
            className={styles.selectInput}
          >
            {reportTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h3>{selectedReport}</h3>
          <span className={styles.recordCount}>
            {reportData.length} records
          </span>
        </div>
        <div className={styles.tableWrapper}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>Loading report data...</p>
            </div>
          ) : (
            renderTableContent()
          )}
        </div>
      </div>

      {renderViewModal()}
    </div>
  );
};

export default Reports;
