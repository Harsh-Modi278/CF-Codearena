const express = require('express');
const router = express.Router();
const {authenticate} = require("../config/authenticate");
const Room= require("../models/Rooms");
// bcrypt related
const bcryptjs = require("bcryptjs");

// Get on rooms
router.get("/",authenticate,(req, res) => {
    Room.find({},(err,rooms)=>{
        if(err)
        {
            console.log(err);
            return;
        }
        console.log(rooms);
        res.render("index",{rooms:rooms.map(room=>room.roomName),user:req.user});
    }) 
});

// Post on rooms
router.post("/",authenticate,(req, res)=>{
    const newRoomName = req.body.room;
    Room.findOne({roomName:newRoomName})
        .then(room=>{
            if(room)
            {
                req.flash("error_msg","Room with given name already exists");
                res.redirect('/rooms');
            }
            else
            {
                roomTimer[newRoomName] = {};
                const newRoom= new Room();
                newRoom.roomName=newRoomName;
                bcryptjs.genSalt(10, (err, salt) => {
                    bcryptjs.hash(req.body.password, salt, (err1, hash) => {
                        if(err1) throw err1;
                        newRoom.password = hash;
                        newRoom.save()
                            .then(room => {
                                console.log("Room saved");
                                // const io=req.app.get('socketio');
                                io.emit("room-created",newRoomName);//sending to all clients, include sender.
                                req.flash('success_msg', 'Room created successfully');
                                res.redirect(`/rooms`);
                                })
                            .catch(err => console.log(err,"Error in room saving"))
                    });
                });
            }
        })
        .catch((err) => console.log(err));
})

// Get on /rooms/:room
router.get('/:room',authenticate,(req, res) => {
    req.flash("error_msg","Please enter room password");
    res.redirect("/rooms");
})

// Post on /rooms/:room
router.post('/:room',authenticate,(req, res)=>{
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
                            req.flash('success_msg','Entered Room Successfully');
                            res.render("problemPage",{roomName: roomName, user: req.user});   
                        } 
                        else 
                        {
                            // wrong password -> redirect to rooms page
                            req.flash('error_msg','Please enter correct room password');
                            res.redirect("/rooms");
                        }
                    })
                    .catch((err) => console.log(err));
            }
            else
            {
                req.flash('error_msg','Room with given name not exist ');
                // If room with the given name doesn't exist then redirect the user to the base page
                res.redirect("/rooms");
            }
        })     
        .catch((err) => console.log(err));
})

module.exports=router;