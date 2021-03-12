
(function connect(){
    let socket = io.connect('http://localhost:4000')

    let username = document.querySelector('#username')
    let usernameBtn = document.querySelector('#usernameBtn')
    let curUsername = document.querySelector('.card-header')
    let message = document.querySelector('#message')
    let messageBtn = document.querySelector('#messageBtn')
    let messageList = document.querySelector('#message-list')    
    
    usernameBtn.addEventListener('click', e => {
        console.log(username.value)
        socket.emit('change_username', {username: username.value})
        curUsername.textContent = username.value
        username.value = ''
    })  

    messageBtn.addEventListener('click', e => {
        console.log(message.value)
        socket.emit('new_message', {message: message.value})
        message.value = ''
    })
    socket.on('receive_message', data => {
        console.log(data)
        let listItem = document.createElement('li')
        listItem.textContent = data.username + ': ' + data.message
        listItem.classList.add('list-group-item')
        messageList.appendChild(listItem)
        
    })
    
    let info = document.querySelector('.info')

    message.addEventListener('keypress', e => {
        socket.emit('typing')
    })

    socket.on('typing', data => {
        info.textContent = data.username + " is typing..."
        setTimeout(() => {info.textContent=''}, 5000)
    })
})()

// fetching initial chat messages from the database
// (function() {
//         fetch("/chat")
//         .then(data  =>  {
//         return  data.json();
//         })
//     .then(json  =>  {
//     json.map(data  =>  {
//     let  li  =  document.createElement("li");
//     let messages = docuemtn.getElementById("messages")
//     let  span  =  document.createElement("span");
//     messages.appendChild(li).append(data.message);

//         messages
//         .appendChild(span)
//         .append("by "  +  data.sender  +  ": "  +  formatTimeAgo(data.createdAt));
//     });
// });
// })();
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
    