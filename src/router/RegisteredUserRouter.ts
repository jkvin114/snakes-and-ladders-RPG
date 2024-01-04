import express = require("express")
import session from "express-session"
import mongoose from "mongoose"
import { ImageUploader } from "../mongodb/mutler"
import { ajaxauth, auth, containsId, encrypt } from "./board/helpers"
import { UserBoardDataSchema } from "../mongodb/schemaController/UserData"
import { UserRelationSchema } from "../mongodb/schemaController/UserRelation"
import { SessionManager } from "../inMemorySession"
/**
 * https://icecokel.tistory.com/17?category=956647
 * 
 * express-session 에 f12 클릭, SessionData 에 필요 property 추가 해아됨 
		interface SessionData {
        cookie: Cookie;
        isLogined:boolean
        userId:string
        username:string
        boardDataId:string
        roomname:string
        turn:number
    }
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

// const { UserBoardData } = require("../mongodb/BoardDBSchemas")
const router = express.Router()

const { User } = require("../mongodb/UserDBSchema")

function createSalt() {
	return Math.round(new Date().valueOf() * Math.random()) + ""
}



function checkPasswordValidity(pw: string) {
	if (pw.length <= 3) {
		return false
	}
	if (pw.match(/[0-9]/) === null) {
		return false
	}
	if (pw.match(/[a-z,A-Z]/) === null) {
		return false
	}
	return true
}
router.get("/all", async function (req: express.Request, res: express.Response) {
	try{
		const friends = await User.findAllSummary()
		res.render("friends", {
			username: "",
			email: "",
			profile: "",
			isme: false,
			friends: friends,
			displayType: "all",
		})
	}
	catch(e){
		console.error(e)
		res.status(500).redirect("servererror")
	}
	
	
})

router.get("/:username", async function (req: express.Request, res: express.Response) {
	const user = await User.findOneByUsername(req.params.username)
	if (!user) {
		res.status(404).redirect("/notfound")
		return
	}
	let isFriend = false
	let isFollowing = false
	try{

		const boardData = await UserBoardDataSchema.findOneById(user.boardData)
		if(!boardData){
			res.status(404).redirect("/notfound")
			return
		}
		const friendcount=await UserRelationSchema.friendCount(user._id)
		const followcount=await UserRelationSchema.followCount(user._id)

		const counts = [friendcount, followcount,boardData.bookmarks.length,
			boardData.articles.length,boardData.comments.length+boardData.replys.length,boardData.upvotedArticles.length]

		if (req.session.isLogined) {
			isFriend =await UserRelationSchema.isFriendWith(req.session.userId,user._id)
			isFollowing =await UserRelationSchema.isFollowTo(req.session.userId,user._id)
		}
		res.render("user", {
			isFriend: isFriend,
			isFollowing: isFollowing,
			username: user.username,
			email: user.email,
			profile: user.profileImgDir,
			isme: req.session.isLogined && req.session.userId === String(user._id),
			isadmin:user.role==="admin" && req.session.isLogined && req.session.userId === String(user._id),
			isLogined: req.session.isLogined,
			counts: counts,
		})
	}
	catch(e){
		console.error(e)
		res.status(500).redirect("servererror")
	}
	
})

router.get("/:username/friend", async function (req: express.Request, res: express.Response) {
	try{
		const user = await User.findOneByUsername(req.params.username)
		if (!user) {
			res.status(404).redirect("/notfound")
			return
		}

		const friendIds = await UserRelationSchema.findFriends(user._id)
		const friends=await User.findAllSummaryByIdList(friendIds)
		res.render("friends", {
			username: user.username,
			email: user.email,
			profile: user.profileImgDir,
			isme: req.session.isLogined && req.session.userId === String(user._id),
			friends: friends,
			displayType: "friends",
		})
	}
	catch(e){
		console.error(e)
		res.status(500).redirect("servererror")
	}

	
})

router.get("/:username/follow", async function (req: express.Request, res: express.Response) {
	try{
		const user = await User.findOneByUsername(req.params.username)
		if (!user) {
			res.status(404).redirect("/notfound")
			return
		}
		
		const followIds = await UserRelationSchema.findFollows(user._id)
		const follows=await User.findAllSummaryByIdList(followIds)

		//console.log(follows)
		res.render("friends", {
			username: user.username,
			email: user.email,
			profile: user.profileImgDir,
			isme: req.session.isLogined && req.session.userId === String(user._id),
			friends: follows,
			displayType: "follows",
		})
	}
	catch(e){
		console.error(e)
		res.status(500).redirect("servererror")
	}

	
})

router.post(
	"/profileimg",
	auth,
	ImageUploader.uploadProfile.single("img"),
	async function (req: express.Request, res: express.Response) {
		const imgfile = req.file
		try{
			if (imgfile) await User.updateProfileImage(req.session.userId, imgfile.filename)
			res.status(201).redirect("/user")
		}
		catch(e){
			console.error(e)
			res.status(500).end()
		}

		
	}
)

router.post("/remove_profileimg", auth, async function (req: express.Request, res: express.Response) {
	try{
		await User.updateProfileImage(req.session.userId, "")
		res.status(200).redirect("/user")
	}
	catch(e){
		console.error(e)
		res.status(500).end()
	}
	
})

router.get("/", async function (req: express.Request, res: express.Response) {
	if (!req.session || !req.session.isLogined) {
		res.status(401).redirect("/")
		return
	}
	res.redirect("/user/" + req.session.username)
})
/**
 * username,password,email
 */
