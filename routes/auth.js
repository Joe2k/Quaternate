const express = require("express");
const router = express.Router();
const {
  getLogin,
  postLogin,
  getRegister,
  postRegister,
} = require("../controllers/auth");

router.get("/login", getLogin);
router.get("/register", getRegister);
router.post("/login", postLogin);
router.post("/register", postRegister);

module.exports = router;
