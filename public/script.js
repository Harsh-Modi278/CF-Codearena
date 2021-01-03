
const socket = io("http://localhost:5000");



// "/" related
const roomContainer = document.getElementById("room-container");


socket.on("connect",
()=>console.log({socketId:socket.id})
);

// Append room name and link to join the room to the room container.
socket.on("room-created",(newRoomName)=>{
    console.log(`${newRoomName} created`);
    const roomElement = document.createElement("div");
    roomElement.innerText = newRoomName;
    const roomLink = document.createElement("a");
    roomLink.href = `/${newRoomName}`;
    roomLink.innerText = "Join";

    roomContainer.append(roomElement);
    roomContainer.append(roomLink);
});

