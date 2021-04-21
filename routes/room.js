const express = require("express");
const router = express.Router();
const {
  getRoomPage,
  postCreateRoom,
  getCubicle,
  postJoinRoom,
} = require("../controllers/room");

router.get("/hall", getRoomPage);
router.post("/create", postCreateRoom);
router.post("/join", postJoinRoom);
router.get("/:id", getCubicle);

module.exports = router;
