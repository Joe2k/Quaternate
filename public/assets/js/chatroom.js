(function connect() {
  let socket = io.connect("https://quaternate.herokuapp.com");

  let username = document.querySelector("#username");
  let usernameBtn = document.querySelector("#usernameBtn");
  let curUsername = document.querySelector(".card-header");
  let message = document.querySelector("#message");
  let messageBtn = document.querySelector("#messageBtn");
  let messageList = document.querySelector("#message-list");
  let roomId = $("#roomId").value;

  messageBtn.addEventListener("click", (e) => {
    let roomId = $("#roomId")[0].value;
    let userId = $("#userId")[0].value;
    let userName = $("#userName")[0].value;
    console.log(message.value);
    console.log(roomId);
    socket.emit("new_message", {
      message: message.value,
      roomId: roomId,
      userId: userId,
      userName: userName,
    });
    message.value = "";
  });
  socket.on("receive_message", (data) => {
    let roomId = $("#roomId")[0].value;
    if (roomId === data.roomId) {
      let listItem = document.createElement("li");
      listItem.textContent = data.userName + ": " + data.message;
      listItem.classList.add("list-group-item");
      messageList.appendChild(listItem);
    }
    //console.log(data.data.userName);
  });

  let info = document.querySelector(".info");

  message.addEventListener("keypress", (e) => {
    let roomId = $("#roomId")[0].value;
    let userId = $("#userId")[0].value;
    let userName = $("#userName")[0].value;
    socket.emit("typing", { roomId, userName });
  });

  socket.on("typing", (data) => {
    let roomId = $("#roomId")[0].value;
    if (roomId === data.roomId) {
      info.textContent = data.userName + " is typing...";
      setTimeout(() => {
        info.textContent = "";
      }, 5000);
    }
  });
})();

// fetching initial chat messages from the database
(function () {
  let roomId = $("#roomId")[0].value;
  fetch("/api/chat/" + roomId)
    .then((data) => {
      return data.json();
    })
    .then((json) => {
      json.map((data) => {
        console.log(data);
        // let li = document.createElement("li");
        let messages = document.getElementById("message-list");
        let span = document.createElement("span");
        messages
          .appendChild(span)
          .append(data.sender.name + ": : " + data.message);
        // messages.appendChild(li).append(data.message);
      });
    });
})();
// (function() {
//     $("form").submit(function(e) {
//         let  li  =  document.createElement("li");
//         e.preventDefault(); // prevents page reloading
//         socket.emit("chat message", $("#message").val());
//         messages.appendChild(li).append($("#message").val());
//         let  span  =  document.createElement("span");
//         messages.appendChild(span).append("by "  +  "Anonymous"  +  ": "  +  "just now");
//         $("#message").val("");
//     return  false;

//     });
//     })();
