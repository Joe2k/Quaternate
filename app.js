const express = require("express");

const app = express();

app.set("view engine", "ejs");

app.get("/", function (req, res) {
  res.render("home");
});

let PORT = process.env.PORT || 4000;
app.listen(PORT, function () {
  console.log(`Server started on port ${PORT}`);
});
