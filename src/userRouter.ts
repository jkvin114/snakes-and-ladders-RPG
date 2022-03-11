import express = require('express');
import session from 'express-session';
/**
 * https://icecokel.tistory.com/17?category=956647
 * 
 * express-session 에 f12 클릭, SessionData 에 필요 요소 추가 해아됨 
 */

const router = express.Router()
const crypto = require('crypto')
const {User} = require("./DBHandler")



function encrypt(pw:string,salt:string){
    return crypto.createHash("sha512").update(pw + salt).digest("hex");
}
function checkPasswordValidity(pw:string){

    if(pw.length<3){
        return false
    }
    if(pw.match(/[0-9]/).length===0){
        return false
    }
    if(pw.match(/[a-z,A-Z]/).length===0){
        return false
    }

}

router.post('/register',function(req:express.Request,res:express.Response){
    let body = req.body;

    if(body.username.length < 5){
        res.end("username too short");
        return
    }
    if(!checkPasswordValidity(body.password)){
        res.end("pw error");
        return
    }

    let salt = Math.round((new Date().valueOf() * Math.random())) + "";
    let encryptedPw = encrypt(body.password,salt)

    User.create({
      username: body.userName,
      email: body.userEmail,
      password: encryptedPw,
      salt:salt
    })
    .then(() => {
      res.redirect("/");
    })
    .catch( (err:Error) => {
      console.log(err)
    })
})

router.post('/login',async function(req:express.Request,res:express.Response){
    let body = req.body;

    let user=await User.findOneByUsername(body.username)
    if(!user){
        res.end("user does not exist")
        return
    }

    if(user.password !== encrypt(body.password,user.salt)){
        res.end("password not match")
        return
    }
    if(req.session){
        req.session.username=body.username
        req.session.isLogined=true

    }
    res.redirect("/")
})

router.post('/logout',function(req:express.Request,res:express.Response){


    req.session.isLogined=false

    req.session.destroy(function(e){
        if(e) console.log(e)
    });

    res.clearCookie('sid');
    res.redirect("/")
})

router.patch('/password',async function(req:express.Request,res:express.Response){
    let body = req.body;
    let salt = Math.round((new Date().valueOf() * Math.random())) + "";
    let encryptedPw = crypto.createHash("sha512").update(body.password + salt).digest("hex");

    let id=await User.findOneByUsername(body.username)._id


    User.updatePassword(id,encryptedPw,salt)
    .then(() => {
      res.redirect("/");
    })
    .catch( (err:Error) => {
      console.log(err)
    })
})

router.patch('/email',async function(req:express.Request,res:express.Response){
    let body = req.body;

    let id=await User.findOneByUsername(body.username)._id

    User.updateEmail(id,body.email)
    .then(() => {
      res.redirect("/");
    })
    .catch( (err:Error) => {
      console.log(err)
    })
})

router.delete('/',async function(req:express.Request,res:express.Response){
    let body = req.body;

    let user=await User.findOneByUsername(body.username)

    if(user.password !== encrypt(body.password,user.salt)){
        res.send("password not match")
    }

    User.deleteOneById(user._id)
    .then(() => {
        req.session.destroy(function(e){
        if(e) console.log(e)
        });
        res.clearCookie('sid');
        res.redirect("/");
    })
    .catch( (err:Error) => {
      console.log(err)
    })
})

router.get('/',async function(req:express.Request,res:express.Response){
    let user=await User.findOneByUsername(req.body.username)

    if(!user){
        res.end("available username")
    }
    else{
        res.end("unavailable username")
    }
})


router.get('/simulation',async function(req:express.Request,res:express.Response){
    let simulations=await User.findOneByUsername(req.body.username).simulations


    res.end(simulations)

})