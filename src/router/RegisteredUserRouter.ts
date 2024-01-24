import express = require("express")
import session from "express-session"
import mongoose from "mongoose"
import { ImageUploader } from "../mongodb/mutler"
import { ajaxauth, auth, containsId, encrypt } from "./board/helpers"
import { UserBoardDataSchema } from "../mongodb/schemaController/UserData"
import { UserRelationSchema } from "../mongodb/schemaController/UserRelation"
import { ISession, SessionManager } from "../session/inMemorySession"
import { getNewJwt, setJwtCookie } from "../session/jwt"
import { loginauth, sessionParser } from "./jwt/auth"
import { ControllerWrapper } from "./ControllerWrapper"
import { UserController } from "./user/controller"
import { UserSchema } from "../mongodb/schemaController/User"
import { userSchema } from "../mongodb/UserDBSchema"
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
	try {
		const friends = await User.findAllSummary()
		res.render("friends", {
			username: "",
			email: "",
			profile: "",
			isme: false,
			friends: friends,
			displayType: "all",
		})
	} catch (e) {
		console.error(e)
		res.status(500).redirect("servererror")
	}
})

router.get("/:username", sessionParser, ControllerWrapper(UserController.getProfile))

router.get("/:username/friend", sessionParser, ControllerWrapper(UserController.getFriend))

router.get("/:username/following", sessionParser, ControllerWrapper(UserController.getFollowing))

router.get("/:username/follower", sessionParser, ControllerWrapper(UserController.getFollower))

router.post(
	"/profileimg",
	loginauth,
	sessionParser,
	ImageUploader.uploadProfile.single("img"),
	ControllerWrapper(async function (req: express.Request, res: express.Response, session: ISession) {
		const imgfile = req.file
		try {
			console.log(imgfile)
			if (imgfile) await UserSchema.updateProfileImage(session.userId, imgfile.filename)
			res.status(201).end()
		} catch (e) {
			console.error(e)
			res.status(500).end()
		}
	})
)

router.post(
	"/remove_profileimg",
	loginauth,
	sessionParser,
	ControllerWrapper(async function (req: express.Request, res: express.Response, session: ISession) {
		try {
			await UserSchema.updateProfileImage(session.userId, "")
			res.status(200).end()
		} catch (e) {
			console.error(e)
			res.status(500).end()
		}
	})
)

router.get("/", sessionParser, async function (req: express.Request, res: express.Response) {
	const session = res.locals.session
	if (!session || !session.isLogined) {
		res.status(401).redirect("/")
		return
	}
	res.redirect("/user/" + session.username)
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
	try {
		let user = await User.findOneByUsername(body.username)
		if (user) {
			res.status(400).end("duplicate username")
			return
		}

		let salt = createSalt()
		let encryptedPw = await encrypt(body.password, salt)

		let boardData = await UserBoardDataSchema.create({
			_id: new mongoose.Types.ObjectId(),
			articles: [],
			comments: [],
			bookmarks: [],
			replys: [],
			username: body.username,
		})

		User.create({
			_id: new mongoose.Types.ObjectId(),
			username: body.username,
			email: body.email,
			password: encryptedPw,
			salt: salt,
			simulations: [],
			boardData: boardData._id,
			role: "user",
		})
			.then((data: any) => {
				console.log(data)
				res.status(200).end(body.username)
			})
			.catch((err: Error) => {
				console.log(err)
				res.status(500).end()
			})
	} catch (e) {
		console.error(e)
		res.status(500).end()
	}
})

router.post("/current", async function (req: express.Request, res: express.Response) {
	const session = SessionManager.getSession(req)
	if (session && session.isLogined) {
		res.end(session.username)
	} else res.end("")
})
/**
 * username,password
 */
router.post("/login", async function (req: express.Request, res: express.Response) {
	let body = req.body
	let session = SessionManager.getSession(req)

	//create new session if session is not initialized
	if(!session){
		let token = SessionManager.createSession()
		setJwtCookie(res,token)
		session = SessionManager.getSession(req)
	}

	try {
		let user = await UserSchema.findOneByUsername(body.username)
		if (!user) {
			res.end("username")
			return
		}

		if (user.password !== encrypt(body.password, user.salt)) {
			res.end("password")
			return
		}
		if (session) {
			SessionManager.login(req,String(user._id),user.username)
			session.username = user.username

			if (user.boardData == null) {
				console.log("added board data")
				let boardData = await UserBoardDataSchema.create({
					_id: new mongoose.Types.ObjectId(),
					articles: [],
					comments: [],
					bookmarks: [],
					replys: [],
					username: body.username,
				})
				user = await User.setBoardData(user._id, boardData._id)
			}
			session.boardDataId = String(user.boardData)
			console.log(session.username + " has logged in")
		}
		else{
			return res.status(401).send("session does not exist")
		}
		// console.log(req.session)
		res.status(200).json({
			username: body.username,
			email: user.email,
			id: user._id,
		})
	} catch (e) {
		console.error(e)
		res.status(500).end()
	}
})

router.post("/logout", loginauth, function (req: express.Request, res: express.Response) {
	const session = SessionManager.getSession(req)

	SessionManager.logout(req)
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
router.patch(
	"/password",
	loginauth,
	sessionParser,
	ControllerWrapper(async function (req: express.Request, res: express.Response, session: ISession) {
		let body = req.body
		let user = await User.findById(session.userId)

		if (!user) {
			console.log("user not exist")
			res.status(200).end("user not exist")
			return
		}
		if (user.password !== encrypt(body.originalpw, user.salt)) {
			res.status(200).end("password not match")
			return
		}
		if (!checkPasswordValidity(body.newpw)) {
			res.status(200).end("pw error")
			return
		}
		let salt = createSalt()
		let encryptedPw = encrypt(body.newpw, salt)
		let id = user._id

		await UserSchema.updatePassword(id, encryptedPw, salt)
		console.log(body.username + " has changed password")
	},201)
)

/**
 * username,email,password
 */
router.patch("/email", async function (req: express.Request, res: express.Response) {
	let body = req.body
	try {
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
	} catch (e) {
		console.error(e)
		res.status(500).end()
	}
})

/**
 * username,password
 */
router.delete("/", async function (req: express.Request, res: express.Response) {
	let body = req.body
	let user = null
	try {
		user = await User.findOneByUsername(body.username)
	} catch (e) {
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
	try {
		let user = await User.findOneByUsername(req.query.username)
		if (!user) {
			res.status(204).end("user not exist")
			return
		}
		let simulations = user.simulations

		res.status(200).end(JSON.stringify(simulations))
	} catch (e) {
		console.error(e)
		res.status(500).end()
	}
})
router.use("/relation", require("./UserRelationRouter"))

module.exports = router
