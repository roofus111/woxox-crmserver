const UserProfile = require('../models/User');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const { S3 } = require("@aws-sdk/client-s3");
const s3Client = require("../config/s3");
const multer = require('multer');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});


// Get all profiles within the user's company
exports.getAllProfiles = async (req, res) => {
  try {
    const profiles = await UserProfile.find({ company: req.user.company._id });
    res.status(200).json(profiles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new user profile
exports.createProfile = async (req, res) => {
  console.log(req.body);
  
  const userProfile = new UserProfile({
    ...req.body,
    company: req.user.company._id
  });

  try {
    const newProfile = await userProfile.save();
    res.status(201).json(newProfile);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getProfileById = async (req, res) => {
  try {
    const { userid } = req.params;
    const profile = await UserProfile.findOne({ 
      _id: userid, 
      company: req.user.company._id 
    });
    
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Controller to update profile by ID
exports.updateProfileById = async (req, res) => {
  try {
    const { userid } = req.params;
    const updates = req.body; // Get the updated fields from the request body

    // Check if the profile exists
    const profile = await UserProfile.findOne({ 
      _id: userid, 
      company: req.user.company._id 
    });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // Update the profile
    Object.keys(updates).forEach((key) => {
      profile[key] = updates[key];
    });

    // Save the updated profile
    await profile.save();

    res.status(200).json({ message: "Profile updated successfully", profile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Toggle user activity
exports.toggleUserStatus = async (req, res) => {
  const { userId } = req.params; // Assuming the userId is passed as a route parameter
  const { isActive } = req.body; // The new status is sent in the request body

  if (typeof isActive !== "boolean") {
    return res.status(400).json({ message: "Invalid isActive value. Must be true or false." });
  }

  try {
    const user = await UserProfile.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.isActive = isActive;
    await user.save();

    res.status(200).json({
      message: `User is now ${isActive ? "active" : "inactive"}.`,
      user: { id: user._id, isActive: user.isActive },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error toggling user status.", error });
  }
};

// Controller to fetch active user details
exports.getPublicUsers = async (req, res) => {
  try {
    // Fetch all active users
    const activeUsers = await UserProfile.find({ company:req.user.company._id,isActive: true }).select(
      "email name firstName lastName phone role company createdAt"
    ).populate('company', 'name'); // Populate company name if needed

    // Respond with active users
    res.status(200).json({
      success: true,
      data: activeUsers,
    });
  } catch (error) {
    // Handle errors
    res.status(500).json({
      success: false,
      message: "Failed to fetch active users",
      error: error.message,
    });
  }
};

exports.uploadProfileImage = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await UserProfile.findById(req.user._id).session(session);
    
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'User not found' });
    }

    // Handle profile image upload to S3
    if (req.file && req.file.buffer) {
      try {
        const fileName = `${uuidv4()}-${req.file.originalname}`;
        const params = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `user-images/${fileName}`,
          Body: req.file.buffer,
          ContentType: req.file.mimetype
        };

        const uploadResult = await s3.upload(params).promise();

        // Update the user's profile image
        user.profileImage = {
          fileName: fileName,
          fileType: req.file.mimetype,
          fileUrl: uploadResult.Location
        };

        await user.save({ session });
        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ message: 'Profile image uploaded successfully', profileImage: user.profileImage });
      } catch (uploadError) {
        console.error('Error uploading file to S3:', uploadError);
        await session.abortTransaction();
        return res.status(500).json({ 
          message: 'Error uploading file to S3', 
          error: uploadError.message 
        });
      }
    } else {
      await session.abortTransaction();
      return res.status(400).json({ message: 'No file uploaded' });
    }
  } catch (err) {
    await session.abortTransaction();
      session.endSession();
      console.error('Error uploading user image:', err.message);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

exports.getUserImage = async (req, res) => {
  try {
    const id = req.user._id;
    const fileRecord = await UserProfile.findById(id);
    
    if (!fileRecord) {
      return res.status(404).json({ error: "File not found" });
    }

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `user-images/${fileRecord.profileImage.fileName}`, // Update path based on actual file structure
    };

    // Create an instance of S3 client
    const s3 = new S3({ client: s3Client });

    // Get the file from S3
    const data = await s3.getObject(params);

    // Set the response headers
    res.setHeader("Content-Type", fileRecord.profileImage.fileType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileRecord.profileImage.fileName}"` // Use docName but keep original file extension
    );

    // Pipe the data to the response
    data.Body.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: error.message });
  }
};
// Remove user profile image
exports.removeUserImage = async (req, res) => {
  try {
    const user = await UserProfile.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.profileImage || !user.profileImage.fileUrl) {
      return res.status(400).json({ message: 'User has no profile image' });
    }

    // Get the S3 key from the file URL
    const key = user.profileImage.fileUrl.split('.com/')[1];

    // Delete the file from S3
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    };
    
    await s3.deleteObject(params).promise();

    // Remove the profile image from the company document
    user.profileImage = null;
    await user.save();

    res.status(200).json({ message: 'User profile image removed successfully' });
  } catch (error) {
    console.error('Error removing user profile image:', error);
    res.status(500).json({ 
        message: 'Error removing user profile image', 
      error: error.message 
    });
  }
};











