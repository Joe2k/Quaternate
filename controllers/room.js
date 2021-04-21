const User = require("../models/User");
const Room = require("../models/Room");
const mongoose = require("mongoose");

exports.getRoomPage = function (req, res, next) {
  if (req.isAuthenticated()) {
    //console.log(req.user);
    User.findById(req.user._id)
      .populate("rooms")
      .exec(function (err, user) {
        if (err) return next(err);
        console.log(user);
        res.render("hall", { user });
      });
  } else {
    res.redirect("/auth/login");
  }
};

exports.postCreateRoom = async function (req, res, next) {
  if (req.isAuthenticated()) {
    try {
      console.log(req.user);
      const user = await User.findById(req.user._id);
      console.log(user);
      const room = await Room.create({
        roomName: req.body.roomName,
        password: req.body.password,
        members: [user._id],
      });
      console.log(room);
      const newuser = await User.findByIdAndUpdate(req.user._id, {
        $push: { rooms: room._id },
      });
      console.log(newuser);
      res.redirect("/cubicle/hall");
    } catch (e) {
      return next(e);
    }
  } else {
    return res.redirect("/cubicle/hall");
  }
};

exports.postJoinRoom = async function (req, res, next) {
  if (req.isAuthenticated()) {
    try {
      const room = await Room.findOne({ roomName: req.body.roomName });
      console.log(room);
      function checkIfThere(id) {
        return String(id.valueOf()) == String(req.user._id.valueOf());
      }
      const result = room.members.find(checkIfThere);
      if (room.password === req.body.password && result === undefined) {
        room.members.push(req.user._id);
        room.save();
        const newuser = await User.findByIdAndUpdate(req.user._id, {
          $push: { rooms: room._id },
        });
        return res.redirect("/cubicle/hall");
      } else {
        return res.redirect("/cubicle/hall");
      }
    } catch (e) {
      return next(e);
    }
  } else {
    return res.redirect("/cubicle/hall");
  }
};

exports.getCubicle = async function (req, res, next) {
  if (req.isAuthenticated()) {
    const userName = req.user.name;
    const userId = req.user._id;
    const roomId = req.params.id;
    const room = await Room.findById(roomId);
    const user = await User.findById(req.user._id);
    res.render("cubicle", { userName, roomId, room, userId, user });
  } else {
    res.redirect("/home");
  }
};
