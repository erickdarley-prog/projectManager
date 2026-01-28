const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // nome original do arquivo
    type: { type: String, required: true }, // MIME type
    size: { type: Number, required: true }, // bytes
    path: { type: String, required: true }, // caminho salvo no disco
    uploadedAt: { type: Date, default: Date.now }, // data de upload
  },
  { timestamps: false }
);

module.exports = mongoose.model('File', fileSchema);
