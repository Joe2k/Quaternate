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

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const roomRoutes = require("./routes/room");
const errorHandler = require("./controllers/error");

// h
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

app.get("/home", (req, res) => {
  if (req.isAuthenticated()) {
    const newname = req.user.name;
    res.render("home", { newname: newname });
  } else res.render("home", { newname: "" });
});
app.get("/chat/:id", async (req, res) => {
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
app.get("/duo/:id", async (req, res) => {
  if (req.isAuthenticated()) {
    const userName = req.user.name;
    const userId = req.user._id;
    const roomId = req.params.id;
    const room = await Room.findById(roomId);
    const user = await User.findById(req.user._id);
    res.render("duo", { userName, roomId, room, userId, user });
  } else {
    res.redirect("/home");
  }
});

app.get("/cubicle", (req, res) => {
  res.render("cubicle");
});

app.use("/auth", authRoutes);
app.use("/room", roomRoutes);

app.get("/", (req, res) => res.redirect("/home"));

app.use((req, res, next) => {
  let err = new Error("Not Found");
  err.status = 404;
  next(err);
});

app.use(errorHandler);

let PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

if (process.env.PROD === "local") {
  const WebSocket = require("ws");
  // based on examples at https://www.npmjs.com/package/ws
  const WebSocketServer = WebSocket.Server;

  const app2 = express();

  function noop() {}

  function heartbeat() {
    this.isAlive = true;
  }
  let PORT = process.env.PORT || 4050;

  const server2 = app2.listen(PORT, () => {
    console.log(`wss running on ${PORT}`);
  });

  const wss = new WebSocketServer({ server: server2 });

  wss.on("connection", (ws) => {
    ws.isAlive = true;
    ws.on("pong", heartbeat);
    ws.on("message", (message) => {
      // Broadcast any received message to all clients
      console.log("received: %s", message);
      wss.broadcast(message);
    });

    ws.on("error", () => ws.terminate());
  });
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();

      ws.isAlive = false;
      ws.ping(noop);
    });
  }, 30000);

  wss.broadcast = function (data) {
    console.log(this.clients.size);
    this.clients.forEach((client) => {
      console.log("hi");
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  };
}

// httpServer = http.createServer();
// httpServer.listen(4050, () => {
//   console.log("listening on *:3000");
// });
var line_history = [];
const io = socketio(server);
io.on("connection", (socket) => {
  console.log("New user connected");

  for (var i in line_history) {
    socket.emit("draw_line", line_history[i]);
  }

  socket.on("draw_line", (data) => {
    // add received line to history
    line_history.push(data);
    console.log(data);
    // send line to all clients
    io.emit("draw_line", data);
  });

  socket.on("delete-jam", (data) => {
    // add received line to history
    console.log(data);
    line_history = line_history.filter((line) => {
      return line.roomId != data.roomId;
    });
    // send line to all clients
    io.emit("delete-jam", data);
  });

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
