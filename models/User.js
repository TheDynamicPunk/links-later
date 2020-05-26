const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        max: 25,
        min: 6
    },
    email: {
        type: String,
        required: true,
        max: 50,
    },
    password: {
        type: String,
        required: true,
        max: 20,
        min: 6
    },
    dateCreated: {
        type: Date,
        default: Date.now()
    },
    lastUpdated: {
        type: Date,
        default: Date.now()
    },
    storedLinks: [{
        url: { type: String },
        dateAdded: { type: Date, default: Date.now() }
    }]
});

module.exports = mongoose.model('User', userSchema);