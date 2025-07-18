"use client";

import { useState, useEffect } from "react";
import styles from "./Reminders.module.css";
// import {
//   notificationService,
//   checkOverdueReminders,
// } from "../utils/notifications";

const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [scheduledReminders, setScheduledReminders] = useState([]);
  const [overdueReminders, setOverdueReminders] = useState([]);
  const [completedReminders, setCompletedReminders] = useState([]);
  const [stats, setStats] = useState({
    totalReminders: 0,
    overdue: 0,
    dueToday: 0,
    upcoming: 0,
    scheduled: 0,
    completed: 0,
    critical: 0,
    failed_contact: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({});
  const [modalType, setModalType] = useState("");

  useEffect(() => {
    fetchReminders();
    // Request notification permission on component mount
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Check every 2 minutes for real-time updates
    const interval = setInterval(() => {
      fetchReminders();
      // Add notification check
    }, 120000);

    // Initial notification check after 5 seconds
    setTimeout(5000);

    return () => clearInterval(interval);
  }, []);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/reminders");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.reminders && data.stats) {
        setReminders(data.reminders);
        setUpcomingReminders(data.upcomingReminders || []);
        setScheduledReminders(data.scheduledReminders || []);
        setOverdueReminders(data.overdueReminders || []);
        setCompletedReminders(data.completedReminders || []);
        setStats(data.stats);
      } else {
        // Initialize empty states
        setReminders([]);
        setUpcomingReminders([]);
        setScheduledReminders([]);
        setOverdueReminders([]);
        setCompletedReminders([]);
        setStats({
          totalReminders: 0,
          overdue: 0,
          dueToday: 0,
          upcoming: 0,
          scheduled: 0,
          completed: 0,
          critical: 0,
          failed_contact: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching reminders:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action, reminderId, data = {}) => {
    try {
      console.log("Sending action:", action, "with data:", data);
      const response = await fetch("/api/reminders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          reminderId,
          data,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }
      // Refresh reminders after action
      await fetchReminders();
      setShowModal(false);
      setModalData({});
      setModalType("");
    } catch (error) {
      console.error("Error performing action:", error);
      alert("Error performing action: " + error.message);
    }
  };

  const handleMarkCalled = (reminderId) => {
    handleAction("mark_called", reminderId);
  };

  const handleMarkScheduled = (reminder) => {
    setModalData(reminder);
    setModalType("schedule_date");
    setShowModal(true);
  };

  const handleMarkCompleted = (reminderId) => {
    if (confirm("Are you sure you want to mark this reminder as completed?")) {
      handleAction("mark_completed", reminderId);
    }
  };

  const openNotesModal = (reminder) => {
    setModalData(reminder);
    setModalType("add_notes");
    setShowModal(true);
  };

  const handleUpdateServiceDate = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newServiceDate = formData.get("serviceDate");
    if (newServiceDate) {
      handleAction("update_service_date", modalData._id, {
        newServiceDate: newServiceDate,
      });
    }
  };

  const handleScheduleDate = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const scheduledDate = formData.get("scheduledDate");
    if (scheduledDate) {
      const selectedDate = new Date(scheduledDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        alert("Cannot schedule a date in the past!");
        return;
      }
      handleAction("mark_scheduled", modalData._id, {
        scheduledDate: scheduledDate,
      });
    }
  };

  const handleUpdateSchedule = (reminder) => {
    setModalData(reminder);
    setModalType("update_schedule");
    setShowModal(true);
  };

  const handleServiceDone = (reminder) => {
    setModalData(reminder);
    setModalType("service_done");
    setShowModal(true);
  };

  const handleUpdateService = (reminder) => {
    setModalData(reminder);
    setModalType("update_service");
    setShowModal(true);
  };

  const handleUpdateScheduleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const scheduledDate = formData.get("scheduledDate");
    if (scheduledDate) {
      const selectedDate = new Date(scheduledDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        alert("Cannot schedule a date in the past!");
        return;
      }
      handleAction("update_schedule", modalData._id, {
        scheduledDate: scheduledDate,
      });
    }
  };

  const handleServiceDoneSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const completedDate = formData.get("completedDate");
    const nextServiceDate = formData.get("nextServiceDate");

    if (completedDate) {
      handleAction("service_done", modalData._id, {
        completedDate: completedDate,
        nextServiceDate: nextServiceDate,
      });
    }
  };

  const handleUpdateServiceSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const serviceDate = formData.get("serviceDate");
    const nextServiceDate = formData.get("nextServiceDate");

    if (serviceDate) {
      handleAction("update_service", modalData._id, {
        serviceDate: serviceDate,
        nextServiceDate: nextServiceDate,
      });
    }
  };

  const handleSetCustomReminder = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const hours = Number.parseInt(formData.get("hours"));
    if (hours > 0) {
      handleAction("set_custom_reminder", modalData._id, {
        hours: hours,
      });
    }
  };

  const handleAddNotes = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const notes = formData.get("notes");
    handleAction("add_notes", modalData._id, {
      notes: notes,
    });
  };

  const handleDeleteReminder = (reminderId) => {
    if (
      confirm(
        "Are you sure you want to delete this reminder? This action cannot be undone."
      )
    ) {
      handleAction("delete_reminder", reminderId);
    }
  };

  // FIXED: Proper last service display function
  const formatLastService = (reminder) => {
    // If it's a new service or lastService is "New Service", return as is
    if (reminder.isNewService || reminder.lastService === "New Service") {
      return "New Service";
    }

    // If lastService is already a formatted string date, return it
    if (
      typeof reminder.lastService === "string" &&
      reminder.lastService !== "New Service"
    ) {
      return reminder.lastService;
    }

    // If it's a date object or date string, format it
    try {
      const date = new Date(reminder.lastService);
      if (isNaN(date)) return "New Service";
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      return date.toLocaleDateString("en-GB");
    } catch (error) {
      return "New Service";
    }
  };

  // FIXED: Proper date formatting function
  const formatDate = (dateValue) => {
    if (!dateValue) return "Not Set";

    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleDateString("en-GB");
    } catch (e) {
      return "Invalid Date";
    }
  };

  // ENHANCED STATUS COLORS AND LOGIC
  const getStatusColor = (reminder) => {
    if (reminder.completed) return styles.statusCompleted;
    if (
      reminder.status === "overdue_scheduled" ||
      reminder.status === "overdue_pending"
    )
      return styles.statusOverdue;
    if (reminder.escalationLevel === 2) return styles.statusCritical;
    if (reminder.isScheduledOverdue) return styles.statusOverdueScheduled;
    if (reminder.isDueToday) return styles.statusDueToday;
    if (reminder.status === "scheduled") return styles.statusScheduled;
    if (reminder.status === "called") return styles.statusCalled;
    if (reminder.status === "failed_contact") return styles.statusFailedContact;
    return styles.statusPending;
  };

  const getStatusText = (reminder) => {
    if (reminder.completed) return "Completed";
    if (reminder.status === "overdue_scheduled") return "Overdue Scheduled";
    if (reminder.status === "overdue_pending") return "Overdue Pending";
    if (reminder.escalationLevel === 2) return "Critical";
    if (reminder.isScheduledOverdue) return "Scheduled Overdue";
    if (reminder.status === "scheduled") return "Scheduled";
    if (reminder.status === "called") return "Called";
    if (reminder.status === "failed_contact") return "Failed Contact";
    if (reminder.isDueToday) return "Due Today";
    return "Pending";
  };

  const getUrgencyIndicator = (reminder) => {
    if (reminder.escalationLevel === 2) return "🚨";
    if (reminder.escalationLevel === 1) return "⚠️";
    if (reminder.isScheduledOverdue) return "🔴";
    if (reminder.isDueToday) return "📅";
    return "";
  };

  const renderReminderTable = (
    reminderList,
    title,
    emptyMessage,
    showUrgency = false
  ) => {
    return (
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h3>
            {title}
            {showUrgency && (
              <span className={styles.urgentBadge}>🚨 URGENT</span>
            )}
          </h3>
          <span className={styles.recordCount}>
            {reminderList.length} {title.toLowerCase()}
          </span>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Urgency</th>
                <th>Property Name</th>
                <th>Key Person</th>
                <th>Contact</th>
                <th>Service Type</th>
                <th>Last Service</th>
                <th>Scheduled Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reminderList.length === 0 ? (
                <tr>
                  <td colSpan="11" className={styles.noData}>
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                reminderList.map((reminder) => (
                  <tr
                    key={reminder._id}
                    className={`${
                      reminder.escalationLevel === 2
                        ? styles.criticalRow
                        : reminder.isOverdue
                        ? styles.overdueRow
                        : reminder.isScheduledOverdue
                        ? styles.scheduledOverdueRow
                        : ""
                    }`}
                  >
                    <td className={styles.urgencyCell}>
                      {getUrgencyIndicator(reminder)}
                    </td>
                    <td className={styles.nameCell}>
                      {reminder.propertyName}
                      {reminder.notes && (
                        <div
                          className={styles.noteIndicator}
                          title={reminder.notes}
                        >
                          📝
                        </div>
                      )}
                    </td>
                    <td>{reminder.keyPerson}</td>
                    <td>{reminder.contact}</td>
                    <td>
                      <span className={styles.serviceTag}>
                        {reminder.serviceType}
                      </span>
                    </td>
                    <td className={styles.lastServiceCell}>
                      <span
                        className={
                          reminder.isNewService ? styles.newServiceBadge : ""
                        }
                      >
                        {formatLastService(reminder)}
                      </span>
                    </td>
                    <td
                      className={
                        reminder.isOverdue
                          ? styles.overdueScheduled
                          : reminder.isDueToday
                          ? styles.dueToday
                          : ""
                      }
                    >
                      {formatDate(reminder.scheduledDate)}
                    </td>
                    <td>
                      <span className={getStatusColor(reminder)}>
                        {getStatusText(reminder)}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        {!reminder.completed && (
                          <>
                            {/* CALL BUTTON - Show for overdue items that haven't been called */}
                            {/* CALL BUTTON - Show for overdue items, changes to delete after 4 attempts */}
                            {reminder.isOverdue &&
                              reminder.callAttempts < 4 && (
                                <button
                                  onClick={() => handleMarkCalled(reminder._id)}
                                  className={styles.callButton}
                                  title={`Mark as Called (${reminder.callAttempts}/4 attempts)`}
                                >
                                  📞
                                  {reminder.callAttempts > 0 && (
                                    <span className={styles.attemptBadge}>
                                      {reminder.callAttempts}
                                    </span>
                                  )}
                                </button>
                              )}

                            {/* DELETE BUTTON - Show after 4 call attempts */}
                            {reminder.isOverdue &&
                              reminder.callAttempts >= 4 && (
                                <button
                                  onClick={() =>
                                    handleDeleteReminder(reminder._id)
                                  }
                                  className={styles.deleteButton}
                                  title="Delete (Unresponsive after 4 attempts)"
                                >
                                  🗑️
                                </button>
                              )}

                            {/* UPDATE SCHEDULE BUTTON - Show for called items or scheduled items */}
                            {(reminder.called ||
                              reminder.status === "scheduled") && (
                              <button
                                onClick={() => handleUpdateSchedule(reminder)}
                                className={styles.scheduleButton}
                                title="Update Schedule"
                              >
                                📅
                              </button>
                            )}

                            {/* UPDATE SERVICE BUTTON - Show for called items or scheduled items */}
                            {(reminder.called ||
                              reminder.status === "scheduled") && (
                              <button
                                onClick={() => handleUpdateService(reminder)}
                                className={styles.updateServiceButton}
                                title="Update Service"
                              >
                                🔧
                              </button>
                            )}

                            {/* SERVICE DONE BUTTON - Show for scheduled items on/after scheduled date */}
                            {reminder.status === "scheduled" &&
                              (reminder.isDueToday || reminder.isOverdue) && (
                                <button
                                  onClick={() => handleServiceDone(reminder)}
                                  className={styles.serviceDoneButton}
                                  title="Service Done"
                                >
                                  ✅
                                </button>
                              )}

                            {/* NOTES BUTTON */}
                            <button
                              onClick={() => openNotesModal(reminder)}
                              className={styles.notesButton}
                              title="Add Notes"
                            >
                              📋
                            </button>

                            {/* COMPLETED BUTTON */}
                            <button
                              onClick={() => handleMarkCompleted(reminder._id)}
                              className={styles.completeButton}
                              title="Mark as Completed"
                            >
                              ✅
                            </button>
                            {/* DELETE BUTTON */}
                            <button
                              onClick={() => handleDeleteReminder(reminder._id)}
                              className={styles.deleteButton}
                              title="Delete Reminder"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderModal = () => {
    if (!showModal) return null;
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <div className={styles.modalHeader}>
            <h3>
              <h3>
                {modalType === "update_schedule" && "Update Schedule"}
                {modalType === "service_done" && "Service Done"}
                {modalType === "update_service" && "Update Service"}
                {modalType === "custom_reminder" && "Set Custom Reminder"}
                {modalType === "add_notes" && "Add Notes"}
              </h3>
            </h3>
            <button
              onClick={() => setShowModal(false)}
              className={styles.closeButton}
            >
              ×
            </button>
          </div>
          <div className={styles.modalContent}>
            {modalType === "update_schedule" && (
              <form onSubmit={handleUpdateScheduleSubmit}>
                <div className={styles.formGroup}>
                  <label htmlFor="scheduledDate">Update Scheduled Date:</label>
                  <input
                    type="date"
                    id="scheduledDate"
                    name="scheduledDate"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    defaultValue={
                      modalData.scheduledDate
                        ? new Date(modalData.scheduledDate)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                  />
                </div>
                <div className={styles.modalActions}>
                  <button type="submit" className={styles.submitButton}>
                    Update Schedule
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className={styles.cancelButton}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
            {modalType === "service_done" && (
              <form onSubmit={handleServiceDoneSubmit}>
                <div className={styles.formGroup}>
                  <label htmlFor="completedDate">Service Completed Date:</label>
                  <input
                    type="date"
                    id="completedDate"
                    name="completedDate"
                    required
                    max={new Date().toISOString().split("T")[0]}
                    defaultValue={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="nextServiceDate">Next Service Date:</label>
                  <input
                    type="date"
                    id="nextServiceDate"
                    name="nextServiceDate"
                    min={new Date().toISOString().split("T")[0]}
                    defaultValue={(() => {
                      const nextMonth = new Date();
                      nextMonth.setMonth(nextMonth.getMonth() + 1);
                      return nextMonth.toISOString().split("T")[0];
                    })()}
                  />
                  <small className={styles.helpText}>
                    Default is 1 month from today. You can change this date.
                  </small>
                </div>
                <div className={styles.modalActions}>
                  <button type="submit" className={styles.submitButton}>
                    Service Done
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className={styles.cancelButton}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
            {modalType === "update_service" && (
              <form onSubmit={handleUpdateServiceSubmit}>
                <div className={styles.formGroup}>
                  <label htmlFor="serviceDate">Service Completed Date:</label>
                  <input
                    type="date"
                    id="serviceDate"
                    name="serviceDate"
                    required
                    max={new Date().toISOString().split("T")[0]}
                    defaultValue={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="nextServiceDate">Next Service Date:</label>
                  <input
                    type="date"
                    id="nextServiceDate"
                    name="nextServiceDate"
                    min={new Date().toISOString().split("T")[0]}
                    defaultValue={(() => {
                      const nextMonth = new Date();
                      nextMonth.setMonth(nextMonth.getMonth() + 1);
                      return nextMonth.toISOString().split("T")[0];
                    })()}
                  />
                  <small className={styles.helpText}>
                    Default is 1 month from today. You can change this date.
                  </small>
                </div>
                <div className={styles.modalActions}>
                  <button type="submit" className={styles.submitButton}>
                    Update Service
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className={styles.cancelButton}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
            {modalType === "custom_reminder" && (
              <form onSubmit={handleSetCustomReminder}>
                <div className={styles.formGroup}>
                  <label htmlFor="hours">Remind me in (hours):</label>
                  <select id="hours" name="hours" required>
                    <option value="1">1 hour</option>
                    <option value="2">2 hours</option>
                    <option value="4">4 hours</option>
                    <option value="8">8 hours</option>
                    <option value="12">12 hours</option>
                    <option value="24">24 hours</option>
                    <option value="48">48 hours</option>
                  </select>
                </div>
                <div className={styles.modalActions}>
                  <button type="submit" className={styles.submitButton}>
                    Set Reminder
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className={styles.cancelButton}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
            {modalType === "add_notes" && (
              <form onSubmit={handleAddNotes}>
                <div className={styles.formGroup}>
                  <label htmlFor="notes">Notes:</label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows="4"
                    defaultValue={modalData.notes || ""}
                    placeholder="Add your notes here..."
                  />
                </div>
                <div className={styles.modalActions}>
                  <button type="submit" className={styles.submitButton}>
                    Save Notes
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className={styles.cancelButton}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading reminders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Error Loading Reminders</h2>
          <p>{error}</p>
          <button onClick={fetchReminders} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Service Reminders Dashboard</h1>
          <p>Comprehensive reminder management and workflow system</p>
        </div>
        <button onClick={fetchReminders} className={styles.refreshButton}>
          🔄 Refresh
        </button>
      </div>

      {/* ENHANCED STATS DASHBOARD */}
      <div className={styles.statsContainer}>
        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.totalCard}`}>
            <div className={styles.statContent}>
              <div className={styles.statInfo}>
                <h3>{stats.totalReminders}</h3>
                <p className={styles.statTitle}>Total Active</p>
                <p className={styles.statDescription}>Active reminders</p>
              </div>
              <div className={styles.statIcon}>📋</div>
            </div>
          </div>
          <div className={`${styles.statCard} ${styles.overdueCard}`}>
            <div className={styles.statContent}>
              <div className={styles.statInfo}>
                <h3>{stats.overdue}</h3>
                <p className={styles.statTitle}>Overdue</p>
                <p className={styles.statDescription}>
                  Requires immediate action
                </p>
              </div>
              <div className={styles.statIcon}>🚨</div>
            </div>
          </div>
          <div className={`${styles.statCard} ${styles.criticalCard}`}>
            <div className={styles.statContent}>
              <div className={styles.statInfo}>
                <h3>{stats.critical}</h3>
                <p className={styles.statTitle}>Critical</p>
                <p className={styles.statDescription}>Maximum priority</p>
              </div>
              <div className={styles.statIcon}>⚠️</div>
            </div>
          </div>
          <div className={`${styles.statCard} ${styles.dueTodayCard}`}>
            <div className={styles.statContent}>
              <div className={styles.statInfo}>
                <h3>{stats.dueToday}</h3>
                <p className={styles.statTitle}>Due Today</p>
                <p className={styles.statDescription}>Action needed today</p>
              </div>
              <div className={styles.statIcon}>📅</div>
            </div>
          </div>
          <div className={`${styles.statCard} ${styles.scheduledCard}`}>
            <div className={styles.statContent}>
              <div className={styles.statInfo}>
                <h3>{stats.scheduled}</h3>
                <p className={styles.statTitle}>Scheduled</p>
                <p className={styles.statDescription}>Service scheduled</p>
              </div>
              <div className={styles.statIcon}>✅</div>
            </div>
          </div>
          <div className={`${styles.statCard} ${styles.upcomingCard}`}>
            <div className={styles.statContent}>
              <div className={styles.statInfo}>
                <h3>{stats.upcoming}</h3>
                <p className={styles.statTitle}>Upcoming</p>
                <p className={styles.statDescription}>Future reminders</p>
              </div>
              <div className={styles.statIcon}>⏰</div>
            </div>
          </div>
          <div className={`${styles.statCard} ${styles.completedCard}`}>
            <div className={styles.statContent}>
              <div className={styles.statInfo}>
                <h3>{stats.completed}</h3>
                <p className={styles.statTitle}>Completed</p>
                <p className={styles.statDescription}>Recently completed</p>
              </div>
              <div className={styles.statIcon}>🎉</div>
            </div>
          </div>
          <div className={`${styles.statCard} ${styles.failedCard}`}>
            <div className={styles.statContent}>
              <div className={styles.statInfo}>
                <h3>{stats.failed_contact}</h3>
                <p className={styles.statTitle}>Failed Contact</p>
                <p className={styles.statDescription}>Unable to reach</p>
              </div>
              <div className={styles.statIcon}>📞</div>
            </div>
          </div>
        </div>
      </div>

      {/* OVERDUE REMINDERS - HIGHEST PRIORITY */}
      {overdueReminders.length > 0 && (
        <div className={styles.section}>
          {renderReminderTable(
            overdueReminders,
            "🚨 Overdue Reminders",
            "No overdue reminders",
            true
          )}
        </div>
      )}

      {/* CURRENT REMINDERS - IMMEDIATE ACTION NEEDED */}
      {reminders.length > 0 && (
        <div className={styles.section}>
          {renderReminderTable(
            reminders,
            "📋 Current Reminders",
            "No current reminders"
          )}
        </div>
      )}

      {/* SCHEDULED REMINDERS */}
      {scheduledReminders.length > 0 && (
        <div className={styles.section}>
          {renderReminderTable(
            scheduledReminders,
            "📅 Scheduled Services",
            "No scheduled services"
          )}
        </div>
      )}

      {/* UPCOMING REMINDERS 
      {upcomingReminders.length > 0 && (
        <div className={styles.section}>
          {renderReminderTable(
            upcomingReminders,
            "⏰ Upcoming Reminders",
            "No upcoming reminders"
          )}
        </div>
      )} */}

      {/* COMPLETED REMINDERS */}
      {completedReminders.length > 0 && (
        <div className={styles.section}>
          {renderReminderTable(
            completedReminders,
            "✅ Recently Completed",
            "No completed reminders"
          )}
        </div>
      )}

      {/* EMPTY STATE */}
      {reminders.length === 0 &&
        upcomingReminders.length === 0 &&
        scheduledReminders.length === 0 &&
        overdueReminders.length === 0 &&
        completedReminders.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📋</div>
            <h2>No Reminders Found</h2>
            <p>No service reminders are currently available.</p>
            <button onClick={fetchReminders} className={styles.refreshButton}>
              🔄 Refresh Data
            </button>
          </div>
        )}

      {/* MODAL */}
      {renderModal()}
    </div>
  );
};

export default Reminders;
