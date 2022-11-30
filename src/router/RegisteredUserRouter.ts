import express = require('express');
import session from 'express-session';
/**
 * https://icecokel.tistory.com/17?category=956647
 * 
 * express-session 에 f12 클릭, SessionData 에 필요 property 추가 해아됨 
 *      username:string
        isLogined:boolean
        turn:number
        roomname:string
        id:string
 */

/**
 * 200:OK
 * 201:created
 * 204:no content
 * 
 * 400: bad request
 * 401:unauthorized
 * 500:server error
 * 
 * 
 */


const{UserBoardData} = require("../mongodb/BoardDBSchemas")
const router = express.Router()
const crypto = require('crypto')
const {User} = require("../mongodb/DBHandler")


function createSalt(){
    return Math.round((new Date().valueOf() * Math.random())) + "";
}

function encrypt(pw:string,salt:string){
    return crypto.createHash("sha512").update(pw + salt).digest("hex");
}

function checkPasswordValidity(pw:string){

    if(pw.length<=3){
        return false
    }
    if(pw.match(/[0-9]/)===null){
        return false
    }
    if(pw.match(/[a-z,A-Z]/)===null){
        return false
    }
    return true

}

router.get("/:username",async function(req:express.Request,res:express.Response) {
    
})

/**
 * username,password,email
 */
router.post('/register',async function(req:express.Request,res:express.Response){
    let body = req.body;


    if(body.username.length < 2 || body.username.length > 15){
        res.status(400).end("username");
        return
    }
    if(!checkPasswordValidity(body.password)){
        res.status(400).end("password");
        return
    }
    let user=await User.findOneByUsername(body.username)
    if(user){
        res.status(400).end("duplicate username")
        return
    }

    let salt = createSalt()
    let encryptedPw = await encrypt(body.password,salt)

    let boardData = await UserBoardData.create({
        articles: [],
	    comments: [],
	    bookmarks: [],
        replys:[],
        username:body.username
    })

    User.create({
      username: body.username,
      email: body.email,
      password: encryptedPw,
      salt:salt,
      simulations:[],
      boardData:boardData._id
    })  
    .then((data:any) => {
        console.log(data)
        res.status(200).end(body.username)
    })
    .catch( (err:Error) => {
      console.log(err)
      res.status(500).end();
    })
})

router.post("/current",async function(req:express.Request,res:express.Response){
    if(req.session && req.session.isLogined){
        res.end(req.session.username)
    }
    else res.end("")
})
/**
 * username,password
 */
router.post('/login',async function(req:express.Request,res:express.Response){
    let body = req.body;

    let user=await User.findOneByUsername(body.username)
    if(!user){
        res.end("username")
        return
    }
    

    if(user.password !== encrypt(body.password,user.salt)){
        res.end("password")
        return
    }
    if(req.session){
        req.session.username=body.username
        req.session.isLogined=true
        req.session.userId=String(user._id)
        if(user.boardData==null){
            console.log("added board data")
            let boardData = await UserBoardData.create({
                articles: [],
                comments: [],
                bookmarks: [],
                replys: [],
                username:body.username
            })
            user = await User.setBoardData(user._id,boardData._id)
           
        }
    }
    
    console.log(req.session)
    console.log(body.username+" has logged in")
    res.status(200).json({
        username:body.username,
        email:user.email,
        id:user._id
    })
})


/**
 * 
 */
router.post('/logout',function(req:express.Request,res:express.Response){


    req.session.isLogined=false

    console.log(req.session.username+" has logged out")
    // req.session.destroy(function(e){
    //     if(e) console.log(e)
    // });
    console.log(req.session)
    


    res.clearCookie('sid');
    res.status(200).redirect("/")
})

/**
 * username,originalpw,newpw
 */
router.patch('/password',async function(req:express.Request,res:express.Response){
    let body = req.body;

    let user=await User.findOneByUsername(body.username)

    if(!user){
        res.status(204).end("user not exist")
        return
    }

    if(user.password !== encrypt(body.originalpw,user.salt)){
        res.status(401).end("password not match")
        return
    }
    if(!checkPasswordValidity(body.newpw)){
        res.status(401).end("pw error");
        return
    }


    let salt = createSalt()
    let encryptedPw = encrypt(body.newpw,salt) 

    let id=user._id

    console.log(body.username+" has changed password")

    User.updatePassword(id,encryptedPw,salt)
    .then(() => {
      res.status(201).end();
    })
    .catch( (err:Error) => {
      console.log(err)
      res.status(500).end();

    })
})

/**
 * username,email,password
 */
router.patch('/email',async function(req:express.Request,res:express.Response){
    let body = req.body;

    let user=await User.findOneByUsername(body.username)

    if(!user){
        res.status(204).end("user not exist")
        return
    }

    if(user.password !== encrypt(body.password,user.salt)){
        res.status(401).end("password not match")
        return
    }
    console.log(body.username+" has changed email")

    let id=user._id

    User.updateEmail(id,body.email)
    .then(() => {
      res.status(201).end();
    })
    .catch( (err:Error) => {
      console.log(err)
      res.status(500).end();

    })
})

/**
 * username,password
 */
router.delete('/',async function(req:express.Request,res:express.Response){
    let body = req.body;

    let user=await User.findOneByUsername(body.username)
    if(!user){
        res.status(204).end("user not exist")
        return
    }

    if(user.password !== encrypt(body.password,user.salt)){
        res.status(401).end("password not match")
        return
    }

    console.log(body.username+" has deleted account")

    User.deleteOneById(user._id)
    .then(() => {
        req.session.destroy(function(e){
        if(e) console.log(e)
        });
        res.clearCookie('sid');
        res.status(200).end();
    })
    .catch( (err:Error) => {
      console.log(err)
      res.status(500).end();

    })
})

/**
 * username
 */
// router.get('/',async function(req:express.Request,res:express.Response){
//     let user=await User.findOneByUsername(req.query.username)
//     console.log(user)
//     if(!user){
//         res.status(200).end("available username")
//     }
//     else{
//         res.status(200).end("unavailable username")
//     }
// })

/**
 * print session (test)
 */
router.post('/',async function(req:express.Request,res:express.Response){
    console.log(req.session)
})


/**
 * username
 */
router.get('/simulation',async function(req:express.Request,res:express.Response){
    let user= await User.findOneByUsername(req.query.username)
    if(!user){
        res.status(204).end("user not exist")
        return
    }
    let simulations=user.simulations


    res.status(200).end(JSON.stringify(simulations))

})

module.exports=router