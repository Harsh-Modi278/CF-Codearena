// express related
const express = require("express");
const morgan = require("morgan");
const app = express();
const bodyParser= require("body-parser");

// dotenv related
const dotenv = require("dotenv");
dotenv.config({path:"./.env",encoding:"utf-8"});

// socket.io related
const socketio = require("socket.io");

// The port on which Node.js server is running
const PORT = process.env.PORT||5000;

// fetch
const fetch = require('node-fetch');

// bcrypt related
const bcryptjs = require("bcryptjs");

const server = app.listen(PORT,
()=>console.log(`Server started listening on ${PORT}`)
);

app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", "./views");
app.use(express.urlencoded({extended:true}) );
app.use(bodyParser.json());


const io = socketio(server,{});

const rooms = {};
const endpointUserStats = "https://codeforces.com/api/user.status?handle=";
const endPointProblems = "https://codeforces.com/api/problemset.problems";
const pre = "https://codeforces.com/contest/";

// logger middleware for all requests
// app.use(morgan('dev'));

app.get("/",(req,res,next)=>{
    res.render("userForm");
});

app.post("/",(req,res,next)=>
{
    console.log(req.body);
    if(!req.body.isuser) {
        res.json({redirect:"/"});
    }
    else {
        res.json({redirect:`/rooms/${req.body.user}`});
    }
});

app.get("/rooms/:username",(req,res,next)=>{
    res.render("index",{rooms:rooms,user:req.params.username});
})

app.post("/rooms/:username",(req,res,next)=>{
    const newRoomName = req.body.room;
    if(rooms[newRoomName]){
        // a room with same name already exists. Redirect user to the home page
        res.redirect(`/rooms/${req.params.username}`);
    }
    else{
        rooms[newRoomName] = { users: {} };
        
        bcryptjs.genSalt(10, (err, salt) => {
            bcryptjs.hash(req.body.password, salt, (err1, hash) => {
                if(err1) throw err1;
                rooms[newRoomName].password = hash;
            });
        });

        // A user created a room, now we will show the link to join the room to all other users,too.
        // Currently what we do is we only render the "/:room" page to that user only so other users 
        // can't see that room w/o reloading.
        // To enable real-time updatatio of that list we will use socket.io

        io.emit("room-created",newRoomName);//sending to all clients, include sender.

        // res.redirect(`/${newRoomName}/user/${req.params.username}`);
        res.render("problemPage",{roomName: newRoomName, user: req.params.username});
    }
});

app.post("/:room/user/:username",(req,res,next)=>{
    console.log(req.params);
    // If room with the given name doesn't exist then redirect the user to the base page
    if(!rooms[req.params.room])
    {
        res.redirect("/rooms/"+req.params.username);
    }
    else 
    { 
        console.log({body: req.body});
        // check if password is valid or not
        bcryptjs.compare(req.body.password, rooms[req.params.room].password)
        .then((isMatch) => {
            console.log({isMatch});
            if (isMatch) {
                res.render("problemPage",{roomName: req.params.room, user: req.params.username});
            } else {
                // wrong password -> redirect to rooms page
                res.redirect("/rooms/:username");
            }
        });
        
    }
});

async function fetchProblems(name,arr){
    let response;
    try{
        response = await fetch(endpointUserStats+String(name));
        // console.log("response:",response);
    } catch(err)
    {
        // console.log("error:",err);
        return false;
    }
    // if(response)
    let temp = await response.json();
    // let temp = response;
    // console.log("hi");
    let obj = {};
    temp.result.forEach( (it)=>{   
            obj = {};
            obj.link = pre + it.contestId + "/" + it.problem.index;
            obj.name = it.problem.name;
            obj.verdict = it.verdict;
            obj.tags = it.problem.tags;
            obj.rating = it.problem.rating;
            obj.date = it.creationTimeSeconds;
            // console.log(typeof obj.rating);
            if (obj.verdict === "OK" && typeof obj.rating === typeof Number(1) ) {
                arr.add(obj.link);
            }
        }
    );
    return true;       
   
}

