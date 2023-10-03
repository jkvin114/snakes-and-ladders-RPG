import express = require("express")
import { R } from "../Room/RoomStorage"
import { MarbleRoom } from "../Marble/MarbleRoom"
const router = express.Router()
import { RPGRoom } from "../RPGGame/RPGRoom"
import CONFIG from "./../../config/config.json"
import SETTINGS = require("../../res/globalsettings.json")
import MarbleGameGRPCClient from "../grpc/marblegameclient"
import RPGGameGRPCClient from "../grpc/rpggameclient"

function isUserInRPGRoom(req: Express.Request) {
	return (
		req.session.roomname != null &&
		R.hasRPGRoom(req.session.roomname) &&
		R.getRPGRoom(req.session.roomname)?.hasSession(req.session.id) &&
		req.session.turn >= 0
	)
}

/**
 * roomname:string,username:string
 */
router.post("/create_rpg", function (req: express.Request, res: express.Response) {
	let body = req.body

	if (body.roomname === "") {
		body.roomname = "ROOM_" + String(Math.floor(Math.random() * 1000000))
	}
	let rname = String(body.roomname)

	if (R.hasRPGRoom(rname)) {
		console.log("exidt")
		res.status(400).end("room name exists")
		return
	}
	// console.log("createroom")
	// console.log(req.session)
	if (isUserInRPGRoom(req)) {
		res.status(307).end("previous room exists")
		return
	}

	//	console.log(rname)
	R.setRPGRoom(
		rname,
		new RPGRoom(rname)
			.registerResetCallback(() => {
				R.remove(rname)
				delete req.session.roomname
				delete req.session.turn
			})
			.setHost(req.session.id)
	)

	if (req.session) {
		if (!req.session.username) {
			req.session.username = String(body.username)
		}

		req.session.roomname = rname
		req.session.turn = 0
	}
	// console.log(req.session)
	return res.status(201).end()
})

router.post("/create", async function (req: express.Request, res: express.Response) {
	let body = req.body
	let ismarble = req.body.type === "marble"
	if (ismarble && !CONFIG.marble) return res.status(403).end()

	if (body.roomname === "") {
		body.roomname = (ismarble ? "MARBLE" : "RPG") + "ROOM_" + String(Math.floor(Math.random() * 1000000))
	}
	let rname = String(body.roomname)
	if (R.hasRPGRoom(rname)) {
		res.status(400).end("room name exists")
		return
	}
	let room = null
	if (ismarble) {	
		let status = await MarbleGameGRPCClient.Ping()
		console.log(status)
		if(status<0) return res.status(500).end('service unavaliable')

		room = new MarbleRoom(rname)
		R.setMarbleRoom(rname, room)
	} else {
		let status = await RPGGameGRPCClient.Ping()
		console.log(status)
		if(status<0) return res.status(500).end('service unavaliable')

		if (isUserInRPGRoom(req)) {
			res.status(307).end("previous room exists")
			return
		}
		room = new RPGRoom(rname)
		R.setRPGRoom(rname, room)
	}
	room.setHost(req.session.id)
	.registerResetCallback(() => {
			R.remove(rname)
			delete req.session.roomname
			delete req.session.turn
		})

	if(body.password!=="") room.setPassword(body.password)

	room.setSettings(body.loggedinOnly,body.isPrivate)

	if (req.session) {
		if (!req.session.username && !req.session.isLogined) {
			req.session.username = String(body.username)
		}
		req.session.roomname = rname
		req.session.turn = 0
	}
	// console.log(req.session)
	return res.status(201).end()
})
/**
 * username:string
 */
