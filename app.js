const express = require("express");
const socketio = require("socket.io");
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
const chatRoutes = require("./routes/chat");

app.use(bodyParser.json());
//routes
app.use("/api", chatRoutes);

app.set("view engine", "ejs");
app.use(cors());

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
const Chat = require("./models/Chat");
const User = require("./models/User");
const Room = require("./models/Room");
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
app.get("/chat/:id", async function (req, res) {
  if (req.isAuthenticated()) {
    const userName = req.user.name;
    const userId = req.user._id;
    const roomId = req.params.id;
    const room = await Room.findById(roomId);
    res.render("chat", { userName, roomId, room, userId });
  } else {
    res.redirect("/home");
  }
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

// const wss = new WebSocketServer({ server: server });

// wss.on("connection", function (ws) {
//   ws.isAlive = true;
//   ws.on("pong", heartbeat);
//   ws.on("message", function (message) {
//     // Broadcast any received message to all clients
//     console.log("received: %s", message);
//     wss.broadcast(message);
//   });

//   ws.on("error", () => ws.terminate());
// });
// const interval = setInterval(function ping() {
//   wss.clients.forEach(function each(ws) {
//     if (ws.isAlive === false) return ws.terminate();

//     ws.isAlive = false;
//     ws.ping(noop);
//   });
// }, 30000);

// wss.broadcast = function (data) {
//   console.log(this.clients.size);
//   this.clients.forEach(function (client) {
//     console.log("hi");
//     if (client.readyState === WebSocket.OPEN) {
//       client.send(data);
//     }
//   });
// };

// console.log("Server running.");

// httpServer = http.createServer();
// httpServer.listen(4050, () => {
//   console.log("listening on *:3000");
// });
const io = socketio(server);
io.on("connection", (socket) => {
  console.log("New user connected");

  //   socket.username = "Anonymous";

  //   socket.on("change_username", (data) => {
  //     socket.username = data.username;
  //   });
  //handle the new message event
  socket.on("new_message", async (data) => {
    console.log("new message");
    console.log(data);
    io.sockets.emit("receive_message", data);
    // connect.then(db  =>  {
    //   console.log("connected correctly to the server");

    let chatMessage = await Chat.create({
      message: data.message,
      sender: data.userId,
      room: data.roomId,
    });
    // });
  });
  socket.on("typing", (data) => {
    socket.broadcast.emit("typing", data);
  });
  // socket.on
  // let  chatMessage  =  new Chat({ message: msg, sender: "Anonymous"});
  // chatMessage.save();
});
// socket.on("connection", socket  =>  {
//   // console.log("user connected");
//   // socket.on("disconnect", function() {
//   // console.log("user disconnected");
//   // });
//   // socket.on("chat message", function(msg) {
//   //     console.log("message: "  +  msg);
//   //     //broadcast message to everyone in port:5000 except yourself.
//   // socket.broadcast.emit("received", { message: msg  });

//   //save chat to the database
//   // connect.then(db  =>  {
//   // console.log("connected correctly to the server");

//   // let  chatMessage  =  new Chat({ message: msg, sender: "Anonymous"});
//   // chatMessage.save();
//   // });
//   });
// });
