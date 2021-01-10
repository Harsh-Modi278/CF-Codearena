const mongoose= require('mongoose');
mongoose.set('useFindAndModify', false);

const roomSchema = new mongoose.Schema({
    roomName:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true
    }
},{timestamps: true})

const Room= mongoose.model('Room',roomSchema);
module.exports = Room;
