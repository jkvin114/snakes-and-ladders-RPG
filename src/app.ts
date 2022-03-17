import { Room } from "./room"
import { MAP_TYPE } from "./enum"
import SETTINGS = require("../res/globalsettings.json")
import { SpecialEffect } from "./SpecialEffect"
const { GameRecord, SimulationRecord,User } = require("./DBHandler")

import { createServer } from "http"
import { Namespace, Server, Socket } from "socket.io"
import express = require("express")
import fs = require("fs")
import cors = require("cors")
import os = require("os")



const session = require('express-session')({
	key: 'sid',   //세션의 키 값
	secret: 'salr', //세션의 비밀 키, 쿠키값의 변조를 막기 위해서 이 값을 통해 세션을 암호화 하여 저장
	resave: false,   //세션을 항상 저장할 지 여부 (false를 권장)
	saveUninitialized: true,   //세션이 저장되기전에 uninitialize 상태로 만들어 저장
	cookie: {
	  maxAge: 24000 * 60 * 60 // 쿠키 유효기간 24시간
	}
  });

export var ROOMS = new Map<string, Room>()
const clientPath = `${__dirname}/../../SALR-android-webview-master`
const firstpage = fs.readFileSync(__dirname + "/../../SALR-android-webview-master/index.html", "utf8")
const PORT=4000
const app = express()




app.use(session);
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use("/stat", require("./router/statRouter"))
app.use("/user", require("./router/RegisteredUserRouter"))
app.use("/room", require("./router/RoomRouter"))
app.use("/resource", require("./router/resourceRouter"))

app.use(express.static(clientPath))
app.use(errorHandler)
const httpserver = createServer(app)
httpserver.listen(PORT)
app.on("error", (err: any) => {
	console.error("Server error:", err)
})



var interfaces = os.networkInterfaces()
var addresses = []
for (var k in interfaces) {
	for (var k2 in interfaces[k]) {
		var address = interfaces[k][k2]
		if (address.family === "IPv4" && !address.internal) {
			addresses.push(address.address)
		}
	}
}
console.log("start server")
console.log("IP Address:" + addresses[0])
console.log("version " + SETTINGS.version)



// function ROOMS.get(name: string): Room {
// 	return ROOMS.get(name)
// }
function errorHandler(err: any, req: any, res: any, next: any) {
	res.send("error!!" + err)
}

namespace SocketSession{
	export function getUsername(socket:Socket):string{
		const req = socket.request as express.Request;
		return req.session.username	
	}
	export function setTurn(socket:Socket,turn:number){
		const req = socket.request as express.Request;
		req.session.turn=turn
		req.session.save();
		console.log(req.session)
	}
	export function getTurn(socket:Socket):number{
		const req = socket.request as express.Request;
		return req.session.turn	
	}

	export function setRoomName(socket:Socket,roomname:string){
		const req = socket.request as express.Request;
		req.session.roomname=roomname
		req.session.save();
		console.log(req.session)
	}
	export function getRoomName(socket:Socket):string{
		const req = socket.request as express.Request;
		return req.session.roomname	
	}

}





var io = new Server(httpserver, {
	cors: {
		origin: "http://127.0.0.1:"+PORT,
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
		credentials: true
	},
	allowEIO3: true
})


//for using sessing in socket.io
io.use((socket,next)=>{
    let req = socket.request as express.Request
    let res = req.res as express.Response
    session(req, res, next as express.NextFunction)
});




io.on("listen", function () {
	console.log("listen")
})
io.on("error", function (e: any) {
	console.log(e)
})


io.on("disconnect", function (socket: Socket) {
	console.log("disconnected")
})




