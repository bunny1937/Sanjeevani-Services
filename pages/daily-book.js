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
  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    property: "",
    keyPerson: "",
    contact: "",
    location: "",
    service: "",
    amount: "",
    remarks: "",
    serviceDetails: {}, // Dynamic service details
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
          setServices(data.services.filter((s) => s.active)); // Store full service objects, only active ones
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
    const { name, value, type, checked } = e.target;

    // Handle service type change - reset service details when service type changes
    if (name === "service") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        serviceDetails: {}, // Reset service details when service type changes
      }));
      return;
    }

    // Handle service detail fields
    if (name.startsWith("serviceDetail_")) {
      const fieldId = name.replace("serviceDetail_", "");
      setFormData((prev) => ({
        ...prev,
        serviceDetails: {
          ...prev.serviceDetails,
          [fieldId]: type === "checkbox" ? checked : value,
        },
      }));
      return;
    }

    // Handle regular form fields
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
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
      // Add dynamic service details
      entryData.serviceDetails = formData.serviceDetails;

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
        serviceDetails: {},
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
    const selectedService = services.find(
      (service) => service.name === formData.service
    );

    if (
      !selectedService ||
      !selectedService.subFields ||
      selectedService.subFields.length === 0
    ) {
      return null;
    }

    // Sort sub-fields by order
    const sortedFields = [...selectedService.subFields].sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );

    return (
      <div className={styles.serviceFields}>
        <h4>{selectedService.name} Details</h4>
        {sortedFields.map((field) => {
          const fieldName = `serviceDetail_${field.id}`;
          const fieldValue =
            formData.serviceDetails[field.id] || field.defaultValue || "";

          switch (field.type) {
            case "input":
              return (
                <div key={field.id} className={styles.formGroup}>
                  <label>
                    {field.label}{" "}
                    {field.required && (
                      <span className={styles.required}>*</span>
                    )}
                  </label>
                  <input
                    type="text"
                    name={fieldName}
                    value={fieldValue}
                    onChange={handleInputChange}
                    required={field.required}
                    placeholder={field.placeholder || ""}
                  />
                </div>
              );

            case "number":
              return (
                <div key={field.id} className={styles.formGroup}>
                  <label>
                    {field.label}{" "}
                    {field.required && (
                      <span className={styles.required}>*</span>
                    )}
                  </label>
                  <input
                    type="number"
                    name={fieldName}
                    value={fieldValue}
                    onChange={handleInputChange}
                    required={field.required}
                    placeholder={field.placeholder || ""}
                    min="0"
                  />
                </div>
              );

            case "select":
              return (
                <div key={field.id} className={styles.formGroup}>
                  <label>
                    {field.label}{" "}
                    {field.required && (
                      <span className={styles.required}>*</span>
                    )}
                  </label>
                  <select
                    name={fieldName}
                    value={fieldValue}
                    onChange={handleInputChange}
                    required={field.required}
                  >
                    <option value="">Select {field.label}</option>
                    {field.options &&
                      field.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                  </select>
                </div>
              );

            case "textarea":
              return (
                <div key={field.id} className={styles.formGroup}>
                  <label>
                    {field.label}{" "}
                    {field.required && (
                      <span className={styles.required}>*</span>
                    )}
                  </label>
                  <textarea
                    name={fieldName}
                    value={fieldValue}
                    onChange={handleInputChange}
                    required={field.required}
                    placeholder={field.placeholder || ""}
                    rows="4"
                  />
                </div>
              );

            case "checkbox":
              return (
                <div key={field.id} className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name={fieldName}
                      checked={!!fieldValue}
                      onChange={handleInputChange}
                    />
                    {field.label}{" "}
                    {field.required && (
                      <span className={styles.required}>*</span>
                    )}
                  </label>
                </div>
              );

            default:
              return null;
          }
        })}
      </div>
    );
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
              {/* Row 1: Service Date + Client Name (aligned properly) */}
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

              {/* Row 2: Service + Property */}
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
              </div>

              {/* Row 3: Key Person + Contact Number */}
              <div className={styles.formRow}>
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

              {/* Row 4: Location + Amount */}
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
                      <option key={service._id} value={service.name}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
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

              {/* Row 5: Remarks */}
              <div className={styles.formRow}></div>

              {/* Optional dynamic service fields */}
              {renderServiceSpecificFields()}

              {/* Form Buttons */}
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
                      {entry.serviceDetails &&
                      Object.keys(entry.serviceDetails).length > 0 ? (
                        <div className={styles.serviceDetails}>
                          {Object.entries(entry.serviceDetails).map(
                            ([key, value]) => (
                              <div key={key}>
                                <strong>{key}:</strong> {value}
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        "-"
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
