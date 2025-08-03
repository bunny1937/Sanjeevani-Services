import { useState, useEffect, useCallback } from "react";
import styles from "./Labor.module.css";

const Labor = () => {
  const [laborers, setLaborers] = useState([]);
  const [filteredLaborers, setFilteredLaborers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedLaborer, setSelectedLaborer] = useState(null);
  const [attendanceData, setAttendanceData] = useState({});
  const [showBulkAttendanceModal, setShowBulkAttendanceModal] = useState(false);
  const [bulkAttendanceData, setBulkAttendanceData] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [stats, setStats] = useState({
    totalLaborers: 0,
    activeLaborers: 0,
    monthlyPayroll: 0,
    totalDaysWorked: 0,
  });

  // New state for attendance selection
  const [selectedAttendanceType, setSelectedAttendanceType] =
    useState("present");
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [showReasonInput, setShowReasonInput] = useState(false);

  // Reason options
  const absentReasons = [
    "Sick leave",
    "Family emergency",
    "Uninformed absence",
  ];
  const holidayReasons = [
    "Festival leave",
    "Company holiday",
    "Weather issues",
  ];

  const [newLaborer, setNewLaborer] = useState({
    name: "",
    phone: "",
    joiningDate: "",
    monthlyPay: "",
    status: "Active",
  });

  const fetchLaborers = useCallback(async () => {
    try {
      const response = await fetch("/api/laborers");
      const data = await response.json();
      setLaborers(data);
      calculateStats(data); // assumed to be defined
    } catch (error) {
      console.error("Error fetching laborers:", error);
    }
  }, []);
  useEffect(() => {
    fetchLaborers(); // now safe with dependency
  }, [fetchLaborers]);

  const calculateStats = (laborersData) => {
    const totalLaborers = laborersData.length;
    const activeLaborers = laborersData.filter(
      (l) => l.status === "Active"
    ).length;
    const monthlyPayroll = laborersData.reduce(
      (sum, l) => sum + (l.monthlyPay || 0),
      0
    );
    const totalDaysWorked = laborersData.reduce(
      (sum, l) => sum + (l.daysWorked || 0),
      0
    );

    setStats({
      totalLaborers,
      activeLaborers,
      monthlyPayroll,
      totalDaysWorked,
    });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  // Replace your existing filterLaborers function with this improved version:

  const filterLaborers = useCallback(() => {
    if (!searchTerm || searchTerm.trim() === "") {
      setFilteredLaborers(laborers);
      return;
    }

    const searchTermLower = searchTerm.toLowerCase().trim();

    const filtered = laborers.filter((laborer) => {
      const name = laborer.name ? laborer.name.toLowerCase() : "";
      const phone = laborer.phone ? laborer.phone.toString() : "";

      return name.includes(searchTermLower) || phone.includes(searchTermLower);
    });

    setFilteredLaborers(filtered);
  }, [laborers, searchTerm]);
  useEffect(() => {
    filterLaborers(); // now safe with dependency
  }, [filterLaborers]);

  const handleAddLaborer = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/laborers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newLaborer,
          daysWorked: 0,
          lastAttendance: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const addedLaborer = await response.json();
        setLaborers([...laborers, addedLaborer]);
        setNewLaborer({
          name: "",
          phone: "",
          joiningDate: "",
          monthlyPay: "",
          status: "Active",
        });
        setShowAddForm(false);
        alert("Laborer added successfully!");
      }
    } catch (error) {
      console.error("Error adding laborer:", error);
      alert("Error adding laborer");
    }
  };

  const handleMarkAttendance = (laborer) => {
    setSelectedLaborer(laborer);
    setSelectedAttendanceType("present");
    setSelectedReason("");
    setCustomReason("");
    setShowReasonInput(false);
    setShowAttendanceModal(true);
  };
  const markAttendance = async (status) => {
    try {
      const today = new Date().toISOString().split("T")[0];

      const requestBody = {
        date: today,
        status: selectedAttendanceType,
      };

      // Add reason if it's absent or holiday
      if (selectedAttendanceType !== "present") {
        const reason =
          selectedReason === "custom" ? customReason : selectedReason;
        if (!reason) {
          alert("Please select or enter a reason");
          return;
        }
        requestBody.reason = reason;
      }

      const response = await fetch(
        `/api/laborers/${selectedLaborer._id}/attendance`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`
        );
      }

      const result = await response.json();

      if (result.success) {
        // Update local state
        setAttendanceData((prev) => ({
          ...prev,
          [selectedLaborer._id]: {
            ...prev[selectedLaborer._id],
            [today]: status,
          },
        }));

        // Update laborer's last attendance and days worked
        const updatedLaborers = laborers.map((l) => {
          if (l._id === selectedLaborer._id) {
            return {
              ...l,
              lastAttendance: today,
              daysWorked:
                status === "present" ? (l.daysWorked || 0) + 1 : l.daysWorked,
            };
          }
          return l;
        });

        setLaborers(updatedLaborers);
        setShowAttendanceModal(false);
        setSelectedAttendanceType("present");
        setSelectedReason("");
        setCustomReason("");
        setShowReasonInput(false);
        alert(
          `Attendance marked as ${selectedAttendanceType} for ${selectedLaborer.name}`
        );
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
      alert("Error marking attendance. Please try again.");
    }
  };

  const showAttendanceReport = async (laborer) => {
    setSelectedLaborer(laborer);
    setShowCalendarModal(true);

    try {
      const month = currentMonth.getMonth() + 1;
      const year = currentMonth.getFullYear();

      const response = await fetch(
        `/api/laborers/${laborer._id}/attendance?month=${month}&year=${year}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // CRITICAL FIX: Replace the specific laborer's data instead of merging
        setAttendanceData((prev) => ({
          ...prev,
          [laborer._id]: result.data, // This replaces only this laborer's data
        }));
      } else {
        console.error("API Error:", result.message);
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      alert("Error fetching attendance data. Please try again.");
    }
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className={styles.calendarDay}></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentMonth.getFullYear()}-${String(
        currentMonth.getMonth() + 1
      ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      // CRITICAL FIX: Make sure we're getting attendance for the correct laborer
      const attendance = attendanceData[selectedLaborer?._id]?.[dateStr];

      days.push(
        <div
          key={day}
          className={`${styles.calendarDay} ${styles.calendarDayWithDate}`}
        >
          <span className={styles.dayNumber}>{day}</span>
          {attendance && (
            <div
              className={`${styles.attendanceDot} ${
                attendance.status === "present"
                  ? styles.presentDot
                  : attendance.status === "holiday"
                  ? styles.holidayDot
                  : styles.absentDot
              }`}
            >
              {attendance.status === "present"
                ? "✓"
                : attendance.status === "holiday"
                ? "🏖️"
                : "✗"}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const handleBulkAttendance = () => {
    setShowBulkAttendanceModal(true);
    // Initialize bulk attendance data
    const initialData = {};
    laborers.forEach((laborer) => {
      initialData[laborer._id] = "present"; // Default to present
    });
    setBulkAttendanceData(initialData);
  };

  const submitBulkAttendance = async () => {
    try {
      const attendanceArray = Object.entries(bulkAttendanceData).map(
        ([laborerId, status]) => ({
          laborerId,
          status,
        })
      );

      const response = await fetch("/api/attendance/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: selectedDate,
          attendanceData: attendanceArray,
        }),
      });

      if (response.ok) {
        setShowBulkAttendanceModal(false);
        fetchLaborers(); // Refresh data
        alert("Bulk attendance marked successfully!");
      }
    } catch (error) {
      console.error("Error submitting bulk attendance:", error);
      alert("Error submitting bulk attendance");
    }
  };

  const changeMonth = async (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);

    if (selectedLaborer) {
      try {
        const month = newMonth.getMonth() + 1;
        const year = newMonth.getFullYear();

        const response = await fetch(
          `/api/laborers/${selectedLaborer._id}/attendance?month=${month}&year=${year}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          setAttendanceData((prev) => ({
            ...prev,
            [selectedLaborer._id]: result.data,
          }));
        } else {
          console.error("API Error:", result.message);
        }
      } catch (error) {
        console.error("Error fetching attendance data:", error);
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Labor Management</h1>
          <p>Manage laborers, track attendance, and monitor payroll</p>
        </div>
        <div className={styles.headerActions}>
          <button
            onClick={handleBulkAttendance}
            className={styles.secondaryBtn}
          >
            Bulk Attendance
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className={styles.primaryBtn}
          >
            Add Laborer
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.darkCard}`}>
          <div className={styles.statContent}>
            <div className={styles.statInfo}>
              <h3>{stats.totalLaborers}</h3>
              <p className={styles.statTitle}>Total Laborers</p>
              <p className={styles.statDescription}>All registered laborers</p>
            </div>
            <div className={styles.statIcon}>👷</div>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.lightCard}`}>
          <div className={styles.statContent}>
            <div className={styles.statInfo}>
              <h3>{stats.activeLaborers}</h3>
              <p className={styles.statTitle}>Active Laborers</p>
              <p className={styles.statDescription}>Currently working</p>
            </div>
            <div className={styles.statIcon}>✅</div>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.mediumCard}`}>
          <div className={styles.statContent}>
            <div className={styles.statInfo}>
              <h3>₹{stats.monthlyPayroll.toLocaleString()}</h3>
              <p className={styles.statTitle}>Monthly Payroll</p>
              <p className={styles.statDescription}>Total monthly expenses</p>
            </div>
            <div className={styles.statIcon}>💰</div>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.grayCard}`}>
          <div className={styles.statContent}>
            <div className={styles.statInfo}>
              <h3>{stats.totalDaysWorked}</h3>
              <p className={styles.statTitle}>Total Days Worked</p>
              <p className={styles.statDescription}>Cumulative attendance</p>
            </div>
            <div className={styles.statIcon}>📅</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className={styles.searchContainer}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search laborers by name or phone..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {searchTerm && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => setSearchTerm("")}
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h3>Labor Database</h3>
          <span className={styles.recordCount}>
            {filteredLaborers.length} records
          </span>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Joining Date</th>
                <th>Days Worked</th>
                <th>Monthly Pay</th>
                <th>Last Attendance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLaborers.length === 0 ? (
                <tr>
                  <td colSpan="8" className={styles.noData}>
                    {searchTerm
                      ? "No laborers found matching your search."
                      : "No laborers found. Add your first laborer to get started."}
                  </td>
                </tr>
              ) : (
                filteredLaborers.map((laborer) => (
                  <tr key={laborer._id}>
                    <td className={styles.nameCell}>{laborer.name}</td>
                    <td>{laborer.phone}</td>
                    <td>
                      {new Date(laborer.joiningDate).toLocaleDateString()}
                    </td>
                    <td>{laborer.daysWorked}</td>
                    <td>₹{laborer.monthlyPay?.toLocaleString()}</td>
                    <td>
                      {laborer.lastAttendance
                        ? new Date(laborer.lastAttendance).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td>
                      <span
                        className={
                          laborer.status === "Active"
                            ? styles.statusActive
                            : styles.statusInactive
                        }
                      >
                        {laborer.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button
                          className={styles.actionBtn}
                          onClick={() => handleMarkAttendance(laborer)}
                          title="Mark Attendance"
                        >
                          📋
                        </button>
                        <button
                          className={styles.actionBtn}
                          onClick={() => showAttendanceReport(laborer)}
                          title="View Report"
                        >
                          📅
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals remain the same but with updated styling */}
      {showAddForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Add New Laborer</h2>
              <button
                className={styles.closeBtn}
                onClick={() => setShowAddForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddLaborer} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Name *</label>
                <input
                  type="text"
                  required
                  value={newLaborer.name}
                  onChange={(e) =>
                    setNewLaborer({ ...newLaborer, name: e.target.value })
                  }
                  placeholder="Enter laborer's name"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Phone *</label>
                <input
                  type="tel"
                  required
                  value={newLaborer.phone}
                  onChange={(e) =>
                    setNewLaborer({ ...newLaborer, phone: e.target.value })
                  }
                  placeholder="Enter phone number"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Joining Date *</label>
                <input
                  type="date"
                  required
                  value={newLaborer.joiningDate}
                  onChange={(e) =>
                    setNewLaborer({
                      ...newLaborer,
                      joiningDate: e.target.value,
                    })
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <label>Monthly Pay *</label>
                <input
                  type="number"
                  required
                  value={newLaborer.monthlyPay}
                  onChange={(e) =>
                    setNewLaborer({
                      ...newLaborer,
                      monthlyPay: Number.parseInt(e.target.value),
                    })
                  }
                  placeholder="Enter monthly pay amount"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Status</label>
                <select
                  value={newLaborer.status}
                  onChange={(e) =>
                    setNewLaborer({ ...newLaborer, status: e.target.value })
                  }
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Add Laborer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Mark Attendance for {selectedLaborer?.name}</h2>
              <button
                className={styles.closeBtn}
                onClick={() => setShowAttendanceModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.attendanceOptions}>
              <p>
                Mark attendance for today ({new Date().toLocaleDateString()})
              </p>

              {/* Attendance Type Selection */}
              <div className={styles.attendanceTypeSelection}>
                <div className={styles.radioGroup}>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="attendanceType"
                      value="present"
                      checked={selectedAttendanceType === "present"}
                      onChange={(e) => {
                        setSelectedAttendanceType(e.target.value);
                        setShowReasonInput(false);
                        setSelectedReason("");
                        setCustomReason("");
                      }}
                    />
                    <span>✅ Present</span>
                  </label>

                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="attendanceType"
                      value="absent"
                      checked={selectedAttendanceType === "absent"}
                      onChange={(e) => {
                        setSelectedAttendanceType(e.target.value);
                        setShowReasonInput(false);
                        setSelectedReason("");
                        setCustomReason("");
                      }}
                    />
                    <span>❌ Absent</span>
                  </label>

                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="attendanceType"
                      value="holiday"
                      checked={selectedAttendanceType === "holiday"}
                      onChange={(e) => {
                        setSelectedAttendanceType(e.target.value);
                        setShowReasonInput(false);
                        setSelectedReason("");
                        setCustomReason("");
                      }}
                    />
                    <span>🏖️ Holiday</span>
                  </label>
                </div>
              </div>

              {/* Reason Selection for Absent/Holiday */}
              {selectedAttendanceType !== "present" && (
                <div className={styles.reasonSelection}>
                  <label htmlFor="reasonSelect">Select Reason:</label>
                  <select
                    id="reasonSelect"
                    value={selectedReason}
                    onChange={(e) => {
                      setSelectedReason(e.target.value);
                      setShowReasonInput(e.target.value === "custom");
                      if (e.target.value !== "custom") {
                        setCustomReason("");
                      }
                    }}
                    className={styles.reasonSelect}
                  >
                    <option value="">Select a reason</option>
                    {(selectedAttendanceType === "absent"
                      ? absentReasons
                      : holidayReasons
                    ).map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                    <option value="custom">Custom reason</option>
                  </select>

                  {showReasonInput && (
                    <div className={styles.customReasonInput}>
                      <label htmlFor="customReason">Custom Reason:</label>
                      <input
                        id="customReason"
                        type="text"
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        placeholder="Enter custom reason"
                        className={styles.customInput}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className={styles.attendanceButtons}>
                <button
                  className={styles.cancelBtn}
                  onClick={() => setShowAttendanceModal(false)}
                >
                  Cancel
                </button>
                <button className={styles.submitBtn} onClick={markAttendance}>
                  Mark Attendance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Modal */}
      {showCalendarModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Attendance Report - {selectedLaborer?.name}</h2>
              <button
                className={styles.closeBtn}
                onClick={() => setShowCalendarModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.calendarContainer}>
              <div className={styles.calendarHeader}>
                <button
                  onClick={() => changeMonth(-1)}
                  className={styles.calendarNavBtn}
                >
                  ◀
                </button>
                <h3>
                  {currentMonth.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
                <button
                  onClick={() => changeMonth(1)}
                  className={styles.calendarNavBtn}
                >
                  ▶
                </button>
              </div>
              <div className={styles.calendarGrid}>
                <div className={styles.calendarDayHeader}>Sun</div>
                <div className={styles.calendarDayHeader}>Mon</div>
                <div className={styles.calendarDayHeader}>Tue</div>
                <div className={styles.calendarDayHeader}>Wed</div>
                <div className={styles.calendarDayHeader}>Thu</div>
                <div className={styles.calendarDayHeader}>Fri</div>
                <div className={styles.calendarDayHeader}>Sat</div>
                {renderCalendar()}
              </div>
              <div className={styles.calendarLegend}>
                <div className={styles.legendItem}>
                  <div
                    className={`${styles.attendanceDot} ${styles.presentDot}`}
                  >
                    ✓
                  </div>
                  <span>Present</span>
                </div>
                <div className={styles.legendItem}>
                  <div
                    className={`${styles.attendanceDot} ${styles.absentDot}`}
                  >
                    ✗
                  </div>
                  <span>Absent</span>
                </div>
                <div className={styles.legendItem}>
                  <div
                    className={`${styles.attendanceDot} ${styles.holidayDot}`}
                  >
                    🏖️
                  </div>
                  <span>Holiday</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Attendance Modal */}
      {showBulkAttendanceModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Bulk Attendance</h2>
              <button
                className={styles.closeBtn}
                onClick={() => setShowBulkAttendanceModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.bulkAttendanceContainer}>
              <div className={styles.dateSelector}>
                <label>Select Date:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className={styles.dateInput}
                />
              </div>
              <div className={styles.bulkAttendanceList}>
                {laborers
                  .filter((l) => l.status === "Active")
                  .map((laborer) => (
                    <div
                      key={laborer._id}
                      className={styles.bulkAttendanceItem}
                    >
                      <span className={styles.laborerName}>{laborer.name}</span>
                      <div className={styles.attendanceToggle}>
                        <button
                          className={`${styles.toggleBtn} ${
                            bulkAttendanceData[laborer._id] === "present"
                              ? styles.active
                              : ""
                          }`}
                          onClick={() =>
                            setBulkAttendanceData((prev) => ({
                              ...prev,
                              [laborer._id]: "present",
                            }))
                          }
                        >
                          Present
                        </button>
                        <button
                          className={`${styles.toggleBtn} ${
                            bulkAttendanceData[laborer._id] === "absent"
                              ? styles.active
                              : ""
                          }`}
                          onClick={() =>
                            setBulkAttendanceData((prev) => ({
                              ...prev,
                              [laborer._id]: "absent",
                            }))
                          }
                        >
                          Absent
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
              <div className={styles.bulkAttendanceActions}>
                <button
                  onClick={() => setShowBulkAttendanceModal(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  onClick={submitBulkAttendance}
                  className={styles.submitBtn}
                >
                  Submit Attendance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Labor;
