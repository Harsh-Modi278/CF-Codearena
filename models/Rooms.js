const mongoose= require('mongoose');
const roomSchema = new mongoose.Schema({
    roomName:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true
    },
    users:{
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    timer:{
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
},{minimize:false})

const Room= mongoose.model('Room',roomSchema);
module.exports = Room;
