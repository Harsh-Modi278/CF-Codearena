// express related
const express = require("express");
const mongoose = require('mongoose');
// const morgan = require("morgan");
const flash= require('connect-flash');
const session= require('express-session');
const app = express();
const bodyParser= require("body-parser");
const cookieParser = require("cookie-parser");
// dotenv related
const dotenv = require("dotenv");
dotenv.config({path:"./.env",encoding:"utf-8"});
// socket.io related
const socketio = require("socket.io");
const User = require("./models/Users");
const Room= require("./models/Rooms");
const {giveProblemNotSolvedByBoth,timer}= require('./config/functions');

// node-fetch related
const fetch = require("node-fetch");

// DB config
const db= process.env.MONGOURI;
let server;

// The port on which Node.js server is running
const PORT = process.env.PORT||5000;
// Connect to mongo
mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true,useFindAndModify: false })
    .then(()=> {
            server = app.listen(PORT,()=>console.log(`Server started listening on ${PORT}`));
            io = socketio(server,{});
            io.on("connection",ioConnection)
            // app.set('socketio',io);
            console.log('Connected to DB')})
    .catch((err)=>console.log(err))

// Middleware 
// app.use(morgan('dev'));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", "./views");
app.use(cookieParser());
app.use(express.urlencoded({extended:true}) );
app.use(bodyParser.json());

// Express session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
  }));
// Connect Flash
app.use(flash());

// Global Vars
app.use((req,res,next)=>{
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});


const pre = "https://codeforces.com/contest/";
roomTimer = {};

app.use("/",require('./routes/Home'));

app.use("/rooms",require('./routes/Rooms'));

async function getUserColorClass(handle) {
    const endpoint = `https://codeforces.com/api/user.info?handles=${handle}`;
    let response;
    try{
        response = await fetch(endpoint);
    } catch (err) {
        console.error(err);
    }
    const jsonResponse = await response.json();
    const rating = jsonResponse.result[0].rating;
    // console.log({handle, rating});
    if(rating <= 1199) return "user-gray";
    if(rating >= 1200 && rating < 1400) return "user-green";
    if(rating >= 1400 && rating < 1600) return "user-cyan";
    if(rating >= 1600 && rating < 1900) return "user-blue";
    if(rating >= 1900 && rating < 2200) return "user-violet";
    if(rating >= 2200 && rating < 2300) return "user-orange";
    if(rating >= 2300 && rating < 2400) return "user-orange";
    if(rating >= 2900) return "user-legendry";
    return "user-red";
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
            
            // console.log({result});

            // Already two users are in the room
            if(result.length == 2) {
                // console.log("Already two users are in the room");
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
                        // console.log("Both users have joined the room");
                        // console.log({result});
                        const handles = result.map((it)=> {
                            return it.handle;
                        });
                        // console.log({handles});
                        let userClasses = {} , i = 0;
                        handles.forEach((currHandle)=> {
                            // console.log("i: ",i, currHandle);
                            const prom = getUserColorClass(currHandle);
                            prom.then((userClass)=> {
                                // console.log({userClass});
                                userClasses[currHandle] = userClass;
                                if(i +1 == handles.length) {
                                    // console.log({userClasses});
                                    io.in(roomName).emit("compete-message",handles,userClasses);
                                    // fetchProblem
                                    (async function() {
                                        const prob = await giveProblemNotSolvedByBoth(handles);
                                        const probLink = pre + prob.contestId + "/" + "problem/"+prob.index;
                                        // console.log({probLink});
                                        io.in(roomName).emit("problem-link",{link:probLink});

                                        // minuites, roomName, eventName
                                        timer(60, roomName, "countdown");
                                    }
                                    )();
                                }
                                i++;
                            })
                            .catch((err)=>console.error(err));
                            
                        })
                        
                        
                    }
                    else
                    {
                        socket.emit("feedback");
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
                delete roomTimer[roomName];
                // console.log(`Deleted users in ${roomName}`);
                socket.emit("room-deleted");
            })
            .catch((err)=>console.error(`Error in deleting users in ${roomName}`,err));
            
        })
    });

    socket.on("stop-timer",({roomName})=>{
        clearInterval(roomTimer[roomName].timer);
    });

    socket.on("disconnect", (reason)=> {

        // find the roomName in which current user with 'socket' was joined
        User.findOne({socketId: socket.id})
        .then((result)=> {
            if(!result) return;
            const roomName = result.roomName;
            const handleLeft = result.handle;
            // There were only two users in room, user with 'socket' got disconnected, sending other user its handle
            io.in(roomName).emit("user-disconnected", handleLeft);

            // delete this user entry from db
            User.remove({socketId: socket.id})
            .then(()=> {
                if(roomTimer[roomName])
                {
                    // stopping the timer
                    clearInterval(roomTimer[roomName].timer);

                    // deleting the room
                    delete roomTimer[roomName];
                    Room.remove({roomName:roomName},(err,room)=>{
                        if(err) 
                        {
                            console.log(err);
                            return;
                        }
                        
                    })
                }
            })
            .catch((err)=>console.error(err));

            
        })
        .catch((err)=>console.error(err));
        
    });
    
}