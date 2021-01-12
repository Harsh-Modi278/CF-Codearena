const socket = io("http://localhost:5000");



// "/" related
const roomContainer = document.getElementById("room-container");


socket.on("connect",
()=>{
    // console.log({socketId:socket.id});
}
);

// Append room name and link to join the room to the room container.
socket.on("room-created",(newRoomName)=>{
    // console.log(`${newRoomName} created`);

    const newDiv = document.createElement("div");
    newDiv.classList.add("container");

    const newForm = document.createElement("form");
    newForm.action = `/rooms/${newRoomName}`;
    newForm.method = "POST";
    newForm.classList.add("row");
    newForm.classList.add("g-3");

    const div1 = document.createElement("div");
    div1.classList.add("col-auto");

    const label1 = document.createElement("label");
    label1.for = "inputPassword2";
    label1.classList.add("visually-hidden");
    // label1.append(document.createTextNode("Email"));
    label1.innerText = "Email";
    const input1 = document.createElement("input");
    input1.type = "text";
    input1.classList.add("form-control-plaintext");
    input1.value = `Room: ${newRoomName}`;

    div1.append(label1);
    div1.append(input1);
    newForm.append(div1);

    const div2 = document.createElement("div");
    div2.classList.add("col");
    const label2 = document.createElement("label");
    label2.for = "staticEmail2";
    label2.classList.add("visually-hidden");
    // label2.append(document.createTextNode("Password"));
    label2.innerText = "Password";
    const input2 = document.createElement("input");
    input2.type = "password";
    input2.classList.add("form-control");
    input2.placeholder = "Password";
    input2.name = "password";

    div2.append(label2);
    div2.append(input2);
    newForm.append(div2);

    const div3 = document.createElement("div");
    div3.classList.add("col");
    const newBtn = document.createElement("button");
    newBtn.type = "submit";
    newBtn.innerText = "Join Room";
    ["btn", "btn-dark", "mb-3"].forEach((className)=>{
        newBtn.classList.add(className);
    });

    div3.append(newBtn);
    newForm.append(div3);
    newDiv.append(newForm);
    roomContainer.append(newDiv);

    // const roomElement = document.createElement("div");
    // roomElement.innerText = newRoomName;

    // const newForm = document.createElement("form");
    // newForm.action = `/rooms/${newRoomName}`;
    // newForm.method = "POST";

    // const input = document.createElement("input");
    // input.type = "password";
    // input.name = "password"; 
    // input.required = true;

    // const btn = document.createElement("button");
    // btn.innerText = "submit";
    // btn.type="submit";

    // roomContainer.append(roomElement);
    // newForm.appendChild(input);
    // newForm.appendChild(btn);
    // roomContainer.append(newForm);
    // --------------------------
    // const roomElement = document.createElement("div");
    // roomElement.innerText = newRoomName;
    // const roomLink = document.createElement("a");
    // roomLink.href = `/${newRoomName}/user/${user}`;
    // roomLink.innerText = "Join";

    // roomContainer.append(roomElement);
    // roomContainer.append(roomLink);
});