router.post("/register", async function (req: express.Request, res: express.Response) {
	let body = req.body

	if (body.username.length < 2 || body.username.length > 15) {
		res.status(400).end("username")
		return
	}
	if (!checkPasswordValidity(body.password)) {
		res.status(400).end("password")
		return
	}
	try{

		let user = await User.findOneByUsername(body.username)
		if (user) {
			res.status(400).end("duplicate username")
			return
		}

		let salt = createSalt()
		let encryptedPw = await encrypt(body.password, salt)

		let boardData = await UserBoardDataSchema.create({
			_id:new mongoose.Types.ObjectId(),
			articles: [],
			comments: [],
			bookmarks: [],
			replys: [],
			username: body.username,
		})

		User.create({
			_id:new mongoose.Types.ObjectId(),
			username: body.username,
			email: body.email,
			password: encryptedPw,
			salt: salt,
			simulations: [],
			boardData: boardData._id,
			role:"user"
		})
			.then((data: any) => {
				console.log(data)
				res.status(200).end(body.username)
			})
			.catch((err: Error) => {
				console.log(err)
				res.status(500).end()
			})
	}
	catch(e){
		console.error(e)
		res.status(500).end()
	}
	
})

router.post("/current", async function (req: express.Request, res: express.Response) {
	const session = SessionManager.getSession(req)
	console.log(session)
	if (session && session.isLogined) {
		res.end(session.username)
	} else res.end("")
})
/**
 * username,password
 */
router.post("/login", async function (req: express.Request, res: express.Response) {
	let body = req.body
	const session = SessionManager.getSession(req)
	try{
		let user = await User.findOneByUsername(body.username)
		if (!user) {
			res.end("username")
			return
		}

		if (user.password !== encrypt(body.password, user.salt)) {
			res.end("password")
			return
		}
		if (session) {
			session.username = body.username
			session.isLogined = true
			session.userId = String(user._id)
			if (user.boardData == null) {
				console.log("added board data")
				let boardData = await UserBoardDataSchema.create({
					_id:new mongoose.Types.ObjectId(),
					articles: [],
					comments: [],
					bookmarks: [],
					replys: [],
					username: body.username,
				})
				user = await User.setBoardData(user._id, boardData._id)
			}
			console.log(session)
			session.boardDataId = String(user.boardData)
			console.log(session.username + " has logged in")
		}
		
		// console.log(req.session)
		res.status(200).json({
			username: body.username,
			email: user.email,
			id: user._id,
		})
	}
	catch(e){
		console.error(e)
		res.status(500).end()
	}

	
})

/**
 *
 */
router.post("/logout", ajaxauth, function (req: express.Request, res: express.Response) {
	const session = SessionManager.getSession(req)

	session.isLogined = false
	delete session.userId
	delete session.username
	delete session.boardDataId

	console.log(session.username + " has logged out")
	// req.session.destroy(function(e){
	//     if(e) console.log(e)
	// });
	console.log(session)

	res.clearCookie("sid")
	res.status(200).redirect("/")
})

/**
 * username,originalpw,newpw
 */
router.patch("/password", ajaxauth, async function (req: express.Request, res: express.Response) {
	let body = req.body
	try{
		let user = await User.findById(req.session.userId)

		if (!user) {
			console.log("user not exist")
			res.end("user not exist")
			return
		}

		if (user.password !== encrypt(body.originalpw, user.salt)) {
			res.end("password not match")
			return
		}
		if (!checkPasswordValidity(body.newpw)) {
			res.end("pw error")
			return
		}

		let salt = createSalt()
		let encryptedPw = encrypt(body.newpw, salt)

		let id = user._id

		console.log(body.username + " has changed password")

		User.updatePassword(id, encryptedPw, salt)
			.then(() => {
				res.status(200).end()
			})
			.catch((err: Error) => {
				console.log(err)
				res.status(500).end()
			})
	}
	catch(e){
		console.error(e)
		res.status(500).end()
	}

	
})

/**
 * username,email,password
 */
router.patch("/email", async function (req: express.Request, res: express.Response) {
	let body = req.body
	try{
		let user = await User.findOneByUsername(body.username)

		if (!user) {
			res.end("user not exist")
			return
		}

		if (user.password !== encrypt(body.password, user.salt)) {
			res.end("password not match")
			return
		}
		console.log(body.username + " has changed email")

		let id = user._id

		User.updateEmail(id, body.email)
			.then(() => {
				res.status(201).end()
			})
			.catch((err: Error) => {
				console.log(err)
				res.status(500).end()
			})
	}
	catch(e){
		console.error(e)
		res.status(500).end()
	}

	
})

/**
 * username,password
 */
router.delete("/", async function (req: express.Request, res: express.Response) {
	let body = req.body
	let user=null
	try{
		user = await User.findOneByUsername(body.username)
	}
	catch(e){
		console.error(e)
		return res.status(500).end()
	}
	
	if (!user) {
		res.status(204).end("user not exist")
		return
	}

	if (user.password !== encrypt(body.password, user.salt)) {
		res.status(401).end("password not match")
		return
	}

	console.log(body.username + " has deleted account")

	User.deleteOneById(user._id)
		.then(() => {
			req.session.destroy(function (e) {
				if (e) console.log(e)
			})
			res.clearCookie("sid")
			res.status(200).end()
		})
		.catch((err: Error) => {
			console.log(err)
			res.status(500).end()
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
router.post("/", async function (req: express.Request, res: express.Response) {
	console.log(req.session)
})

/**
 * username
 */
router.get("/simulation", async function (req: express.Request, res: express.Response) {
	try{
		let user = await User.findOneByUsername(req.query.username)
		if (!user) {
			res.status(204).end("user not exist")
			return
		}
		let simulations = user.simulations

		res.status(200).end(JSON.stringify(simulations))

	}
	catch(e){
		console.error(e)
		res.status(500).end()
	}
	
})	
router.use("/relation", require("./UserRelationRouter"))

module.exports = router
