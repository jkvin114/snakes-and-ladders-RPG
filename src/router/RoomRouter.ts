import express = require("express")
import { R } from "../Room/RoomStorage"
import { MarbleRoom } from "../Marble/MarbleRoom"
const router = express.Router()
import { RPGRoom } from "../RPGGame/RPGRoom"
import CONFIG from "./../../config/config.json"
import SETTINGS = require("../../res/globalsettings.json")
import MarbleGameGRPCClient from "../grpc/marblegameclient"
import RPGGameGRPCClient from "../grpc/rpggameclient"
import { sessionParser } from "./jwt/auth"
import { ControllerWrapper } from "./ControllerWrapper"
import { ISession } from "../session/inMemorySession"
import type { Request, Response } from "express"
import { randName } from "../RPGGame/data/names"

function isUserInRPGRoom(req: Express.Request) {
	return (
		req.session.roomname != null &&
		R.hasRPGRoom(req.session.roomname) &&
		R.getRPGRoom(req.session.roomname)?.hasSession(req.session.id) &&
		req.session.turn >= 0
	)
}
function isUserInRPGRoom2(session: ISession) {
	return (
		session.roomname != null &&
		R.hasRPGRoom(session.roomname) &&
		R.getRPGRoom(session.roomname)?.hasSession(session.id) &&
		session.turn >= 0
	)
}
/**
 * roomname:string,username:string
 * 
 * 
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

router.post(
	"/create",
	sessionParser,
	ControllerWrapper(async function (req: Request, res: Response, session: ISession) {
		let body = req.body
		let ismarble = req.body.type === "marble"
		if (ismarble && !CONFIG.marble) {
			res.status(403).end()
			return
		}

		if (body.roomname === "" || !body.roomname) {
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
			if (status < 0) {
				res.status(500).end("service unavaliable")
				return
			}

			room = new MarbleRoom(rname)
			R.setMarbleRoom(rname, room)
		} else {
			let status = await RPGGameGRPCClient.Ping()
			console.log(status)
			//if(status<0) return res.status(500).end('service unavaliable')

			if (isUserInRPGRoom2(session)) {
				res.status(307).end("previous room exists")
				return
			}
			room = new RPGRoom(rname)
			R.setRPGRoom(rname, room)
			
		}
		room.setHost(session.id).registerResetCallback(() => {
			R.remove(rname)
			delete session.roomname
			delete session.turn
		})

		if (body.password) room.setPassword(body.password)

		room.setSettings(body.loggedinOnly, body.isPrivate)

		if (session) {
			if ((!session.username || session.username==="") && !session.isLogined) {
				session.username = randName()
			}
			session.roomname = rname
			session.turn = 0
		}
		console.log(session)
		res.status(201).end(rname)
	}, 201)
)
/**
 * username:string
 */
router.post(
	"/join",
	sessionParser,
	ControllerWrapper(async function (req: Request, res: Response, session: ISession) {
		let body = req.body

		if (isUserInRPGRoom2(session)) {
			res.status(307).end("previous room exists")
			return
		}

		if (session) {
			if ((!session.username || session.username==="") && !session.isLogined) {
				session.username = randName()
			}
			session.turn = 1
		}
	})
)
router.post(
	"/home",
	sessionParser,
	ControllerWrapper(async function (req: Request, res: Response, session: ISession) {
		session.ip = req.socket.remoteAddress
		session.time = new Date()
		let data = {
			config: CONFIG,
			reconnect: false,
			version: SETTINGS.version,
			patch: SETTINGS.patch_version,
			locale: CONFIG.defaultLocale,
		}
		if (session && isUserInRPGRoom2(session)) {
			data.reconnect = true
		}
		res.status(200).json(data)
	})
)
router.post(
	"/matching",
	sessionParser,
	ControllerWrapper(async function (req: Request, res: Response, session: ISession) {
		console.log(session)
		console.log("matching")
		if (session) {
			if (session.roomname === undefined) {
				res.status(401).end()
				return
			}

			if (isUserInRPGRoom2(session)) {
				res.status(307).end()
				return
			}
			if (!R.hasRoom(session.roomname)) res.status(401).end()
			else res.status(200).end(session.roomname)
		} else {
			console.error("unauthorized access to the matching page")
			res.status(401).end()
		}
	})
)

router.get(
	"/hosting",
	sessionParser,
	ControllerWrapper(async function (req: Request, res: Response, session: ISession) {
		let li = []
		for (let r of R.allRPG()) {
			if (r.canJoinPublic(session.isLogined)) {
				li.push(r.roomSummary)
			}
		}
		for (let r of R.allMarble()) {
			if (r.canJoinPublic(session.isLogined)) {
				li.push(r.roomSummary)
			}
		}

		res.status(200).json({ rooms: li })
	})
)
router.post(
	"/verify_join",
	sessionParser,
	ControllerWrapper(async function (req: Request, res: Response, session: ISession) {
		let name = req.body.roomname

		if (!R.hasRoom(name)) res.status(404).end()
		else if (!R.getRoom(name).checkPassword(req.body.password)) res.status(401).json({ message: "password" })
		else if (R.getRoom(name).isLoggedInUserOnly && !session.isLogined) res.status(401).json({ message: "login" })
		else {
			//set guest session to detect if the user is successfully joined the room at matching page and socket connection
			session.roomname = name

			//set the guest username from client session storage if user is not logged in
			if (!session.isLogined) session.username = randName()
		}
	})
)
router.post(
	"/game",
	sessionParser,
	ControllerWrapper(async function (req: Request, res: Response, session: ISession) {
		if (session.turn === undefined) {
			console.error("unauthorized access to the game page")
			res.status(401).end()
			return
		}
		if (!R.hasRoom(session.roomname)) {
			console.error("access to unexisting game")
			delete session.roomname
			delete session.turn
			res.status(401).end()
			return
		}
	})
)
router.post(
	"/spectate_rpg",
	sessionParser,
	ControllerWrapper(async function (req: Request, res: Response, session: ISession) {
		console.log(req.body)
		if (req.body.roomname) {
			if (!R.hasRPGRoom(req.body.roomname) || !R.getRPGRoom(req.body.roomname).gameStatus) {
				console.error("access to unexisting game")
				res.status(404).end()
				return
			}
			session.roomname = req.body.roomname
			session.turn = -1

			res.status(200).end(req.body.roomname)
		} else {
			res.status(404).end()
		}
	})
)

router.post(
	"/simulation",
	sessionParser,
	ControllerWrapper(async function (req: Request, res: Response, session: ISession) {
		if (!CONFIG.simulation) {
			res.status(403).end()
			return
		}

		if (!req.session.isLogined) {
			console.error("unauthorized access to the simulation page")
			res.status(401).end()
			return
		}
	})
)

router.get("/all_rpg_games", function (req: Request, res: Response) {
	let list = []
	for (const room of R.allRPG()) {
		let status = room.gameStatus
		if (status != null) list.push(status)
	}
	return res.status(200).json({ games: list })
})

router.get("/rpg_game/:roomname", function (req: Request, res: Response) {
	let game = null
	if (R.hasRPGRoom(req.params.roomname)) {
		game = R.getRPGRoom(req.params.roomname).gameStatus
	}
	return res.status(200).json(game)
})

module.exports = router
