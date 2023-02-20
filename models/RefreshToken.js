const mongoose = require("mongoose");
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');

const RefreshTokenSchema = new mongoose.Schema({
  token: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  expireTimestamp: Number,
});

RefreshTokenSchema.statics.createToken = async function (user) {

  console.log(`Creating refresh token for username: ${user.username}`);

  let _token = uuidv4();

  let _object = new this({
    token: _token,
    user: user._id,
    expireTimestamp: Date.now() + parseInt(process.env.REFRESH_TOKEN_TTL)
  });

  console.log(_object);

  let refreshToken = await _object.save();

  return refreshToken.token;
};

RefreshTokenSchema.statics.extendExpiry = async function (tokenObject) {
  await this.updateOne({_id: tokenObject._id}, {expireTimestamp: Date.now() + parseInt(process.env.REFRESH_TOKEN_TTL)});
}

RefreshTokenSchema.statics.verifyExpiration = (tokenObject) => {
  return tokenObject.expireTimestamp < Date.now();
}

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);
