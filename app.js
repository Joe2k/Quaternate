const express = require("express");

const app = express();

app.get("/", function (req, res) {
  res.send("Hi");
});

let PORT = process.env.PORT || 4000;
app.listen(PORT, function () {
  console.log(`Server started on port ${PORT}`);
});
