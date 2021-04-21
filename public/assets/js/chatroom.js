var scrolled = false;

function updateScroll() {
  if (!scrolled) {
    var element = document.getElementById("scrollDiv");
    element.scrollTop = element.scrollHeight;
  }
}

$(document).ready(function () {
  $("#message").keypress(function (e) {
    if (e.keyCode == 13) $("#messageBtn").click();
  });
});
$("#scrollBtn").on("click", () => {
  window.scrollTo(0, document.body.scrollHeight);
});
(function connect() {
  let socket = io.connect("/");

  let username = document.querySelector("#username");
  let usernameBtn = document.querySelector("#usernameBtn");
  let curUsername = document.querySelector(".card-header");
  let message = document.querySelector("#message");
  let messageBtn = document.querySelector("#messageBtn");
  let messageList = document.querySelector("#message-list");
  let roomId = $("#roomId").value;

  // $("#scrollDiv").on("scroll", function () {
  //   scrolled = true;
  // });

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
      let nameDiv = document.createElement("div");
      let messageDiv = document.createElement("div");
      let hrDiv = document.createElement("hr");
      nameDiv.textContent = data.userName;
      messageDiv.textContent = data.message;
      nameDiv.classList.add("nameStyle");
      messageDiv.classList.add("messageStyle");
      hrDiv.classList.add("hrStyle");
      // listItem.textContent = nameDiv + hrDiv + messageDiv;
      listItem.appendChild(nameDiv);
      listItem.appendChild(hrDiv);
      listItem.appendChild(messageDiv);
      listItem.classList.add("list-group-item");
      listItem.classList.add("li-list");
      messageList.appendChild(listItem);
      updateScroll();
    }
    updateScroll();
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
      updateScroll();
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
        let messageList = document.querySelector("#message-list");
        let listItem = document.createElement("li");
        let nameDiv = document.createElement("div");
        let messageDiv = document.createElement("div");
        let hrDiv = document.createElement("hr");
        nameDiv.textContent = data.sender.name;
        messageDiv.textContent = data.message;
        nameDiv.classList.add("nameStyle");
        messageDiv.classList.add("messageStyle");
        hrDiv.classList.add("hrStyle");
        // listItem.textContent = nameDiv + hrDiv + messageDiv;
        listItem.appendChild(nameDiv);
        listItem.appendChild(hrDiv);
        listItem.appendChild(messageDiv);
        listItem.classList.add("list-group-item");
        listItem.classList.add("li-list");
        messageList.appendChild(listItem);
        updateScroll();

        // let messages = document.getElementById("message-list");
        // let span = document.createElement("span");
        // messages
        //   .appendChild(span)
        //   .append(data.sender.name + ": : " + data.message);
        // updateScroll();
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
