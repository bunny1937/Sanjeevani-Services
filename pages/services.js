import { useState, useEffect } from "react";

const Services = () => {
  const [services, setServices] = useState([]);
  const [serviceOverview, setServiceOverview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [showServiceDetails, setShowServiceDetails] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    active: true,
    scopeOfWork: "",
    frequency: "",
    notes: "",
    subFields: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [showSubFieldForm, setShowSubFieldForm] = useState(false);
  const [editingSubField, setEditingSubField] = useState(null);
  const [subFieldData, setSubFieldData] = useState({
    id: "",
    label: "",
    type: "input",
    placeholder: "",
    required: false,
    options: [],
    defaultValue: "",
    order: 0,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/services?overview=true");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const servicesList = data.services || [];
      const overviewList = data.serviceOverview || [];
      setServices(Array.isArray(servicesList) ? servicesList : []);
      setServiceOverview(Array.isArray(overviewList) ? overviewList : []);
    } catch (error) {
      console.error("Error fetching services:", error);
      setError(error.message);
      setServices([]);
      setServiceOverview([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      active: true,
      scopeOfWork: "",
      frequency: "",
      notes: "",
      subFields: [],
    });
    setEditingService(null);
    setShowForm(false);
  };

  const resetSubFieldForm = () => {
    setSubFieldData({
      id: "",
      label: "",
      type: "input",
      placeholder: "",
      required: false,
      options: [],
      defaultValue: "",
      order: 0,
    });
    setEditingSubField(null);
    setShowSubFieldForm(false);
  };

  const handleCreateService = () => {
    setShowForm(true);
    setEditingService(null);
    setFormData({
      name: "",
      description: "",
      active: true,
      scopeOfWork: "",
      frequency: "",
      notes: "",
      subFields: [],
    });
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      active: service.active,
      scopeOfWork: service.scopeOfWork || "",
      frequency: service.frequency || "",
      notes: service.notes || "",
      subFields: service.subFields || [],
    });
    setShowForm(true);
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm("Are you sure you want to delete this service?")) {
      return;
    }

    try {
      const response = await fetch(`/api/services/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setServices((prev) => prev.filter((service) => service._id !== id));
    } catch (error) {
      console.error("Error deleting service:", error);
      alert("Failed to delete service. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.description.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      if (editingService) {
        const response = await fetch(`/api/services/${editingService._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const updatedService = await response.json();
        setServices((prev) =>
          prev.map((service) =>
            service._id === editingService._id ? updatedService : service
          )
        );
      } else {
        const response = await fetch("/api/services", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const newService = await response.json();
        setServices((prev) => [...prev, newService]);
      }

      resetForm();
    } catch (error) {
      console.error("Error submitting service:", error);
      alert("Failed to save service. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubFieldInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSubFieldData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const addSubField = () => {
    setShowSubFieldForm(true);
    setEditingSubField(null);
    setSubFieldData({
      id: Date.now().toString(),
      label: "",
      type: "input",
      placeholder: "",
      required: false,
      options: [],
      defaultValue: "",
      order: formData.subFields.length,
    });
  };

  const editSubField = (subField) => {
    setEditingSubField(subField);
    setSubFieldData({ ...subField });
    setShowSubFieldForm(true);
  };

  const saveSubField = () => {
    if (!subFieldData.label.trim()) {
      alert("Please enter a label for the field");
      return;
    }

    if (editingSubField) {
      setFormData((prev) => ({
        ...prev,
        subFields: prev.subFields.map((field) =>
          field.id === editingSubField.id ? subFieldData : field
        ),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        subFields: [
          ...prev.subFields,
          { ...subFieldData, id: Date.now().toString() },
        ],
      }));
    }

    resetSubFieldForm();
  };

  const deleteSubField = (fieldId) => {
    setFormData((prev) => ({
      ...prev,
      subFields: prev.subFields.filter((field) => field.id !== fieldId),
    }));
  };

  const addOption = () => {
    setSubFieldData((prev) => ({
      ...prev,
      options: [...prev.options, { value: "", label: "" }],
    }));
  };

  const updateOption = (index, field, value) => {
    setSubFieldData((prev) => ({
      ...prev,
      options: prev.options.map((option, i) =>
        i === index ? { ...option, [field]: value } : option
      ),
    }));
  };

  const removeOption = (index) => {
    setSubFieldData((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const handleCardClick = (serviceData) => {
    setSelectedService(serviceData);
    setShowServiceDetails(true);
  };

  const closeServiceDetails = () => {
    setSelectedService(null);
    setShowServiceDetails(false);
  };

  const handleSaveClick = () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      alert("Please fill in all required fields");
      return;
    }
    handleSubmit({ preventDefault: () => {} });
  };

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
          paddingBottom: "20px",
          borderBottom: "2px solid #e0e0e0",
        }}
      >
        <div>
          <h1 style={{ margin: "0 0 5px 0", color: "#333" }}>Services</h1>
          <p style={{ margin: 0, color: "#666" }}>
            Manage your service offerings and configurations
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleCreateService}
            style={{
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            ➕ Add Service
          </button>
          <button
            style={{
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            📊 Service Report
          </button>
        </div>
      </div>
      {/* Service Overview Cards */}
      {!loading && serviceOverview.length > 0 && (
        <div style={{ marginBottom: "30px" }}>
          <h2 style={{ margin: "0 0 20px 0", color: "#333", fontSize: "18px" }}>
            Service Overview
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "15px",
              marginBottom: "20px",
            }}
          >
            {serviceOverview.map((serviceData) => (
              <div
                key={serviceData._id}
                onClick={() => handleCardClick(serviceData)}
                style={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  padding: "20px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  border: "1px solid #f0f0f0",
                  minHeight: "80px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(0,0,0,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(0,0,0,0.08)";
                }}
              >
                {/* Service Name */}
                <h3
                  style={{
                    margin: 0,
                    color: "#333",
                    fontSize: "16px",
                    fontWeight: "600",
                    lineHeight: "1.3",
                  }}
                >
                  {serviceData.name}
                </h3>
                {/* Property Count */}
                <div style={{ marginTop: "8px", display: "flex", gap: "10px" }}>
                  <span
                    style={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: "#333",
                      lineHeight: "1",
                    }}
                  >
                    {serviceData.propertyCount}
                  </span>
                  <p
                    style={{
                      margin: "4px 0 0 0",
                      color: "#666",
                      fontSize: "13px",
                      fontWeight: "400",
                    }}
                  >
                    {serviceData.propertyCount === 1
                      ? "Property"
                      : "Properties"}
                  </p>
                </div>
                {/* Properties Label */}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Service Details Modal */}
      {showServiceDetails && selectedService && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "15px",
              width: "90%",
              maxWidth: "1000px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "25px 30px",
                borderBottom: "2px solid #e0e0e0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#f8f9fa",
                borderRadius: "15px 15px 0 0",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: "0 0 5px 0",
                    color: "#333",
                    fontSize: "24px",
                  }}
                >
                  {selectedService.name}
                </h2>
                <p style={{ margin: 0, color: "#666", fontSize: "16px" }}>
                  {selectedService.propertyCount}{" "}
                  {selectedService.propertyCount === 1
                    ? "Property"
                    : "Properties"}
                </p>
              </div>
              <button
                onClick={closeServiceDetails}
                style={{
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                  cursor: "pointer",
                  fontSize: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: "30px" }}>
              {selectedService.properties.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "#666",
                    fontSize: "16px",
                  }}
                >
                  <div style={{ fontSize: "48px", marginBottom: "15px" }}>
                    📋
                  </div>
                  <p>No properties are using this service yet.</p>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(350px, 1fr))",
                    gap: "20px",
                  }}
                >
                  {selectedService.properties.map((property) => (
                    <div
                      key={property._id}
                      style={{
                        backgroundColor: "#f8f9fa",
                        borderRadius: "10px",
                        padding: "20px",
                        border: "1px solid #e0e0e0",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "15px",
                        }}
                      >
                        <h4
                          style={{
                            margin: 0,
                            color: "#333",
                            fontSize: "16px",
                            fontWeight: "600",
                          }}
                        >
                          {property.name}
                        </h4>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "bold",
                            backgroundColor: property.isOnHold
                              ? "#fff3cd"
                              : "#d1ecf1",
                            color: property.isOnHold ? "#856404" : "#0c5460",
                          }}
                        >
                          {property.statusDisplay}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span
                            style={{
                              color: "#666",
                              fontSize: "13px",
                              minWidth: "80px",
                            }}
                          >
                            👤 Contact:
                          </span>
                          <span
                            style={{
                              color: "#333",
                              fontSize: "13px",
                              fontWeight: "500",
                            }}
                          >
                            {property.keyPerson}
                          </span>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span
                            style={{
                              color: "#666",
                              fontSize: "13px",
                              minWidth: "80px",
                            }}
                          >
                            📞 Phone:
                          </span>
                          <span style={{ color: "#333", fontSize: "13px" }}>
                            {property.contact}
                          </span>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span
                            style={{
                              color: "#666",
                              fontSize: "13px",
                              minWidth: "80px",
                            }}
                          >
                            📍 Location:
                          </span>
                          <span style={{ color: "#333", fontSize: "13px" }}>
                            {property.location}
                          </span>
                        </div>

                        {property.area && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <span
                              style={{
                                color: "#666",
                                fontSize: "13px",
                                minWidth: "80px",
                              }}
                            >
                              📏 Area:
                            </span>
                            <span style={{ color: "#333", fontSize: "13px" }}>
                              {property.area}
                            </span>
                          </div>
                        )}

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span
                            style={{
                              color: "#666",
                              fontSize: "13px",
                              minWidth: "80px",
                            }}
                          >
                            💰 Amount:
                          </span>
                          <span
                            style={{
                              color: "#28a745",
                              fontSize: "13px",
                              fontWeight: "600",
                            }}
                          >
                            ₹{property.amount || 0}
                          </span>
                        </div>

                        {property.serviceDate && !property.isOnHold && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <span
                              style={{
                                color: "#666",
                                fontSize: "13px",
                                minWidth: "80px",
                              }}
                            >
                              📅 Service:
                            </span>
                            <span style={{ color: "#333", fontSize: "13px" }}>
                              {new Date(
                                property.serviceDate
                              ).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Service Form Modal */}
      {showForm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "10px",
              width: "800px",
              maxWidth: "90%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            }}
          >
            <h2 style={{ margin: "0 0 20px 0", color: "#333" }}>
              {editingService ? "Edit Service" : "Add New Service"}
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
                marginBottom: "20px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "bold",
                    color: "#555",
                  }}
                >
                  Service Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                  placeholder="Enter service name"
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "bold",
                    color: "#555",
                  }}
                >
                  Frequency
                </label>
                <input
                  type="text"
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                  placeholder="e.g., Monthly, Quarterly"
                />
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                  color: "#555",
                }}
              >
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
                placeholder="Enter service description"
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                  color: "#555",
                }}
              >
                Scope of Work
              </label>
              <textarea
                name="scopeOfWork"
                value={formData.scopeOfWork}
                onChange={handleInputChange}
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
                placeholder="Detailed description of work to be performed"
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                  color: "#555",
                }}
              >
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={2}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
                placeholder="Additional notes or instructions"
              />
            </div>

            {/* Dynamic Sub Fields Section */}
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px",
                }}
              >
                <h3 style={{ margin: 0, color: "#333", fontSize: "18px" }}>
                  Custom Fields
                </h3>
                <button
                  type="button"
                  onClick={addSubField}
                  style={{
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  ➕ Add Field
                </button>
              </div>

              {formData.subFields.length > 0 && (
                <div
                  style={{
                    backgroundColor: "#f8f9fa",
                    padding: "15px",
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    {formData.subFields.map((field, index) => (
                      <div
                        key={field.id}
                        style={{
                          backgroundColor: "white",
                          padding: "12px",
                          borderRadius: "6px",
                          border: "1px solid #ddd",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: "500", color: "#333" }}>
                            {field.label}
                          </span>
                          <span
                            style={{
                              marginLeft: "8px",
                              fontSize: "12px",
                              color: "#666",
                              backgroundColor: "#e9ecef",
                              padding: "2px 6px",
                              borderRadius: "3px",
                            }}
                          >
                            {field.type}
                          </span>
                          {field.required && (
                            <span
                              style={{ marginLeft: "5px", color: "#dc3545" }}
                            >
                              *
                            </span>
                          )}
                          {field.options && field.options.length > 0 && (
                            <div
                              style={{
                                marginTop: "5px",
                                fontSize: "11px",
                                color: "#007bff",
                              }}
                            >
                              Options:{" "}
                              {field.options.map((opt) => opt.label).join(", ")}
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() => editSubField(field)}
                            style={{
                              backgroundColor: "#ffc107",
                              color: "white",
                              border: "none",
                              padding: "6px 10px",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px",
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSubField(field.id)}
                            style={{
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              padding: "6px 10px",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px",
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginBottom: "25px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#555",
                }}
              >
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleInputChange}
                  style={{ transform: "scale(1.2)" }}
                />
                <span>
                  <strong>Active Service</strong> - Enable this service for new
                  properties
                </span>
              </label>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={resetForm}
                disabled={submitting}
                style={{
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "5px",
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveClick}
                disabled={submitting}
                style={{
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "5px",
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting
                  ? "Saving..."
                  : editingService
                  ? "Update Service"
                  : "Add Service"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub Field Form Modal */}
      {showSubFieldForm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1100,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "25px",
              borderRadius: "10px",
              width: "600px",
              maxWidth: "90%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            }}
          >
            <h3
              style={{ margin: "0 0 20px 0", color: "#333", fontSize: "20px" }}
            >
              {editingSubField ? "Edit Field" : "Add Custom Field"}
            </h3>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "bold",
                    color: "#555",
                  }}
                >
                  Field Label *
                </label>
                <input
                  type="text"
                  name="label"
                  value={subFieldData.label}
                  onChange={handleSubFieldInputChange}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                  placeholder="e.g., Square Feet, Number of Rooms"
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "bold",
                    color: "#555",
                  }}
                >
                  Field Type
                </label>
                <select
                  name="type"
                  value={subFieldData.type}
                  onChange={handleSubFieldInputChange}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="input">Text Input</option>
                  <option value="number">Number Input</option>
                  <option value="textarea">Text Area</option>
                  <option value="select">Select Dropdown</option>
                  <option value="checkbox">Checkbox</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "bold",
                    color: "#555",
                  }}
                >
                  Placeholder Text
                </label>
                <input
                  type="text"
                  name="placeholder"
                  value={subFieldData.placeholder}
                  onChange={handleSubFieldInputChange}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                  placeholder="Placeholder text for the field"
                />
              </div>

              {subFieldData.type === "select" && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <label
                      style={{
                        fontWeight: "bold",
                        color: "#555",
                      }}
                    >
                      Options
                    </label>
                    <button
                      type="button"
                      onClick={addOption}
                      style={{
                        backgroundColor: "#007bff",
                        color: "white",
                        border: "none",
                        padding: "5px 12px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      Add Option
                    </button>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      maxHeight: "200px",
                      overflowY: "auto",
                      padding: "10px",
                      backgroundColor: "#f8f9fa",
                      borderRadius: "5px",
                      border: "1px solid #e0e0e0",
                    }}
                  >
                    {subFieldData.options.map((option, index) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          gap: "8px",
                          alignItems: "center",
                        }}
                      >
                        <input
                          type="text"
                          value={option.value}
                          onChange={(e) =>
                            updateOption(index, "value", e.target.value)
                          }
                          placeholder="Value"
                          style={{
                            flex: 1,
                            padding: "8px",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            fontSize: "13px",
                          }}
                        />
                        <input
                          type="text"
                          value={option.label}
                          onChange={(e) =>
                            updateOption(index, "label", e.target.value)
                          }
                          placeholder="Display Label"
                          style={{
                            flex: 1,
                            padding: "8px",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            fontSize: "13px",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          style={{
                            backgroundColor: "#dc3545",
                            color: "white",
                            border: "none",
                            padding: "8px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    color: "#555",
                  }}
                >
                  <input
                    type="checkbox"
                    name="required"
                    checked={subFieldData.required}
                    onChange={handleSubFieldInputChange}
                    style={{ transform: "scale(1.1)" }}
                  />
                  <span style={{ fontWeight: "bold" }}>Required field</span>
                </label>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
                marginTop: "25px",
              }}
            >
              <button
                type="button"
                onClick={resetSubFieldForm}
                style={{
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveSubField}
                style={{
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                {editingSubField ? "Update Field" : "Add Field"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Services Table */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8f9fa" }}>
              <th
                style={{
                  padding: "15px",
                  textAlign: "left",
                  borderBottom: "2px solid #dee2e6",
                  fontWeight: "bold",
                  color: "#495057",
                }}
              >
                Service Name
              </th>
              <th
                style={{
                  padding: "15px",
                  textAlign: "left",
                  borderBottom: "2px solid #dee2e6",
                  fontWeight: "bold",
                  color: "#495057",
                }}
              >
                Description
              </th>
              <th
                style={{
                  padding: "15px",
                  textAlign: "center",
                  borderBottom: "2px solid #dee2e6",
                  fontWeight: "bold",
                  color: "#495057",
                }}
              >
                Custom Fields
              </th>
              <th
                style={{
                  padding: "15px",
                  textAlign: "center",
                  borderBottom: "2px solid #dee2e6",
                  fontWeight: "bold",
                  color: "#495057",
                }}
              >
                Status
              </th>
              <th
                style={{
                  padding: "15px",
                  textAlign: "center",
                  borderBottom: "2px solid #dee2e6",
                  fontWeight: "bold",
                  color: "#495057",
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="5"
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    color: "#dc3545",
                    fontSize: "16px",
                  }}
                >
                  <div>Error loading services: {error}</div>
                  <button
                    onClick={fetchServices}
                    style={{
                      marginTop: "10px",
                      backgroundColor: "#007bff",
                      color: "white",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Retry
                  </button>
                </td>
              </tr>
            ) : services.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    color: "#666",
                    fontSize: "16px",
                  }}
                >
                  <div>No services found</div>
                  <p style={{ margin: "10px 0" }}>
                    Get started by adding your first service
                  </p>
                  <button
                    onClick={handleCreateService}
                    style={{
                      backgroundColor: "#007bff",
                      color: "white",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    ➕ Add Service
                  </button>
                </td>
              </tr>
            ) : (
              services.map((service, index) => (
                <tr
                  key={service._id}
                  style={{
                    backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa",
                    borderBottom: "1px solid #dee2e6",
                  }}
                >
                  <td
                    style={{
                      padding: "15px",
                      fontWeight: "500",
                      color: "#333",
                    }}
                  >
                    {service.name}
                  </td>
                  <td
                    style={{
                      padding: "15px",
                      color: "#666",
                      maxWidth: "300px",
                    }}
                  >
                    <div
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {service.description}
                    </div>
                  </td>
                  <td style={{ padding: "15px", textAlign: "center" }}>
                    <span
                      style={{
                        backgroundColor: "#e3f2fd",
                        color: "#1976d2",
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      {service.subFields ? service.subFields.length : 0} fields
                    </span>
                  </td>
                  <td style={{ padding: "15px", textAlign: "center" }}>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        backgroundColor: service.active ? "#d4edda" : "#f8d7da",
                        color: service.active ? "#155724" : "#721c24",
                      }}
                    >
                      {service.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: "15px", textAlign: "center" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: "5px",
                        justifyContent: "center",
                      }}
                    >
                      <button
                        onClick={() => handleEditService(service)}
                        title="Edit Service"
                        style={{
                          backgroundColor: "#ffc107",
                          color: "white",
                          border: "none",
                          padding: "8px 12px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteService(service._id)}
                        title="Delete Service"
                        style={{
                          backgroundColor: "#dc3545",
                          color: "white",
                          border: "none",
                          padding: "8px 12px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                      >
                        🗑️
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
  );
};

export default Services;
