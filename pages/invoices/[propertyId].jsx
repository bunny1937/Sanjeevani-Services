// pages/invoices/[propertyId].jsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import styles from "./Invoice.module.css";
import Image from "next/image";

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
      fetch(`/api/property-details?propertyId=${propertyId}`)
        .then((res) => res.json())
        .then((data) => {
          setPropertyData(data);
          const property = data.property;
          const serviceHistory = data.serviceHistory || [];

          // Initialize with proper structure based on service type
          let defaultLineItems = [];
          let defaultSubject = "SERVICE QUOTATION";

          if (property.serviceType === "Pest Control Service") {
            defaultSubject = "YEARLY PEST CONTROL SERVICE PLAN";

            // Create single line item with combined services
            defaultLineItems = [
              {
                srNo: 1,
                particular:
                  "Professional Pest Control Management Service:\nType : General\n\nComprehensive Inspection of Property to\nIdentify Pest Activity & Assess the Extent of\nInfestation.\n\nScope of Work :\n\n1. Rodent (Rat) Management\n   (Key Infestation Areas: Garbage Zone & Garden)\n2. Spray Treatment Focused on Common Pest\n   Hotspots (according to inspection).\n   Targeted Towards - Cockroaches, Home Spiders,\n   Ants and other minor - major pests.\n   Note: under these treatment we follow special\n   Herbitical Treatment.",
                serviceDue: "every 2 months\n\nevery 2 months",
                rate: `Rs.1500/month\n\nRs.2000/month`,
                amount: property.amount || 21000,
                totalAmount: property.amount || 21000,
              },
            ];
          } else if (property.serviceType === "Water Tank Cleaning") {
            defaultSubject = "WATER TANK CLEANING SERVICE QUOTATION";

            const tankDetails = [];
            if (data.serviceDetails?.ohTank)
              tankDetails.push(`OH Tank: ${data.serviceDetails.ohTank}`);
            if (data.serviceDetails?.ugTank)
              tankDetails.push(`UG Tank: ${data.serviceDetails.ugTank}`);
            if (data.serviceDetails?.sintexTank)
              tankDetails.push(
                `Sintex Tank: ${data.serviceDetails.sintexTank}`
              );

            defaultLineItems = [
              {
                srNo: 1,
                particular: `Water Tank Cleaning Service\n\n${tankDetails.join(
                  "\n"
                )}\n\nComplete cleaning and sanitization\nDisinfection and water quality testing`,
                serviceDue: "Annual Service",
                rate: `Rs.${property.amount}`,
                amount: property.amount,
                totalAmount: property.amount,
              },
            ];
          } else if (property.serviceType === "Motor Repairing & Rewinding") {
            defaultSubject = "MOTOR REPAIR & REWINDING SERVICE QUOTATION";

            defaultLineItems = [
              {
                srNo: 1,
                particular: `Motor Repairing & Rewinding Service\n\n${
                  data.serviceDetails?.workDescription ||
                  "Professional motor repair and rewinding"
                }\n\nComplete diagnosis and repair\nTesting and quality assurance`,
                serviceDue: "As Required",
                rate: `Rs.${property.amount}`,
                amount: property.amount,
                totalAmount: property.amount,
              },
            ];
          } else {
            // Default for other services
            defaultLineItems = [
              {
                srNo: 1,
                particular: `${property.serviceType}\n\nProfessional service as per requirements\nComplete service delivery\nQuality assurance`,
                serviceDue: "Annual Service",
                rate: `Rs.${property.amount}`,
                amount: property.amount,
                totalAmount: property.amount,
              },
            ];
          }

          const totalAmount = defaultLineItems.reduce(
            (sum, item) => sum + (item.amount || 0),
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
      rate: "",
      amount: 0,
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
  const createBlankInvoice = () => {
    setEditable({
      discount: { percentage: 10, amount: 0 },
      customLineItems: [
        {
          srNo: 1,
          particular: "",
          serviceDue: "",
          rate: "",
          amount: 0,
          totalAmount: 0,
        },
      ],
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

    // Clear property data to show blank invoice
    setPropertyData({
      property: {
        name: "",
        keyPerson: "",
        contact: "",
        location: "",
        serviceType: "",
        amount: 0,
        serviceDate: new Date().toISOString().split("T")[0],
      },
      serviceHistory: [],
    });
  };

  // 5. Update the addLineItem function:

  // 6. Add preset templates function:

  const loadPresetTemplate = (serviceType) => {
    let template = {};

    switch (serviceType) {
      case "pest-control":
        template = {
          subject: "YEARLY PEST CONTROL SERVICE PLAN",
          customLineItems: [
            {
              srNo: 1,
              particular:
                "Professional Pest Control Management Service:\nType : General\n\nComprehensive Inspection of Property to\nIdentify Pest Activity & Assess the Extent of\nInfestation.\n\nScope of Work :\n\n1. Rodent (Rat) Management\n   (Key Infestation Areas: Garbage Zone & Garden)\n2. Spray Treatment Focused on Common Pest\n   Hotspots (according to inspection).\n   Targeted Towards - Cockroaches, Home Spiders,\n   Ants and other minor - major pests.\n   Note: under these treatment we follow special\n   Herbitical Treatment.",
              serviceDue: "every 2 months\n\nevery 2 months",
              rate: "Rs.1500/month\n\nRs.2000/month",
              amount: 21000,
            },
          ],
          contractDuration: "1 Year",
          includeSpecialNotes: {
            includeSpecialTreatment: true,
            includeTargetedPests: true,
            specialTreatmentNote:
              "Note: under these treatment we follow special Herbal Treatment.",
            targetedPestsNote:
              "Targeted Towards - Cockroaches, Home Spiders, Ants and other minor - major pests.",
          },
        };
        break;

      case "water-tank":
        template = {
          subject: "WATER TANK CLEANING SERVICE QUOTATION",
          customLineItems: [
            {
              srNo: 1,
              particular:
                "Water Tank Cleaning Service\n\nComplete cleaning and sanitization\nDisinfection and water quality testing\nPump and pipeline maintenance",
              serviceDue: "Annual Service",
              rate: "Rs.5000",
              amount: 5000,
            },
          ],
          contractDuration: "1 Year",
        };
        break;

      case "motor-repair":
        template = {
          subject: "MOTOR REPAIR & REWINDING SERVICE QUOTATION",
          customLineItems: [
            {
              srNo: 1,
              particular:
                "Motor Repairing & Rewinding Service\n\nComplete diagnosis and repair\nRewinding if required\nTesting and quality assurance\nWarranty coverage",
              serviceDue: "As Required",
              rate: "Rs.3000",
              amount: 3000,
            },
          ],
          contractDuration: "As Required",
        };
        break;

      default:
        template = {
          subject: "SERVICE QUOTATION",
          customLineItems: [
            {
              srNo: 1,
              particular:
                "Professional Service\n\nService as per requirements\nQuality assurance\nTimely completion",
              serviceDue: "As Required",
              rate: "Rs.1000",
              amount: 1000,
            },
          ],
          contractDuration: "1 Year",
        };
    }

    const totalAmount = template.customLineItems.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const discountAmount = Math.round((totalAmount * 10) / 100);

    setEditable((prev) => ({
      ...prev,
      ...template,
      discount: { percentage: 10, amount: discountAmount },
      totalAmount,
      grossTotal: totalAmount - discountAmount,
    }));
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
            <div className={styles.lineItemEditor} key={item.id || index}>
              <div className={styles.lineItemRow}>
                <input
                  type="number"
                  placeholder="Sr. No"
                  value={item.srNo}
                  onChange={(e) =>
                    updateLineItem(index, "srNo", +e.target.value)
                  }
                  style={{ width: "60px" }}
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={item.amount}
                  onChange={(e) =>
                    updateLineItem(index, "amount", +e.target.value)
                  }
                  style={{ width: "100px" }}
                />
                <button
                  onClick={() => removeLineItem(index)}
                  className={styles.removeBtn}
                >
                  ×
                </button>
              </div>

              <div className={styles.textAreaRow}>
                <div className={styles.textAreaGroup}>
                  <label>Particular:</label>
                  <textarea
                    placeholder="Enter particular details (use line breaks for formatting)"
                    value={item.particular}
                    onChange={(e) =>
                      updateLineItem(index, "particular", e.target.value)
                    }
                    rows="6"
                    className={styles.particularTextarea}
                  />
                </div>

                <div className={styles.textAreaGroup}>
                  <label>Service Due:</label>
                  <textarea
                    placeholder="Enter service due details"
                    value={item.serviceDue}
                    onChange={(e) =>
                      updateLineItem(index, "serviceDue", e.target.value)
                    }
                    rows="3"
                  />
                </div>

                <div className={styles.textAreaGroup}>
                  <label>Rate:</label>
                  <textarea
                    placeholder="Enter rate details"
                    value={item.rate}
                    onChange={(e) =>
                      updateLineItem(index, "rate", e.target.value)
                    }
                    rows="3"
                  />
                </div>
              </div>
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
            <h1>संजीवनी</h1>
            <span>SERVICES</span>
          </div>
          <div className={styles.invoiceTitle}>
            <h2>QUOTE&apos;</h2>
          </div>
        </div>

        <div className={styles.invoiceDetails}>
          <div className={styles.leftSection}>
            <p>
              <strong>To ,&apos;</strong>
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
                    {/* Render multiline particular content */}
                    {item.particular.split("\n").map((line, lineIndex) => (
                      <div
                        key={lineIndex}
                        className={line.trim() === "" ? styles.emptyLine : ""}
                      >
                        {line || <br />}
                      </div>
                    ))}
                  </div>
                </td>
                <td>
                  <div className={styles.serviceDueCell}>
                    {/* Render multiline service due content */}
                    {item.serviceDue &&
                      item.serviceDue
                        .split("\n")
                        .map((line, lineIndex) => (
                          <div key={lineIndex}>{line || <br />}</div>
                        ))}
                  </div>
                </td>
                <td>
                  <div className={styles.rateCell}>
                    {/* Render multiline rate content */}
                    {item.rate &&
                      item.rate
                        .toString()
                        .split("\n")
                        .map((line, lineIndex) => (
                          <div key={lineIndex}>{line || <br />}</div>
                        ))}
                  </div>
                </td>
                <td>{item.amount?.toLocaleString("en-IN")}</td>
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
        <div className={styles.amountInWordsContainer}>
          <div className={styles.amountInWords}>
            <p>
              <strong>Amount In Words:</strong> {convertToWords(grossTotal)}{" "}
              Rupees Only.
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
        <div className={styles.NotesContainer}>
          <div className={styles.generalNotes}>
            <p>
              <strong>NOTE:</strong>
            </p>
            <div className={styles.contractDetails}>
              <p>
                <strong>Duration of Contract:</strong>{" "}
                {editable.contractDuration}
              </p>
            </div>
            <p>Frequency Mentioned Above in Accordance with the Treatment.</p>
            <p>{editable.notes}</p>
          </div>
          <div className={styles.servicesImage}>
            <Image
              src="/services.png"
              alt="Services"
              width={300}
              height={250}
              className={styles.servicesImage}
            />
          </div>
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