io.on("connect", function (socket: Socket) {
	console.log(`${socket.id} is connected`)

	socket.on("user:host_connect", function () {
		let roomName=SocketSession.getRoomName(socket)
		if (!ROOMS.has(roomName)) return

		// if (ROOMS.get(roomName) != null) {
		// 	socket.emit("server:room_name_exist")
		// 	return
		// }
		/*
		Test.create({name:"hello",turn:2,sub:{name:"d"}})
		.then((resolvedData)=>console.log(resolvedData))
		.catch((e)=>console.error(e))
*/
		ROOMS.get(roomName).setSimulation(false).setNickname(SocketSession.getUsername(socket), 0)
		// ROOMS.set(roomName, room)
		//console.log("join"+roomName)
		socket.join(roomName)
	//	socket.emit("server:create_room",roomName)
	})
	//==========================================================================================
	socket.on("user:register", function (rname: string) {
		if (!ROOMS.has(rname)) {
			socket.emit("server:room_full")
			return
		}
		let room = ROOMS.get(rname)

		if (room.hosting <= 0) {
			socket.emit("server:room_full")
		}
		try {
			SocketSession.setRoomName(socket,rname)
			socket.join(rname)
			room.guestnum += 1
			socket.emit("server:join_room", rname)
		} catch (e) {
			console.error(e)
		}
	})

	//==========================================================================================
	/**
	 * 버그존재
	 * 2턴 컴, 3턴 플레이어 상태에서 3턴 챔 선택 후 컴퓨터 킥 하면(킥 후에 챔 선택 x) 3턴이었던 플레이어 챔피언 초기화됨
	 */
	socket.on("user:update_playerlist", function (playerlist: any) {
		
		try {
			let rname=SocketSession.getRoomName(socket)
			console.log(rname)
			if (!ROOMS.has(rname)) return
			let room = ROOMS.get(rname)
			let turnchange = room.user_updatePlayerList(playerlist)
			io.to(rname).emit("server:update_playerlist", room.playerlist, turnchange)
		} catch (e) {
			console.error(e)
		}
	})
	//==========================================================================================
	socket.on("user:update_ready", function (turn: number, ready: boolean) {
		let rname=SocketSession.getRoomName(socket)

		if (!ROOMS.has(rname)) return
		ROOMS.get(rname).user_updateReady(turn, ready)

		io.to(rname).emit("server:update_ready", turn, ready)
	})
	socket.on("user:request_players", function () {
		try {
			let rname=SocketSession.getRoomName(socket)
			let nickname=SocketSession.getUsername(socket)
			if (!ROOMS.has(rname)) return


			let room = ROOMS.get(rname)
			let turn = room.user_requestPlayers(nickname)
			SocketSession.setTurn(socket,turn)

			socket.emit("server:guest_register", turn, room.playerlist)
			socket.broadcast.to(rname).emit("server:update_playerlist", room.playerlist)
		} catch (e) {
			console.error(e)
		}
	})
	socket.on("user:guest_quit", function () {
		const req = socket.request as express.Request;
		delete req.session.turn;
		//req.session.destroy((e)=>{console.log("destroy guest session")})
	})
	//==========================================================================================

	socket.on("user:kick_player", function (turn: number) {
		try {
			let rname=SocketSession.getRoomName(socket)
			if (!ROOMS.has(rname)) return
			let room = ROOMS.get(rname)
			room.guestnum -= 1

			io.to(rname).emit("server:kick_player", turn)

			console.log("kick" + turn)
			//room.playerlist[turn]=null
		} catch (e) {
			console.log(e)
		}
	})

	//==========================================================================================

	socket.on("user:go_teampage", function () {
		let rname=SocketSession.getRoomName(socket)

		if (!ROOMS.has(rname)) return
		ROOMS.get(rname).setTeamGame()
		io.to(rname).emit("server:go_teampage")
	})

	socket.on("user:request_names", function () {
		let rname=SocketSession.getRoomName(socket)

		if (!ROOMS.has(rname)) return
		let names = ROOMS.get(rname).user_requestNames()

		io.to(rname).emit("server:player_names", names)
	})
	//==========================================================================================

	socket.on("user:update_champ", function ( turn: number, champ: number) {
		let rname=SocketSession.getRoomName(socket)
		if (!ROOMS.has(rname)) return
		ROOMS.get(rname).user_updateChamp(turn, champ)
		io.to(rname).emit("server:update_champ", turn, champ)
		console.log("changechamp" + turn + champ)
	})
	//==========================================================================================

	socket.on("user:update_map", function ( map: number) {
		let rname=SocketSession.getRoomName(socket)

		if (!ROOMS.has(rname)) return
		ROOMS.get(rname).user_updateMap(map)

		io.to(rname).emit("server:map", map)
		console.log("setmap" + map)
	})
	//==========================================================================================

	socket.on("user:update_team", function (check_status) {
		let rname=SocketSession.getRoomName(socket)

		console.log("set team" + check_status)
		if (!ROOMS.has(rname)) return
		ROOMS.get(rname).user_updateTeams(check_status)
		io.to(rname).emit("server:teams", check_status)
	})
	//==========================================================================================

	socket.on("user:simulationready", async function (setting, count, isTeam) {

		if(!SocketSession.getUsername(socket)){
			console.error("user not logined for simulation")
			return
		}

		let rname="simulation_"+String(Math.floor(Math.random()*1000000))
		SocketSession.setRoomName(socket,rname)
		socket.join(rname)
		let room=new Room(rname).setSimulation(true)
		ROOMS.set(rname,room) 

		let u=SocketSession.getUsername(socket)
		User.findOneByUsername(u)
		.then((user:any)=>{
			console.log(setting)
			console.log("team:" + isTeam + "   count:" + count+"runner:"+user._id)
	
			room.user_simulationReady(setting, count, isTeam, user._id)
		})
		.catch((e:Error)=>{
			console.error(e)
		})


		
	})

	socket.on("user:gameready", function ( setting) {
		let rname=SocketSession.getRoomName(socket)

		if (!ROOMS.has(rname)) return

		ROOMS.get(rname).user_gameReady(setting, rname)

		//게스트 페이지 바꾸기
		socket.to(rname).emit("server:to_gamepage")
	})
	//==========================================================================================

	//즉시 시뮬레이션 전용
	socket.on("server:join_room", function () {
		let rname=SocketSession.getRoomName(socket)

		let room = ROOMS.get(rname)
		if (!room) {
			return
		}
		socket.join(rname)
	})
	//==========================================================================================

	socket.on("user:requestsetting", function () {
		let rname=SocketSession.getRoomName(socket)
		let turn=SocketSession.getTurn(socket)
		if (!ROOMS.has(rname)) return
		let room = ROOMS.get(rname)
		if (!room.game) {
			socket.emit("server:quit")
			return
		}
		socket.join(rname)
		let setting = room.user_requestSetting()

		socket.emit("server:initialsetting", setting,turn,room.cryptTurn(turn))
	})
	//==========================================================================================

	socket.on("user:start_game", function () {
		let rname=SocketSession.getRoomName(socket)

		if (!ROOMS.has(rname)) return
		let room = ROOMS.get(rname)
		if (!room.game) return

		let t = room.user_startGame()
		if (!t) {
			console.log("connecting incomplete")
		} else {
			//socket.emit('nextturn',t)
			io.to(rname).emit("server:nextturn", t)
		}
	})
	//==========================================================================================
	socket.on("start_instant_simulation", function () {
		let rname=SocketSession.getRoomName(socket)

		if (!ROOMS.has(rname)) return

		socket.join(rname)
		ROOMS.get(rname).doInstantSimulation()
	})

	//==========================================================================================

	socket.on("user:press_dice", function (crypt_turn:string,dicenum: number) {
		let rname=SocketSession.getRoomName(socket)


		if (!ROOMS.has(rname)) return
		if(!ROOMS.get(rname).isThisTurn(crypt_turn)) return

		let dice = ROOMS.get(rname).user_pressDice(dicenum)
		console.log("press_dice" + rname)
		io.to(rname).emit("server:rolldice", dice)

		//	console.log("pressdice")
	})
	//==========================================================================================

	/**
	 * 장애물에 도착하는 즉시 실행
	 * -장애물 효과 받음
	 * -게임오버 체크
	 */
	socket.on("user:arrive_square", function () {
		let rname=SocketSession.getRoomName(socket)
		if (!ROOMS.has(rname)) return
		ROOMS.get(rname).user_arriveSquare()
	})
	//==========================================================================================

	/**
	 * 클라이언트에서 장애물에 도착 후 0.5초 후에 실행
	 */
	socket.on("user:obstacle_complete", function () {
		let rname=SocketSession.getRoomName(socket)


		if (!ROOMS.has(rname)) return
		ROOMS.get(rname).user_obstacleComplete()
	})
	//==========================================================================================

	/**
	 * 선택 장애물(신의손,납치범 등) 선택 완료후 정보 전송 받음
	 * 처리 후 선댁 action(잠수함, 갈림길선택 등) 체크
	 */
	socket.on("user:complete_obstacle_selection", function (crypt_turn: string, info: any) {
		//	console.log("obs selection complete")

		let rname=SocketSession.getRoomName(socket)


		if (!ROOMS.has(rname)) return
		if(!ROOMS.get(rname).isThisTurn(crypt_turn)) return

		ROOMS.get(rname).user_completePendingObs(info)
	})
	//==========================================================================================

	/**
	 * 선택 action 선택 완료후 처리
	 * 처리 후 스킬 사용
	 */
	socket.on("user:complete_action_selection", function (crypt_turn: string, info: any) {
		//	console.log("action selection complete")
		let rname=SocketSession.getRoomName(socket)


		if (!ROOMS.has(rname)) return
		if(!ROOMS.get(rname).isThisTurn(crypt_turn)) return
		
		ROOMS.get(rname).user_completePendingAction(info)
	})

	//==========================================================================================

	//execute when player clicks skill button, use skill or return targets or return proj positions
	socket.on("user:get_skill_data", function (crypt_turn: string, s: number) {
		let rname=SocketSession.getRoomName(socket)


		if (!ROOMS.has(rname)) return
		if(!ROOMS.get(rname).isThisTurn(crypt_turn)) return
		let room = ROOMS.get(rname)
		let result = room.user_clickSkill(s)
		socket.emit("server:skill_data", result)
	})
	//==========================================================================================
	//execute when player chose a target
	socket.on("user:chose_target", function (crypt_turn: string, target: any) {
		//	console.log("sendtarget")
		let rname=SocketSession.getRoomName(socket)


		if (!ROOMS.has(rname)) return
		if(!ROOMS.get(rname).isThisTurn(crypt_turn)) return
		let status = ROOMS.get(rname).user_choseSkillTarget(target)

		if (status != null) {
			setTimeout(() => socket.emit("server:used_skill", status), 500)
		}
	})
	//==========================================================================================
	//execute when player chose a projectile location
	socket.on("user:chose_location", function (crypt_turn: string, location: any) {
		//	console.log("sendprojlocation")
		let rname=SocketSession.getRoomName(socket)


		if (!ROOMS.has(rname)) return
		if(!ROOMS.get(rname).isThisTurn(crypt_turn)) return
		let skillstatus = ROOMS.get(rname).user_choseSkillLocation(location)
		socket.emit("server:used_skill", skillstatus)
	})
	socket.on("user:chose_area_skill_location", function (crypt_turn: string, location: any) {
		//	console.log("sendprojlocation")
		let rname=SocketSession.getRoomName(socket)


		if (!ROOMS.has(rname)) return
		if(!ROOMS.get(rname).isThisTurn(crypt_turn)) return
		let skillstatus = ROOMS.get(rname).user_choseAreaSkillLocation(location)
		socket.emit("server:used_skill", skillstatus)
	})
	//==========================================================================================

	socket.on("user:store_data", function (data: any) {
		let rname=SocketSession.getRoomName(socket)

		if (!ROOMS.has(rname)) return

		ROOMS.get(rname).user_storeComplete(data)
	})

	//==========================================================================================

	socket.on("user:nextturn", function (crypt_turn: string, n: any) {
		let rname=SocketSession.getRoomName(socket)


		if (!ROOMS.has(rname)) return
		if(!ROOMS.get(rname).isThisTurn(crypt_turn)) return
		ROOMS.get(rname).goNextTurn()
	})

	//==========================================================================================

	socket.on("user:reset_game", function () {
		let rname=SocketSession.getRoomName(socket)
		let quitter=SocketSession.getTurn(socket)
		console.log(rname,quitter)
		if (!ROOMS.has(rname)) return
		let room = ROOMS.get(rname)
		io.to(rname).emit("server:quit", quitter)
		console.log("an user has been disconnected " + ROOMS.get(rname))

		try {
			room.reset()
		} catch (e) {
			console.error("Error while resetting room " + e)
		}

		ROOMS.delete(rname)
	})

	//==========================================================================================

	socket.on("user:reload_game", function () {
		console.log("reloadgame")
		let rname=SocketSession.getRoomName(socket)

		if (!ROOMS.has(rname)) return
		ROOMS.get(rname).goNextTurn()
	})
	//==========================================================================================
	socket.on("user:extend_timeout", function () {
		let rname=SocketSession.getRoomName(socket)
		let turn=SocketSession.getTurn(socket)
		if (!ROOMS.has(rname)) return
		ROOMS.get(rname).extendTimeout(turn)
	})
	//==========================================================================================

	socket.on("user:turn_roullete", function () {
		let rname=SocketSession.getRoomName(socket)

		io.to(rname).emit("server:turn_roullete")
	})

	socket.on("connection_checker", function () {

		socket.emit("connection_checker")
	})
	socket.on("user:reconnect", function () {
		let rname=SocketSession.getRoomName(socket)
		let turn=SocketSession.getTurn(socket)
		if (!ROOMS.has(rname)) return
		ROOMS.get(rname).user_reconnect(turn)
	})
})

