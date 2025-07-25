// pages/invoices/generate.js
import { useState, useEffect } from "react";
import axios from "axios";

export default function InvoiceGenerator() {
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [completedServices, setCompletedServices] = useState([]);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load all properties on page load
  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const res = await axios.get("/api/properties");
        // Ensure response data is an array
        setProperties(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Failed to fetch properties:", error);
        setProperties([]); // Fallback to empty array
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  // When property is selected, load its completed services
  useEffect(() => {
    if (!selectedProperty) return;
    const fetchServices = async () => {
      try {
        const res = await axios.get(
          `/api/reminders?propertyId=${selectedProperty._id}&status=completed`
        );
        setCompletedServices(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Failed to fetch services:", error);
        setCompletedServices([]);
      }
    };
    fetchServices();
  }, [selectedProperty]);

  const generateInvoice = () => {
    const lineItems = completedServices.map((service) => ({
      date: new Date(service.date).toLocaleDateString(),
      description: service.details,
      amount: service.amount,
    }));

    const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);

    setInvoice({
      property: selectedProperty,
      date: new Date().toLocaleDateString(),
      lineItems,
      totalAmount,
      amountInWords: numberToWords(totalAmount),
    });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Generate Invoice</h1>

      {/* Property Selection Dropdown */}
      {/* Property Selection Dropdown */}
      {loading ? (
        <p>Loading properties...</p>
      ) : (
        <select
          onChange={(e) => {
            const property = properties.find((p) => p._id === e.target.value);
            setSelectedProperty(property || null);
          }}
          style={{ padding: "8px", marginBottom: "15px" }}
          disabled={loading}
        >
          <option value="">Select Property</option>
          {properties.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name} ({p.address})
            </option>
          ))}
        </select>
      )}

      {/* Invoice Preview */}
      {selectedProperty && (
        <div>
          <h2>Property Details:</h2>
          <p>
            <strong>Name:</strong> {selectedProperty.name}
          </p>
          <p>
            <strong>Address:</strong> {selectedProperty.address}
          </p>
          <p>
            <strong>Contact:</strong> {selectedProperty.contact}
          </p>

          <h2>Completed Services:</h2>
          <ul>
            {completedServices.map((service) => (
              <li key={service._id}>
                {new Date(service.date).toLocaleDateString()} -{" "}
                {service.details} (₹{service.amount})
              </li>
            ))}
          </ul>

          <button
            onClick={generateInvoice}
            style={{ marginTop: "15px", padding: "8px 15px" }}
          >
            Generate Invoice
          </button>
        </div>
      )}

      {/* Invoice Display */}
      {invoice && (
        <div
          style={{
            marginTop: "20px",
            border: "1px solid #ddd",
            padding: "15px",
          }}
        >
          <h2>Invoice</h2>
          <p>
            <strong>Property:</strong> {invoice.property.name}
          </p>
          <p>
            <strong>Date:</strong> {invoice.date}
          </p>

          <h3>Services Performed:</h3>
          <ul>
            {invoice.lineItems.map((item, i) => (
              <li key={i}>
                {item.date} - {item.description} (₹{item.amount})
              </li>
            ))}
          </ul>

          <h3>Total: ₹{invoice.totalAmount}</h3>
          <p>
            <em>{invoice.amountInWords}</em>
          </p>
        </div>
      )}
    </div>
  );
}

// Simple number to words conversion
function numberToWords(num) {
  // ... implementation ...
}
