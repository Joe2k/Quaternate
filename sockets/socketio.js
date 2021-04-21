module.exports = function (server) {
  const socketio = require("socket.io");

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

    //handle the new message event
    socket.on("new_message", async (data) => {
      console.log("new message");
      console.log(data);
      io.sockets.emit("receive_message", data);

      let chatMessage = await Chat.create({
        message: data.message,
        sender: data.userId,
        room: data.roomId,
      });
    });
    socket.on("typing", (data) => {
      socket.broadcast.emit("typing", data);
    });
  });
};