export namespace RoomClientInterface {
	export const updateNextTurn = function (rname: string, turnUpdateData: any) {
		io.to(rname).emit("server:nextturn", turnUpdateData)
	}
	export const syncVisibility = function (rname: string, data: any) {
		io.to(rname).emit("server:sync_player_visibility", data)
	}
	export const rollDice = function (rname: string, data: any) {
		io.to(rname).emit("server:rolldice", data)
	}
	export const startTimeout = function (rname: string, data: any, time: number) {
		io.to(rname).emit("server:start_timeout_countdown", data, time)
	}
	export const stopTimeout = function (rname: string, data: any) {
		io.to(rname).emit("server:stop_timeout_countdown", data)
	}
	export const forceNextturn = function (rname: string, data: any) {
		io.to(rname).emit("server:force_nextturn", data)
	}
	export const sendPendingObs = function (rname: string, name: string, data: any) {
		io.to(rname).emit(name, data)
	}
	export const setSkillReady = function (rname: string, skildata: any) {
		io.to(rname).emit("server:skills", skildata)
	}
	export const sendPendingAction = function (rname: string, name: string, data: any) {
		io.to(rname).emit(name, data)
	}
	export const simulationOver = function (rname: string, msg: string) {
		io.to(rname).emit("server:simulationover", msg)
	}
	export const gameOver = function (rname: string, winner: number) {
		//	console.log(rname)
		io.to(rname).emit("server:gameover", winner)
	}
	export const gameStatReady = function (rname: string, id: string) {
		io.to(rname).emit("server:game_stat_ready", id)
	}
	export const simulationStatReady = function (rname: string, id: string) {
		io.to(rname).emit("server:simulation_stat_ready", id)
	}
}

