const mongoose = require('mongoose');

/*
 * Schema definition for the 'users' collection.
 * Maps the required properties: id, first_name, last_name, and birthday.
 * Disables the versionKey (__v) as it is not required in the output.
 */
const userSchema = new mongoose.Schema({ // Updated to camelCase
    // The specific user ID (different from MongoDB's _id)
    id: { 
        type: Number, 
        required: true, 
        unique: true 
    },
    // The user's first name
    first_name: { 
        type: String, 
        required: true 
    },
    // The user's last name
    last_name: { 
        type: String, 
        required: true 
    },
    // The user's date of birth
    birthday: { 
        type: Date, 
        required: true 
    }
}, { versionKey: false });

module.exports = mongoose.model('User', userSchema);