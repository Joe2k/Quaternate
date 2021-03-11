const express = require("express");
const router = express.Router();
const { getLogin } = require("../controllers/auth");

router.get("/login", getLogin);
router.get("/register");
router.post("/login");
router.post("/register");

module.exports = router;
