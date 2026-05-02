const mongoose = require('mongoose');

/*
 * Schema definition for the 'logs' collection.
 * Used by the Pino logger utility to store HTTP request logs and endpoint access.
 */
const log_schema = new mongoose.Schema({
    // The HTTP method (GET, POST, etc.)
    method: String,
    // The URL endpoint accessed
    url: String,
    // A descriptive message from Pino
    message: String,
    // The timestamp of the log entry
    timestamp: { 
        type: Date, 
        default: Date.now 
    }
}, { versionKey: false });

module.exports = mongoose.model('Log', log_schema);