export class PlayerClientInterface {
	static changeHP = (rname: string, hpChangeData: any) => {
		io.to(rname).emit("server:hp", hpChangeData)
	}
	static changeMoney = (rname: string, turn: number, indicate_amt: number, result: number) => {
		io.to(rname).emit("server:money", { turn: turn, amt: indicate_amt, result: result })
	}

	static changeHP_damage = (rname: string, hpChangeData: any) => io.to(rname).emit("server:damage", hpChangeData)

	static changeHP_heal = (rname: string, hpChangeData: any) => io.to(rname).emit("server:heal", hpChangeData)

	static changeShield = (rname: string, shieldData: any) => io.to(rname).emit("server:shield", shieldData)

	static giveEffect = (rname: string, turn: number, effect: number, num: number) =>
		io.to(rname).emit("server:status_effect", { turn: turn, effect: effect, num: num })

	static giveSpecialEffect = (
		rname: string,
		turn: number,
		name: string,
		data: SpecialEffect.DescriptionData,
		sourcePlayer: string
	) => io.to(rname).emit("server:special_effect", { turn: turn, name: name, data: data, sourcePlayer: sourcePlayer })

	static tp = (rname: string, turn: number, pos: number, movetype: string) =>
		io.to(rname).emit("server:teleport_pos", { turn: turn, pos: pos, movetype: movetype })

