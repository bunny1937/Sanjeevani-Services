// pages/invoices/[propertyId].jsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import styles from "./Invoice.module.css";

export default function InvoicePage() {
  const { query } = useRouter();
  const { propertyId } = query;
  const [propertyData, setPropertyData] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [editable, setEditable] = useState({
    discount: { percentage: 10, amount: 0 },
    customLineItems: [],
    notes: "Dates would be Forwarded with Commencement of Contract.",
    specialNote:
      "Note: under these treatment we follow special Herbal Treatment.",
    targetedPests:
      "Targeted Towards - Cockroaches, Home Spiders, Ants and other minor - major pests.",
    contractDuration: "1 Year",
    subject: "",
    includeServiceHistory: false,
    includeSpecialNotes: {
      includeSpecialTreatment: false,
      includeTargetedPests: false,
      specialTreatmentNote:
        "Note: under these treatment we follow special Herbal Treatment.",
      targetedPestsNote:
        "Targeted Towards - Cockroaches, Home Spiders, Ants and other minor - major pests.",
    },
  });
  const [loading, setLoading] = useState(true);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  useEffect(() => {
    if (propertyId) {
      // Fetch comprehensive property details
      fetch(`/api/property-details?propertyId=${propertyId}`)
        .then((res) => res.json())
        .then((data) => {
          setPropertyData(data);

          // Initialize editable data based on property and service history
          const property = data.property;
          const serviceHistory = data.serviceHistory || [];
          let defaultLineItems = [];

          // Set default subject based on service type
          let defaultSubject = "SERVICE QUOTATION";
          if (property.serviceType === "Pest Control Service") {
            defaultSubject = "YEARLY PEST CONTROL SERVICE PLAN";
          } else if (property.serviceType === "Water Tank Cleaning") {
            defaultSubject = "WATER TANK CLEANING SERVICE QUOTATION";
          } else if (property.serviceType === "Motor Repairing & Rewinding") {
            defaultSubject = "MOTOR REPAIR & REWINDING SERVICE QUOTATION";
          }

          // Generate line items from service history by default if available
          if (serviceHistory.length > 0) {
            defaultLineItems = serviceHistory.map((service, index) => {
              const serviceDate = new Date(
                service.serviceDate
              ).toLocaleDateString("en-GB");
              let scopeOfWork = "Professional service as per requirements";

              // Enhanced scope of work based on service type and details
              if (property.serviceType === "Water Tank Cleaning") {
                const tankDetails = [];
                if (data.serviceDetails?.ohTank)
                  tankDetails.push(`OH Tank: ${data.serviceDetails.ohTank}`);
                if (data.serviceDetails?.ugTank)
                  tankDetails.push(`UG Tank: ${data.serviceDetails.ugTank}`);
                if (data.serviceDetails?.sintexTank)
                  tankDetails.push(
                    `Sintex Tank: ${data.serviceDetails.sintexTank}`
                  );

                scopeOfWork =
                  tankDetails.length > 0
                    ? `Water tank cleaning: ${tankDetails.join(", ")}`
                    : "Complete water tank cleaning and sanitization service";
              } else if (property.serviceType === "Pest Control Service") {
                scopeOfWork =
                  "Comprehensive pest control treatment for cockroaches, ants, spiders and other pests";
              } else if (
                property.serviceType === "Motor Repairing & Rewinding"
              ) {
                scopeOfWork =
                  data.serviceDetails?.workDescription ||
                  "Motor repair and rewinding service";
              }

              return {
                srNo: index + 1,
                particular: `${service.serviceType} - ${serviceDate}`,
                serviceDue:
                  service.status === "completed" ? "Completed" : "Scheduled",
                rate: service.amount,
                amount: service.amount,
                scopeOfWork: scopeOfWork,
              };
            });
          } else {
            // Fallback to default single line item
            if (property.serviceType === "Pest Control Service") {
              const monthlyRate = Math.round(property.amount / 12);
              const rodentRate = Math.round(monthlyRate * 0.75);

              defaultLineItems = [
                {
                  srNo: 1,
                  particular:
                    "Spray Treatment Focused on Common Pest every 2 months",
                  serviceDue: `Rs.${monthlyRate}/month`,
                  rate: monthlyRate,
                  amount: monthlyRate * 12,
                  scopeOfWork:
                    "Targeted spray treatment for hotspots (according to inspection)",
                },
                {
                  srNo: 2,
                  particular: "Rodent (Rat) Management every 2 months",
                  serviceDue: `Rs.${rodentRate}/month`,
                  rate: rodentRate,
                  amount: rodentRate * 12,
                  scopeOfWork:
                    "Rodent control in key infestation areas - garbage zones & garden areas",
                },
              ];
            } else {
              let scopeOfWork = "Professional service as per requirements";

              if (property.serviceType === "Water Tank Cleaning") {
                const tankDetails = [];
                if (data.serviceDetails?.ohTank)
                  tankDetails.push(`OH Tank (${data.serviceDetails.ohTank})`);
                if (data.serviceDetails?.ugTank)
                  tankDetails.push(`UG Tank (${data.serviceDetails.ugTank})`);
                if (data.serviceDetails?.sintexTank)
                  tankDetails.push(
                    `Sintex Tank (${data.serviceDetails.sintexTank})`
                  );

                scopeOfWork =
                  tankDetails.length > 0
                    ? `Complete cleaning and sanitization of: ${tankDetails.join(
                        ", "
                      )}`
                    : "Complete water tank cleaning and sanitization";
              } else if (
                property.serviceType === "Motor Repairing & Rewinding"
              ) {
                scopeOfWork =
                  data.serviceDetails?.workDescription ||
                  "Professional motor repair and rewinding service";
              }

              defaultLineItems = [
                {
                  srNo: 1,
                  particular: property.serviceType,
                  serviceDue: "Annual Service",
                  rate: property.amount,
                  amount: property.amount,
                  scopeOfWork: scopeOfWork,
                },
              ];
            }
          }

          const totalAmount = defaultLineItems.reduce(
            (sum, item) => sum + item.amount,
            0
          );
          const discountAmount = Math.round((totalAmount * 10) / 100);

          setEditable((prev) => ({
            ...prev,
            customLineItems: defaultLineItems,
            discount: { percentage: 10, amount: discountAmount },
            totalAmount,
            grossTotal: totalAmount - discountAmount,
            subject: defaultSubject,
            includeServiceHistory: serviceHistory.length > 0,
            includeSpecialNotes: {
              ...prev.includeSpecialNotes,
              includeSpecialTreatment:
                property.serviceType === "Pest Control Service",
              includeTargetedPests:
                property.serviceType === "Pest Control Service",
            },
          }));

          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching property data:", error);
          setLoading(false);
        });
    }
  }, [propertyId]);

  const calculateTotals = () => {
    const totalAmount = editable.customLineItems.reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    );
    const discountAmount = Math.round(
      (totalAmount * editable.discount.percentage) / 100
    );
    const grossTotal = totalAmount - discountAmount;

    return { totalAmount, discountAmount, grossTotal };
  };

  const generateInvoice = async () => {
    const { totalAmount, discountAmount, grossTotal } = calculateTotals();

    try {
      const response = await fetch("/api/generate-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          customLineItems: editable.customLineItems,
          customDiscount: {
            percentage: editable.discount.percentage,
            amount: discountAmount,
          },
          customNotes: editable.notes,
          contractDuration: editable.contractDuration,
          includeServiceHistory: editable.includeServiceHistory,
          customSubject: editable.subject,
          includeSpecialNotes: editable.includeSpecialNotes,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setInvoice(result.invoice);
        alert("Invoice generated successfully!");
      } else {
        alert("Error generating invoice: " + result.message);
      }
    } catch (error) {
      console.error("Error generating invoice:", error);
      alert("Error generating invoice");
    }
  };

  const handleDownload = async () => {
    const element = document.getElementById("invoice-preview");
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
    });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = pageWidth;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const fileName = `Invoice_${propertyData?.property?.name?.replace(
      /\s+/g,
      "_"
    )}_${new Date().toISOString().split("T")[0]}.pdf`;
    pdf.save(fileName);
  };

  const updateLineItem = (index, field, value) => {
    const newItems = [...editable.customLineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditable({ ...editable, customLineItems: newItems });
  };

  const addLineItem = () => {
    const newItem = {
      srNo: editable.customLineItems.length + 1,
      particular: "",
      serviceDue: "",
      rate: 0,
      amount: 0,
      scopeOfWork: "",
    };
    setEditable({
      ...editable,
      customLineItems: [...editable.customLineItems, newItem],
    });
  };

  const removeLineItem = (index) => {
    const newItems = editable.customLineItems.filter((_, i) => i !== index);
    // Renumber the items
    const renumberedItems = newItems.map((item, i) => ({
      ...item,
      srNo: i + 1,
    }));
    setEditable({ ...editable, customLineItems: renumberedItems });
  };

  const regenerateFromServiceHistory = () => {
    if (
      !propertyData?.serviceHistory ||
      propertyData.serviceHistory.length === 0
    ) {
      alert("No service history available for this property");
      return;
    }

    const serviceHistory = propertyData.serviceHistory;
    const property = propertyData.property;

    const historyLineItems = serviceHistory.map((service, index) => {
      const serviceDate = new Date(service.serviceDate).toLocaleDateString(
        "en-GB"
      );
      let scopeOfWork = "Professional service as per requirements";

      if (property.serviceType === "Water Tank Cleaning") {
        const tankDetails = [];
        if (propertyData.serviceDetails?.ohTank)
          tankDetails.push(`OH Tank: ${propertyData.serviceDetails.ohTank}`);
        if (propertyData.serviceDetails?.ugTank)
          tankDetails.push(`UG Tank: ${propertyData.serviceDetails.ugTank}`);
        if (propertyData.serviceDetails?.sintexTank)
          tankDetails.push(
            `Sintex Tank: ${propertyData.serviceDetails.sintexTank}`
          );

        scopeOfWork =
          tankDetails.length > 0
            ? `Water tank cleaning: ${tankDetails.join(", ")}`
            : "Complete water tank cleaning and sanitization service";
      } else if (property.serviceType === "Motor Repairing & Rewinding") {
        scopeOfWork =
          propertyData.serviceDetails?.workDescription ||
          "Motor repair and rewinding service";
      }

      return {
        srNo: index + 1,
        particular: `${service.serviceType} - ${serviceDate}`,
        serviceDue: service.status === "completed" ? "Completed" : "Scheduled",
        rate: service.amount,
        amount: service.amount,
        scopeOfWork: scopeOfWork,
      };
    });

    setEditable({
      ...editable,
      customLineItems: historyLineItems,
      includeServiceHistory: true,
    });
  };

  if (loading)
    return <div className={styles.loading}>Loading property data...</div>;
  if (!propertyData)
    return <div className={styles.error}>Property not found</div>;

  const { property, serviceHistory } = propertyData;
  const { totalAmount, discountAmount, grossTotal } = calculateTotals();
  const currentDate = new Date().toLocaleDateString("en-IN");
  const quotationNumber =
    invoice?.quotationNumber || Math.floor(Math.random() * 1000).toString();

  return (
    <div className={styles.invoiceContainer}>
      {/* Edit Controls */}
      <div className={styles.editControls}>
        <h2>Invoice Editor</h2>

        {/* Property Info Summary */}
        <div className={styles.controlSection}>
          <h3>Property Information</h3>
          <div className={styles.propertyInfoSummary}>
            <p>
              <strong>{property.name}</strong> - {property.serviceType}
            </p>
            <p>
              Contact: {property.contact} | Location: {property.location}
            </p>
            {serviceHistory.length > 0 && (
              <p>
                Service History: {serviceHistory.length} services (Total: ₹
                {propertyData.stats?.totalAmount?.toLocaleString("en-IN")})
              </p>
            )}
          </div>
        </div>

        {/* Invoice Configuration */}
        <div className={styles.controlSection}>
          <h3>Invoice Configuration</h3>
          <div className={styles.configGrid}>
            <div className={styles.configItem}>
              <label>Subject:</label>
              <input
                type="text"
                value={editable.subject}
                onChange={(e) =>
                  setEditable({ ...editable, subject: e.target.value })
                }
                placeholder="Enter custom subject"
              />
            </div>
            <div className={styles.configItem}>
              <label>Contract Duration:</label>
              <select
                value={editable.contractDuration}
                onChange={(e) =>
                  setEditable({ ...editable, contractDuration: e.target.value })
                }
              >
                <option value="1 Year">1 Year</option>
                <option value="2 Years">2 Years</option>
                <option value="3 Years">3 Years</option>
                <option value="6 Months">6 Months</option>
                <option value="One-time Service">One-time Service</option>
                <option value="As Required">As Required</option>
              </select>
            </div>
            <div className={styles.configItem}>
              <label>
                <input
                  type="checkbox"
                  checked={editable.includeServiceHistory}
                  onChange={(e) =>
                    setEditable({
                      ...editable,
                      includeServiceHistory: e.target.checked,
                    })
                  }
                />
                Include Service History in Line Items
              </label>
            </div>
          </div>

          {serviceHistory.length > 0 && (
            <button
              onClick={regenerateFromServiceHistory}
              className={styles.historyBtn}
            >
              Generate Line Items from Service History ({serviceHistory.length}{" "}
              services)
            </button>
          )}
        </div>

        <div className={styles.controlSection}>
          <h3>Line Items</h3>
          {editable.customLineItems.map((item, index) => (
            <div key={index} className={styles.lineItemEditor}>
              <div className={styles.lineItemRow}>
                <input
                  type="text"
                  placeholder="Particular"
                  value={item.particular}
                  onChange={(e) =>
                    updateLineItem(index, "particular", e.target.value)
                  }
                />
                <input
                  type="text"
                  placeholder="Service Due"
                  value={item.serviceDue}
                  onChange={(e) =>
                    updateLineItem(index, "serviceDue", e.target.value)
                  }
                />
                <input
                  type="number"
                  placeholder="Rate"
                  value={item.rate}
                  onChange={(e) =>
                    updateLineItem(index, "rate", +e.target.value)
                  }
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={item.amount}
                  onChange={(e) =>
                    updateLineItem(index, "amount", +e.target.value)
                  }
                />
                <button
                  onClick={() => removeLineItem(index)}
                  className={styles.removeBtn}
                >
                  ×
                </button>
              </div>
              <textarea
                placeholder="Scope of Work"
                value={item.scopeOfWork}
                onChange={(e) =>
                  updateLineItem(index, "scopeOfWork", e.target.value)
                }
                rows="2"
              />
            </div>
          ))}
          <button onClick={addLineItem} className={styles.addBtn}>
            Add Line Item
          </button>
        </div>

        <div className={styles.controlSection}>
          <h3>Discount</h3>
          <input
            type="number"
            placeholder="Discount %"
            value={editable.discount.percentage}
            onChange={(e) =>
              setEditable({
                ...editable,
                discount: { ...editable.discount, percentage: +e.target.value },
              })
            }
          />
        </div>

        <div className={styles.controlSection}>
          <h3>Notes</h3>
          <textarea
            value={editable.notes}
            onChange={(e) =>
              setEditable({ ...editable, notes: e.target.value })
            }
            rows="3"
          />
        </div>

        {/* Advanced Options */}
        <div className={styles.controlSection}>
          <button
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className={styles.toggleBtn}
          >
            {showAdvancedOptions ? "Hide" : "Show"} Advanced Options
          </button>

          {showAdvancedOptions && (
            <div className={styles.advancedOptions}>
              <h4>Special Notes (Optional)</h4>
              <div className={styles.specialNotesConfig}>
                <label>
                  <input
                    type="checkbox"
                    checked={
                      editable.includeSpecialNotes.includeSpecialTreatment
                    }
                    onChange={(e) =>
                      setEditable({
                        ...editable,
                        includeSpecialNotes: {
                          ...editable.includeSpecialNotes,
                          includeSpecialTreatment: e.target.checked,
                        },
                      })
                    }
                  />
                  Include Special Treatment Note
                </label>
                {editable.includeSpecialNotes.includeSpecialTreatment && (
                  <textarea
                    value={editable.includeSpecialNotes.specialTreatmentNote}
                    onChange={(e) =>
                      setEditable({
                        ...editable,
                        includeSpecialNotes: {
                          ...editable.includeSpecialNotes,
                          specialTreatmentNote: e.target.value,
                        },
                      })
                    }
                    rows="2"
                    placeholder="Special treatment note"
                  />
                )}

                <label>
                  <input
                    type="checkbox"
                    checked={editable.includeSpecialNotes.includeTargetedPests}
                    onChange={(e) =>
                      setEditable({
                        ...editable,
                        includeSpecialNotes: {
                          ...editable.includeSpecialNotes,
                          includeTargetedPests: e.target.checked,
                        },
                      })
                    }
                  />
                  Include Targeted Pests Note
                </label>
                {editable.includeSpecialNotes.includeTargetedPests && (
                  <textarea
                    value={editable.includeSpecialNotes.targetedPestsNote}
                    onChange={(e) =>
                      setEditable({
                        ...editable,
                        includeSpecialNotes: {
                          ...editable.includeSpecialNotes,
                          targetedPestsNote: e.target.value,
                        },
                      })
                    }
                    rows="2"
                    placeholder="Targeted pests note"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        <div className={styles.controlActions}>
          <button onClick={generateInvoice} className={styles.generateBtn}>
            Generate Invoice
          </button>
          <button onClick={handleDownload} className={styles.downloadBtn}>
            Download PDF
          </button>
        </div>
      </div>

      {/* Invoice Preview */}
      <div id="invoice-preview" className={styles.invoicePreview}>
        <div className={styles.invoiceHeader}>
          <div className={styles.companyInfo}>
            <h1>Sanjeevani Services</h1>
            <div className={styles.serviceTypes}>
              <span>WATER TANK CLEANING.</span>
              <span>PEST CONTROL SERVICE.</span>
              <span>HOUSE KEEPING.</span>
              <span>MOTOR REPAIRING & REWINDING</span>
            </div>
          </div>
        </div>

        <div className={styles.invoiceTitle}>
          <h2>QUOTE</h2>
        </div>

        <div className={styles.invoiceDetails}>
          <div className={styles.leftSection}>
            <p>
              <strong>To,</strong>
            </p>
            <p>
              <strong>{property.keyPerson || property.name}</strong>
            </p>
            <p>{property.name}</p>
            <p>{property.location}</p>
            <p>Date: {property.serviceDate}</p>
          </div>

          <div className={styles.rightSection}>
            <p>
              <strong>Date:</strong> {currentDate}
            </p>
            <p>
              <strong>Quotation No:</strong> {quotationNumber}
            </p>
            <p>
              <strong>Work Order No:</strong>
            </p>
          </div>
        </div>

        <div className={styles.subject}>
          <p>
            <strong>SUBJECT:</strong>
          </p>
          <p>
            <strong>{editable.subject || "SERVICE QUOTATION"}</strong>
          </p>
        </div>

        <table className={styles.servicesTable}>
          <thead>
            <tr>
              <th>SR. No.</th>
              <th>PARTICULAR</th>
              <th>SERVICE DUE</th>
              <th>RATE</th>
              <th>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {editable.customLineItems.map((item, index) => (
              <tr key={index}>
                <td>{item.srNo}</td>
                <td>
                  <div className={styles.particularCell}>
                    <div>{item.particular}</div>
                    {item.scopeOfWork && (
                      <div className={styles.scopeOfWork}>
                        {item.scopeOfWork}
                      </div>
                    )}
                  </div>
                </td>
                <td>{item.serviceDue}</td>
                <td>{item.rate.toLocaleString("en-IN")}</td>
                <td>{item.amount.toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.totalsSection}>
          <div className={styles.totalsTable}>
            <div className={styles.totalRow}>
              <span>TOTAL</span>
              <span>{totalAmount.toLocaleString("en-IN")}</span>
            </div>
            <div className={styles.totalRow}>
              <span>DISCOUNT {editable.discount.percentage}%</span>
              <span>-{discountAmount.toLocaleString("en-IN")}</span>
            </div>
            <div className={styles.totalRow}>
              <span>
                <strong>GROSS TOTAL</strong>
              </span>
              <span>
                <strong>{grossTotal.toLocaleString("en-IN")}</strong>
              </span>
            </div>
          </div>
        </div>

        <div className={styles.amountInWords}>
          <p>
            <strong>Amount In Words:</strong> {convertToWords(grossTotal)}{" "}
            Rupees Only.
          </p>
        </div>

        <div className={styles.contractDetails}>
          <p>
            <strong>Duration of Contract:</strong> {editable.contractDuration}
          </p>
        </div>

        <div className={styles.scopeOfWork}>
          <p>
            <strong>Scope of Work:</strong>
          </p>
          <p>Identify Pest Activity & Assess the Extent of Infestation.</p>
          <p>Comprehensive Inspection of Property to</p>
          <p>Professional Pest Control Management Service:</p>
        </div>

        {editable.includeSpecialNotes.includeSpecialTreatment && (
          <div className={styles.additionalNotes}>
            <p>{editable.includeSpecialNotes.specialTreatmentNote}</p>
          </div>
        )}

        {editable.includeSpecialNotes.includeTargetedPests && (
          <div className={styles.additionalNotes}>
            <p>{editable.includeSpecialNotes.targetedPestsNote}</p>
          </div>
        )}

        <div className={styles.generalNotes}>
          <p>
            <strong>NOTE:</strong>
          </p>
          <p>Frequency Mentioned Above in Accordance with the Treatment.</p>
          <p>{editable.notes}</p>
        </div>

        <div className={styles.footer}>
          <div className={styles.companyDetails}>
            <p>
              <strong>
                DOMBIVLI | KALYAN | THANE | MULUND | GHATKOPAR | AIROLI | VASHI
              </strong>
            </p>
            <p>
              Contact: 7715823333 / 9930742021 | Email Id:
              sanjeevaniservices1@gmail.com
            </p>
            <p>
              Address: Sanjeevani Services, Shivalik Apt. Lokmanya Nagar, Thane
              - 400606
            </p>
          </div>

          <div className={styles.signature}>
            <p>
              <strong>For Sanjeevani Services</strong>
            </p>
            <div className={styles.signatureSpace}></div>
            <p>
              <strong>Authorised Signatory.</strong>
            </p>
          </div>
        </div>

        <div className={styles.thankYou}>
          <p>
            <strong>THANK YOU :)</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

// Enhanced number to words converter
function convertToWords(num) {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  if (num === 0) return "Zero";
  if (num > 9999999) return "Amount too large";

  function convertChunk(n) {
    let result = "";

    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }

    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    } else if (n >= 10) {
      result += ones[n] + " ";
      return result;
    }

    if (n > 0) {
      result += ones[n] + " ";
    }

    return result;
  }

  let result = "";

  // Crores
  if (num >= 10000000) {
    result += convertChunk(Math.floor(num / 10000000)) + "Crore ";
    num %= 10000000;
  }

  // Lakhs
  if (num >= 100000) {
    result += convertChunk(Math.floor(num / 100000)) + "Lakh ";
    num %= 100000;
  }

  // Thousands
  if (num >= 1000) {
    result += convertChunk(Math.floor(num / 1000)) + "Thousand ";
    num %= 1000;
  }

  // Remaining
  if (num > 0) {
    result += convertChunk(num);
  }

  return result.trim();
}
