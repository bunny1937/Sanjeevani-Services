// models/Invoice.js
import mongoose from "mongoose";

const InvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true },
    quotationNumber: { type: String },
    workOrderNumber: String,
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    propertyName: { type: String, required: true },
    keyPerson: String,
    contact: String,
    location: String,
    invoiceDate: { type: Date, default: Date.now },
    serviceDate: Date,
    subject: {
      type: String,
      default: "SERVICE QUOTATION",
    },

    // Line items for services
    lineItems: [
      {
        srNo: Number,
        particular: String,
        serviceDue: String,
        rate: Number,
        amount: Number,
        scopeOfWork: String,
        serviceDate: String, // For service history items
        status: String, // For service history items
      },
    ],

    // Financial details
    totalAmount: Number,
    discount: {
      percentage: { type: Number, default: 10 },
      amount: Number,
    },
    grossTotal: Number,
    amountInWords: String,

    // Contract details - now flexible
    contractDuration: {
      type: String,
      default: "1 Year",
      enum: [
        "1 Year",
        "2 Years",
        "3 Years",
        "6 Months",
        "One-time Service",
        "As Required",
      ],
    },
    serviceType: String,

    // Additional details - now optional and configurable
    generalNotes: {
      type: String,
      default: "Dates would be Forwarded with Commencement of Contract.",
    },
    specialTreatmentNote: {
      type: String,
      default: null, // Only include if specifically requested
    },
    targetedPests: {
      type: String,
      default: null, // Only include if specifically requested
    },

    // Service details from property - enhanced
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

    // Company details
    companyInfo: {
      name: { type: String, default: "Sanjeevani Services" },
      address: {
        type: String,
        default:
          "Sanjeevani Services, Shivalik Apt. Lokmanya Nagar, Thane - 400606",
      },
      contact: { type: String, default: "7715823333 / 9930742021" },
      email: { type: String, default: "sanjeevaniservices1@gmail.com" },
      locations: {
        type: String,
        default:
          "DOMBIVLI | KALYAN | THANE | MULUND | GHATKOPAR | AIROLI | VASHI",
      },
    },

    status: {
      type: String,
      enum: ["Draft", "Generated", "Sent", "Paid"],
      default: "Draft",
    },

    // New fields for enhanced functionality
    includeServiceHistory: {
      type: Boolean,
      default: false,
    },
    serviceHistoryCount: {
      type: Number,
      default: 0,
    },
    includeSpecialNotes: {
      includeSpecialTreatment: { type: Boolean, default: false },
      includeTargetedPests: { type: Boolean, default: false },
      specialTreatmentNote: String,
      targetedPestsNote: String,
    },

    // Metadata
    generatedFrom: {
      type: String,
      enum: ["current_service", "service_history", "custom"],
      default: "current_service",
    },
    lastModified: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Auto-generate invoice number and quotation number
InvoiceSchema.pre("save", async function (next) {
  if (!this.invoiceNumber) {
    const count = await mongoose.model("Invoice").countDocuments();
    this.invoiceNumber = `INV-${String(count + 1).padStart(4, "0")}`;
  }

  // Only auto-generate quotationNumber if it's not already set
  if (!this.quotationNumber) {
    const count = await mongoose.model("Invoice").countDocuments();
    this.quotationNumber = String(count + 1);
  }

  // Update lastModified on save
  this.lastModified = new Date();

  next();
});

// Add indexes for better performance
InvoiceSchema.index({ propertyId: 1 });
InvoiceSchema.index({ invoiceNumber: 1 });
InvoiceSchema.index({ quotationNumber: 1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ createdAt: -1 });

const Invoice =
  mongoose.models.Invoice ||
  mongoose.model("Invoice", InvoiceSchema, "invoices");

export default Invoice;
