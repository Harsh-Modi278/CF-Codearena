// express related
const express = require("express");
const mongoose = require('mongoose');
const morgan = require("morgan");
const app = express();
const bodyParser= require("body-parser");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const {authenticate} = require("./config/authenticate");
const Room= require("./models/Rooms");

// dotenv related
const dotenv = require("dotenv");
dotenv.config({path:"./.env",encoding:"utf-8"});

// DB config
const db= process.env.MONGOURI;
var server,io;

// Connect to mongo
mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true,useFindAndModify: false })
    .then(()=> {
            server = app.listen(PORT,()=>console.log(`Server started listening on ${PORT}`));
            io = socketio(server,{});
            io.on("connection",ioConnection)
            console.log('Connected to DB')})
    .catch((err)=>console.log(err))

// socket.io related
const socketio = require("socket.io");

// The port on which Node.js server is running
const PORT = process.env.PORT||5000;

// fetch
const fetch = require('node-fetch');

// bcrypt related
const bcryptjs = require("bcryptjs");
const User = require("./models/Users");


app.use(morgan('dev'));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", "./views");
app.use(cookieParser());
app.use(express.urlencoded({extended:true}) );
app.use(bodyParser.json());


const endpointUserStats = "https://codeforces.com/api/user.status?handle=";
const endPointProblems = "https://codeforces.com/api/problemset.problems";
const pre = "https://codeforces.com/contest/";


app.get("/",(req,res,next)=>{
    res.render("userForm");
});

app.post("/",(req,res,next)=>{
    console.log(req.body);
    if(!req.body.isuser)
    {
        res.json({redirect:"/"});
    }
    else 
    {
        var token= jwt.sign({handle:req.body.user},process.env.JWT_key);
        res.json({redirect:`/rooms`,token:token});
    }
});

app.get("/rooms",authenticate,(req,res,next)=>{
    Room.find({},(err,rooms)=>{
        if(err)
        {
            console.log(err);
            return;
        }
        console.log(rooms);
        res.render("index",{rooms:rooms.map(room=>room.roomName),user:req.user});
    }) 
})

app.post("/rooms",authenticate,(req,res,next)=>{
    const newRoomName = req.body.room;
    Room.findOne({roomName:newRoomName})
        .then(room=>{
            if(room)
            {
                res.redirect('/rooms');
            }
            else
            {
                const newRoom= new Room();
                newRoom.roomName=newRoomName;
                bcryptjs.genSalt(10, (err, salt) => {
                    bcryptjs.hash(req.body.password, salt, (err1, hash) => {
                        if(err1) throw err1;
                        newRoom.password = hash;
                        newRoom.save()
                            .then(room => {
                                console.log("Room saved");
                                io.emit("room-created",newRoomName);//sending to all clients, include sender.
                                res.redirect(`/rooms`);
                                })
                            .catch(err => console.log("Error in room saving"))
                    });
                });
            }
        })
        .catch((err) => console.log(err));

});

app.get("/rooms/:room",authenticate,(req, res, next)=> {
    res.redirect("/rooms");
});

app.post("/rooms/:room",authenticate,(req,res,next)=>{
    console.log(req.params);
    const roomName= req.params.room;
    Room.findOne({roomName: roomName})
        .then((room)=>{
            if(room)
            {
                const password=req.body.password;
                bcryptjs.compare(password, room.password)
                    .then((isMatch) => {
                        console.log({isMatch});
                        if (isMatch) 
                        {
                            res.render("problemPage",{roomName: roomName, user: req.user});
                        } 
                        else 
                        {
                            // wrong password -> redirect to rooms page
                            res.redirect("/rooms");
                        }
                    })
                    .catch((err) => console.log(err));
            }
            else
            {
                // If room with the given name doesn't exist then redirect the user to the base page
                res.redirect("/rooms");
            }
        })     
        .catch((err) => console.log(err));
 
});

// Functions to fetch problem not solved by both user
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
        if(!firstUserProblems.has(link) && !secondUserProblems.has(link) && currProblem.index==="A") {
            return true;
        }
    })[0];
}

function timer(minutes, roomName, eventName)
{
    
    console.log({minutes, eventName});

    const seconds = minutes*60;
    const now = Date.now();
    const finish = now + seconds*1000;

    // display time once
    io.in(roomName).emit(eventName,seconds);

    // looping starts
    Room.findOne({roomName: roomName})
        .then(room =>{

            const fun = setInterval(function(){
                const secondsLeft = Math.round((finish-Date.now())/1000);
                console.log({secondsLeft});
                if (secondsLeft<0) {
                    // console.log("this: ", this);
                    io.in(roomName).emit(`time-up-${eventName}`);
                    Room.findOne({roomName: roomName})
                        .then(room => {
                            // console.log("this1: ", this);
                            clearInterval(this);
                        })
                        .catch((err) => console.error("hereee:",err));

                    return;
                }
                // display time
                io.in(roomName).emit(eventName,secondsLeft);
            },1000);
            // console.log({fun});
            
        })
        .catch((err) => console.log(err));

}

function ioConnection(socket)
{

    console.log();
    console.log("A new connection joined");
    console.log(socket.id);

    socket.on("new-user",({handle,roomName})=> {
        console.log({handle:handle,roomName:roomName});

        // find how many users are currently in this room
        User.find({roomName: roomName})
        .then((result)=>{
            
            console.log({result});

            // Already two users are in the room
            if(result.length == 2) {
                console.log("Already two users are in the room");
                socket.emit("housefull",{redirect:`/rooms`});
                return;
            }
            socket.join(roomName);
            // rooms[roomName].users[socket.id] = {handle, sock:socket};//associating current user with the room
            // since there is space in the room, add the current user to the room.
            const newUserInstance = new User({
                socketId: socket.id,
                handle: handle,
                roomName: roomName,
            });

            newUserInstance.save()
            .then(()=>{
                // After saving the current user, now find how many users are currently in the room(active users)
                User.find({roomName: roomName})
                .then((result)=> {
                    // Both users have joined the room
                    if (result.length == 2) {
                        console.log("Both users have joined the room");
                        console.log({result});
                        const handles = result.map((it)=> {
                            return it.handle;
                        });
                        io.in(roomName).emit("compete-message",handles);

                        // fetchProblem
                        (async function() {
                                const prob = await giveProblemNotSolvedByBoth(handles);
                                const probLink = pre + prob.contestId + "/" + "problem/"+prob.index;
                                console.log({probLink});
                                io.in(roomName).emit("problem-link",{link:probLink});

                                // minuites, roomName, eventName
                                timer(1, roomName, "countdown");
                            }
                        )();
                    }
                })
                .catch((err)=>console.error("here3: ",err));

            })
            .catch((err)=>console.error("here2: ",err));

            
        })
        .catch((err)=>console.error("here1:",err));
    });
    socket.on("user-logs",({handle,obj,roomName}) => {
        io.in(roomName).emit("display-logs",{handle:handle,obj});
    });

    socket.on("delete-room",(roomName)=>{
        Room.remove({roomName:roomName},(err,room)=>{
            if(err) 
            {
                console.log(err);
                return;
            }
            User.remove({roomName: roomName})
            .then((result)=> {
                console.log(`Deleted users in ${roomName}`);
                socket.emit("room-deleted");
            })
            .catch((err)=>console.error(`Error in deleting users in ${roomName}`,err));
            
        })
    });

    socket.on("stop-timer",({roomName})=>{
        Room.findOne({roomName: roomName})
            .then(room => {
                clearInterval(room.timer);
            })
            .catch((err) => console.log(err));

    })
    
}