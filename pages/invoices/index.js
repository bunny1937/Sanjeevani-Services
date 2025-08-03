// pages/invoices/index.jsx
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "./Invoice.module.css";
import sharedStyles from "./sharedstyles.module.css";
export default function InvoiceListPage() {
  const router = useRouter();
  const [properties, setProperties] = useState([]);
  const [generatedInvoices, setGeneratedInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("properties");
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [propertyDetails, setPropertyDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    // Fetch properties
    fetch("/api/properties")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.properties || [];
        setProperties(list);
      })
      .catch((error) => console.error("Error fetching properties:", error));

    // Fetch generated invoices
    fetch("/api/generate-invoice")
      .then((res) => res.json())
      .then((data) => {
        setGeneratedInvoices(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching invoices:", error);
        setLoading(false);
      });
  }, []);

  const handleDeleteInvoice = async (invoiceId) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;

    try {
      const response = await fetch(
        `/api/generate-invoice?invoiceId=${invoiceId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setGeneratedInvoices((prev) =>
          prev.filter((inv) => inv._id !== invoiceId)
        );
        alert("Invoice deleted successfully!");
      } else {
        alert("Error deleting invoice");
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      alert("Error deleting invoice");
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
  const handleCreateNewInvoice = () => {
    router.push("/invoices/new");
  };
  if (loading) {
    return (
      <div className={styles.invoiceMainContainer}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.invoiceMainContainer}>
      <div className={styles.pageHeader}>
        <h1>Invoice Management</h1>
        <p>Create new invoices or manage existing ones</p>
        <div className={styles.mainActions}>
          <button
            onClick={handleCreateNewInvoice}
            className={styles.createNewInvoiceBtn}
          >
            📄 GENERATE A NEW INVOICE
          </button>
        </div>
      </div>
      <div className={styles.invoiceContainer}>
        <div className={styles.tabNavigation}>
          <button
            className={`${styles.tabButton} ${
              activeTab === "properties" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("properties")}
          >
            Create New Invoice ({properties.length})
          </button>
          <button
            className={`${styles.tabButton} ${
              activeTab === "invoices" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("invoices")}
          >
            Generated Invoices ({generatedInvoices.length})
          </button>
        </div>
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
                        <strong>Key Person:</strong>{" "}
                        {selectedProperty.keyPerson}
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
                                  {
                                    propertyDetails.serviceDetails
                                      .workDescription
                                  }
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
                                        sharedStyles[
                                          service.status.toLowerCase()
                                        ]
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
                                {new Date(event.date).toLocaleDateString(
                                  "en-GB"
                                )}
                              </div>
                              <div className={sharedStyles.timelineContent}>
                                <strong>{event.type}:</strong>{" "}
                                {event.description}
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
      {activeTab === "properties" && (
        <div className={styles.tabContent}>
          <h2>Select Property to Generate Invoice</h2>
          {properties.length === 0 ? (
            <div className={styles.emptyState}>
              <p>
                No properties found. Add properties first to generate invoices.
              </p>
              <Link href="/properties" className={styles.addPropertyBtn}>
                Add Properties
              </Link>
            </div>
          ) : (
            <div className={styles.propertyGrid}>
              {properties.map((property) => (
                <div key={property._id} className={styles.propertyCard}>
                  <div className={styles.propertyInfo}>
                    <h3>{property.name}</h3>
                    <div className={styles.propertyDetails}>
                      <p>
                        <span>Location:</span> {property.location}
                      </p>
                      <p>
                        <span>Contact:</span> {property.contact}
                      </p>
                      <p>
                        <span>Service:</span> {property.serviceType}
                      </p>
                      <p>
                        <span>Amount:</span> ₹
                        {property.amount?.toLocaleString("en-IN")}
                      </p>
                      <p>
                        <span>Service Date:</span> {property.serviceDate}
                      </p>
                      {property.keyPerson && (
                        <p>
                          <span>Key Person:</span> {property.keyPerson}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className={styles.propertyActions}>
                    <Link
                      href={`/invoices/${property._id}`}
                      className={styles.generateInvoiceBtn}
                    >
                      Generate Invoice
                    </Link>
                    <button
                      onClick={() => handleViewProperty(property)}
                      className={styles.viewPropertyBtn}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "invoices" && (
        <div className={styles.tabContent}>
          <h2>Generated Invoices</h2>
          {generatedInvoices.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No invoices generated yet.</p>
            </div>
          ) : (
            <div className={styles.invoicesList}>
              {generatedInvoices.map((invoice) => (
                <div key={invoice._id} className={styles.invoiceCard}>
                  <div className={styles.invoiceHeader}>
                    <div className={styles.invoiceNumber}>
                      <h3>Invoice #{invoice.invoiceNumber}</h3>
                      <span
                        className={`${styles.status} ${
                          styles[invoice.status?.toLowerCase()]
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </div>
                    <div className={styles.invoiceMeta}>
                      <p>Quote No: {invoice.quotationNumber}</p>
                      <p>Date: {invoice.invoiceDate}</p>
                    </div>
                  </div>

                  <div className={styles.invoiceDetails}>
                    <div className={styles.clientInfo}>
                      <h4>{invoice.propertyName}</h4>
                      <p>{invoice.location}</p>
                      <p>Contact: {invoice.contact}</p>
                      {invoice.keyPerson && (
                        <p>Key Person: {invoice.keyPerson}</p>
                      )}
                    </div>

                    <div className={styles.invoiceAmounts}>
                      <div className={styles.amountRow}>
                        <span>Total Amount:</span>
                        <span>
                          ₹{invoice.totalAmount?.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className={styles.amountRow}>
                        <span>Discount ({invoice.discount?.percentage}%):</span>
                        <span>
                          -₹{invoice.discount?.amount?.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className={`${styles.amountRow} ${styles.total}`}>
                        <span>
                          <strong>Gross Total:</strong>
                        </span>
                        <span>
                          <strong>
                            ₹{invoice.grossTotal?.toLocaleString("en-IN")}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.invoiceServices}>
                    <h5>Services ({invoice.lineItems?.length || 0} items):</h5>
                    <div className={styles.servicesList}>
                      {invoice.lineItems?.slice(0, 2).map((item, index) => (
                        <div key={index} className={styles.serviceItem}>
                          <span>{item.particular}</span>
                          <span>₹{item.amount?.toLocaleString("en-IN")}</span>
                        </div>
                      ))}
                      {invoice.lineItems?.length > 2 && (
                        <div className={styles.moreServices}>
                          +{invoice.lineItems.length - 2} more services
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.invoiceActions}>
                    <Link
                      href={`/invoices/${invoice.propertyId}?invoiceId=${invoice._id}`}
                      className={styles.viewInvoiceBtn}
                    >
                      View & Download
                    </Link>
                    <Link
                      href={`/invoices/${invoice.propertyId}?edit=true&invoiceId=${invoice._id}`}
                      className={styles.editInvoiceBtn}
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteInvoice(invoice._id)}
                      className={styles.deleteInvoiceBtn}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
