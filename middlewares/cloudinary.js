const cloudinary = require('cloudinary').v2;
const fileUpload = require('express-fileupload');
const os = require('os');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
  secure: true,
});

const tempUpload = fileUpload({
  useTempFiles: true,
  tempFileDir: os.tmpdir(),
});

const uploadAsset = async (filePath, folder = 'resources', resourceType = 'image') => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: resourceType,
  });

  return {
    public_id: result.public_id,
    secure_url: result.secure_url,
    resource_type: result.resource_type || resourceType,
  };
};

const deleteAsset = async (publicId, resourceType = 'image') => {
  return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

module.exports = {
  tempUpload,
  uploadAsset,
  deleteAsset,
};