router.post("/join", async function (req: express.Request, res: express.Response) {
	let body = req.body

	if (isUserInRPGRoom(req)) {
		res.status(307).end("previous room exists")
		return
	}

	if (req.session) {
		if (!req.session.username && !req.session.isLogined) {
			req.session.username = String(body.username)
		}

		req.session.turn = 1
	}
	//  console.log(req.session)
	res.status(200).end()
})
router.post("/home", async function (req: express.Request, res: express.Response) {
 	req.session.ip = req.socket.remoteAddress
	req.session.time=new Date()
	let data={config:CONFIG,reconnect:false,version:SETTINGS.version,patch:SETTINGS.patch_version,locale:CONFIG.defaultLocale}
	if (req.session && isUserInRPGRoom(req)) {
		data.reconnect=true
	} 
	return res.status(200).json(data)
})
router.post("/matching", async function (req: express.Request, res: express.Response) {
	console.log(req.session)
	if (req.session) {
		if (req.session.roomname === undefined) {
			return res.status(401).end()
		}

		if (isUserInRPGRoom(req)) {
			return res.status(307).end()
		}
		if (!R.hasRoom(req.session.roomname)) return res.status(401).end()

		return res.status(200).end(req.session.roomname)

		//host
		if (req.session.turn === 0) {
		} //guest
		else if (req.session.turn === 1) {
			// let list = ""
			// for (let r of R.allRPG()) {
			// 	if (r.hosting > 0) {
			// 		list += r.name + "||"
			// 	}
			// }
			// for (let r of R.allMarble()) {
			// 	if (r.hosting > 0) {
			// 		list += r.name + "||"
			// 	}
			// } //no avaliable rooms
			// if (list === "") {
			// 	return res.status(404).end()
			// }
			// return res.status(200).end(list)
		}
	} else {
		console.error("unauthorized access to the matching page")
		return res.status(401).end()
	}
})

router.get("/hosting", async function (req: express.Request, res: express.Response) {
	let li = []
	for (let r of R.allRPG()) {
		if (r.canJoinPublic(req.session.isLogined)) {
			li.push(r.roomSummary)
		}
	}
	for (let r of R.allMarble()) {
		if (r.canJoinPublic(req.session.isLogined)) {
			li.push(r.roomSummary)
		}
	}

	return res.status(200).json({ rooms: li })
})
router.post("/verify_join", async function (req: express.Request, res: express.Response) {
	let name = req.body.roomname

	if (!R.hasRoom(name)) return res.status(404).end()
	if (!R.getRoom(name).checkPassword(req.body.password)) return res.status(401).json({ message: "password" })
	if (R.getRoom(name).isLoggedInUserOnly && !req.session.isLogined) return res.status(401).json({ message: "login" })

	//set guest session to detect if the user is successfully joined the room at matching page and socket connection
	req.session.roomname = name

	//set the guest username from client session storage if user is not logged in
	if (!req.session.isLogined) req.session.username = req.body.username

	console.log(req.session)
	return res.status(200).end()
})
router.post("/game", async function (req: express.Request, res: express.Response) {
	if (req.session) {
		// console.log("game")
		// console.log(req.session)
		if (req.session.turn === undefined) {
			console.error("unauthorized access to the game page")
			return res.status(401).end()
		}
		if (!R.hasRoom(req.session.roomname)) {
			console.error("access to unexisting game")
			return res.status(401).end()
		}

		return res.status(200).end()
	} else {
		console.error("unauthorized access to the game page")
		return res.status(401).end()
	}
})
router.post("/spectate_rpg", async function (req: express.Request, res: express.Response) {
	console.log(req.body)
	if (req.body.roomname) {
		if (!R.hasRPGRoom(req.body.roomname) || !R.getRPGRoom(req.body.roomname).gameStatus) {
			console.error("access to unexisting game")
			return res.status(404).end()
		}
		req.session.roomname = req.body.roomname
		req.session.turn = -1

		return res.status(200).end(req.body.roomname)
	} else {
		return res.status(404).end()
	}
})

router.post("/simulation", async function (req: express.Request, res: express.Response) {
	if (!CONFIG.simulation) return res.status(403).end()

	if (req.session) {
		console.log("simulation")
		// console.log(req.session)
		if (!req.session.isLogined) {
			console.error("unauthorized access to the simulation page")
			return res.status(401).end()
		}

		return res.status(200).end()
	} else {
		console.error("unauthorized access to the simulation page")
		return res.status(401).end()
	}
})

router.get("/all_rpg_games", function (req: express.Request, res: express.Response) {
	let list = []
	for (const room of R.allRPG()) {
		let status = room.gameStatus
		if (status != null) list.push(status)
	}
	return res.status(200).json({ games: list })
})

router.get("/rpg_game/:roomname", function (req: express.Request, res: express.Response) {
	let game = null
	if (R.hasRPGRoom(req.params.roomname)) {
		game = R.getRPGRoom(req.params.roomname).gameStatus
	}
	return res.status(200).json(game)
})

module.exports = router
