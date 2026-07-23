const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const Lead = require("../models/Lead");
const Customer = require("../models/Customer");
const authenticateUser = require("../middleware/authenticateUser");
const { resolveUserCompany } = require("../utils/resolveUserCompany");

const router = express.Router();
router.use(authenticateUser);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

const MAPPABLE_FIELDS = [
  { key: "name", label: "Name", required: true },
  { key: "phone", label: "Phone", required: true },
  { key: "email", label: "Email", required: false },
  { key: "district", label: "District", required: false },
];

const FIELD_ALIASES = {
  name: [
    "name",
    "full name",
    "fullname",
    "full_name",
    "lead name",
    "contact name",
    "customer name",
  ],
  phone: [
    "phone",
    "mobile",
    "phone number",
    "phonenumber",
    "phone_number",
    "mobile number",
    "contact",
    "contact number",
    "whatsapp",
    "cell",
  ],
  email: ["email", "e-mail", "email address", "mail", "email_id", "emailid"],
  district: ["district", "city", "location", "place", "area", "town"],
};

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function autoMapHeaders(headers) {
  const mapping = { name: "", phone: "", email: "", district: "" };
  const used = new Set();

  for (const field of Object.keys(mapping)) {
    const aliases = FIELD_ALIASES[field] || [field];
    for (const header of headers) {
      const normalized = normalizeHeader(header);
      if (used.has(header)) continue;
      if (aliases.includes(normalized) || normalized === field) {
        mapping[field] = header;
        used.add(header);
        break;
      }
    }
  }

  return mapping;
}

function getLeadName(data) {
  return (
    data.Name ||
    data.name ||
    data["full name"] ||
    data.full_name ||
    data["Full Name"] ||
    data["Full name"]
  );
}

function getLeadPhone(data) {
  return (
    data.Phone ||
    data.phone ||
    data.phone_number ||
    data["Phone Number"] ||
    data["phone number"]
  );
}

function getLeadEmail(data) {
  return data.Email || data.email || data["E-mail"] || data["e-mail"];
}

function readSheetRows(buffer) {
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { error: "File has no sheets" };
  }
  const sheet = workbook.Sheets[sheetName];
  const matrix = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  if (!matrix.length) {
    return { error: "File has no header row" };
  }
  const headers = (matrix[0] || [])
    .map((h) => String(h || "").trim())
    .filter((h) => h !== "");
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });
  return { headers, rows, matrix };
}

function parseFieldMap(raw) {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function parseAssignmentPlan(raw) {
  if (!raw) return [];
  let plan = raw;
  if (typeof raw === "string") {
    try {
      plan = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(plan)) return [];
  return plan
    .map((item) => ({
      userId: String(item.userId || item._id || "").trim(),
      percentage: Number(item.percentage),
    }))
    .filter((item) => item.userId && Number.isFinite(item.percentage) && item.percentage > 0);
}

/** Weighted round-robin: keeps each counselor closest to their target % as leads are created. */
function createWeightedAssigner(plan) {
  const weights = plan.map((p) => ({
    userId: p.userId,
    weight: p.percentage,
    assigned: 0,
  }));
  if (!weights.length) return () => null;

  return function nextAssignee() {
    let best = weights[0];
    let bestScore = best.assigned / best.weight;
    for (let i = 1; i < weights.length; i++) {
      const score = weights[i].assigned / weights[i].weight;
      if (score < bestScore) {
        best = weights[i];
        bestScore = score;
      }
    }
    best.assigned += 1;
    return best.userId;
  };
}

/**
 * Preview headers + auto mapping for bulk upload wizard.
 * POST /api/excel/headers
 */
router.post("/headers", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const parsed = readSheetRows(req.file.buffer);
    if (parsed.error) {
      return res.status(400).json({ error: parsed.error });
    }

    const { headers, rows } = parsed;
    const sampleRows = rows.slice(0, 3).map((row) => {
      const sample = {};
      headers.forEach((header) => {
        sample[header] = row[header];
      });
      return sample;
    });

    res.json({
      headers,
      mappableFields: MAPPABLE_FIELDS,
      suggestedMapping: autoMapHeaders(headers),
      sampleRows,
      rowCount: rows.length,
    });
  } catch (error) {
    console.error("Error reading upload headers:", error);
    res.status(500).json({ error: "Failed to read file headers", details: error.message });
  }
});

/**
 * Mapped bulk import.
 * POST /api/excel/upload-mapped
 * fieldMap: JSON { name: "Excel Col", phone: "...", email: "...", district: "..." }
 * assignmentPlan (optional): JSON [{ userId, percentage }] — percentages should sum ~100
 */
