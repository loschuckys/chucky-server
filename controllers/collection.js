const { response } = require('express');
const Collection = require('../models/collection');
const Asset = require('../models/asset');
const { deleteAsset, uploadAsset } = require('../middlewares/cloudinary');
const fs = require('fs');

const create_collection = async (req, res = response) => {
  try {
    const data = req.body;

    const collection = new Collection({
      ...data,
      banner: {},
    });

    const saved = await collection.save();

    let bannerInfo = {};
    if (req.files?.banner) {
      const file = req.files.banner;
      const tempFilePath = file.tempFilePath;
      const folder = `collections/${saved._id}`;
      bannerInfo = await uploadAsset(tempFilePath, folder, 'image');
      fs.unlinkSync(tempFilePath);

      saved.banner = bannerInfo;
      await saved.save();
    }

    return res.json(saved);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({ msg: 'El slug ya existe.' });
    }
    return res.status(500).json({ msg: err?.message });
  }
};

const update_collection = async (req, res = response) => {
  try {
    const data = req.body;
    const id = data._id || req.params.id;

    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({ msg: 'Collection no encontrada.' });
    }

    if (req.files?.banner) {
      const file = req.files.banner;

      if (collection.banner?.public_id) {
        const resourceType = collection.banner?.resource_type || 'image';
        await deleteAsset(collection.banner.public_id, resourceType);
      }

      const tempFilePath = file.tempFilePath;
      const folder = `collections/${collection._id}`;

      const bannerInfo = await uploadAsset(tempFilePath, folder, 'image');
      fs.unlinkSync(tempFilePath);

      data.banner = bannerInfo;
    }

    Object.assign(collection, data);

    const updated = await collection.save();
    return res.json(updated);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({ msg: 'El slug ya existe.' });
    }
    return res.status(500).json({ msg: err?.message });
  }
};

const read_collections = async (req, res = response) => {
  try {
    const collections = await Collection.find().sort({ order: 1 });
    return res.json(collections);
  } catch (err) {
    return res.status(500).json({ msg: err?.message });
  }
};

  const getCollections = async (req, res = response) => {
    try {
      const collections = await Collection.find({ status: true }).sort({ order: 1 }).select('title subtitle slug banner');

      const result = collections.map((item) => ({
        title: item.title,
        subtitle: item.subtitle,
        slug: item.slug,
        image: item.banner?.secure_url || null,
      }));

      return res.json(result);
    } catch (err) {
      return res.status(500).json({ msg: err?.message });
    }
  };

const get_collection = async (req, res = response) => {
  try {
    const id = req.params.id;
    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({ msg: 'Collection no encontrada.' });
    }
    return res.json(collection);
  } catch (err) {
    return res.status(500).json({ msg: err?.message });
  }
};

const delete_collection = async (req, res = response) => {
  try {
    const id = req.params.id;

    const assetsCount = await Asset.countDocuments({ collectionId: id });
    if (assetsCount > 0) {
      return res.status(400).json({
        msg: 'No se puede eliminar esta colección porque tiene recursos en su galería.',
      });
    }

    const reg = await Collection.findByIdAndDelete(id, { new: true });
    if (!reg) {
      return res.status(404).json({ msg: 'Collection no encontrada.' });
    }

    if (reg?.banner?.public_id) {
      const resourceType = reg.banner?.resource_type || 'image';
      await deleteAsset(reg.banner.public_id, resourceType);
    }

    return res.json(true);
  } catch (err) {
    return res.status(500).json({ msg: err?.message });
  }
};

const update_collections_order = async (req, res = response) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ msg: 'Items inválidos.' });
    }

    const bulk = items.map((x) => ({
      updateOne: {
        filter: { _id: x._id },
        update: { $set: { order: x.order } },
      },
    }));

    await Collection.bulkWrite(bulk, { ordered: true });

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ msg: err?.message });
  }
};

module.exports = {
  create_collection,
  get_collection,
  read_collections,
  update_collection,
  delete_collection,
  update_collections_order,
  getCollections,
};
