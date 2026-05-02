const mongoose = require('mongoose');

// Schema to store previously computed reports
const reportSchema = new mongoose.Schema({
    userid: Number,
    year: Number,
    month: Number,
    costs: Array // Stores the grouped JSON structure
}, { versionKey: false });

module.exports = mongoose.model('Report', reportSchema);