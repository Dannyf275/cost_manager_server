const mongoose = require('mongoose');
const logger = require('./logger');

/*
 * Establishes a connection to the MongoDB Atlas database.
 * Uses the connection string from the .env file.
 */
const connectDb = async () => {
    try {
        // Attempt to connect to the database
        await mongoose.connect(process.env.MONGODB_URI);
        // Log the successful connection
        logger.info({ msg: 'Connected to MongoDB Atlas successfully' });
    } catch (error) {
        // Log the error if connection fails
        logger.error({ msg: `MongoDB connection error: ${error.message}` });
        process.exit(1);
    }
};

module.exports = connectDb;