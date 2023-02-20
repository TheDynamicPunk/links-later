const mongoose = require("mongoose");

const BlacklistAuthTokenSchema = new mongoose.Schema({
  blacklistedAuthToken: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  creationDate: Date,
});

module.exports = mongoose.model('BlacklistAuthToken', BlacklistAuthTokenSchema);
