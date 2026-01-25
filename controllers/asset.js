const { response } = require('express');
const Asset = require('../models/asset');
const Collection = require('../models/collection');
const { deleteAsset, uploadAsset } = require('../middlewares/cloudinary');
const fs = require('fs');

const isVideoMime = (m) => typeof m === 'string' && m.toLowerCase().startsWith('video/');
const isImageMime = (m) => typeof m === 'string' && m.toLowerCase().startsWith('image/');

const create_asset = async (req, res = response) => {
  try {
    const data = req.body;
    let fileInfo = {};

    if (!req.files?.file) {
      return res.status(400).json({ msg: 'Debe adjuntar un archivo.' });
    }

    const file = req.files.file;
    const mime = file.mimetype;

    if (data.type === 'video') {
      if (!isVideoMime(mime)) return res.status(400).json({ msg: 'Solo se permite video.' });
    } else {
      if (!isImageMime(mime)) return res.status(400).json({ msg: 'Solo se permite imagen.' });
    }

    const tempFilePath = file.tempFilePath;
    const folder = `collections/${data.collectionId}/gallery`;
    const resourceType = data.type === 'video' ? 'video' : 'image';

    fileInfo = await uploadAsset(tempFilePath, folder, resourceType);
    fs.unlinkSync(tempFilePath);

    const asset = new Asset({
      ...data,
      file: fileInfo,
    });

    const saved = await asset.save();
    return res.json(saved);
  } catch (err) {
    return res.status(500).json({ msg: err?.message });
  }
};

const update_asset = async (req, res = response) => {
  try {
    const data = req.body;
    const id = data._id || req.params.id;

    const asset = await Asset.findById(id);
    if (!asset) return res.status(404).json({ msg: 'Asset no encontrado.' });

    if (data.file && typeof data.file === 'string') {
      data.file = JSON.parse(data.file);
    }

    if (req.files?.file) {
      const file = req.files.file;
      const mime = file.mimetype;
      const type = String(data.type || asset.type || '');

      if (type === 'video') {
        if (!isVideoMime(mime)) return res.status(400).json({ msg: 'Solo se permite video.' });
      } else {
        if (!isImageMime(mime)) return res.status(400).json({ msg: 'Solo se permite imagen.' });
      }

      if (asset.file?.public_id) {
        const oldResourceType = asset.file?.resource_type || (asset.type === 'video' ? 'video' : 'image');
        await deleteAsset(asset.file.public_id, oldResourceType);
      }

      const tempFilePath = file.tempFilePath;
      const folder = `collections/${data.collectionId || asset.collectionId}/gallery`;
      const resourceType = type === 'video' ? 'video' : 'image';

      const fileInfo = await uploadAsset(tempFilePath, folder, resourceType);
      fs.unlinkSync(tempFilePath);

      data.file = fileInfo;
      data.type = type;
    }

    Object.assign(asset, data);

    const updated = await asset.save();
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ msg: err?.message });
  }
};

const read_assets = async (req, res = response) => {
  try {
    const { collectionId, type, status } = req.query;

    const q = {};
    if (collectionId) q.collectionId = collectionId;
    if (type) q.type = type;
    if (typeof status !== 'undefined') q.status = String(status) === 'true';

    const assets = await Asset.find(q).sort({ order: 1 });
    return res.json(assets);
  } catch (err) {
    return res.status(500).json({ msg: err?.message });
  }
};

const get_asset = async (req, res = response) => {
  try {
    const id = req.params.id;
    const asset = await Asset.findById(id);
    if (!asset) return res.status(404).json({ msg: 'Asset no encontrado.' });
    return res.json(asset);
  } catch (err) {
    return res.status(500).json({ msg: err?.message });
  }
};

const getGallery = async (req, res = response) => {
  try {
    const { gallery } = req.query;

    if (!gallery || typeof gallery !== 'string') {
      return res.status(400).json({ msg: 'Slug requerido' });
    }

    const collection = await Collection.findOne({
      slug: gallery,
      status: true,
    }).select('title subtitle banner');

    if (!collection) {
      return res.status(404).json({ msg: 'Galería no encontrada' });
    }

    const assets = await Asset.find({
      collectionId: collection._id,
      status: true,
    })
      .sort({ order: 1, _id: 1 })
      .select('title file type order');

    const result = {
      title: collection.title,
      description: collection.subtitle,
      banner: collection.banner?.secure_url || null,
      resources: assets.map((a) => ({
        title: a.title || '',
        type: a.type,
        url: a.file?.secure_url || a.file?.url || null,
      })),
    };

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ msg: err?.message });
  }
};

const delete_asset = async (req, res = response) => {
  try {
    const id = req.params.id;
    const reg = await Asset.findByIdAndDelete(id, { new: true });
    if (!reg) return res.status(404).json({ msg: 'Asset no encontrado.' });

    if (reg?.file?.public_id) {
      const resourceType = reg.file?.resource_type || (reg.type === 'video' ? 'video' : 'image');
      await deleteAsset(reg.file.public_id, resourceType);
    }

    return res.json(true);
  } catch (err) {
    return res.status(500).json({ msg: err?.message });
  }
};

const update_assets_order = async (req, res = response) => {
  try {
    const { collectionId, items } = req.body;

    if (!collectionId) return res.status(400).json({ msg: 'collectionId requerido.' });
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ msg: 'Items inválidos.' });

    const bulk = items.map((x) => ({
      updateOne: {
        filter: { _id: x._id, collectionId },
        update: { $set: { order: x.order } },
      },
    }));

    await Asset.bulkWrite(bulk, { ordered: true });

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ msg: err?.message });
  }
};

module.exports = {
  create_asset,
  get_asset,
  read_assets,
  update_asset,
  delete_asset,
  update_assets_order,
  getGallery,
};
