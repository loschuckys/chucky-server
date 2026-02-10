const { response } = require('express');
const Asset = require('../models/asset');
const Collection = require('../models/collection');
const { deleteAsset } = require('../middlewares/cloudinary');

const create_asset = async (req, res = response) => {
  try {
    const data = req.body;

    if (!data?.collectionId) return res.status(400).json({ msg: 'collectionId requerido.' });
    if (!data?.type) return res.status(400).json({ msg: 'type requerido.' });
    if (!data?.file?.public_id || !data?.file?.secure_url) {
      return res.status(400).json({ msg: 'file.public_id y file.secure_url requeridos.' });
    }

    const asset = new Asset({
      collectionId: data.collectionId,
      file: data.file,
      type: data.type,
      status: typeof data.status === 'boolean' ? data.status : String(data.status) === 'true',
      order: Number(data.order ?? 0),
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

    const nextType = String(data.type || asset.type || '');
    const nextFile = data.file;

    if (nextFile?.public_id && nextFile?.secure_url) {
      if (asset.file?.public_id && asset.file.public_id !== nextFile.public_id) {
        const oldResourceType = asset.file?.resource_type || (asset.type === 'video' ? 'video' : 'image');
        await deleteAsset(asset.file.public_id, oldResourceType);
      }
      asset.file = nextFile;
    }

    if (typeof data.collectionId !== 'undefined') asset.collectionId = data.collectionId;
    if (nextType) asset.type = nextType;

    if (typeof data.status !== 'undefined') {
      asset.status = typeof data.status === 'boolean' ? data.status : String(data.status) === 'true';
    }

    if (typeof data.order !== 'undefined') asset.order = Number(data.order);
    if (typeof data.link !== 'undefined') asset.link = data.link;

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
};
