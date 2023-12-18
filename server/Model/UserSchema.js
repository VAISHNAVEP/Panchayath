const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: String,
    email: String,
    phonenumber: Number,
    password: String,
    blocked: {
        type: Boolean,
        default: false, 
    },
});

const UserModel = mongoose.model('users', UserSchema);
module.exports = UserModel;
