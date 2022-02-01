var app = new Vue({
  el: "#app",
  data: {
    onlineUsers: [],
    messages: [],
    typing: ''
  },
});

// const URL_API = "https://webchat-voll-backend.herokuapp.com/";
const URL_API = "http://localhost:3000";

const socket = io(URL_API);

function loadOldMessages() {
  fetch(URL_API)
    .then((promise) => promise.json())
    .then((result) => {
      app.messages = result.messages;
    });
}

loadOldMessages();

socket.on("updateOnlineUsers", (users) => {
  const currentUser = users.find((user) => socket.id === user.id);
  const otherUsers = users.filter((user) => socket.id !== user.id);
  otherUsers.unshift(currentUser);
  app.onlineUsers = otherUsers;
});

const btnSave = document.querySelector("#btn-save");
const inputNick = document.querySelector("#nickname");

const btnSend = document.querySelector("#btn-send")
const inputMsg = document.querySelector("#input-mgs");

function saveNewNick() {
  const newNick = inputNick.value;
  if (!newNick) {
    return alert('Digite seu nome')
  }
  socket.emit('updateNick', { newNick, id: socket.id})
  inputNick.value = ''
}

function sendMessage() {
  const textMsg = inputMsg.value
  if (!textMsg) {
    return alert('Escreva algo')
  }
  const user = app.onlineUsers.find(({ id }) => {
    return socket.id === id
  })

  socket.emit('message', { message: textMsg, nickname: user.name })
  inputMsg.value = ''
}

socket.on('message', (payload) => {
  if (socket.id === payload.id) {
    payload.itsMe = true
    delete payload.nickname
  }
  app.messages.push(payload)
})

btnSave.addEventListener("click", saveNewNick);
btnSend.addEventListener("click", sendMessage);
document.addEventListener("keypress", (e) => {
  if (e.key === 'Enter') {
    btnSend.click()
  }
});

inputMsg.addEventListener('keyup', () => {
  if (inputMsg.value.length === 0) {
    app.typing = ''
    return 
  }
  socket.emit('typing', { id: socket.id })
})

socket.on('typing', ({user}) => {
  app.typing = `${user} is typing...`
})
