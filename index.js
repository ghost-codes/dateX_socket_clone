const socketPort = process.env.PORT || 8000;

const io = require("socket.io")(socketPort);
//     , {
//     cors: {
//         origin: "http://localhost:3000",
//     },
// });

let users = [];
let searchingUsers = [];
let maleLobby = [];
let femaleLobby = [];

const addUser = (userId, socketId) => {
    !users.some(user => user.userId === userId) && users.push({ userId, socketId })
}

const removeUser = (socketId) => {
    users = users.filter(user => user.socketId !== socketId);
}

const getUsers = (userId) => {
    return users.find((user) => user.userId === userId);
}

const addToSearchingUsers = (userId, gender, socketId) => {
    !searchingUsers.some(user => user.userId === userId) && searchingUsers.push({ userId, gender, socketId });
    if (gender === "male") {
        !maleLobby.some(user => user.userId === userId) && maleLobby.push({ userId, gender, socketId });
    } else {
        !femaleLobby.some(user => user.userId === userId) && femaleLobby.push({ userId, gender, socketId });
    }
}

const matchUsers = (socket) => {
    if (maleLobby.length !== 0 && femaleLobby.length !== 0) {
        const male =
            maleLobby.splice(Math.floor(Math.random() * maleLobby.length), 1)[0];
        const female =
            femaleLobby.splice(Math.floor(Math.random() * femaleLobby.length), 1)[0];
        io.to(male.socketId).emit("matchedWith", { "userId": female.userId });
        io.to(female.socketId).emit("matchedWith", { "userId": male.userId });
    } else {
        io.emit("notMatched", { "x": true });
    }
}

io.on("connection", (socket) => {
    console.log("a user has connected...");

    // matchUsers(socket);
    //after connection take user id and socket id
    socket.on("addUser", ({ userId }) => {
        addUser(userId, socket.id);
        io.emit("getUsers", users);
    });

    //send and get messages
    socket.on("sendMessage", ({ senderId, receiverId, text }) => {
        const user = getUsers(receiverId);
        if (user) {

            io.to(user.socketId).emit("getMessage", { senderId, text })
        }
    });

    // searching socket
    socket.on("searchAndMatch", ({ userId, gender }) => {
        addToSearchingUsers(userId, gender, socket.id);
    })

    // when disconnected
    socket.on("disconnect", (socket) => {
        console.log("user disconnected");
        removeUser(socket.id);
        io.emit("getUsers", users);
    });
    // }
});
