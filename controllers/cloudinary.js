const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
  secure: true,
});

const get_signature = async (req, res) => {
  const { folder, public_id } = req.body || {};
  const timestamp = Math.floor(Date.now() / 1000);

  const paramsToSign = {
    folder: String(folder || 'resources'),
    timestamp,
  };

  if (public_id) paramsToSign.public_id = String(public_id);

  const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUD_API_SECRET);

  return res.json({
    cloudName: process.env.CLOUD_NAME,
    apiKey: process.env.CLOUD_API_KEY,
    timestamp,
    folder: paramsToSign.folder,
    signature,
    public_id: paramsToSign.public_id || null,
  });
};

module.exports = { get_signature };
