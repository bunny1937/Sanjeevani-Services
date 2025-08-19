// Updated pages/api/generate-invoice.js - Handle both property-based and blank invoices

import connectDB from "../../lib/mongodb.js";
import Invoice from "../../models/Invoice.js";
import mongoose from "mongoose";

// Use existing schemas
const PropertySchema = new mongoose.Schema(
  {
    name: String,
    keyPerson: String,
    contact: String,
    location: String,
    area: String,
    serviceType: String,
    amount: Number,
    serviceDate: { type: Date, required: true },
    serviceDetails: {
      ohTank: String,
      ugTank: String,
      sintexTank: String,
      numberOfFloors: Number,
      wing: String,
      treatment: String,
      apartment: String,
      workDescription: String,
    },
  },
  { timestamps: true }
);

const Property =
  mongoose.models.Property ||
  mongoose.model("Property", PropertySchema, "properties");

export default async function handler(req, res) {
  try {
    await connectDB();

    if (req.method === "POST") {
      const {
        propertyId,
        customLineItems,
        customDiscount,
        customNotes,
        contractDuration,
        includeServiceHistory,
        customSubject,
        includeSpecialNotes,
        customClientInfo,
        customInvoiceDetails,
      } = req.body;

      let property = null;
      let serviceHistory = [];
      let serviceDetails = {};

      // Handle property-based invoices
      if (propertyId) {
        // Get comprehensive property details
        const propertyDetailsResponse = await fetch(
          `${
            process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
          }/api/property-details?propertyId=${propertyId}`
        );
        const propertyDetailsData = await propertyDetailsResponse.json();

        if (!propertyDetailsData.property) {
          return res.status(404).json({ message: "Property not found" });
        }

        property = propertyDetailsData.property;
        serviceHistory = propertyDetailsData.serviceHistory || [];
        serviceDetails = propertyDetailsData.serviceDetails || {};
      }

      // Generate line items based on service type, history, and custom requirements
      let lineItems = [];

      if (customLineItems && customLineItems.length > 0) {
        lineItems = customLineItems;
      } else if (property) {
        // Generate line items based on service history if requested
        if (includeServiceHistory && serviceHistory.length > 0) {
          lineItems = serviceHistory.map((service, index) => {
            const serviceDate = new Date(
              service.serviceDate
            ).toLocaleDateString("en-GB");
            let scopeOfWork = "Professional service as per requirements";

            // Enhanced scope of work based on service type and details
            if (property.serviceType === "Water Tank Cleaning") {
              const tankDetails = [];
              if (serviceDetails.ohTank)
                tankDetails.push(`OH Tank: ${serviceDetails.ohTank}`);
              if (serviceDetails.ugTank)
                tankDetails.push(`UG Tank: ${serviceDetails.ugTank}`);
              if (serviceDetails.sintexTank)
                tankDetails.push(`Sintex Tank: ${serviceDetails.sintexTank}`);
              if (serviceDetails.numberOfFloors)
                tankDetails.push(`${serviceDetails.numberOfFloors} Floors`);
              if (serviceDetails.wing)
                tankDetails.push(`Wing: ${serviceDetails.wing}`);

              scopeOfWork =
                tankDetails.length > 0
                  ? `Water tank cleaning and maintenance: ${tankDetails.join(
                      ", "
                    )}`
                  : "Complete water tank cleaning and sanitization service";
            } else if (property.serviceType === "Pest Control Service") {
              const pestDetails = [];
              if (serviceDetails.treatment)
                pestDetails.push(`Treatment: ${serviceDetails.treatment}`);
              if (serviceDetails.apartment)
                pestDetails.push(`Area: ${serviceDetails.apartment}`);

              scopeOfWork =
                pestDetails.length > 0
                  ? `Pest control treatment: ${pestDetails.join(", ")}`
                  : "Comprehensive pest control treatment for cockroaches, ants, spiders and other pests";
            } else if (property.serviceType === "Motor Repairing & Rewinding") {
              scopeOfWork =
                serviceDetails.workDescription ||
                "Motor repair and rewinding service";
            } else if (property.serviceType === "House Keeping") {
              scopeOfWork = "Professional housekeeping and maintenance service";
            }

            return {
              srNo: index + 1,
              particular: `${service.serviceType} - ${serviceDate}`,
              serviceDue:
                service.status === "completed" ? "Completed" : "Scheduled",
              rate: service.amount,
              amount: service.amount,
              scopeOfWork: scopeOfWork,
              serviceDate: serviceDate,
              status: service.status,
            };
          });
        } else {
          // Default line items for property-based invoices
          let scopeOfWork = "Professional service as per requirements";
          let serviceDue = "One-time Service";

          // Enhanced scope based on service type and details
          if (property.serviceType === "Pest Control Service") {
            // Create single line item with combined pest control services (matching image structure)
            lineItems = [
              {
                srNo: 1,
                particular:
                  "Professional Pest Control Management Service:\nType : General\n\nComprehensive Inspection of Property to\nIdentify Pest Activity & Assess the Extent of\nInfestation.\n\nScope of Work :\n\n1. Rodent (Rat) Management\n   (Key Infestation Areas: Garbage Zone & Garden)\n2. Spray Treatment Focused on Common Pest\n   Hotspots (according to inspection).\n   Targeted Towards - Cockroaches, Home Spiders,\n   Ants and other minor - major pests.\n   Note: under these treatment we follow special\n   Herbitical Treatment.",
                serviceDue: "every 2 months\n\nevery 2 months",
                rate: "Rs.1500/month\n\nRs.2000/month",
                amount: property.amount || 21000,
              },
            ];
          } else {
            // For other services, create detailed line item
            if (property.serviceType === "Water Tank Cleaning") {
              const tankDetails = [];
              if (serviceDetails.ohTank)
                tankDetails.push(`OH Tank (${serviceDetails.ohTank})`);
              if (serviceDetails.ugTank)
                tankDetails.push(`UG Tank (${serviceDetails.ugTank})`);
              if (serviceDetails.sintexTank)
                tankDetails.push(`Sintex Tank (${serviceDetails.sintexTank})`);

              scopeOfWork =
                tankDetails.length > 0
                  ? `Complete cleaning and sanitization of: ${tankDetails.join(
                      ", "
                    )}`
                  : "Complete water tank cleaning and sanitization";

              if (serviceDetails.numberOfFloors) {
                scopeOfWork += `\nBuilding floors: ${serviceDetails.numberOfFloors}`;
              }
              if (serviceDetails.wing) {
                scopeOfWork += `\nWing: ${serviceDetails.wing}`;
              }

              serviceDue =
                contractDuration && contractDuration !== "1 Year"
                  ? `${contractDuration} Contract`
                  : "Annual Service";
            } else if (property.serviceType === "Motor Repairing & Rewinding") {
              scopeOfWork =
                serviceDetails.workDescription ||
                "Professional motor repair and rewinding service";
              serviceDue = "As Required";
            } else if (property.serviceType === "House Keeping") {
              scopeOfWork =
                "Comprehensive housekeeping and maintenance service";
              serviceDue =
                contractDuration && contractDuration !== "1 Year"
                  ? `${contractDuration} Contract`
                  : "Regular Service";
            }

            lineItems = [
              {
                srNo: 1,
                particular: scopeOfWork,
                serviceDue: serviceDue,
                rate: `Rs.${property.amount}`,
                amount: property.amount,
              },
            ];
          }
        }
      }

      // Calculate totals
      const totalAmount = lineItems.reduce(
        (sum, item) => sum + (item.amount || 0),
        0
      );
      const discountPercentage = customDiscount?.percentage || 10;
      const discountAmount = Math.round(
        (totalAmount * discountPercentage) / 100
      );
      const grossTotal = totalAmount - discountAmount;

      // Generate quotation number
      const invoiceCount = await Invoice.countDocuments();
      const quotationNumber = String(invoiceCount + 1);

      // Determine subject based on service type or use custom
      let subject = customSubject || "SERVICE QUOTATION";
      if (property && !customSubject) {
        if (property.serviceType === "Pest Control Service") {
          subject = "YEARLY PEST CONTROL SERVICE PLAN";
        } else if (property.serviceType === "Water Tank Cleaning") {
          subject = "WATER TANK CLEANING SERVICE QUOTATION";
        } else if (property.serviceType === "Motor Repairing & Rewinding") {
          subject = "MOTOR REPAIR & REWINDING SERVICE QUOTATION";
        } else if (property.serviceType === "House Keeping") {
          subject = "HOUSEKEEPING SERVICE QUOTATION";
        }
      }

      // Create invoice with enhanced data
      const invoiceData = {
        documentType: req.body.documentType || "invoice",

        propertyId: propertyId || null,
        propertyName:
          property?.name || customClientInfo?.name || "Custom Invoice",
        keyPerson: property?.keyPerson || customClientInfo?.keyPerson || "",
        contact: property?.contact || "",
        location: property?.location || customClientInfo?.location || "",
        serviceDate:
          property?.serviceDate ||
          new Date(customClientInfo?.date || new Date()),
        serviceType: property?.serviceType || "Custom Service",
        subject: subject,
        quotationNumber:
          customInvoiceDetails?.quotationNumber || quotationNumber,
        workOrderNumber: customInvoiceDetails?.workOrderNumber || "",
        lineItems,
        totalAmount,
        discount: {
          percentage: discountPercentage,
          amount: discountAmount,
        },
        grossTotal,
        amountInWords: convertToWords(grossTotal),
        contractDuration: contractDuration || "1 Year",
        serviceDetails: serviceDetails,
        generalNotes:
          customNotes ||
          "Dates would be Forwarded with Commencement of Contract.",

        // Optional special notes
        specialTreatmentNote: includeSpecialNotes?.includeSpecialTreatment
          ? includeSpecialNotes.specialTreatmentNote ||
            "Note: under these treatment we follow special Herbal Treatment."
          : null,
        targetedPests: includeSpecialNotes?.includeTargetedPests
          ? includeSpecialNotes.targetedPestsNote ||
            "Targeted Towards - Cockroaches, Home Spiders, Ants and other minor - major pests."
          : null,

        status: "Generated",

        // Store additional context
        includeServiceHistory: includeServiceHistory || false,
        serviceHistoryCount: serviceHistory.length,
        isCustomInvoice: !propertyId, // Flag for blank/custom invoices
      };

      const invoice = new Invoice(invoiceData);
      await invoice.save();

      return res.status(201).json({
        message: "Invoice generated successfully",
        invoice: {
          ...invoice.toObject(),
          invoiceDate: invoice.invoiceDate.toISOString().split("T")[0],
          serviceDate: invoice.serviceDate
            ? invoice.serviceDate.toISOString().split("T")[0]
            : null,
        },
      });
    }

    if (req.method === "PUT") {
      const { invoiceId, updates } = req.body;

      if (!invoiceId) {
        return res.status(400).json({ message: "Invoice ID is required" });
      }

      const invoice = await Invoice.findByIdAndUpdate(
        invoiceId,
        { ...updates, updatedAt: new Date() },
        { new: true }
      );

      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      return res.status(200).json({
        message: "Invoice updated successfully",
        invoice: {
          ...invoice.toObject(),
          invoiceDate: invoice.invoiceDate.toISOString().split("T")[0],
          serviceDate: invoice.serviceDate
            ? invoice.serviceDate.toISOString().split("T")[0]
            : null,
        },
      });
    }

    if (req.method === "DELETE") {
      const { invoiceId } = req.query;

      if (!invoiceId) {
        return res.status(400).json({ message: "Invoice ID is required" });
      }

      const deletedInvoice = await Invoice.findByIdAndDelete(invoiceId);

      if (!deletedInvoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      return res.status(200).json({
        message: "Invoice deleted successfully",
      });
    }

    if (req.method === "GET") {
      const { invoiceId } = req.query;

      if (invoiceId) {
        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) {
          return res.status(404).json({ message: "Invoice not found" });
        }

        return res.status(200).json({
          ...invoice.toObject(),
          invoiceDate: invoice.invoiceDate.toISOString().split("T")[0],
          serviceDate: invoice.serviceDate
            ? invoice.serviceDate.toISOString().split("T")[0]
            : null,
        });
      }

      // Get all invoices
      const invoices = await Invoice.find().sort({ createdAt: -1 });
      return res.status(200).json(
        invoices.map((invoice) => ({
          ...invoice.toObject(),
          invoiceDate: invoice.invoiceDate.toISOString().split("T")[0],
          serviceDate: invoice.serviceDate
            ? invoice.serviceDate.toISOString().split("T")[0]
            : null,
        }))
      );
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Invoice API Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}

// Enhanced number to words converter for Indian currency
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
