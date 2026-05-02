const pino = require('pino');
const Log = require('../models/log');

/*
 * Custom Pino stream implementation.
 * Catches Pino log outputs and saves them directly to the MongoDB 'logs' collection.
 */
const stream = {
    write: (msg) => {
        // [NEW CHANGE] Bypass database logging completely if we are running unit tests
        // This prevents the "MongoExpiredSessionError" race condition.
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        try {
            // Parse the JSON string provided by Pino
            const log_entry = JSON.parse(msg);
            
            // Create a new Log document
            const new_log = new Log({
                method: log_entry.method || 'SYSTEM',
                url: log_entry.url || 'N/A',
                message: log_entry.msg,
                timestamp: new Date(log_entry.time)
            });
            
            // Save the log to MongoDB asynchronously
            new_log.save().catch(err => console.error('Log save error:', err));
        } catch (e) {
            console.error('Pino stream parsing error:', e);
        }
    }
};

// Initialize Pino with the custom MongoDB write stream
const logger = pino({ level: 'info' }, stream);

module.exports = logger;