if (process.env.PROD === "local") {
  const WebSocket = require("ws");
  const express = require("express");
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
