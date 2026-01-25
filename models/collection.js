const { Schema, model } = require('mongoose');
const { timestamps } = require('../utils/data');

const CollectionSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true, default: '' },
    banner: { type: Object, default: {} },
    status: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    slug: { type: String, required: true, unique: true, trim: true },
  },
  timestamps,
);

module.exports = model('Collection', CollectionSchema);