async function giveProblemNotSolvedByBoth(handles)
{
    let firstUserProblems = new Set();
    let secondUserProblems = new Set();
    await fetchProblems(handles[0], firstUserProblems);
    await fetchProblems(handles[1], secondUserProblems);
    console.log("here");
    let response = await fetch(endPointProblems);
    console.log("here1");
    let jsonResponse = await response.json();
    console.log("here2");
    // console.log(jsonResponse.result.problems);
    return Array.from(jsonResponse.result.problems).filter((currProblem)=>{
        const link = pre + currProblem.contestId + "/" + currProblem.index;
        if(!firstUserProblems.has(link) && !secondUserProblems.has(link)) {
            return true;
        }
    })[0];
}

let refresh;
function timer(minutes, roomName)
{
    const seconds = minutes*60;
    const now = Date.now();
    const finish = now + seconds*1000;

    // display time once
    io.in(roomName).emit("countdown",seconds);

    // looping starts
    refresh = setInterval(()=>{
        const secondsLeft = Math.round((finish-Date.now())/1000);
        console.log({secondsLeft});
        if (secondsLeft<0) {
            // maybe show their score or who is winner
            // corner case: when 1-2 seconds were remaining and user submitted but it takes some time to fetch data from
            // cf api so we might wait for about 1 minuite in the room and then both users will be out of room.
            io.in(roomName).emit("time-up");
            clearInterval(refresh);
            return;
        }
        // display time
        io.in(roomName).emit("countdown",secondsLeft);
    },1000);
}

io.on("connection",(socket)=> {

    console.log();
    console.log("A new connection joined");
    console.log(socket.id);

    
    socket.on("new-user",({handle,roomName})=> {
        console.log({handle:handle,roomName:roomName});

        if(Array.from(Object.keys(rooms[roomName].users)).length == 2)
        {
            // Already two users are in the room
            socket.emit("housefull",{redirect:`/rooms/${handle}`});
            return;
        }
        socket.join(roomName);


        rooms[roomName].users[socket.id] = {handle, sock:socket};
        // console.log({rooms});
        // console.log(rooms[roomName].users);
        const activeUsersRoom = Array.from(Object.keys(rooms[roomName].users));

        // Both users have joined the room
        if(activeUsersRoom.length === 2)
        {
            let handles = []
            activeUsersRoom.forEach((sockId)=> {
                const currSock = rooms[roomName].users[sockId].sock;
                const currHandle = rooms[roomName].users[sockId].handle;
                handles.push(currHandle);
                currSock.to(roomName).broadcast.emit("compete-message",currHandle);
            });
            
            // fetchProblem
            (async function() {
                    const prob = await giveProblemNotSolvedByBoth(handles);
                    const probLink = pre + prob.contestId + "/" + "problem/"+prob.index;
                    console.log({probLink});
                    io.in(roomName).emit("problem-link",{link:probLink});

                    // minuites
                    timer(1,roomName);
                }
            )();

            
        }
    });
    socket.on("user-logs",({handle,obj,roomName}) => {
        io.in(roomName).emit("display-logs",{handle:handle,obj});

    });

    // // i.e. client with socket instance 'socket' was disconnected
    // socket.on("disconnect", (reason)=> {
        
    //     // get all the rooms where user with socket.id is joined: activeRooms
    //     const activeRooms = Object.entries(rooms).filter((currRoom)=> {
    //         const usersArray = Array.from(Object.keys(rooms[currRoom[0]].users));
    //         console.log("here1", rooms[currRoom[0]].users[socket.id]);
    //         if(usersArray.includes({handle : rooms[currRoom[0]].users[socket.id].handle, sock: socket})) {
    //             return true;
    //         }
    //     });
    //     console.log(activeRooms);
    //     activeRooms.forEach((room)=> {
    //         socket.to(room[0]).broadcast.emit("user-disconnect",rooms[room[0]].users[socket.id].handle);
    //         delete rooms[room[0]].users[socket.id];
    //     });
    // });
    
});


