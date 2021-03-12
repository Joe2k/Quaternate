const express = require("express");
const socketio = require("socket.io");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors");
//const server = require("http").Server(app);
//const io = require("socket.io")(server);
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const errorHandler = require("./controllers/error");

const app = express();
const  chatRouter  = require("./routes/chat");

app.use(bodyParser.json());
//routes
app.use("/chats", chatRouter);



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
const  Chat  = require("./models/Chat");
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
app.get("/chat", function (req, res) {
  // if (req.isAuthenticated()) {
  //   const newname = req.user.name;
  //   res.render("chat", { newname: newname });
  // } else 
    res.render("chat", { newname: "" });
});


app.use("/auth", authRoutes);

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

const io = socketio(server)
io.on('connection', socket => {
    console.log("New user connected")

    socket.username = "Anonymous"

    socket.on('change_username', data => {
        socket.username = data.username
    })
    //handle the new message event
    socket.on('new_message', data => {
        console.log("new message")
        io.sockets.emit('receive_message', {message: data.message, username: socket.username})
        // connect.then(db  =>  {
        //   console.log("connected correctly to the server");
        
          let  chatMessage  =  new Chat({ message: data.message, sender: socket.username});
          chatMessage.save();
          // });
    })
    socket.on('typing', data => {
        socket.broadcast.emit('typing', {username: socket.username})
    })
    // socket.on
    // let  chatMessage  =  new Chat({ message: msg, sender: "Anonymous"});
    // chatMessage.save();
})
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