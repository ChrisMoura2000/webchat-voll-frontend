var app = new Vue({
  el: "#app",
  data: {
    onlineUsers: [],
    messages: [],
    typing: "",
  },
});

const URL_API = "https://webchat-voll-backend.herokuapp.com/";

const socket = io(URL_API);

const btnSave = document.querySelector("#btn-save");
const inputNick = document.querySelector("#nickname");

const btnSend = document.querySelector("#btn-send");
const inputMsg = document.querySelector("#input-mgs");

const chat = document.querySelector("#chat");

function loadOldMessages() {
  fetch(URL_API)
    .then((promise) => promise.json())
    .then((result) => {
      app.messages = result.messages;
    });
}

loadOldMessages();

const socketOn = {
  updateOnlineUsers: (users) => {
    const currentUser = users.find((user) => socket.id === user.id);
    const otherUsers = users.filter((user) => socket.id !== user.id);
    otherUsers.unshift(currentUser);
    app.onlineUsers = otherUsers;
  },
  message: (payload) => {
    if (socket.id === payload.id) {
      payload.itsMe = true;
      delete payload.nickname;
    }
    app.messages.push(payload);
  },
  typing: ({ user }) => {
    if (user.id !== socket.id) {
      app.typing = `${user.name} is typing...`;
    }
  },
  stopTyping: () => {
    app.typing = "";
  },
};

socket.on("updateOnlineUsers", socketOn.updateOnlineUsers);
socket.on("message", socketOn.message);
socket.on("typing", socketOn.typing);
socket.on("stopTyping", socketOn.stopTyping);

function saveNewNick() {
  const newNick = inputNick.value;
  if (!newNick) {
    return alert("Digite seu nome");
  }
  socket.emit("updateNick", { newNick, id: socket.id });
  inputNick.value = "";
}

function sendMessage() {
  const textMsg = inputMsg.value;
  if (!textMsg) {
    return alert("Escreva algo");
  }
  const user = app.onlineUsers.find(({ id }) => {
    return socket.id === id;
  });

  socket.emit("message", { message: textMsg, nickname: user.name });
  chat.scrollTop = chat.scrollHeight;
  inputMsg.value = "";
}

document.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    btnSend.click();
  }
});

btnSave.addEventListener("click", saveNewNick);
btnSend.addEventListener("click", sendMessage);
inputMsg.addEventListener("keyup", () => {
  if (inputMsg.value.length === 0) {
    app.typing = "";
    socket.emit("stopTyping");
    return;
  }
  socket.emit("typing", { id: socket.id });
});

