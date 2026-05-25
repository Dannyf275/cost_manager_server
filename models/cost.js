const mongoose = require('mongoose');

/*
 * Schema definition for the 'costs' collection.
 * Maps description, category, userid, sum, and the date the cost was created.
 */
const costSchema = new mongoose.Schema({ // Updated to camelCase
    // Description of the cost item
    description: { 
        type: String, 
        required: true 
    },
    // Category must be one of the specified allowed values
    category: { 
        type: String, 
        required: true,
        enum: ['food', 'health', 'housing', 'sports', 'education']
    },
    // The ID of the user who made the cost
    userid: { 
        type: Number, 
        required: true 
    },
    // The monetary sum of the cost
    sum: { 
        type: Number, 
        required: true 
    },
    // The date and time the cost item was created
    date: { 
        type: Date, 
        default: Date.now 
    }
}, { versionKey: false });

module.exports = mongoose.model('Cost', costSchema);