// pages/invoices/new.jsx - Create blank invoice with exact structure

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import styles from "./Invoice.module.css";

export default function NewInvoicePage() {
  const router = useRouter();
  const [documentType, setDocumentType] = useState("invoice");
  const [isQuote, setIsQuote] = useState(false);

  useEffect(() => {
    if (router.query.type) {
      const type = router.query.type;
      setDocumentType(type);
      setIsQuote(type === "quote");
    }
  }, [router.query.type]);
  const [editable, setEditable] = useState({
    // Client Information
    clientInfo: {
      name: "",
      keyPerson: "",
      location: "",
      date: new Date().toLocaleDateString("en-GB"),
    },

    // Invoice Details
    invoiceDetails: {
      date: new Date().toLocaleDateString("en-GB"),
      quotationNumber: Math.floor(Math.random() * 1000).toString(),
      workOrderNumber: "",
      validUntil: isQuote
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(
            "en-GB"
          )
        : "",
    },

    // Subject
    subject: documentType === "quote" ? "SERVICE QUOTATION" : "SERVICE INVOICE",

    // Line Items
    customLineItems: [
      {
        srNo: 1,
        particular: "",
        serviceDue: "",
        rate: "",
        amount: 0,
      },
    ],

    // Discount and totals
    discount: { percentage: 10, amount: 0 },

    // Contract details
    contractDuration: "1 Year",

    // Notes
    notes: "Dates would be Forwarded with Commencement of Contract.",

    // Special notes
    includeSpecialNotes: {
      includeSpecialTreatment: false,
      includeTargetedPests: false,
      specialTreatmentNote:
        "Note: under these treatment we follow special Herbal Treatment.",
      targetedPestsNote:
        "Targeted Towards - Cockroaches, Home Spiders, Ants and other minor - major pests.",
    },
  });

  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

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
    }));
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

    const fileName = `Invoice_${
      editable.clientInfo.name?.replace(/\s+/g, "_") || "New"
    }_${new Date().toISOString().split("T")[0]}.pdf`;
    pdf.save(fileName);
  };

  const saveDocument = async () => {
    const { totalAmount, discountAmount, grossTotal } = calculateTotals();

    try {
      const response = await fetch("/api/generate-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: documentType,
          propertyId: null, // No property linked
          customLineItems: editable.customLineItems,
          customDiscount: {
            percentage: editable.discount.percentage,
            amount: discountAmount,
          },
          customNotes: editable.notes,
          contractDuration: editable.contractDuration,
          customSubject: editable.subject,
          includeSpecialNotes: editable.includeSpecialNotes,
          // Custom client info for blank invoices
          customClientInfo: editable.clientInfo,
          customInvoiceDetails: editable.invoiceDetails,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        alert("Invoice saved successfully!");
        router.push("/invoices");
      } else {
        alert("Error saving invoice: " + result.message);
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
      alert("Error saving invoice");
    }
  };

  const { totalAmount, discountAmount, grossTotal } = calculateTotals();

  return (
    <div className={styles.invoiceContainer}>
      {/* Edit Controls */}
      <div className={styles.editControls}>
        <div className={styles.controlHeader}>
          <h2>Create New Document</h2>
          <div className={styles.documentTypeSelector}>
            <label>
              <input
                type="radio"
                name="documentType"
                value="quote"
                checked={isQuote}
                onChange={(e) => {
                  setIsQuote(true);
                  setDocumentType("quote");
                }}
              />
              Quote
            </label>
            <label>
              <input
                type="radio"
                name="documentType"
                value="invoice"
                checked={!isQuote}
                onChange={(e) => {
                  setIsQuote(false);
                  setDocumentType("invoice");
                }}
              />
              Invoice
            </label>
          </div>
          <div className={styles.headerActions}>
            <button
              onClick={() => router.push("/invoices")}
              className={styles.backBtn}
            >
              ← Back to List
            </button>
          </div>
        </div>

        {/* Quick Templates */}
        <div className={styles.controlSection}>
          <h3>Quick Templates</h3>
          <div className={styles.templateButtons}>
            <button
              onClick={() => loadPresetTemplate("pest-control")}
              className={styles.templateBtn}
            >
              🐛 Pest Control
            </button>
            <button
              onClick={() => loadPresetTemplate("water-tank")}
              className={styles.templateBtn}
            >
              💧 Water Tank Cleaning
            </button>
            <button
              onClick={() => loadPresetTemplate("motor-repair")}
              className={styles.templateBtn}
            >
              ⚙️ Motor Repair
            </button>
            <button
              onClick={() => loadPresetTemplate("general")}
              className={styles.templateBtn}
            >
              📋 General Service
            </button>
          </div>
        </div>

        {/* Client Information */}
        <div className={styles.controlSection}>
          <h3>Client Information</h3>
          <div className={styles.configGrid}>
            <div className={styles.configItem}>
              <label>Client/Property Name:</label>
              <input
                type="text"
                value={editable.clientInfo.name}
                onChange={(e) =>
                  setEditable({
                    ...editable,
                    clientInfo: {
                      ...editable.clientInfo,
                      name: e.target.value,
                    },
                  })
                }
                placeholder="Enter client or property name"
              />
            </div>
            <div className={styles.configItem}>
              <label>Key Person:</label>
              <input
                type="text"
                value={editable.clientInfo.keyPerson}
                onChange={(e) =>
                  setEditable({
                    ...editable,
                    clientInfo: {
                      ...editable.clientInfo,
                      keyPerson: e.target.value,
                    },
                  })
                }
                placeholder="Contact person name"
              />
            </div>
            <div className={styles.configItem}>
              <label>Location:</label>
              <input
                type="text"
                value={editable.clientInfo.location}
                onChange={(e) =>
                  setEditable({
                    ...editable,
                    clientInfo: {
                      ...editable.clientInfo,
                      location: e.target.value,
                    },
                  })
                }
                placeholder="Full address"
              />
            </div>
            <div className={styles.configItem}>
              <label>Service Date:</label>
              <input
                type="date"
                value={editable.clientInfo.date}
                onChange={(e) =>
                  setEditable({
                    ...editable,
                    clientInfo: {
                      ...editable.clientInfo,
                      date: e.target.value,
                    },
                  })
                }
              />
            </div>
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
                placeholder="Enter invoice subject"
              />
            </div>
            <div className={styles.configItem}>
              <label>Quotation Number:</label>
              <input
                type="text"
                value={editable.invoiceDetails.quotationNumber}
                onChange={(e) =>
                  setEditable({
                    ...editable,
                    invoiceDetails: {
                      ...editable.invoiceDetails,
                      quotationNumber: e.target.value,
                    },
                  })
                }
                placeholder="Quote number"
              />
            </div>
            {!isQuote && (
              <div className={styles.configItem}>
                <label>Work Order Number:</label>
                <input
                  type="text"
                  value={editable.invoiceDetails.workOrderNumber}
                  onChange={(e) =>
                    setEditable({
                      ...editable,
                      invoiceDetails: {
                        ...editable.invoiceDetails,
                        workOrderNumber: e.target.value,
                      },
                    })
                  }
                  placeholder="Work order number (optional)"
                />
              </div>
            )}

            {isQuote && (
              <div className={styles.configItem}>
                <label>Quote Valid Until:</label>
                <input
                  type="date"
                  value={editable.invoiceDetails.validUntil}
                  onChange={(e) =>
                    setEditable({
                      ...editable,
                      invoiceDetails: {
                        ...editable.invoiceDetails,
                        validUntil: e.target.value,
                      },
                    })
                  }
                />
              </div>
            )}
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
          </div>
        </div>

        {/* Line Items */}
        <div className={styles.controlSection}>
          <h3>Line Items</h3>
          {editable.customLineItems.map((item, index) => (
            <div key={index} className={styles.lineItemEditor}>
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
                  <label>{isQuote ? "Quantity:" : "Service Due:"}</label>
                  <textarea
                    placeholder={
                      isQuote
                        ? "Enter quantity details"
                        : "Enter service due details"
                    }
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

        {/* Discount */}
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

        {/* Notes */}
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

        {/* Action Buttons */}
        <div className={styles.controlActions}>
          <button onClick={saveDocument} className={styles.generateBtn}>
            Save {isQuote ? "Quote" : "Invoice"}
          </button>
          <button onClick={handleDownload} className={styles.downloadBtn}>
            Download PDF
          </button>
        </div>
      </div>

      {/* Invoice Preview - Exact Structure */}
      <div id="invoice-preview" className={styles.invoicePreview}>
        <div className={styles.invoiceHeader}>
          <div className={styles.companyInfo}>
            <h1>संजीवनी</h1>
            <span>SERVICES</span>
          </div>
          <div className={styles.invoiceTitle}>
            <h2>{isQuote ? "QUOTE" : "INVOICE"}</h2>
          </div>
        </div>

        <div className={styles.invoiceDetails}>
          <div className={styles.leftSection}>
            <p>
              <strong>To,</strong>
            </p>
            <p>
              <strong>
                {editable.clientInfo.keyPerson || "The Secretary / Chairman,"}
              </strong>
            </p>
            <p>{editable.clientInfo.name || "Property Name"}</p>
            <p>{editable.clientInfo.location || "Location"}</p>
            <p>Date: {editable.clientInfo.date}</p>
          </div>

          <div className={styles.rightSection}>
            <p>
              <strong>Date:</strong> {editable.invoiceDetails.date}
            </p>
            <p>
              <strong>{isQuote ? "Quotation" : "Invoice"} No:</strong>{" "}
              {editable.invoiceDetails.quotationNumber}
            </p>
            {!isQuote && (
              <p>
                <strong>Work Order No:</strong>{" "}
                {editable.invoiceDetails.workOrderNumber}
              </p>
            )}
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
              <th>{isQuote ? "QUANTITY" : "SERVICE DUE"}</th>
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

            {/* Totals Row */}
            <tr className={styles.totalsRow}>
              <td colSpan="4" className={styles.totalLabel}>
                TOTAL
              </td>
              <td className={styles.totalAmount}>
                {totalAmount.toLocaleString("en-IN")}
              </td>
            </tr>
            <tr className={styles.totalsRow}>
              <td colSpan="4" className={styles.totalLabel}>
                DISCOUNT {editable.discount.percentage}%
              </td>
              <td className={styles.discountAmount}>
                -{discountAmount.toLocaleString("en-IN")}
              </td>
            </tr>
            <tr className={styles.grossTotalRow}>
              <td colSpan="4" className={styles.grossTotalLabel}>
                <strong>GROSS TOTAL</strong>
              </td>
              <td className={styles.grossTotalAmount}>
                <strong>{grossTotal.toLocaleString("en-IN")}</strong>
              </td>
            </tr>
          </tbody>
        </table>

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
            <div className={styles.serviceCategories}>
              <div className={styles.categoryRow}>
                <div className={styles.category}>WATER TANK CLEANING</div>
                <div className={styles.category}>PEST CONTROL SERVICE</div>
              </div>
              <div className={styles.categoryRow}>
                <div className={styles.category}>HOUSE KEEPING</div>
                <div className={styles.category}>
                  MOTOR REPAIRING & REWINDING
                </div>
              </div>
            </div>
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
