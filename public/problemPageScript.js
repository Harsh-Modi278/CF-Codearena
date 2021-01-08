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
const timerDiv = document.getElementById("timer");

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
                    time: latest_submission.creationTimeSeconds
                };
                if(obj.problem_index!==problem_index || obj.contest_Id!==contestId)
                {
                    // show error message that solution is not submitted
                    alert(`You have not submitted solution on codeforces`);
                }
                else
                {
                    socket.emit("user-logs",{handle:username,obj,roomName:roomName});
                }
            }
        })
}

function toHHMMSS(sec_num)
{
    let date = new Date(0);//0=>set to epoch
    date.setUTCSeconds(sec_num);
    return date;
}

function toMMSS(sec) {
    let m = String(Math.floor(sec/60));
    if (m.length < 2) m = "0" + m;
    let s = String(Math.floor(sec%60));
    if (s.length < 2) s = "0" + s;
    return `${m} : ${s}`;
}

function closeRoom(message) 
{
    document.querySelector("#output a").style.display = "none";
    document.querySelector("#output button").style.display = "none";

    const newDiv = document.createElement("div");
    newDiv.innerHTML = "<p>"+message+"</p>";

    const newButton = document.createElement("button");
    newButton.innerHTML = "Go to rooms page";
    newButton.addEventListener("click", (e)=> {
        socket.emit("delete-room",roomName);
    });

    output.append(newDiv);
    output.append(newButton);
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
    submit.addEventListener("click",onsubmit);
});

socket.on("display-logs",({handle,obj})=>{
    var logWin= Array.from(logsWindow);
    const message= document.createElement("p");
    var time= toHHMMSS(obj.time);
    message.innerHTML="Verdict for Last Submission is "+ "<b>" +obj.verdict + "</b>"+" on <i>" + time + "</i>";
    if(username===handle)
    {
        logWin[0].append(message);
    }
    else
    {
        logWin[1].append(message);
    }
    for(let i=0;i<logWin.length;i++) logWin[i].scrollTop = logWin[i].scrollHeight;
    if(obj.verdict==="OK")
    {
        if(username===handle)
        {
            closeRoom("You have won");
        }
        else
        {
            closeRoom(`${handle} have won`);
        }
        socket.emit("stop-timer",{roomName:roomName});
    }
});

socket.on("housefull",({redirect})=> {
    window.location.href = redirect;
});

socket.on("countdown",(secondsLeft)=> {
    // timerDiv
    timerDiv.innerHTML = toMMSS(secondsLeft);
});

socket.on("time-up-countdown",()=>{
    // console.log("time is up");
    closeRoom("None of you have won!");
});

socket.on("room-deleted",()=>{
    window.location.href = "/rooms";
});

// socket.on("user-disconnect",(handle)=> {
//     // other user got disconnected
//     logWin[1].append(message);
//     for(let i=0;i<logWin.length;i++) logWin[i].scrollTop = logWin[i].scrollHeight;
// });