	static removeProj = (rname: string, UPID: string) => io.to(rname).emit("server:delete_projectile", UPID)

	static die = (rname: string, killData: Object) => io.to(rname).emit("server:death", killData)

	static respawn = (rname: string, turn: number, respawnPos: number, isRevived: boolean) =>
		io.to(rname).emit("server:respawn", { turn: turn, respawnPos: respawnPos, isRevived: isRevived })

	static message = (rname: string, message: string) => io.to(rname).emit("server:receive_message", "[@]", message)

	static playsound = (rname: string, sound: string) => io.to(rname).emit("server:sound", sound)

	static placePassProj = (rname: string, data:any) =>
		io.to(rname).emit("server:create_passprojectile", data)

	static placeProj = (rname: string, proj: any) => io.to(rname).emit("server:create_projectile", proj)
	
	static summonEntity = (rname: string, entity: any) => io.to(rname).emit("server:create_entity", entity)

	static deleteEntity = (rname: string, UEID:string,iskilled:boolean) => io.to(rname).emit("server:delete_entity", UEID,iskilled)

	static update = (rname: string, type: string, turn: number, amt: any) =>
		io.to(rname).emit("server:update_other_data", { type: type, turn: turn, amt: amt })

	static updateSkillInfo = (rname: string, turn: number, info_kor: string[], info_eng: string[]) =>
		io.to(rname).emit("server:update_skill_info", { turn: turn, info_kor: info_kor, info_eng: info_eng })

