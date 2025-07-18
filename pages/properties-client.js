// pages/PropertiesClient.js - Updated with Delete functionality
"use client";

import { useState, useEffect, useMemo } from "react";
import styles from "./PropertiesClient.module.css";

const PropertiesClient = () => {
  const [properties, setProperties] = useState([]);
  const [stats, setStats] = useState({
    totalProperties: 0,
    uniqueLocations: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    keyPerson: "",
    contact: "",
    location: "",
    area: "",
    serviceType: "",
    amount: "",
    serviceDate: "",
    // Location fields
    customLocation: "",
    // Water Tank Cleaning specific fields
    ohTank: "",
    ugTank: "",
    sintexTank: "",
    numberOfFloors: "",
    wing: "",
    // Pest Control specific fields
    treatment: "",
    apartment: "",
    // Motor Repairing specific fields
    workDescription: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [amountFilter, setAmountFilter] = useState({
    min: "",
    max: "",
  });

  // Delete functionality states
  const [selectedProperties, setSelectedProperties] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);

  const serviceTypes = [
    "Water Tank Cleaning",
    "Pest Control",
    "Motor Repairing & Rewinding",
  ];

  const locations = [
    "Kalyan-W",
    "Kalyan-E",
    "Dombivli-E",
    "Dombivli-W",
    "Thakurli-E",
    "Thakurli-W",
    "Diva",
    "Kopar Khairane",
    "Vashi",
    "Panvel",
    "Other/Manual",
  ];

  const apartmentTypes = ["1RK", "1BHK", "2BHK", "3BHK", "4BHK", "5BHK"];

  useEffect(() => {
    fetchPropertiesAndStats();
  }, []);

  const fetchPropertiesAndStats = async () => {
    try {
      const response = await fetch("/api/properties");
      const data = await response.json();

      // Set properties and stats from the API response
      setProperties(data.properties || []);
      setStats(
        data.stats || {
          totalProperties: 0,
          uniqueLocations: 0,
        }
      );
    } catch (error) {
      console.error("Error fetching properties and stats:", error);
    }
  };

  // Filter and Search Logic
  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      // Search filter
      const matchesSearch =
        searchTerm === "" ||
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.keyPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.contact.includes(searchTerm) ||
        property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.serviceType.toLowerCase().includes(searchTerm.toLowerCase());

      // Location filter
      const matchesLocation =
        locationFilter === "" ||
        property.location.toLowerCase().includes(locationFilter.toLowerCase());

      // Amount filter
      const matchesAmount =
        (amountFilter.min === "" ||
          property.amount >= parseFloat(amountFilter.min)) &&
        (amountFilter.max === "" ||
          property.amount <= parseFloat(amountFilter.max));

      return matchesSearch && matchesLocation && matchesAmount;
    });
  }, [properties, searchTerm, locationFilter, amountFilter]);

  // Get unique locations for filter dropdown
  const uniqueLocations = useMemo(() => {
    const locations = new Set();
    properties.forEach((property) => {
      if (property.location) {
        locations.add(property.location);
      }
    });
    return Array.from(locations).sort();
  }, [properties]);

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = new Set(filteredProperties.map((p) => p._id));
      setSelectedProperties(allIds);
    } else {
      setSelectedProperties(new Set());
    }
  };

  const handleSelectProperty = (propertyId) => {
    const newSelected = new Set(selectedProperties);
    if (newSelected.has(propertyId)) {
      newSelected.delete(propertyId);
    } else {
      newSelected.add(propertyId);
    }
    setSelectedProperties(newSelected);
  };

  // Delete handlers
  const handleDeleteSelected = async () => {
    if (selectedProperties.size === 0) {
      alert("Please select properties to delete");
      return;
    }

    const confirmMessage = `Are you sure you want to delete ${selectedProperties.size} selected property(ies)? This action cannot be undone and will also delete associated reminders.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch("/api/properties", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertyIds: Array.from(selectedProperties),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        await fetchPropertiesAndStats();
        setSelectedProperties(new Set());
        alert(`Successfully deleted ${result.deletedCount} property(ies)`);
      } else {
        throw new Error("Failed to delete properties");
      }
    } catch (error) {
      console.error("Error deleting properties:", error);
      alert("Failed to delete properties. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSingle = async (propertyId, propertyName) => {
    const confirmMessage = `Are you sure you want to delete "${propertyName}"? This action cannot be undone and will also delete associated reminders.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch("/api/properties", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertyIds: [propertyId],
        }),
      });

      if (response.ok) {
        await fetchPropertiesAndStats();
        setSelectedProperties(new Set());
        alert(`Successfully deleted "${propertyName}"`);
      } else {
        throw new Error("Failed to delete property");
      }
    } catch (error) {
      console.error("Error deleting property:", error);
      alert("Failed to delete property. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // CSV Export Function
  const handleExportCSV = () => {
    if (filteredProperties.length === 0) {
      alert("No data to export");
      return;
    }

    const csvHeaders = [
      "Property Name",
      "Key Person",
      "Contact",
      "Location",
      "Area",
      "Service Type",
      "Amount (₹)",
      "Service Date",
      "Created At",
      "Updated At",
    ];

    const csvData = filteredProperties.map((property) => [
      property.name,
      property.keyPerson,
      property.contact,
      property.location,
      property.area || "",
      property.serviceType,
      property.amount,
      property.serviceDate,
      property.createdAt
        ? new Date(property.createdAt).toLocaleDateString()
        : "",
      property.updatedAt
        ? new Date(property.updatedAt).toLocaleDateString()
        : "",
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `properties_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setLocationFilter("");
    setAmountFilter({ min: "", max: "" });
  };

  const handleAddProperty = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      name: "",
      keyPerson: "",
      contact: "",
      location: "",
      area: "",
      serviceType: "",
      amount: "",
      serviceDate: "",
      // Location fields
      customLocation: "",
      // Water Tank Cleaning specific fields
      ohTank: "",
      ugTank: "",
      sintexTank: "",
      numberOfFloors: "",
      wing: "",
      // Pest Control specific fields
      treatment: "",
      apartment: "",
      // Motor Repairing specific fields
      workDescription: "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Determine the final location value
      let finalLocation = formData.location;
      if (formData.location === "Other/Manual" && formData.customLocation) {
        finalLocation = formData.customLocation;
      }

      const propertyData = {
        name: formData.name,
        keyPerson: formData.keyPerson,
        contact: formData.contact,
        location: finalLocation,
        area: formData.area,
        serviceType: formData.serviceType,
        amount: parseFloat(formData.amount),
        serviceDate: formData.serviceDate,
        // Service-specific data
        serviceDetails: getServiceDetails(),
      };

      const response = await fetch("/api/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(propertyData),
      });

      if (response.ok) {
        const newProperty = await response.json();

        // Refresh the data to get updated stats
        await fetchPropertiesAndStats();

        handleCloseModal();
        alert(
          "Property added successfully! A reminder has been created automatically."
        );
      } else {
        throw new Error("Failed to add property");
      }
    } catch (error) {
      console.error("Error adding property:", error);
      alert("Failed to add property. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getServiceDetails = () => {
    switch (formData.serviceType) {
      case "Water Tank Cleaning":
        return {
          ohTank: formData.ohTank,
          ugTank: formData.ugTank,
          sintexTank: formData.sintexTank,
          numberOfFloors: formData.numberOfFloors,
          wing: formData.wing,
        };
      case "Pest Control":
        return {
          treatment: formData.treatment,
          apartment: formData.apartment,
        };
      case "Motor Repairing & Rewinding":
        return {
          workDescription: formData.workDescription,
        };
      default:
        return {};
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  const renderServiceSpecificFields = () => {
    switch (formData.serviceType) {
      case "Water Tank Cleaning":
        return (
          <>
            <div className={styles.formGroup}>
              <label htmlFor="ohTank">OH Tank</label>
              <input
                type="text"
                id="ohTank"
                name="ohTank"
                value={formData.ohTank}
                onChange={handleInputChange}
                placeholder="e.g., 2 tanks"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="ugTank">UG Tank</label>
              <input
                type="text"
                id="ugTank"
                name="ugTank"
                value={formData.ugTank}
                onChange={handleInputChange}
                placeholder="e.g., 1 tank"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="sintexTank">Sintex Tank</label>
              <input
                type="text"
                id="sintexTank"
                name="sintexTank"
                value={formData.sintexTank}
                onChange={handleInputChange}
                placeholder="e.g., 3 tanks"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="numberOfFloors">Number of Floors</label>
              <input
                type="number"
                id="numberOfFloors"
                name="numberOfFloors"
                value={formData.numberOfFloors}
                onChange={handleInputChange}
                placeholder="e.g., 15"
                min="1"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="wing">Wing</label>
              <input
                type="text"
                id="wing"
                name="wing"
                value={formData.wing}
                onChange={handleInputChange}
                placeholder="e.g., A, B, C"
              />
            </div>
          </>
        );

      case "Pest Control":
        return (
          <>
            <div className={styles.formGroup}>
              <label htmlFor="treatment">Treatment *</label>
              <input
                type="text"
                id="treatment"
                name="treatment"
                value={formData.treatment}
                onChange={handleInputChange}
                required
                placeholder="e.g., Cockroach / Termite / Bed Bugs / etc"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="apartment">Apartment *</label>
              <select
                id="apartment"
                name="apartment"
                value={formData.apartment}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Apartment Type</option>
                {apartmentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </>
        );

      case "Motor Repairing & Rewinding":
        return (
          <div className={styles.formGroup}>
            <label htmlFor="workDescription">Describe the Work *</label>
            <textarea
              id="workDescription"
              name="workDescription"
              value={formData.workDescription}
              onChange={handleInputChange}
              required
              placeholder="Describe the motor repair work to be done..."
              rows="4"
            />
          </div>
        );

      default:
        return null;
    }
  };

  const isAllSelected =
    filteredProperties.length > 0 &&
    filteredProperties.every((property) =>
      selectedProperties.has(property._id)
    );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Properties & Clients</h1>
          <p>Manage your property database and client information</p>
        </div>
        <div className={styles.headerActions}>
          <button onClick={handleExportCSV} className={styles.secondaryBtn}>
            Export CSV
          </button>
          <button onClick={handleAddProperty} className={styles.primaryBtn}>
            Add Property
          </button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.darkCard}`}>
          <div className={styles.statContent}>
            <div className={styles.statInfo}>
              <h3>{stats.totalProperties}</h3>
              <p className={styles.statTitle}>Total Properties</p>
              <p className={styles.statDescription}>
                Properties served till date
              </p>
            </div>
            <div className={styles.statIcon}>🏠</div>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.lightCard}`}>
          <div className={styles.statContent}>
            <div className={styles.statInfo}>
              <h3>{stats.uniqueLocations}</h3>
              <p className={styles.statTitle}>Unique Locations</p>
              <p className={styles.statDescription}>
                Number of locations served
              </p>
            </div>
            <div className={styles.statIcon}>📍</div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className={styles.searchFilterSection}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search by property name, key person, contact, location, or service type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <span className={styles.searchIcon}>🔍</span>
        </div>

        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <label htmlFor="locationFilter">Location:</label>
            <select
              id="locationFilter"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Locations</option>
              {uniqueLocations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="amountMin">Amount Range:</label>
            <div className={styles.amountFilter}>
              <input
                type="number"
                id="amountMin"
                placeholder="Min ₹"
                value={amountFilter.min}
                onChange={(e) =>
                  setAmountFilter((prev) => ({ ...prev, min: e.target.value }))
                }
                className={styles.amountInput}
              />
              <span>-</span>
              <input
                type="number"
                id="amountMax"
                placeholder="Max ₹"
                value={amountFilter.max}
                onChange={(e) =>
                  setAmountFilter((prev) => ({ ...prev, max: e.target.value }))
                }
                className={styles.amountInput}
              />
            </div>
          </div>

          <button onClick={clearFilters} className={styles.clearFiltersBtn}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedProperties.size > 0 && (
        <div className={styles.bulkActions}>
          <span className={styles.selectedCount}>
            {selectedProperties.size} property(ies) selected
          </span>
          <button
            onClick={handleDeleteSelected}
            disabled={isDeleting}
            className={styles.deleteSelectedBtn}
          >
            {isDeleting
              ? "Deleting..."
              : `Delete Selected (${selectedProperties.size})`}
          </button>
        </div>
      )}

      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h3>Properties Database</h3>
          <div className={styles.tableHeaderInfo}>
            <span className={styles.recordCount}>
              {filteredProperties.length} of {properties.length} records
            </span>
            {(searchTerm ||
              locationFilter ||
              amountFilter.min ||
              amountFilter.max) && (
              <span className={styles.filterIndicator}>(Filtered)</span>
            )}
          </div>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    disabled={filteredProperties.length === 0}
                  />
                </th>
                <th>Name</th>
                <th>Key Person</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Service Type</th>
                <th>Amount</th>
                <th>Service Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProperties.length === 0 ? (
                <tr>
                  <td colSpan="9" className={styles.noData}>
                    {properties.length === 0
                      ? "No properties found. Add your first property to get started."
                      : "No properties match your search criteria."}
                  </td>
                </tr>
              ) : (
                filteredProperties.map((property) => (
                  <tr key={property._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedProperties.has(property._id)}
                        onChange={() => handleSelectProperty(property._id)}
                      />
                    </td>
                    <td className={styles.nameCell}>{property.name}</td>
                    <td>{property.keyPerson}</td>
                    <td>{property.contact}</td>
                    <td>{property.location}</td>
                    <td>{property.serviceType}</td>
                    <td>₹{property.amount}</td>
                    <td>{property.serviceDate}</td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button
                          className={styles.viewBtn}
                          onClick={() =>
                            alert(`View details for ${property.name}`)
                          }
                        >
                          View
                        </button>
                        <button
                          className={styles.deleteBtn}
                          onClick={() =>
                            handleDeleteSingle(property._id, property.name)
                          }
                          disabled={isDeleting}
                        >
                          Delete
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

      {/* Add Property Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={handleBackdropClick}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Add New Property</h2>
              <button
                className={styles.closeButton}
                onClick={handleCloseModal}
                type="button"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Property Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Sai Samarth, Royal Heights"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="keyPerson">Key Person *</label>
                  <input
                    type="text"
                    id="keyPerson"
                    name="keyPerson"
                    value={formData.keyPerson}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Sarvesh Sawant"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="contact">Contact Number *</label>
                  <input
                    type="tel"
                    id="contact"
                    name="contact"
                    value={formData.contact}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., 9876543210"
                    pattern="[0-9]{10}"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="location">Main Location *</label>
                  <select
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Location</option>
                    {locations.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.location === "Other/Manual" && (
                  <div className={styles.formGroup}>
                    <label htmlFor="customLocation">Enter Location *</label>
                    <input
                      type="text"
                      id="customLocation"
                      name="customLocation"
                      value={formData.customLocation}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., Thane-E, Pune-W, Mumbai-Central"
                    />
                    <small>
                      Please use format: City-Direction (e.g., Kalyan-E)
                    </small>
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label htmlFor="area">Area</label>
                  <input
                    type="text"
                    id="area"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    placeholder="e.g., Sector 10"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="serviceType">Service Type *</label>
                  <select
                    id="serviceType"
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Service Type</option>
                    {serviceTypes.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="amount">Amount (₹) *</label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., 2500"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="serviceDate">Service Date *</label>
                  <input
                    type="date"
                    id="serviceDate"
                    name="serviceDate"
                    value={formData.serviceDate}
                    onChange={handleInputChange}
                    required
                  />
                  <small>
                    This will be the due date for the service reminder
                  </small>
                </div>

                {/* Service-specific fields */}
                {renderServiceSpecificFields()}
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Adding..." : "Add Property"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertiesClient;
