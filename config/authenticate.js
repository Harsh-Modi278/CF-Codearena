const jwt= require('jsonwebtoken');

const authenticate= (req, res, next) =>{

    const token=req.cookies.token;
    //console.log(req.cookies);
    if(token){
        jwt.verify(token,process.env.JWT_key,(err,decode)=>{
            if(err )
            {
                console.log(err);
                res.redirect('/');
            }
            else
            {
                req.user=decode.handle;
                next();
            }
        });
    }
    else{
        res.redirect('/');
    }
}
module.exports = {authenticate};