	static visualEffect = (rname: string, turn: number, type: string, source: number) =>
		io.to(rname).emit("server:visual_effect", { turn: turn, type: type, source: source })

	static indicateObstacle = (rname: string, turn: number, obs: number) =>
		io.to(rname).emit("server:indicate_obstacle", { turn: turn, obs: obs })

	static indicateItem = (rname: string, turn: number, item: number[]) =>
		io.to(rname).emit("server:indicate_item", { turn: turn, item: item })

	static goStore = (rname: string, turn: number, storeData: Object) =>
		io.to(rname).emit("server:store", {
			turn: turn,
			storeData: storeData
		})
}

app.get("/connection_check", function (req, res) {
	res.end()
})



app.get("/mode_selection", function (req, res, next) {})

app.get("/check_players", function (req, res) {})

app.get("/", function (req, res) {
	res.end(firstpage)
	return
})


// app.get("/getobs_kor", function (req, res) {

// })
app.post("/chat", function (req, res) {
	console.log("chat " + req.body.msg + " " + req.body.turn)
	let room = ROOMS.get(req.session.roomname)
	if (!room || !room.game) {
		return
	}
	io.to(req.session.roomname).emit(
		"server:receive_message",
		room.game.playerSelector.get(Number(req.body.turn)).name +
			"(" +
			SETTINGS.characters[room.game.playerSelector.get(Number(req.body.turn)).champ].name +
			")",
		req.body.msg
	)
	res.end("")
})


app.post("/reset_game", function (req, res) {
	//console.log(req.session)
	let rname=req.session.roomname
	//console.log("reset"+rname)
	if(!ROOMS.has(rname)) return
	ROOMS.get(rname).reset()
	console.log(ROOMS.keys())

	ROOMS.delete(rname)
	io.to(rname).emit("server:quit")
	delete req.session.turn;
	// req.session.destroy((e)=>{console.error("session destroyed")})
	res.redirect("/")
})

app.get("/stat/result", function (req: express.Request, res: express.Response) {
	let rname=req.session.roomname

	if (rname != null && ROOMS.has(rname.toString())) {
		ROOMS.get(rname).reset()
		ROOMS.delete(rname.toString())
	}

	if (req.query.statid == null || req.query.type == null) {
		return
	}
	if (req.query.type === "game") {
		GameRecord.findById(req.query.statid)
			.then((stat: any) => {
				if (!stat) return res.status(404).send({ err: "Statistic not found" })
				res.end(JSON.stringify(stat))
			})
			.catch((err: any) => res.status(500).send(err))
	} else if (req.query.type === "simulation") {
		console.log(req.query)
		SimulationRecord.findOneById(req.query.statid)
			.then((stat: any) => {
				if (!stat) return res.status(404).send({ err: "Statistic not found" })
				res.end(JSON.stringify(stat))
			})
			.catch((err: any) => res.status(500).send(err))
	} else {
		res.status(404).end("unknown statistic type")
	}
	//let str = JSON.stringify(stat)

	//writeStat(str, isSimulation)

	//res.end()
})


function writeStat(stat: any, isSimulation: boolean) {
	let date_ob = new Date()
	let date = ("0" + date_ob.getDate()).slice(-2)

	// current month
	let month = ("0" + (date_ob.getMonth() + 1)).slice(-2)
	// current hours
	let hours = date_ob.getHours()

	// current minutes
	let minutes = date_ob.getMinutes()

	// current seconds
	let seconds = date_ob.getSeconds()

	let currenttime = month + "_" + date + "_" + hours + "_" + minutes + "_" + seconds
	//new Date().toISOString().slice(5, 19).replace(':', ' ').replace('T', ' ')
	console.log(currenttime)
	if (isSimulation) {
		currenttime += "(Simulation)"
	}

	fs.writeFile(__dirname + "/../stats/stat" + currenttime + ".txt", stat, (err) => {
		if (err) {
			console.log(err)
			throw err
		}
		console.log("The statistics have been saved!")
	})
}
