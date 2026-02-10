const { Schema, model } = require('mongoose');
const { timestamps } = require('../utils/data');

const AssetSchema = new Schema(
  {
    collectionId: { type: Schema.Types.ObjectId, ref: 'Collection', required: true },
    file: { type: Object, required: true },
    type: { type: String, enum: ['image', 'video'], required: true },
    link: { type: String, trim: true, default: '' },
    status: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  timestamps,
);

module.exports = model('Asset', AssetSchema);
