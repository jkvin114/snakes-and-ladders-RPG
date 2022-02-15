import { createServer } from "http"
import express from "express"
import fs = require("fs")
import { Game } from "./Game"
import { Room } from "./room"
import { MAP_TYPE } from "./enum"
import SETTINGS = require("../res/globalsettings.json")
import cors = require("cors")
import os = require("os")
import { Namespace, Server, Socket } from "socket.io"
import cliProgress = require("cli-progress")
import {GameRecord,Test,SimulationRecord} from "./statisticsDB"
const app = express()

console.log("start server")

const clientPath = `${__dirname}/../../SALR-android-webview-master`
const firstpage = fs.readFileSync(__dirname + "/../../SALR-android-webview-master/index.html", "utf8")
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
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
console.log("IP Address:" + addresses[0])

var ROOMS = new Map<string,Room>()

function findRoomByName(name: string): Room {
	return ROOMS.get(name)
}

app.use(express.static(clientPath))
app.use(errorHandler)
const httpserver = createServer(app)
console.log("version " +SETTINGS.version)
const io = new Server(httpserver, {
	cors: {
		origin: "http://127.0.0.1:4000",
		methods: ["GET", "POST"],
		credentials: true
	},
	allowEIO3: true
})
httpserver.listen(4000)

io.on("listen", function () {
	console.log("listen")
})
io.on("error", function (e: any) {
	console.log(e)
})
function errorHandler(err: any, req: any, res: any, next: any) {
	res.send("error!!" + err)
}

io.on("disconnect", function (socket: Socket) {
	console.log("disconnected")
})

app.on("error", (err: any) => {
	console.error("Server error:", err)
})

