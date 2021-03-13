const express = require("express");
const connectdb = require("../config/db");
const Chats = require("../models/Chat");

const router = express.Router();

router.get("/chat/:roomId", (req, res, next) => {
  console.log("hi");
  Chats.find({})
    .populate("sender")
    .then((chat) => {
      chat = chat.filter((c) => {
        return String(c.room.valueOf()) === req.params.roomId;
      });
      console.log(chat);
      res.json(chat);
    });
});

module.exports = router;
