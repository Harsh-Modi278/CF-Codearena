const socket = io("http://localhost:5000");

socket.on("connect",
()=>{
    // console.log({socketId:socket.id});
    console.log({username,sockId: socket.id});
    // socket.emit("self-user",{username:username, roomName});
}
);

const output = document.getElementById("output");
const userTitles= Array.from(document.querySelectorAll(".user-logs-title"));
const logsWindow = document.querySelectorAll(".user-logs-window");

socket.emit("new-user",{handle:username,roomName:roomName});

socket.on("compete-message",(handle)=> {
    userTitles[0].innerText = username;
    userTitles[1].innerText = handle;
    const newDiv = document.createElement("div");
    newDiv.innerHTML = `<h1> You are competing against ${handle}</h1>`;
    output.append(newDiv);
});

function onsubmit()
{
    const ele=document.querySelector("a");
    var link = ele.href;
    link= link.split("/");
    var contestId= parseInt(link[4]),problem_index=link[6];
    const url="https://codeforces.com/api/user.status?handle="+ username +"&from=1&count=1";
    fetch(url)
        .then(list=>{
            return list.json();
        })
        .then(data=>{
            if(data.status==="OK") 
            {
                var latest_submission=data.result[0];
                var obj={
                    problem_index: latest_submission.problem.index,
                    contest_Id: latest_submission.problem.contestId,
                    verdict: latest_submission.verdict,

                };
                if(obj.problem_index!==problem_index || obj.contest_Id!==contestId)
                {
                    // show error message that solution is not submitted
                    alert(`You have not submitted solution on codeforces`);
                }
                else
                {
                    socket.emit("user-logs",{handle:username,verdict:obj.verdict,roomName:roomName});
                }
            }
        })
}

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
    const submit= document.querySelector("button");
    submit.addEventListener("click",onsubmit.bind(link));
});

socket.on("display-logs",({handle,verdict})=>{
    logsWindow.scrollTop = logsWindow.scrollHeight;
    var logWin= Array.from(logsWindow);
    const message= document.createElement("p");
    message.innerText="Verdict for Last Submission is "+ verdict;
    if(username===handle)
    {
        logWin[0].append(message);
    }
    else
    {
        logWin[1].append(message);
    }
})