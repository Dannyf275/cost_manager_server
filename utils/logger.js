const pino = require('pino');
const Log = require('../models/log');

/*
 * Custom Pino stream implementation.
 * Catches Pino log outputs and saves them directly to the MongoDB 'logs' collection.
 */
const stream = {
    write: (msg) => {
        // Bypass database logging completely if we are running unit tests
        // This prevents the "MongoExpiredSessionError" race condition.
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        try {
            // Parse the JSON string provided by Pino
            const logEntry = JSON.parse(msg);
            
            // Create a new Log document
            const newLog = new Log({
                method: logEntry.method || 'SYSTEM',
                url: logEntry.url || 'N/A',
                message: logEntry.msg,
                timestamp: new Date(logEntry.time)
            });
            
            // Save the log to MongoDB asynchronously
            newLog.save().catch(err => console.error('Log save error:', err));
        } catch (e) {
            console.error('Pino stream parsing error:', e);
        }
    }
};

// Initialize Pino with the custom MongoDB write stream
const logger = pino({ level: 'info' }, stream);

module.exports = logger;