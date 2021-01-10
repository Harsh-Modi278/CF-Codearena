const socket = io("http://localhost:5000");



// "/" related
const roomContainer = document.getElementById("room-container");


socket.on("connect",
()=>console.log({socketId:socket.id})
);

// Append room name and link to join the room to the room container.
socket.on("room-created",(newRoomName)=>{

    // <form action="/<%= room %>/user/<%=user%>" method="POST" id = "rooms-join">
    //                 <input type="password" name="password" id="" required>
    //                 <button type="submit"> Join </button>
    //             </form>
    console.log(`${newRoomName} created`);

    const roomElement = document.createElement("div");
    roomElement.innerText = newRoomName;

    const newForm = document.createElement("form");
    newForm.action = `/rooms/${newRoomName}`;
    newForm.method = "POST";

    const input = document.createElement("input");
    input.type = "password";
    input.name = "password"; 
    input.required = true;

    const btn = document.createElement("button");
    btn.innerText = "submit";
    btn.type="submit";

    roomContainer.append(roomElement);
    newForm.appendChild(input);
    newForm.appendChild(btn);
    roomContainer.append(newForm);
    // const roomElement = document.createElement("div");
    // roomElement.innerText = newRoomName;
    // const roomLink = document.createElement("a");
    // roomLink.href = `/${newRoomName}/user/${user}`;
    // roomLink.innerText = "Join";

    // roomContainer.append(roomElement);
    // roomContainer.append(roomLink);
});