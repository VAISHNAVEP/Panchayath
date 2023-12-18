const mongoose = require('mongoose');


const UsercomplaintSchema = new mongoose.Schema({
  aadhar: {
    type: Number,
    required: true,
  },
  complaint: {
    type: String,
    required: true,
  },
  image: {
    type: Buffer,
    required:true,
  },
  name: {
    type: String,
    required:true,
  },
  email: {
    type: String,
    required:true,
  },
  phonenumber: {
    type: Number,
    required:true,
  },
});

const ComplaintModel = mongoose.model('Complaint', UsercomplaintSchema);

module.exports = ComplaintModel;
