// pages/PropertiesClient.js - Updated with Delete functionality
"use client";

import { useState, useEffect, useMemo } from "react";
import styles from "./PropertiesClient.module.css";
import sharedStyles from "./invoices/sharedstyles.module.css";

const PropertiesClient = () => {
  const [properties, setProperties] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState(null);
  const [services, setServices] = useState([]); // New state for services
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
    // Dynamic service details will be stored here
    serviceDetails: {},
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [amountFilter, setAmountFilter] = useState({
    min: "",
    max: "",
  });
  const [showOnHoldOnly, setShowOnHoldOnly] = useState(false);

  // Delete functionality states
  const [selectedProperties, setSelectedProperties] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [propertyDetails, setPropertyDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
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

  useEffect(() => {
    fetchPropertiesAndStats();
    fetchServices();
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
  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services");
      const data = await response.json();
      setServices(data.services || []);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  const handleEditProperty = (property) => {
    setIsEditing(true);
    setEditingPropertyId(property._id);

    setFormData({
      name: property.name || "",
      keyPerson: property.keyPerson || "",
      contact: property.contact || "",
      location: property.location || "",
      area: property.area || "",
      serviceType: property.serviceType || "",
      amount: property.amount || "",

      serviceDate: property.serviceDateISO || "",
      customLocation: "",
      serviceDetails: property.serviceDetails || {},
    });

    setIsModalOpen(true);
  };

  // Get the selected service object
  const selectedService = useMemo(() => {
    return services.find((service) => service.name === formData.serviceType);
  }, [services, formData.serviceType]);
  // Add this helper function after the existing functions:
  const isPropertyOnHold = (property) => {
    return (
      property.serviceDate === null ||
      property.serviceDate === "" ||
      property.serviceDate === "On Hold" ||
      property.isOnHold === true
    );
  };

  const onHoldCount = useMemo(() => {
    return properties.filter((property) => isPropertyOnHold(property)).length;
  }, [properties]);

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

      const isOnHold = !property.serviceDate || property.serviceDate === "";
      const matchesOnHold = !showOnHoldOnly || isOnHold;

      // Amount filter
      const matchesAmount =
        (amountFilter.min === "" ||
          property.amount >= parseFloat(amountFilter.min)) &&
        (amountFilter.max === "" ||
          property.amount <= parseFloat(amountFilter.max));

      return matchesSearch && matchesLocation && matchesAmount && matchesOnHold;
    });
  }, [properties, searchTerm, locationFilter, amountFilter, showOnHoldOnly]);

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

  const handleViewProperty = async (property) => {
    setSelectedProperty(property);
    setViewModalOpen(true);
    setLoadingDetails(true);

    try {
      const response = await fetch(
        `/api/property-details?propertyId=${property._id}`
      );
      if (response.ok) {
        const details = await response.json();
        setPropertyDetails(details);
      } else {
        console.error("Failed to fetch property details");
      }
    } catch (error) {
      console.error("Error fetching property details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedProperty(null);
    setPropertyDetails(null);
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
        ? new Date(property.createdAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "",
      property.updatedAt
        ? new Date(property.updatedAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
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
    setIsEditing(false);
    setEditingPropertyId(null);
    setFormData({
      name: "",
      keyPerson: "",
      contact: "",
      location: "",
      area: "",
      serviceType: "",
      amount: "",
      serviceDate: "",
      markAsOnHold: false,
      // Location fields
      customLocation: "",
      // Reset dynamic service details
      serviceDetails: {},
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle service type change - reset service details when service type changes
    if (name === "serviceType") {
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
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
        serviceDate: formData.serviceDate?.trim() || null,
        isOnHold: !formData.serviceDate,
        serviceDetails: formData.serviceDetails,
      };

      const url = isEditing
        ? `/api/properties?id=${editingPropertyId}`
        : "/api/properties";

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(propertyData),
      });

      if (response.ok) {
        await fetchPropertiesAndStats();
        setIsEditing(false);
        setEditingPropertyId(null);
        handleCloseModal();
        alert(
          isEditing
            ? "Property updated successfully!"
            : "Property added successfully!"
        );
      } else {
        throw new Error(
          isEditing ? "Failed to update property" : "Failed to add property"
        );
      }
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
      setIsEditing(false);
      setEditingPropertyId(null);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  const renderServiceSpecificFields = () => {
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

    return sortedFields.map((field) => {
      const fieldName = `serviceDetail_${field.id}`;
      const fieldValue =
        formData.serviceDetails[field.id] || field.defaultValue || "";

      switch (field.type) {
        case "input":
          return (
            <div key={field.id} className={styles.formGroup}>
              <label htmlFor={fieldName}>
                {field.label} {field.required && "*"}
              </label>
              <input
                type="text"
                id={fieldName}
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
              <label htmlFor={fieldName}>
                {field.label} {field.required && "*"}
              </label>
              <input
                type="number"
                id={fieldName}
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
              <label htmlFor={fieldName}>
                {field.label} {field.required && "*"}
              </label>
              <select
                id={fieldName}
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
              <label htmlFor={fieldName}>
                {field.label} {field.required && "*"}
              </label>
              <textarea
                id={fieldName}
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
                {field.label} {field.required && "*"}
              </label>
            </div>
          );

        default:
          return null;
      }
    });
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
        <div className={`${styles.statCard} ${styles.onHoldCard}`}>
          <div className={styles.statContent}>
            <div className={styles.statInfo}>
              <h3>{stats.onHoldProperties}</h3>
              <p className={styles.statTitle}>On Hold</p>
              <p className={styles.statDescription}>No service date set</p>
            </div>
            <div className={styles.statIcon}>⏸️</div>
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
                    <td className={styles.nameCell}>
                      {property.name}
                      {(!property.serviceDate ||
                        property.serviceDate === "") && (
                        <span className={styles.onHoldBadge}>ON HOLD</span>
                      )}
                    </td>{" "}
                    <td>{property.keyPerson}</td>
                    <td>{property.contact}</td>
                    <td>{property.location}</td>
                    <td>{property.serviceType}</td>
                    <td>₹{property.amount}</td>
                    <td
                      className={
                        !property.serviceDate || property.serviceDate === ""
                          ? styles.onHoldCell
                          : ""
                      }
                    >
                      {property.serviceDate || "Not Set"}
                    </td>{" "}
                    <td>
                      <div className={styles.actionButtons}>
                        <button
                          className={styles.viewBtn}
                          onClick={() => handleViewProperty(property)}
                        >
                          View
                        </button>
                        <button
                          className={styles.editBtn}
                          onClick={() => handleEditProperty(property)}
                        >
                          Edit
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
              <h2>{isEditing ? "Edit Property" : "Add New Property"}</h2>
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
                {/* Property Name */}
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

                {/* Key Person */}
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

                {/* Contact Number */}
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

                {/* Main Location */}
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

                {/* Custom Location */}
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

                {/* Area */}
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

                {/* Amount */}
                <div className={styles.formGroup}>
                  <label htmlFor="amount">Amount (₹) *</label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                    placeholder={
                      selectedService?.defaultPrice
                        ? `Default: ₹${selectedService.defaultPrice}`
                        : "e.g., 2500"
                    }
                    min="0"
                    step="0.01"
                  />
                  {selectedService?.defaultPrice && (
                    <small>
                      Default price: ₹{selectedService.defaultPrice}
                    </small>
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="serviceDate">Service Date</label>
                  <input
                    type="date"
                    id="serviceDate"
                    name="serviceDate"
                    value={formData.serviceDate}
                    onChange={handleInputChange}
                  />
                  <label
                    className={styles.checkboxLabel}
                    style={{ marginTop: "0.5rem" }}
                  >
                    <input
                      type="checkbox"
                      name="markAsOnHold"
                      checked={
                        !formData.serviceDate || formData.serviceDate === ""
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData((prev) => ({ ...prev, serviceDate: "" }));
                        } else {
                          const today = new Date().toISOString().split("T")[0];
                          setFormData((prev) => ({
                            ...prev,
                            serviceDate: today,
                          }));
                        }
                      }}
                    />
                    Mark client as &quot;On Hold&quot; (no service date set)
                  </label>
                  <small>
                    Leave empty to mark client as &quot;On Hold&quot;. This will
                    be the due date for the service reminder when set.
                  </small>
                  <small>
                    On Hold clients will not generate automatic reminders until
                    a service date is set.
                  </small>
                </div>
                {/* Service Type */}
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
                    {services
                      .filter((service) => service.active)
                      .map((service) => (
                        <option key={service._id} value={service.name}>
                          {service.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* ✅ FIXED: Service Date + On Hold checkbox grouped properly */}

                {/* Dynamic service fields */}
                {renderServiceSpecificFields()}

                {/* Service Information Section */}
                {selectedService && (
                  <div
                    className={styles.formGroup}
                    style={{ gridColumn: "1 / -1" }}
                  >
                    <div className={styles.serviceInfo}>
                      <h4>Service Information</h4>
                      {selectedService.description && (
                        <p>
                          <strong>Description:</strong>{" "}
                          {selectedService.description}
                        </p>
                      )}
                      {selectedService.scopeOfWork && (
                        <p>
                          <strong>Scope of Work:</strong>{" "}
                          {selectedService.scopeOfWork}
                        </p>
                      )}
                      {selectedService.frequency && (
                        <p>
                          <strong>Frequency:</strong>{" "}
                          {selectedService.frequency}
                        </p>
                      )}
                      {selectedService.notes && (
                        <p>
                          <strong>Notes:</strong> {selectedService.notes}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
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
                  {isSubmitting
                    ? isEditing
                      ? "Updating..."
                      : "Adding..."
                    : isEditing
                    ? "Update Property"
                    : "Add Property"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Property View Modal */}
      {viewModalOpen && selectedProperty && (
        <div
          className={sharedStyles.modalOverlay}
          onClick={(e) =>
            e.target === e.currentTarget && handleCloseViewModal()
          }
        >
          <div
            className={`${sharedStyles.modalContent} ${sharedStyles.viewModalContent}`}
          >
            <div className={sharedStyles.modalHeader}>
              <h2>Property Details: {selectedProperty.name}</h2>
              <button
                className={sharedStyles.closeButton}
                onClick={handleCloseViewModal}
                type="button"
              >
                ×
              </button>
            </div>

            {loadingDetails ? (
              <div className={sharedStyles.loadingContainer}>
                <p>Loading property details...</p>
              </div>
            ) : propertyDetails ? (
              <div className={sharedStyles.viewModalBody}>
                {/* Client Overview */}
                <div className={sharedStyles.detailSection}>
                  <h3>📋 Client Overview</h3>
                  <div className={sharedStyles.detailGrid}>
                    <div className={sharedStyles.detailItem}>
                      <strong>Property Name:</strong> {selectedProperty.name}
                    </div>
                    <div className={sharedStyles.detailItem}>
                      <strong>Key Person:</strong> {selectedProperty.keyPerson}
                    </div>
                    <div className={sharedStyles.detailItem}>
                      <strong>Contact:</strong> {selectedProperty.contact}
                    </div>
                    <div className={sharedStyles.detailItem}>
                      <strong>Location:</strong> {selectedProperty.location}
                    </div>
                    {selectedProperty.area && (
                      <div className={sharedStyles.detailItem}>
                        <strong>Area:</strong> {selectedProperty.area}
                      </div>
                    )}
                  </div>
                </div>

                {/* Service-Specific Details */}
                <div className={sharedStyles.detailSection}>
                  <h3>🔧 Service Details</h3>
                  <div className={sharedStyles.serviceTypeTag}>
                    {selectedProperty.serviceType}
                  </div>

                  {propertyDetails.serviceDetails && (
                    <div className={sharedStyles.serviceDetailsGrid}>
                      {selectedProperty.serviceType ===
                        "Water Tank Cleaning" && (
                        <>
                          {propertyDetails.serviceDetails.ohTank && (
                            <div className={sharedStyles.detailItem}>
                              <strong>OH Tank:</strong>{" "}
                              {propertyDetails.serviceDetails.ohTank}
                            </div>
                          )}
                          {propertyDetails.serviceDetails.ugTank && (
                            <div className={sharedStyles.detailItem}>
                              <strong>UG Tank:</strong>{" "}
                              {propertyDetails.serviceDetails.ugTank}
                            </div>
                          )}
                          {propertyDetails.serviceDetails.sintexTank && (
                            <div className={sharedStyles.detailItem}>
                              <strong>Sintex Tank:</strong>{" "}
                              {propertyDetails.serviceDetails.sintexTank}
                            </div>
                          )}
                          {propertyDetails.serviceDetails.numberOfFloors && (
                            <div className={sharedStyles.detailItem}>
                              <strong>Floors:</strong>{" "}
                              {propertyDetails.serviceDetails.numberOfFloors}
                            </div>
                          )}
                          {propertyDetails.serviceDetails.wing && (
                            <div className={sharedStyles.detailItem}>
                              <strong>Wing:</strong>{" "}
                              {propertyDetails.serviceDetails.wing}
                            </div>
                          )}
                        </>
                      )}

                      {selectedProperty.serviceType === "Pest Control" && (
                        <>
                          {propertyDetails.serviceDetails.treatment && (
                            <div className={sharedStyles.detailItem}>
                              <strong>Treatment:</strong>{" "}
                              {propertyDetails.serviceDetails.treatment}
                            </div>
                          )}
                          {propertyDetails.serviceDetails.apartment && (
                            <div className={sharedStyles.detailItem}>
                              <strong>Apartment:</strong>{" "}
                              {propertyDetails.serviceDetails.apartment}
                            </div>
                          )}
                        </>
                      )}

                      {selectedProperty.serviceType ===
                        "Motor Repairing & Rewinding" && (
                        <>
                          {propertyDetails.serviceDetails.workDescription && (
                            <div className={sharedStyles.detailItem}>
                              <strong>Work Description:</strong>
                              <div className={sharedStyles.workDescription}>
                                {propertyDetails.serviceDetails.workDescription}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Service History */}
                {propertyDetails.serviceHistory &&
                  propertyDetails.serviceHistory.length > 0 && (
                    <div className={sharedStyles.detailSection}>
                      <h3>📅 Service History</h3>
                      <div className={sharedStyles.serviceHistoryList}>
                        {propertyDetails.serviceHistory.map(
                          (service, index) => (
                            <div
                              key={index}
                              className={sharedStyles.serviceHistoryItem}
                            >
                              <div className={sharedStyles.serviceDate}>
                                {new Date(
                                  service.serviceDate
                                ).toLocaleDateString("en-GB")}
                              </div>
                              <div className={sharedStyles.serviceInfo}>
                                <strong>₹{service.amount}</strong> -{" "}
                                {service.serviceType}
                                {service.status && (
                                  <span
                                    className={`${sharedStyles.statusBadge} ${
                                      sharedStyles[service.status.toLowerCase()]
                                    }`}
                                  >
                                    {service.status}
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Current Reminders */}
                {propertyDetails.reminders &&
                  propertyDetails.reminders.length > 0 && (
                    <div className={sharedStyles.detailSection}>
                      <h3>🔔 Active Reminders</h3>
                      <div className={sharedStyles.remindersList}>
                        {propertyDetails.reminders.map((reminder, index) => (
                          <div
                            key={index}
                            className={sharedStyles.reminderItem}
                          >
                            <div className={sharedStyles.reminderInfo}>
                              <strong>Next Service:</strong>{" "}
                              {new Date(
                                reminder.scheduledDate
                              ).toLocaleDateString("en-GB")}
                              <span
                                className={`${sharedStyles.statusBadge} ${
                                  sharedStyles[reminder.status]
                                }`}
                              >
                                {reminder.status}
                              </span>
                            </div>
                            {reminder.lastServiceDate && (
                              <div className={sharedStyles.reminderSubInfo}>
                                Last Service:{" "}
                                {new Date(
                                  reminder.lastServiceDate
                                ).toLocaleDateString("en-GB")}
                              </div>
                            )}
                            {reminder.notes && (
                              <div className={sharedStyles.reminderNotes}>
                                <em>Notes: {reminder.notes}</em>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Statistics */}
                {propertyDetails.stats && (
                  <div className={sharedStyles.detailSection}>
                    <h3>📊 Statistics</h3>
                    <div className={sharedStyles.statsGrid}>
                      <div className={sharedStyles.statCard}>
                        <div className={sharedStyles.statValue}>
                          ₹{propertyDetails.stats.totalAmount || 0}
                        </div>
                        <div className={sharedStyles.statLabel}>
                          Total Amount
                        </div>
                      </div>
                      <div className={sharedStyles.statCard}>
                        <div className={sharedStyles.statValue}>
                          {propertyDetails.stats.totalServices || 0}
                        </div>
                        <div className={sharedStyles.statLabel}>
                          Total Services
                        </div>
                      </div>
                      <div className={sharedStyles.statCard}>
                        <div className={sharedStyles.statValue}>
                          {propertyDetails.stats.avgServiceInterval || 0}
                        </div>
                        <div className={sharedStyles.statLabel}>
                          Avg Interval (days)
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Timeline */}
                {propertyDetails.timeline &&
                  propertyDetails.timeline.length > 0 && (
                    <div className={sharedStyles.detailSection}>
                      <h3>🕐 Timeline</h3>
                      <div className={sharedStyles.timelineList}>
                        {propertyDetails.timeline.map((event, index) => (
                          <div
                            key={index}
                            className={sharedStyles.timelineItem}
                          >
                            <div className={sharedStyles.timelineDate}>
                              {new Date(event.date).toLocaleDateString("en-GB")}
                            </div>
                            <div className={sharedStyles.timelineContent}>
                              <strong>{event.type}:</strong> {event.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            ) : (
              <div className={sharedStyles.errorContainer}>
                <p>Failed to load property details. Please try again.</p>
                <button
                  onClick={() => handleViewProperty(selectedProperty)}
                  className={sharedStyles.retryBtn}
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertiesClient;
