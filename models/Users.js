const mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);
const Schema = mongoose.Schema;

const userObj = {
  socketId: { type: String },
  handle: { type: String },
  roomName: { type: String, ref: "Room" },
};

const userSchema = new Schema(userObj, { timestamps: true });
const User = mongoose.model("user", userSchema);

module.exports = User;
