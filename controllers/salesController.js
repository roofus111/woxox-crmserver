const Sales = require("../models/sales");
const Lead = require("../models/Lead");


// Create a new sales entry
exports.createSales = async (req, res) => {
  try {
    const { SalesId, LeadId, Customer } = req.body;
    const newSales = new Sales({
      SalesId,
      LeadId,
      Customer,
      company: req.user.company._id,
    });

    const savedSales = await newSales.save();
    res.status(201).json(savedSales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating sales entry" });
  }
};

exports.getAllSalesByCompany = async (req,res) => {
  try {
    const salesData = await Sales.find({ company: req.user.company._id })
    .populate({
      path: "LeadId",
      populate: {
        path: "campaignid",
        select: "name", // Select only the `name` field from `campaignid`
      },
    }).sort({ createdAt: -1 }).populate("invoice") // Populates details of the lead(s)
    //   .populate("company", "name"); // Populates only the name of the company

    res.status(200).json({
      salesData,
    });
  } catch (error) {
    console.error("Error fetching sales data:", error);
    res.status(500).json({
        error
      });
  }
};

// Get a specific sales entry by ID
exports.getSalesById = async (req, res) => {
  try {
    const sales = await Sales.findById(req.params.id).populate("LeadId").populate("LeadId","campaignid");
    if (!sales) {
      return res.status(404).json({ message: "Sales entry not found" });
    }
    res.status(200).json(sales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching sales entry" });
  }
};

// Update a specific sales entry by ID
exports.updateSales = async (req, res) => {
  try {
    const { SalesId, LeadId } = req.body;

    // Check if the Lead IDs exist
    const leads = await Lead.find({ _id: { $in: LeadId } });
    if (leads.length !== LeadId.length) {
      return res
        .status(400)
        .json({ message: "One or more Lead IDs are invalid" });
    }

    const updatedSales = await Sales.findByIdAndUpdate(
      req.params.id,
      { SalesId, LeadId },
      { new: true }
    );
    if (!updatedSales) {
      return res.status(404).json({ message: "Sales entry not found" });
    }
    res.status(200).json(updatedSales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating sales entry" });
  }
};

// Delete a sales entry by ID
exports.deleteSales = async (req, res) => {
  try {
    const deletedSales = await Sales.findByIdAndDelete(req.params.id);
    if (!deletedSales) {
      return res.status(404).json({ message: "Sales entry not found" });
    }
    res.status(200).json({ message: "Sales entry deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting sales entry" });
  }
};

exports.acceptSales = async (req, res) => {
  try {
    const { SalesId } = req.body;

    const updatedSales = await Sales.findByIdAndUpdate(
      SalesId,
      { accepted: true },
      { new: true }
    );
    if (!updatedSales) {
      return res.status(404).json({ message: "Sales entry not found" });
    }
    res.status(200).json(updatedSales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error accepting sales entry" });
  }
};


exports.closeSales = async (req, res) => {
  try {
    const { SalesId } = req.body;

    const updatedSales = await Sales.findByIdAndUpdate(
      SalesId,
      { closed: true },
      { new: true }
    );
    if (!updatedSales) {
      return res.status(404).json({ message: "Sales entry not found" });
    }
    res.status(200).json(updatedSales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error closing sales entry" });
  }
}
