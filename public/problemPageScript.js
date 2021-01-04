const socket = io("http://localhost:5000");

socket.on("connect",
()=>{
    // console.log({socketId:socket.id});
    console.log({username,sockId: socket.id});
    // socket.emit("self-user",{username:username, roomName});
}
);

const output = document.getElementById("output");

socket.emit("new-user",{handle:username,roomName:roomName});

socket.on("compete-message",(handle)=> {
    console.log("here1");
    console.log({handle});
    const newDiv = document.createElement("div");
    newDiv.innerHTML = `<h1> You are competing against ${handle}</h1>`;
    output.append(newDiv);
});

socket.on("problem-link",({link})=> {
    console.log({link});
    const newLink = document.createElement("a");
    newLink.appendChild(document.createTextNode(`${link}`));
    newLink.title = `${link}`;
    newLink.href = link;
    newLink.target = "_blank";
    output.append(newLink);

    const newButton = document.createElement("button");
    newButton.innerHTML = "Submit";
    output.append(newButton);
});