const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors");
//const server = require("http").Server(app);
//const io = require("socket.io")(server);

const HTTPS_PORT = 8443; //default port for https is 443
const HTTP_PORT = 8001; //default port for http is 80

const fs = require("fs");
const http = require("http");
const https = require("https");
const WebSocket = require("ws");
// based on examples at https://www.npmjs.com/package/ws
const WebSocketServer = WebSocket.Server;

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const roomRoutes = require("./routes/room");
const errorHandler = require("./controllers/error");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: process.env.PASS_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Connect DB
const User = require("./models/User");
connectDB();

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/home", function (req, res) {
  if (req.isAuthenticated()) {
    const newname = req.user.name;
    res.render("home", { newname: newname });
  } else res.render("home", { newname: "" });
});

app.get("/cubicle", function (req, res) {
  res.render("cubicle");
});

app.use("/auth", authRoutes);
app.use("/room", roomRoutes);

app.use(function (req, res, next) {
  let err = new Error("Not Found");
  err.status = 404;
  next(err);
});

app.use(errorHandler);

let PORT = process.env.PORT || 4000;
const server = app.listen(PORT, function () {
  console.log(`Server started on port ${PORT}`);
});

function noop() {}

function heartbeat() {
  this.isAlive = true;
}

const wss = new WebSocketServer({ server: server });

wss.on("connection", function (ws) {
  ws.isAlive = true;
  ws.on("pong", heartbeat);
  ws.on("message", function (message) {
    // Broadcast any received message to all clients
    console.log("received: %s", message);
    wss.broadcast(message);
  });

  ws.on("error", () => ws.terminate());
});
const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();

    ws.isAlive = false;
    ws.ping(noop);
  });
}, 30000);

wss.broadcast = function (data) {
  console.log(this.clients.size);
  this.clients.forEach(function (client) {
    console.log("hi");
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

console.log("Server running.");
