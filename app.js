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

// logger middleware for all requests
app.use(morgan('dev'));

app.get("/",(req,res,next)=>{
    res.render("index",{rooms:rooms});
});

app.post("/room",(req,res,next)=>{
    const newRoomName = req.body.room;
    if(rooms[newRoomName]){
        // a room with same name already exists. Redirect user to the home page
        res.redirect("/");
    }
    else{
        rooms[newRoomName] = { users: {} };
        // A user created a room, now we will show the link to join the room to all other users,too.
        // Currently what we do is we only render the "/:room" page to that user only so other users 
        // can't see that room w/o reloading.
        // To enable real-time updatatio of that list we will use socket.io

        io.emit("room-created",newRoomName);//sending to all clients, include sender.

        res.redirect(`/${newRoomName}/user`);
    }
});

app.get("/:room/user",(req,res,next)=>{
    // console.log(req.params);

    // If room with the given name doesn't exist then redirect the user to the base page
    if(!rooms[req.params.room]) {
        res.redirect("/");
    }
    else { 
        res.render("userForm",{roomName : req.params.room});
    }
});

app.post("/:room/user",(req,res,next)=>{
    //console.log(req.body);
    if(req.body.isuser)
    res.json({redirect:"/"});
    else
    res.json({redirect:"/"+req.params.room+"/user"});
});

io.on("connection",(socket)=> {
    console.log("A new connection joined");

});