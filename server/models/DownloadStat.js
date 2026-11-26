const mongoose = require('mongoose');

const downloadStatSchema = new mongoose.Schema({
    _id: { type: String, default: 'ea-file' },
    count: { type: Number, default: 0, min: 0 },
    lastDownloadedAt: { type: Date, default: null }
}, { versionKey: false });

module.exports = mongoose.model('DownloadStat', downloadStatSchema);