router.post("/upload-mapped", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const fieldMap = parseFieldMap(req.body.fieldMap);
  if (!fieldMap || !fieldMap.name || !fieldMap.phone) {
    return res.status(400).json({
      error: "fieldMap with name and phone column mappings is required",
    });
  }

  const assignmentPlan = parseAssignmentPlan(req.body.assignmentPlan);
  if (assignmentPlan.length) {
    const totalPct = assignmentPlan.reduce((sum, item) => sum + item.percentage, 0);
    if (totalPct < 99 || totalPct > 101) {
      return res.status(400).json({
        error: `Counselor percentages must total 100% (currently ${totalPct}%).`,
      });
    }
  }
  const nextAssignee = createWeightedAssigner(assignmentPlan);
  const assignmentCounts = {};

  try {
    const companyId = await resolveUserCompany(req.user);
    if (!companyId) {
      return res.status(400).json({
        error: "Your account is not linked to a company yet. Complete company registration first.",
      });
    }

    const parsed = readSheetRows(req.file.buffer);
    if (parsed.error) {
      return res.status(400).json({ error: parsed.error });
    }

    const { rows, headers } = parsed;
    if (!rows.length) {
      return res.status(400).json({ error: "File has no data rows" });
    }

    const mappedHeaders = new Set(
      ["name", "phone", "email", "district"]
        .map((key) => fieldMap[key])
        .filter(Boolean)
    );

    const duplicateLeads = [];
    const skippedRows = [];
    let createdCount = 0;

    for (const data of rows) {
      const name = String(data[fieldMap.name] ?? "").trim();
      const phone = String(data[fieldMap.phone] ?? "").trim();
      const email = fieldMap.email ? String(data[fieldMap.email] ?? "").trim() : "";
      const district = fieldMap.district
        ? String(data[fieldMap.district] ?? "").trim()
        : "";

      const additionalFields = {};
      headers.forEach((header) => {
        if (!mappedHeaders.has(header) && data[header] !== "" && data[header] != null) {
          additionalFields[header] = data[header];
        }
      });

      if (!name || !phone) {
        skippedRows.push({ reason: "Missing name or phone", row: data });
        continue;
      }

      const existingCustomer = await Customer.findOne({
        $or: [{ phone }],
      });

      const existingLead = await Lead.findOne({
        phone,
        company: companyId,
        ...(req.body.campaignid ? { campaignid: req.body.campaignid } : {}),
      });

      if (existingLead) {
        duplicateLeads.push({ name, phone, email, district });
        continue;
      }

      const assigneeId = nextAssignee();
      const leadData = {
        name,
        email,
        phone,
        status: "New",
        source: req.body.source || "",
        campaign: req.body.campaign || "",
        campaignid: req.body.campaignid || null,
        company: companyId,
        assignedTo: assigneeId || null,
        district,
        additionalFields,
        untouched: true,
      };
      if (existingCustomer) {
        leadData.Customer = existingCustomer._id;
      }

      await new Lead(leadData).save();
      createdCount += 1;
      if (assigneeId) {
        assignmentCounts[assigneeId] = (assignmentCounts[assigneeId] || 0) + 1;
      }
    }

    res.status(200).json({
      message: "Leads processed successfully",
      created: createdCount,
      duplicates: duplicateLeads.length,
      skipped: skippedRows.length,
      duplicateLeads,
      skippedRows,
      assignmentCounts,
    });
  } catch (error) {
    console.error("Error processing mapped Excel upload:", error);
    res.status(500).json({
      error: "An error occurred while processing the file",
      details: error.message,
    });
  }
});

/**
 * Legacy upload (hardcoded column aliases).
 * POST /api/excel/upload
 */
router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const companyId = await resolveUserCompany(req.user);
    if (!companyId) {
      return res.status(400).json({
        error: "Your account is not linked to a company yet. Complete company registration first.",
      });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return res.status(400).json({ error: "Excel file has no sheets" });
    }

    const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    if (!jsonData.length) {
      return res.status(400).json({ error: "Excel file has no data rows" });
    }

    const duplicateLeads = [];
    const skippedRows = [];
    let createdCount = 0;

    for (const data of jsonData) {
      const leadData = {
        name: getLeadName(data),
        email: getLeadEmail(data),
        phone: getLeadPhone(data),
        status: "New",
        source: req.body.source || "",
        campaign: req.body.campaign || "",
        campaignid: req.body.campaignid || null,
        company: companyId,
        assignedTo: null,
        district: data.District || data.district || "",
        additionalFields: {},
      };

      Object.keys(data).forEach((key) => {
        if (
          [
            "which_level_are_you_at_right_now?",
            "what_job_are_you_looking_for_in_luxembourg?",
            "how_many_years_of_minimum_experience_you_have_in_the_same_field?",
            "what_is_your_highest_educational_qualification?",
            "country_of_interest",
          ].includes(key)
        ) {
          leadData.additionalFields[key] = data[key];
        }
      });

      if (!leadData.name || !leadData.phone) {
        skippedRows.push({ reason: "Missing name or phone", row: data });
        continue;
      }

      const existingCustomer = await Customer.findOne({
        $or: [{ phone: leadData.phone }],
      });

      if (existingCustomer) {
        leadData.Customer = existingCustomer._id;
      }

      const existingLead = await Lead.findOne({
        phone: leadData.phone,
        company: companyId,
        ...(leadData.campaignid ? { campaignid: leadData.campaignid } : {}),
      });

      if (existingLead) {
        duplicateLeads.push(leadData);
        continue;
      }

      await new Lead(leadData).save();
      createdCount += 1;
    }

    res.status(200).json({
      message: "Leads processed successfully",
      created: createdCount,
      duplicates: duplicateLeads.length,
      skipped: skippedRows.length,
      duplicateLeads,
      skippedRows,
    });
  } catch (error) {
    console.error("Error processing Excel upload:", error);
    res.status(500).json({
      error: "An error occurred while processing the file",
      details: error.message,
    });
  }
});

module.exports = router;
