"use client";

import { useState, useEffect } from "react";
import styles from "./DailyBook.module.css";

const DailyBook = () => {
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState({
    totalEntries: 0,
    totalAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [services, setServices] = useState([
    "Water Tank Cleaning",
    "Pest Control",
    "Motor Repairing & Rewinding",
  ]);

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    property: "",
    keyPerson: "",
    contact: "",
    location: "",
    service: "",
    amount: "",
    remarks: "",
    // Service-specific fields
    ohTank: "",
    ugTank: "",
    sintexTank: "",
    numberOfFloors: "",
    wing: "",
    treatment: "",
    apartment: "",
    workDescription: "",
  });

  const [existingProperties, setExistingProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [showPropertySuggestions, setShowPropertySuggestions] = useState(false);

  useEffect(() => {
    fetchData();
    fetchServices();
    fetchExistingProperties();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/daily-book");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.entries && data.stats) {
        setEntries(data.entries);
        setStats(data.stats);
      } else if (Array.isArray(data)) {
        setEntries(data);
        const totalEntries = data.length;
        const totalAmount = data.reduce(
          (sum, entry) => sum + (entry.amount || 0),
          0
        );
        setStats({ totalEntries, totalAmount });
      } else {
        setEntries([]);
        setStats({ totalEntries: 0, totalAmount: 0 });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message);
      setEntries([]);
      setStats({ totalEntries: 0, totalAmount: 0 });
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services");
      if (response.ok) {
        const data = await response.json();
        if (data.services) {
          setServices(data.services.map((s) => s.name));
        }
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  const fetchExistingProperties = async () => {
    try {
      const response = await fetch("/api/properties");
      if (response.ok) {
        const data = await response.json();
        setExistingProperties(data.properties || []);
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Handle property name autocomplete
    if (name === "property") {
      if (value.length > 0) {
        const filtered = existingProperties.filter((prop) =>
          prop.name.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredProperties(filtered);
        setShowPropertySuggestions(true);
      } else {
        setShowPropertySuggestions(false);
      }
    }
  };

  const handlePropertySelect = (property) => {
    setFormData((prev) => ({
      ...prev,
      property: property.name,
      keyPerson: property.keyPerson || "",
      contact: property.contact || "",
      location: property.location || "",
    }));
    setShowPropertySuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Prepare the data based on selected service
      const entryData = {
        date: formData.date,
        property: formData.property,
        keyPerson: formData.keyPerson,
        contact: formData.contact,
        location: formData.location,
        service: formData.service,
        amount: parseFloat(formData.amount) || 0,
        remarks: formData.remarks,
      };

      // Add service-specific fields
      if (formData.service === "Water Tank Cleaning") {
        entryData.serviceDetails = {
          ohTank: formData.ohTank,
          ugTank: formData.ugTank,
          sintexTank: formData.sintexTank,
          numberOfFloors: formData.numberOfFloors,
          wing: formData.wing,
        };
      } else if (formData.service === "Pest Control") {
        entryData.serviceDetails = {
          treatment: formData.treatment,
          apartment: formData.apartment,
        };
      } else if (formData.service === "Motor Repairing & Rewinding") {
        entryData.serviceDetails = {
          workDescription: formData.workDescription,
        };
      }

      const response = await fetch("/api/daily-book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(entryData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save entry");
      }

      const result = await response.json();

      // Reset form and refresh data
      setFormData({
        date: new Date().toISOString().split("T")[0],
        property: "",
        keyPerson: "",
        contact: "",
        location: "",
        service: "",
        amount: "",
        remarks: "",
        ohTank: "",
        ugTank: "",
        sintexTank: "",
        numberOfFloors: "",
        wing: "",
        treatment: "",
        apartment: "",
        workDescription: "",
      });
      setShowForm(false);
      fetchData();
      alert(result.message || "Entry added successfully!");
    } catch (error) {
      console.error("Error saving entry:", error);
      alert(`Error saving entry: ${error.message}`);
    }
  };

  const handleExportCSV = () => {
    if (entries.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = [
      "Service Date",
      "Property",
      "Key Person",
      "Contact",
      "Location",
      "Service",
      "Amount",
      "Remarks",
      "Service Details",
    ];

    const csvContent = [
      headers.join(","),
      ...entries.map((entry) =>
        [
          entry.date,
          `"${entry.property}"`,
          `"${entry.keyPerson}"`,
          entry.contact,
          `"${entry.location}"`,
          `"${entry.service}"`,
          entry.amount,
          `"${entry.remarks || ""}"`,
          `"${
            entry.serviceDetails ? JSON.stringify(entry.serviceDetails) : ""
          }"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily-book-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleAddEntry = () => {
    setShowForm(true);
  };

  const renderServiceSpecificFields = () => {
    switch (formData.service) {
      case "Water Tank Cleaning":
        return (
          <div className={styles.serviceFields}>
            <h4>Water Tank Cleaning Details</h4>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>OH Tank</label>
                <input
                  type="text"
                  name="ohTank"
                  value={formData.ohTank}
                  onChange={handleInputChange}
                  placeholder="OH Tank details"
                />
              </div>
              <div className={styles.formGroup}>
                <label>UG Tank</label>
                <input
                  type="text"
                  name="ugTank"
                  value={formData.ugTank}
                  onChange={handleInputChange}
                  placeholder="UG Tank details"
                />
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Sintex Tank</label>
                <input
                  type="text"
                  name="sintexTank"
                  value={formData.sintexTank}
                  onChange={handleInputChange}
                  placeholder="Sintex Tank details"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Number of Floors</label>
                <input
                  type="number"
                  name="numberOfFloors"
                  value={formData.numberOfFloors}
                  onChange={handleInputChange}
                  placeholder="Number of floors"
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Wing</label>
              <input
                type="text"
                name="wing"
                value={formData.wing}
                onChange={handleInputChange}
                placeholder="Wing details"
              />
            </div>
          </div>
        );

      case "Pest Control":
        return (
          <div className={styles.serviceFields}>
            <h4>Pest Control Details</h4>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Treatment</label>
                <input
                  type="text"
                  name="treatment"
                  value={formData.treatment}
                  onChange={handleInputChange}
                  placeholder="e.g., Cockroach / Termite / Bed Bugs"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Apartment</label>
                <select
                  name="apartment"
                  value={formData.apartment}
                  onChange={handleInputChange}
                >
                  <option value="">Select apartment type</option>
                  <option value="1RK">1RK</option>
                  <option value="1BHK">1BHK</option>
                  <option value="2BHK">2BHK</option>
                  <option value="3BHK">3BHK</option>
                  <option value="4BHK">4BHK</option>
                </select>
              </div>
            </div>
          </div>
        );

      case "Motor Repairing & Rewinding":
        return (
          <div className={styles.serviceFields}>
            <h4>Motor Repairing & Rewinding Details</h4>
            <div className={styles.formGroup}>
              <label>Describe the Work</label>
              <textarea
                name="workDescription"
                value={formData.workDescription}
                onChange={handleInputChange}
                placeholder="Describe the work performed"
                rows="4"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading daily book entries...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>⚠️</div>
          <h3>Error Loading Data</h3>
          <p>Error loading data: {error}</p>
          <button onClick={fetchData} className={styles.retryBtn}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Daily Book</h1>
          <p>Record daily transactions and service entries</p>
        </div>
        <div className={styles.headerActions}>
          <button onClick={handleExportCSV} className={styles.secondaryBtn}>
            Export CSV
          </button>
          <button onClick={handleAddEntry} className={styles.primaryBtn}>
            Add Entry
          </button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.darkCard}`}>
          <div className={styles.statContent}>
            <div className={styles.statInfo}>
              <h3>{stats.totalEntries}</h3>
              <p className={styles.statTitle}>Total Entries</p>
              <p className={styles.statDescription}>
                Daily book entries recorded
              </p>
            </div>
            <div className={styles.statIcon}>📖</div>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.lightCard}`}>
          <div className={styles.statContent}>
            <div className={styles.statInfo}>
              <h3>₹{stats.totalAmount?.toLocaleString()}</h3>
              <p className={styles.statTitle}>Total Amount</p>
              <p className={styles.statDescription}>Total revenue recorded</p>
            </div>
            <div className={styles.statIcon}>💰</div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Add New Daily Book Entry</h3>
              <button
                onClick={() => setShowForm(false)}
                className={styles.closeBtn}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>
                    Service Date <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>
                    Service <span className={styles.required}>*</span>
                  </label>
                  <select
                    name="service"
                    value={formData.service}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select service</option>
                    {services.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>
                    Property / Client Name{" "}
                    <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.autocompleteContainer}>
                    <input
                      type="text"
                      name="property"
                      value={formData.property}
                      onChange={handleInputChange}
                      placeholder="Enter property/client name"
                      required
                    />
                    {showPropertySuggestions &&
                      filteredProperties.length > 0 && (
                        <div className={styles.suggestions}>
                          {filteredProperties.map((prop) => (
                            <div
                              key={prop._id}
                              className={styles.suggestion}
                              onClick={() => handlePropertySelect(prop)}
                            >
                              <strong>{prop.name}</strong>
                              <span>{prop.location}</span>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>
                    Key Person Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    name="keyPerson"
                    value={formData.keyPerson}
                    onChange={handleInputChange}
                    placeholder="Key person name"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>
                    Contact Number <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="tel"
                    name="contact"
                    value={formData.contact}
                    onChange={handleInputChange}
                    placeholder="Contact number"
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>
                    Location <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Location"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>
                    Amount <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="Amount"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Remarks</label>
                  <input
                    type="text"
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    placeholder="Additional remarks"
                  />
                </div>
              </div>

              {renderServiceSpecificFields()}

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Add Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h3>Daily Book Entries</h3>
          <span className={styles.recordCount}>{entries.length} records</span>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Property</th>
                <th>Key Person</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Service</th>
                <th>Amount</th>
                <th>Remarks</th>
                <th>Service Details</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan="9" className={styles.noData}>
                    No entries found. Add your first daily book entry to get
                    started.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry._id}>
                    <td>{new Date(entry.date).toLocaleDateString()}</td>
                    <td className={styles.nameCell}>{entry.property}</td>
                    <td>{entry.keyPerson}</td>
                    <td>{entry.contact}</td>
                    <td>{entry.location}</td>
                    <td>
                      <span className={styles.serviceTag}>{entry.service}</span>
                    </td>
                    <td className={styles.amountCell}>
                      ₹{entry.amount?.toLocaleString()}
                    </td>
                    <td className={styles.remarksCell}>
                      {entry.remarks || "-"}
                    </td>
                    <td className={styles.serviceDetailsCell}>
                      {entry.serviceDetails && (
                        <div className={styles.serviceDetails}>
                          {Object.entries(entry.serviceDetails).map(
                            ([key, value]) => (
                              <div key={key}>
                                <strong>{key}:</strong> {value}
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DailyBook;
