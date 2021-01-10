const express = require('express');
const router = express.Router();
const jwt = require("jsonwebtoken");


// Get Home page
router.get('/',(req, res) => {
    res.render("userForm");
})

// Post Home page
router.post('/',(req, res) => {
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
})



module.exports=router;