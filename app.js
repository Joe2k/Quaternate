const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const roomRoutes = require("./routes/room");
const chatRoutes = require("./routes/chat");
const errorHandler = require("./controllers/error");

const app = express();

app.use(bodyParser.json());

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

// Passport setup
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/home", (req, res) => {
  if (req.isAuthenticated()) {
    const newname = req.user.name;
    res.render("home", { newname: newname });
  } else res.render("home", { newname: "" });
});

//routes
app.use("/api", chatRoutes);
app.use("/auth", authRoutes);
app.use("/cubicle", roomRoutes);

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

require("./sockets/wss");
require("./sockets/socketio")(server);
