import { useState, useEffect } from "react";

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/services");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Handle both response formats - your API returns {services: [...]} but frontend expects array
      const servicesList = data.services || data || [];
      setServices(Array.isArray(servicesList) ? servicesList : []);
    } catch (error) {
      console.error("Error fetching services:", error);
      setError(error.message);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", active: true });
    setEditingService(null);
    setShowForm(false);
  };

  const handleCreateService = () => {
    setShowForm(true);
    setEditingService(null);
    setFormData({ name: "", description: "", active: true });
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      active: service.active,
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

      // Remove from local state
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
        // Update existing service
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
        // Create new service
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
            Manage your service offerings and pricing
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

      {/* Form Modal */}
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
              width: "500px",
              maxWidth: "90%",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            }}
          >
            <h2 style={{ margin: "0 0 20px 0", color: "#333" }}>
              {editingService ? "Edit Service" : "Add New Service"}
            </h2>

            <div>
              <div style={{ marginBottom: "20px" }}>
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
                    <strong>Active Service</strong> - Enable this service for
                    new properties
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
                  colSpan="4"
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    color: "#666",
                    fontSize: "16px",
                  }}
                >
                  <div>Loading services...</div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan="4"
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
                  colSpan="4"
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
                  <td style={{ padding: "15px", color: "#666" }}>
                    {service.description}
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