io.on("connect", function (socket: Socket) {
	console.log(`${socket.id} is connected`)

	socket.on("user:create_room", function (roomName: string, nickName: string, isSimulation: boolean) {
		//방이름 중복체크
		if (findRoomByName(roomName) != null) {
			socket.emit("server:room_name_exist")
			return
		}
/*
		Test.create({name:"hello",turn:2,sub:{name:"d"}})
		.then((resolvedData)=>console.log(resolvedData))
		.catch((e)=>console.error(e))
*/
		let room = new Room(roomName).setSimulation(isSimulation).setNickname(nickName, 0)
		ROOMS.set(roomName, room)

		socket.join(roomName)


	})
	//==========================================================================================
	socket.on("user:register", function (rname: string) {
		if (!ROOMS.has(rname)) return
		let room = ROOMS.get(rname)

		if (room.hosting <= 0) {
			socket.emit("server:room_full")
		}
		try {
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
	socket.on("user:update_playerlist", function (rname: string, playerlist: any) {
		try {
			console.log(ROOMS)
			if (!ROOMS.has(rname)) return
			let room = ROOMS.get(rname)
			let turnchange = room.user_updatePlayerList(playerlist)

			console.log(room.playerlist)
			console.log(turnchange)
			io.to(rname).emit("server:update_playerlist", room.playerlist, turnchange)
		} catch (e) {
			console.error(e)
		}
	})
	//==========================================================================================
	socket.on("user:update_ready", function (rname: string, turn: number, ready: boolean) {
		if (!ROOMS.has(rname)) return
		ROOMS.get(rname).user_updateReady(turn, ready)

		io.to(rname).emit("server:update_ready", turn, ready)
	})
	socket.on("user:request_players", function (rname: string, nickname: string) {
		try {
			if (!ROOMS.has(rname)) return
			let room = ROOMS.get(rname)
			let turn = room.user_requestPlayers(nickname)

			socket.emit("server:registered", turn, room.playerlist)
			socket.broadcast.to(rname).emit("server:update_playerlist", room.playerlist)
		} catch (e) {
			console.error(e)
		}
	})
	//==========================================================================================

	socket.on("user:kick_player", function (rname: string, turn: number) {
		try {
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

	socket.on("user:go_teampage", function (rname: string) {
		if (!ROOMS.has(rname)) return
		ROOMS.get(rname).setTeamGame()
		io.to(rname).emit("server:go_teampage")
	})

	socket.on("user:request_names", function (rname: string) {
		if (!ROOMS.has(rname)) return
		let names = ROOMS.get(rname).user_requestNames()

		io.to(rname).emit("server:player_names", names)
	})
	//==========================================================================================

	socket.on("user:update_champ", function (rname: string, turn: number, champ: number) {
		if (!ROOMS.has(rname)) return
		ROOMS.get(rname).user_updateChamp(turn, champ)

		console.log("changechamp" + turn + champ)
	})
	//==========================================================================================

	socket.on("user:update_map", function (rname: string, map: number) {
		if (!ROOMS.has(rname)) return
		ROOMS.get(rname).user_updateMap(map)

		io.to(rname).emit("server:map", map)
		console.log("setmap" + map)
	})
	//==========================================================================================

	socket.on("user:update_team", function (rname: string, check_status) {
		console.log("set team" + check_status)
		if (!ROOMS.has(rname)) return
		ROOMS.get(rname).user_updateTeams(check_status)
		io.to(rname).emit("server:teams", check_status)
	})
	//==========================================================================================

	socket.on("user:simulationready",function(rname,setting,count,isTeam){
		if (!ROOMS.has(rname)) return
		
		console.log(setting)
		console.log("team:"+isTeam+"   count:"+count)

		ROOMS.get(rname).user_simulationReady(setting, count,isTeam, rname)

		
	})

	socket.on("user:gameready", function (rname,setting) {
		if (!ROOMS.has(rname)) return

		ROOMS.get(rname).user_gameReady(setting, rname)
		
		
		//게스트 페이지 바꾸기
		socket.to(rname).emit("server:to_gamepage")
	})
	//==========================================================================================

	//즉시 시뮬레이션 전용
	socket.on("server:join_room", function (rname: string) {
		let room = findRoomByName(rname)
		if (!room) {
			return
		}
		socket.join(rname)
	})
	//==========================================================================================

	socket.on("user:requestsetting", function (rname: string) {
		if (!ROOMS.has(rname)) return
		let room = ROOMS.get(rname)
		if (!room.game) {
			socket.emit("server:quit")
			return
		}
		socket.join(rname)
		let setting = room.user_requestSetting()

		socket.emit("server:initialsetting", setting)
	})
	//==========================================================================================

	socket.on("user:start_game", function (rname: string) {
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
	socket.on("start_instant_simulation", function (rname: string) {
		if (!ROOMS.has(rname)) return

		socket.join(rname)
		ROOMS.get(rname).doInstantSimulation()
	})

	//==========================================================================================

	socket.on("user:press_dice", function (rname: string, dicenum: number) {
		if (!ROOMS.has(rname)) return
		let dice = ROOMS.get(rname).user_pressDice(dicenum)

		io.to(rname).emit("server:rolldice", dice)

		console.log("pressdice")
	})
	//==========================================================================================

	/**
	 * 장애물에 도착하는 즉시 실행
	 * -장애물 효과 받음
	 * -게임오버 체크
	 */
	socket.on("user:arrive_square", function (rname: string) {
		if (!ROOMS.has(rname)) return
		let winner = ROOMS.get(rname).user_arriveSquare()

		if (winner != null) {
			io.to(rname).emit("server:gameover", winner)
		}
	})
	//==========================================================================================

	/**
	 * 클라이언트에서 장애물에 도착 후 0.5초 후에 실행
	 */
	socket.on("user:obstacle_complete", function (rname: string) {
		if (!ROOMS.has(rname)) return
		ROOMS.get(rname).user_obstacleComplete()
	})
	//==========================================================================================

	/**
	 * 선택 장애물(신의손,납치범 등) 선택 완료후 정보 전송 받음
	 * 처리 후 선댁 action(잠수함, 갈림길선택 등) 체크
	 */
	socket.on("user:complete_obstacle_selection", function (rname: string, info: any) {
		console.log("obs selection complete")
		if (!ROOMS.has(rname)) return
		ROOMS.get(rname).user_completePendingObs(info)
	})
	//==========================================================================================

	/**
	 * 선택 action 선택 완료후 처리
	 * 처리 후 스킬 사용
	 */
	socket.on("user:complete_action_selection", function (rname: string, info: any) {
		console.log("action selection complete")
		if (!ROOMS.has(rname)) return
		ROOMS.get(rname).user_completePendingAction(info)
	})

	//==========================================================================================

	//execute when player clicks skill button, use skill or return targets or return proj positions
	socket.on("user:get_skill_data", function (rname: string, s: number) {
		if (!ROOMS.has(rname)) return
		let room = ROOMS.get(rname)
		let result = room.user_clickSkill(s)
		socket.emit("server:skill_data", result)
	})
	//==========================================================================================
	//execute when player chose a target
	socket.on("user:chose_target", function (rname: string, target: any) {
		console.log("sendtarget")
		if (!ROOMS.has(rname)) return
		let status = ROOMS.get(rname).user_choseSkillTarget(target)

		if (status != null) {
			setTimeout(() => socket.emit("server:used_skill", status), 500)
		}
	})
	//==========================================================================================
	//execute when player chose a projectile location
	socket.on("user:chose_location", function (rname: string, location: any) {
		console.log("sendprojlocation")
		if (!ROOMS.has(rname)) return
		let skillstatus = ROOMS.get(rname).user_choseSkillLocation(location)
		socket.emit("server:used_skill", skillstatus)
	})
	//==========================================================================================

	socket.on("user:store_data", function (rname: string, data: any) {
		if (!ROOMS.has(rname)) return
		ROOMS.get(rname).user_storeComplete(data)
	})

	//==========================================================================================

	socket.on("user:nextturn", function (rname: string, n: any) {
		if (!ROOMS.has(rname)) return
		ROOMS.get(rname).goNextTurn()

		console.log("gonextturn")
	})

	//==========================================================================================

	socket.on("user:reset_game", function (rname: string, quitter: number) {
		if (!ROOMS.has(rname)) return
		let room = ROOMS.get(rname)
		io.to(rname).emit("server:quit",quitter)
		console.log("reset " + findRoomByName(rname))

		try{
			room.reset()
		}
		catch(e){
			console.error("Error while resetting room "+e)
		}
		
		ROOMS.delete(rname)
	})

	//==========================================================================================

	socket.on("user:reload_game", function (rname: string, turn: number) {
		console.log("reloadgame")
		if (!ROOMS.has(rname)) return
		ROOMS.get(rname).goNextTurn()
	})
	//==========================================================================================
	socket.on("user:extend_timeout", function (rname: string, turn: number) {
		if (!ROOMS.has(rname)) return
		ROOMS.get(rname).extendTimeout(turn)
	})
	//==========================================================================================

	socket.on("user:turn_roullete", function (rname: string) {
		io.to(rname).emit("server:turn_roullete")
	})
})


function isInstant(rname: string) {
	if (!ROOMS.has(rname)) return true

	return ROOMS.get(rname).instant
}

export namespace RoomClientInterface{
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
	export const simulationOver = function (rname: string,msg:string) {
		io.to(rname).emit("server:simulationover", msg)
	}
}



export class PlayerClientInterface{

	static changeHP=(rname:string,hpChangeData: any) =>{
		io.to(rname).emit("server:hp", hpChangeData)
	} 
	static changeMoney = (rname: string,turn:number,amt:number,result:number) =>{
		io.to(rname).emit("server:money", { turn: turn, amt: amt, result:result })
	}

	static changeHP_damage = (rname: string, hpChangeData: any) =>
	io.to(rname).emit("server:damage", hpChangeData)

	static changeHP_heal =  (rname: string, hpChangeData: any)=>
	io.to(rname).emit("server:heal", hpChangeData)

	static changeShield = (rname: string, shieldData: any)=>
	io.to(rname).emit("server:shield", shieldData)

	static giveEffect = (rname: string,turn:number,effect:number,num:number)=>
	io.to(rname).emit("server:status_effect", { turn: turn, effect: effect, num: num })

	static tp =  (rname: string,turn:number,pos:number,movetype:string)=>
	io.to(rname).emit("server:teleport_pos", { turn: turn, pos: pos, movetype: movetype})
	
	static removeProj =  (rname: string, UPID: string)=>
	io.to(rname).emit("server:delete_projectile", UPID)
	
	static die =  (rname: string, killData: Object)=>io.to(rname).emit("server:death", killData)
	
	static respawn =  (rname: string,turn:number,respawnPos:number,isRevived:boolean) =>
	io.to(rname).emit("server:respawn", {turn:turn,respawnPos:respawnPos,isRevived:isRevived})
	
	static message = (rname: string, message: string) =>
	io.to(rname).emit("server:receive_message", message)

	static playsound =  (rname: string, sound: string) =>
		io.to(rname).emit("server:sound", sound)
	
	static placePassProj =  (rname: string,type:string,pos:number,UPID:string)=>
		io.to(rname).emit("server:create_passprojectile",{type:type,pos:pos,UPID:UPID})

	static placeProj =  (rname: string, proj: any)=>
	io.to(rname).emit("server:create_projectile", proj)

	static update =  (rname: string,type:string,turn:number,amt:any) =>
	io.to(rname).emit("server:update_other_data",{type:type,turn:turn,amt:amt})

	static updateSkillInfo =  (rname: string, turn:number,info_kor:string[],info_eng:string[])=>
		io.to(rname).emit("server:update_skill_info", {turn:turn,info_kor:info_kor,info_eng:info_eng})


	static visualEffect = (rname: string,turn:number,type:string,source:number)=>
		io.to(rname).emit("server:visual_effect",{turn:turn,type:type,source:source})
	
	static indicateObstacle =  (rname: string,turn:number,obs:number )=>
		io.to(rname).emit("server:indicate_obstacle",{turn:turn,obs:obs})

	static indicateItem = (rname: string, turn:number,item:number[])=>
		io.to(rname).emit("server:indicate_item",{turn:turn,item:item})
	
	static goStore = (rname: string,turn:number,storeData:Object)=>
		io.to(rname).emit("server:store", {
			turn: turn,
			storeData: storeData
		})
}

app.get("/gamesetting",function(req,res){

	fs.readFile(__dirname + "/../res/gamesetting.json", "utf8", function (err, data) {
		res.end(data)
	})
})
app.get("/simulationsetting",function(req,res){

	fs.readFile(__dirname + "/../res/simulationsetting.json", "utf8", function (err, data) {
		res.end(data)
	})
})
app.get("/globalsetting",function(req,res){

	fs.readFile(__dirname + "/../res/globalsettings.json", "utf8", function (err, data) {
		res.end(data)
	})
})
app.get("/rooms", function (req, res, next) {
	let list = ""

	for (let r of ROOMS.values()) {
		if (r.hosting > 0) {
			list += r.name + "||"
		}
	}
	console.log("getrooms" + list)
	res.send(list)
})

app.get("/mode_selection", function (req, res, next) {})

app.get("/check_players", function (req, res) {})

app.get("/", function (req, res) {
	res.end(firstpage)
	return
})

app.post("/signup", function (req, res) {
	res.writeHead(302, { Location: "/" }) //mysql 사용안함
	res.end()
	return

	var html = fs.readFileSync(__dirname + "/../newclient/signup.html", "utf8")
	if (!req.body) {
		res.end(html)
	}
	var id = req.body.id.toString()
	var pw = req.body.pw
	var pw2 = req.body.pw2
})

app.post("/signin", function (req, res) {
	if (req.body === null) {
		res.end()
	}
})

app.post("/logout", function (req, res) {
	req.session.destroy(function (e) {
		if (e) {
			throw e
		}
		res.redirect("/")
	})
})

app.get("/map", function (req: any, res) {
	let room = findRoomByName(req.query.rname)
	if (!room) {
		return
	}
	if (room.game.mapId === MAP_TYPE.OCEAN) {
		fs.readFile(__dirname + "/../res/ocean_map.json", "utf8", function (err, data) {
			res.end(data)
		})
	} else if (room.game.mapId === MAP_TYPE.CASINO) {
		fs.readFile(__dirname + "/../res/casino_map.json", "utf8", function (err, data) {
			res.end(data)
		})
	} else {
		fs.readFile(__dirname + "/../res/map.json", "utf8", function (err, data) {
			res.end(data)
		})
	}
})

app.get("/item", function (req, res) {
	fs.readFile(__dirname + "/../res/item.json", "utf8", function (err, data) {
		res.end(data)
	})
})

app.get("/obstacle", function (req, res) {
	console.log(req.query.lang)
	if (req.query.lang === "kor") {
		fs.readFile(__dirname + "/../res/obstacles_kor.json", "utf8", function (err, data) {
			res.end(data)
		})
	} else {
		fs.readFile(__dirname + "/../res/obstacles.json", "utf8", function (err, data) {
			res.end(data)
		})
	}
})

app.get("/string_resource", function (req, res) {
	fs.readFile(__dirname + "/../res/string_resource.json", "utf8", function (err, data) {
		res.end(data)
	})
})
// app.get("/getobs_kor", function (req, res) {

// })
app.post("/chat", function (req, res) {
	console.log("chat " + req.body.msg + " " + req.body.turn)
	let room = findRoomByName(req.body.rname)
	if (!room || !room.game) {
		return
	}
	io.to(req.body.rname).emit(
		"server:receive_message",
		room.game.playerSelector.get(Number(req.body.turn)).name +
			"(" +
			SETTINGS.characters[room.game.playerSelector.get(Number(req.body.turn)).champ].name +
			"): " +
			req.body.msg
	)
	res.end("")
})
app.post("/reset_game", function (req, res) {
	ROOMS.delete(req.body.rname)
	io.to(req.body.rname).emit("server:quit")

	res.end()
})

app.get("/stat", function (req: any, res) {
	if (req.query.rname == null || !ROOMS.has(req.query.rname)) return
	let room = ROOMS.get(req.query.rname)

	let stat = {}

	let isSimulation = false
	if (room.simulation===null) {
		stat = room.game.getFinalStatistics()

		GameRecord.create(stat)
		.then((resolvedData)=>console.log("stat saved successfully"))
		.catch((e)=>console.error(e))

	} else {
		stat = {
			stat: room.simulation.getFinalStatistics(),
			count: room.simulation.getCount(),
			multiple: true,
			version:SETTINGS.version
		}

		ROOMS.delete(req.query.rname)
		SimulationRecord.create(stat)
		.then((resolvedData)=>console.log("stat saved successfully"))
		.catch((e)=>console.error(e))
	}
	let str = JSON.stringify(stat)

	//writeStat(str, isSimulation)

	res.end(str)
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
