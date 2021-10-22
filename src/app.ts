import { createServer } from "http"
import express from "express"
import fs = require("fs")
import { Game } from "./Game"
import SETTINGS = require("../res/settings.json")
import cors = require("cors")
import os = require("os")
import { Server, Socket } from "socket.io"
import cliProgress = require("cli-progress")

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

var roomList: Room[] = []
var roomNum: number = -1
class Room {
	simulation_total_count: number
	simulation_count: number
	game: Game
	name: string
	hosting: number
	guestnum: number
	isTeam: boolean
	playerlist: {
		type: string
		name: string
		team: string
		champ: number
		ready: boolean
	}[]
	teams: boolean[]
	simulation: boolean
	instant: boolean
	map: number
	stats: any[]
	idleTimeout: ReturnType<typeof setTimeout>

	constructor(name: string) {
		this.simulation_total_count = 1
		this.simulation_count = 1
		this.game = null
		this.name = name
		this.teams = []
		this.hosting = 0
		this.guestnum = 0
		this.isTeam = false
		this.playerlist = this.makePlayerList()
		this.simulation = false
		this.instant = false
		this.map = 0
		this.stats = []
		this.idleTimeout = null
	}

	makePlayerList() {
		let p = []
		for (let i = 0; i < 4; ++i) {
			p.push({
				type: "none",
				name: i + 1 + "P",
				team: "none",
				champ: 0,
				ready: false
			})
		}
		// p[0].card='player_connected'
		return p
	}
	/**
	 * set types of all players
	 * @param {f} types string[]
	 */
	setTypes(types: string[]) {
		for (let i = 0; i < 4; ++i) {
			this.playerlist[i].type = types[i]
		}
	}

	getId() {
		return ++roomNum
	}
	reset() {
		console.log(this.name + "초기화")
		this.name = null
		this.game = null
		this.hosting = 0
		this.guestnum = 0
		this.isTeam = false
		this.playerlist = null
		this.simulation = false
		this.instant = false
		this.map = 0
		this.stats = []
		clearTimeout(this.idleTimeout)
	}
}

function findRoomByName(name: string) {
	if (name == null) return null
	return roomList.filter((r) => r.name === name)[0]
}

app.use(express.static(clientPath))
app.use(errorHandler)
const httpserver = createServer(app)

//http.createServer(app)
const io = new Server(httpserver, {
	cors: {
		origin: "http://127.0.0.1:4000",
		methods: ["GET", "POST"],
		credentials: true
	},
	allowEIO3: true
})
httpserver.listen(4000)
// app.listen(4000, function () {
// 	console.log("listening for requests on port 4000,")
// })

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

		let room = new Room(roomName)
		if (isSimulation) {
			room.instant = true
			room.simulation = true
		}

		if (nickName !== "") {
			room.playerlist[0].name = nickName
		}

		roomList.push(room)
		socket.join(roomName)
	})
	//==========================================================================================
	socket.on("user:register", function (rname: string) {
		let room = findRoomByName(rname)
		if (!room) {
			return
		}
		if (room.hosting <= 0) {
			socket.emit("server:room_full")
		}
		try {
			socket.join(rname)
			let room = findRoomByName(rname)
			if (!room) {
				return
			}
			room.guestnum += 1
			// room.names[1]=nickName
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
			let room = findRoomByName(rname)
			if (!room) {
				return
			}

			//기다리는 플레이어 숫자파악
			room.hosting = playerlist.reduce(function (num: number, val: any) {
				if (val.type === "player") {
					num += 1
				}
				return num
			}, 0)

			console.log("PLAYERLISTUPDATE hosting" + room.hosting)

			//턴바뀌는 일 감지용==========
			let turnchange = [-1, -1, -1, -1]
			for (let i = 0; i < 4; ++i) {
				//서버에 저장되있는 챔피언으로 변경함
				playerlist[i].champ = room.playerlist[i].champ
				if (playerlist[i].type !== "none") {
					turnchange[i] = i
				}
			}
			//[-1 1 -1 3]
			turnchange.sort(function (a, b) {
				if (a === -1) {
					return 1
				}
				if (b === -1) {
					return -1
				}
				return 0
			})
			//======================

			playerlist.sort(function (a: any, b: any) {
				if (a.type === "none") {
					return 1
				}
				if (b.type === "none") {
					return -1
				}
				return 0
			})
			playerlist.map(function (p: any) {
				if (p.type === "none") {
					return {
						type: "none",
						name: "",
						team: "none",
						champ: 0,
						ready: false
					}
				}
			})

			room.playerlist = playerlist
			console.log(room.playerlist)
			console.log(turnchange)
			io.to(rname).emit("server:update_playerlist", room.playerlist, turnchange)
		} catch (e) {
			console.error(e)
		}
	})
	//==========================================================================================
	socket.on("user:update_ready", function (rname: string, turn: number, ready: boolean) {
		console.log(turn + "ready" + ready)
		let room = findRoomByName(rname)
		if (!room) {
			return
		}
		room.playerlist[turn].ready = ready
		io.to(rname).emit("server:update_ready", turn, ready)
	})
	socket.on("user:request_players", function (rname: string, nname: string) {
		try {
			let room = findRoomByName(rname)
			if (!room) {
				return
			}

			let turn = room.playerlist.findIndex((r) => r.type === "player")
			room.playerlist[turn].type = "player_connected"
			if (nname !== "") {
				room.playerlist[turn].name = nname
			}
			console.log(room.playerlist)
			socket.emit("server:registered", turn, room.playerlist)

			socket.broadcast.to(rname).emit("server:update_playerlist", room.playerlist)
		} catch (e) {
			console.error(e)
		}
	})
	//==========================================================================================

	socket.on("user:kick_player", function (rname: string, turn: number) {
		try {
			let room = findRoomByName(rname)
			if (!room) {
				return
			}
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
		let room = findRoomByName(rname)
		if (!room) {
			return
		}
		io.to(rname).emit("server:go_teampage")
	})

	socket.on("user:request_names", function (rname: string) {
		let room = findRoomByName(rname)
		if (!room) {
			return
		}
		let names = []
		for (let i = 0; i < room.playerlist.length; ++i) {
			let n = room.playerlist[i].name
			if (room.playerlist[i].type === "ai") {
				n = SETTINGS.champnames[Number(room.playerlist[i].champ)] + "_Bot(" + String(i + 1) + "P)"
			}

			names.push(n)
		}

		io.to(rname).emit("server:player_names", names)
	})
	//==========================================================================================

	socket.on("user:update_champ", function (rname: string, turn: number, champ: number) {
		let room = findRoomByName(rname)
		if (!room || turn < 0) {
			return
		}
		room.playerlist[turn].champ = champ
		console.log("changechamp" + turn + champ)
	})
	//==========================================================================================

	socket.on("user:update_map", function (rname: string, map: number) {
		let room = findRoomByName(rname)
		if (!room) {
			return
		}
		room.map = map
		io.to(rname).emit("server:map", map)
		console.log("setmap" + room.map)
	})
	//==========================================================================================

	socket.on("user:update_team", function (rname: string, check_status) {
		console.log("set team" + check_status)
		let room = findRoomByName(rname)
		if (!room) {
			return
		}
		room.teams = check_status
		io.to(rname).emit("server:teams", check_status)
	})
	//==========================================================================================

	socket.on("user:gameready", function (rname, instant, simulation_count) {
		let room = findRoomByName(rname)
		if (!room) {
			return
		}
		if (instant) {
			room.simulation = true
			room.simulation_count = simulation_count
			room.simulation_total_count = simulation_count
		}
		room.instant = instant

		// room.aichamplist=aichamplist
		// room.map=map
		console.log("instant" + room.instant)
		room.game = new Game(room.isTeam, room.map, rname, room.simulation, instant)
		//console.log("simulation: "+room.simulation)
		for (let i = 0; i < room.playerlist.length; ++i) {
			// let champ=room.champ[i]
			let team = room.teams[i]
			if (team === null) team = null
			let p = room.playerlist[i]

			if (p.type === "player_connected") {
				room.game.addPlayer(team, p.champ, p.name)
			} else if (p.type === "ai") {
				//시뮬레이션일시 첫번째 ai
				room.game.addAI(
					team,
					p.champ,
					SETTINGS.champnames[Number(p.champ)] + "_Bot(" + String(room.game.totalnum + 1) + "P) "
				)
			}
		}
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
		let room = findRoomByName(rname)
		if (!room || !room.game) {
			socket.emit("server:quit")
			return
		}
		socket.join(rname)
		let setting = room.game.getInitialSetting()
		setting.simulation = room.simulation

		socket.emit("server:initialsetting", setting)
		// all(socket,rname,'initialsetting',setting)
	})
	//==========================================================================================

	socket.on("user:start_game", function (rname: string) {
		let room = findRoomByName(rname)
		if (!room || !room.game) {
			return
		}
		let t = room.game.startTurn()
		if (room.simulation) {
			goNextTurn(rname)
			return
		}

		if (!t) {
			console.log("connecting incomplete")
		} else {
			//socket.emit('nextturn',t)
			io.to(rname).emit("server:nextturn", t)
		}
	})
	//==========================================================================================
	socket.on("start_instant_simulation", function (rname: string) {
		let room = findRoomByName(rname)
		if (!room || !room.game) {
			return
		}

		socket.join(rname)
		console.log("team" + room.isTeam)
		doInstantSimulation(rname, room)
	})

	//==========================================================================================

	socket.on("user:press_dice", function (rname: string, dicenum: number) {
		let room = findRoomByName(rname)
		if (!room) {
			return
		}

		stopTimeout(room, rname)
		let dice = room.game.rollDice(dicenum)

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
		checkObstacle(rname)
	})
	//==========================================================================================

	/**
	 * 클라이언트에서 장애물에 도착 후 0.5초 후에 실행
	 */
	socket.on("user:obstacle_complete", function (rname: string) {
		let room = findRoomByName(rname)
		if (!room) {
			return
		}
		console.log("obscomplete, pendingobs:" + room.game.pendingObs)

		let info = room.game.checkPendingObs()

		if (!info) {
			if (room.game.players[room.game.thisturn].AI) {
				setTimeout(() => room.game.aiSkill(), 300)
				setTimeout(() => goNextTurn(rname), 800)

				console.log("ai go nextturn")
			} else {
				checkPendingAction(rname)
			}
		} else {
			console.log("obscomplete, pendingobs:" + info)

			io.to(rname).emit(info.name, info.argument)

			io.to(rname).emit("server:start_timeout_countdown", room.game.thisturn, SETTINGS.idleTimeout)
			console.log("timeout")

			room.idleTimeout = setTimeout(() => {
				io.to(rname).emit("server:force_nextturn", room.game.thisturn)
				room.game.processPendingObs(false)
				goNextTurn(rname)
			}, SETTINGS.idleTimeout)
		}
	})
	//==========================================================================================

	/**
	 * 선택 장애물(신의손,납치범 등) 선택 완료후 정보 전송 받음
	 * 처리 후 선댁 action(잠수함, 갈림길선택 등) 체크
	 */
	socket.on("user:complete_obstacle_selection", function (rname: string, info: any) {
		console.log("obs selection complete")
		console.log(info)
		let room = findRoomByName(rname)
		if (!room) {
			return
		}

		stopTimeout(room, rname)

		room.game.processPendingObs(info)

		checkPendingAction(rname)
	})
	//==========================================================================================

	/**
	 * 선택 action 선택 완료후 처리
	 * 처리 후 스킬 사용
	 */
	socket.on("user:complete_action_selection", function (rname: string, info: any) {
		console.log("action selection complete")
		console.log(info)
		let room = findRoomByName(rname)
		if (!room) {
			return
		}

		room.game.processPendingAction(info)
		stopTimeout(room, rname)
		showSkillBtn(room, rname)
	})

	//==========================================================================================

	//execute when player clicks skill button, use skill or return targets or return proj positions
	socket.on("user:get_skill_data", function (rname: string, s: number) {
		let room = findRoomByName(rname)
		if (!room) {
			return
		}
		let result = room.game.initSkill(s - 1)
		console.log("getskill")
		console.log(result)

		stopTimeout(room, rname)

		// if (result.type === "targeting" || result.type === "projectile")
		timeoutNoAction(room, rname)

		socket.emit("server:skill_data", result)
	})
	//==========================================================================================
	//execute when player chose a target
	socket.on("user:chose_target", function (rname: string, target: any) {
		console.log("sendtarget")
		let room = findRoomByName(rname)
		if (!room) {
			return
		}
		stopTimeout(room, rname)
		timeoutNoAction(room, rname)
		if (target === "canceled") {
			return
		}
		let status = room.game.useSkillToTarget(target)

		setTimeout(() => socket.emit("server:used_skill", status), 500)
	})
	//==========================================================================================
	//execute when player chose a projectile location
	socket.on("user:chose_location", function (rname: string, location: any) {
		console.log("sendprojlocation")
		let room = findRoomByName(rname)
		if (!room) {
			return
		}
		stopTimeout(room, rname)
		timeoutNoAction(room, rname)
		if (location === "canceled") {
			return
		}

		room.game.placeProj(location)

		socket.emit("server:used_skill", room.game.getSkillStatus())
	})
	//==========================================================================================

	socket.on("user:store_data", function (rname: string, data: any) {
		let room = findRoomByName(rname)
		if (!room) {
			return
		}
		room.game.players[data.turn].updateItem(data)
	})

	//==========================================================================================

	socket.on("user:nextturn", function (rname: string, n: any) {
		goNextTurn(rname)
		console.log("gonextturn")
	})

	//==========================================================================================

	socket.on("user:reset_game", function (rname: string, n: any) {
		let room = findRoomByName(rname)
		if (!room) {
			return
		}
		io.to(rname).emit("server:quit")

		room.reset()
		room = null
		console.log("reset " + findRoomByName(rname))
	})

	//==========================================================================================

	socket.on("user:reload_game", function (rname: string, turn: number) {
		console.log("reloadgame")
		goNextTurn(rname)
	})
	//==========================================================================================
	socket.on("user:extend_timeout", function (rname: string, turn: number) {
		let room = findRoomByName(rname)
		if (!room) {
			return
		}
		if (turn === room.game.thisturn) {
			extendTimeout(room, rname, turn)
		}
	})
	//==========================================================================================

	socket.on("user:turn_roullete", function (rname: string) {
		io.to(rname).emit("server:turn_roullete")
	})
})
function goNextTurn(rname: string) {
	console.log("function gonextturn")
	let room = findRoomByName(rname)
	if (!room) {
		return
	}
	stopTimeout(room, rname)

	let turnUpdateData = room.game.goNextTurn()

	io.to(rname).emit("server:nextturn", turnUpdateData)

	if (room.game.thisturn === 0) {
		io.to(rname).emit("server:sync_player_visibility", room.game.getPlayerVisibilitySyncData())
	}

	if (turnUpdateData == null) return

	if (!turnUpdateData.ai && !turnUpdateData.stun) {
		timeoutNoAction(room, rname)
	}

	//컴퓨터일경우만 주사위 던짐
	if (turnUpdateData.ai && !turnUpdateData.stun) {
		console.log("ai roll dice")
		let dice = room.game.rollDice(-1)
		console.log("stun" + dice)

		if (room.simulation) {
			setTimeout(() => io.to(rname).emit("server:rolldice", dice), 150)
		} else {
			setTimeout(() => io.to(rname).emit("server:rolldice", dice), 500)
		}
	}
}
function checkObstacle(rname: string) {
	let room = findRoomByName(rname)

	if (!room) {
		return
	}

	let obs = room.game.checkObstacle()
	console.log("checkobs" + obs)

	// if(obs==='store'){
	//   io.to(rname).emit('arrive_store',{
	//     street_vendor:false,
	//     who:room.game.thisturn,
	//     storeData:room.game.getStoreData(room.game.thisturn)
	//   })
	// }
	if (obs === -7) {
		if (room.simulation_count <= 1) {
			let winner = room.game.thisturn
			io.to(rname).emit("server:gameover", winner)
		}
	}
}
function checkPendingAction(rname: string) {
	let room = findRoomByName(rname)
	if (!room) {
		return
	}
	console.log("function checkpendingaction" + room.game.pendingAction)
	if (!room.game.pendingAction || room.game.p().dead) {
		showSkillBtn(room, rname)
	} else {
		if (room.game.pendingAction === "submarine") {
			io.to(rname).emit("server:pending_action:submarine", room.game.p().pos)
		}
		if (room.game.pendingAction === "ask_way2") {
			io.to(rname).emit("server:pending_action:ask_way2")
		}

		io.to(rname).emit("server:start_timeout_countdown", room.game.thisturn, SETTINGS.idleTimeout)
		console.log("timeout")

		room.idleTimeout = setTimeout(() => {
			io.to(rname).emit("server:force_nextturn", room.game.thisturn)
			room.game.processPendingAction(false)
			goNextTurn(rname)
		}, SETTINGS.idleTimeout)
	}
}
function showSkillBtn(room: Room, rname: string) {
	let status = room.game.getSkillStatus()
	io.to(rname).emit("server:skills", status)
	timeoutNoAction(room, rname)
}

function stopTimeout(room: Room, rname: string) {
	console.log("stoptimeout")
	io.to(rname).emit("server:stop_timeout_countdown", room.game.thisturn)
	clearTimeout(room.idleTimeout)
}
/**
 * go next turn after 20sec
 */
function timeoutNoAction(room: Room, rname: string) {
	io.to(rname).emit("server:start_timeout_countdown", room.game.thisturn, SETTINGS.idleTimeout)
	console.log("start timeout")
	if (room.game.gameover) {
		return
	}

	room.idleTimeout = setTimeout(() => {
		io.to(rname).emit("server:force_nextturn", room.game.thisturn)
		goNextTurn(rname)
	}, SETTINGS.idleTimeout)
}
/**
 * extend timeout by 20sec
 */

function extendTimeout(room: Room, rname: string, turn: number) {
	io.to(rname).emit("server:stop_timeout_countdown", turn)
	clearTimeout(room.idleTimeout)

	io.to(rname).emit("server:start_timeout_countdown", turn, SETTINGS.idleTimeout)
	console.log("timeout extension")
	room.idleTimeout = setTimeout(() => {
		io.to(rname).emit("server:force_nextturn", turn)
		goNextTurn(rname)
	}, SETTINGS.idleTimeout)
}

function isInstant(rname: string) {
	let room = findRoomByName(rname)
	if (!room) {
		return true
	}
	return room.instant
}

function doInstantSimulation(rname: string, room: Room) {
	let consolelog = console.log
	 console.log = function () {}
	let game = room.game
	let repeat = room.simulation_total_count
	let playercount = game.players.length
	const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
	bar1.start(repeat - 2, 0)
	let startTime: any = new Date()
	let i = 0

	for (i = 0; i < repeat - 1; ++i) {
		game.startTurn()

		let oneGame = true
		while (oneGame) {
			try {
				let obs = simulationNextturn(game)

				if (obs === -7) {
					oneGame = false
				} else {
					game.aiSkill()
				}
			} catch (e) {
				console.error(e)
				console.error(game.thisturn)
			}
		}
		//io.to(rname).emit("instant_num", repeat, i)
		bar1.update(i)

		console.log("-----------------------------------------------------------------------------------------------------")
		room.stats.push(room.game.getFinalStatistics())
		room.game = null
		room.game = new Game(room.isTeam, room.map, rname, room.simulation, true)

		for (let i = 0; i < playercount; ++i) {
			// let champ=room.champ[i]
			let team = room.playerlist[i].team
			if (team === null) team = "none"
			let p = room.playerlist[i]

			room.game.addAI(
				team,
				p.champ,
				SETTINGS.champnames[Number(p.champ)] + "_Bot(" + String(room.game.totalnum + 1) + "P) "
			)
		}

		game = room.game
	}
	bar1.stop()
	let endTime: any = new Date()
	let timeDiff: any = endTime - startTime
	console.log = consolelog
	console.warn("total time:" + timeDiff + "ms, " + timeDiff / repeat + "ms per game")
	io.to(room.game.rname).emit("server:gameover", 0)
}

function simulationNextturn(game: Game) {
	game.goNextTurn()

	game.rollDice(-1)

	return game.checkObstacle()
}

export const changeHP = function (rname: string, hpChangeData: any) {
	if (isInstant(rname)) {
		return
	}
	console.log("Change hp")
	io.to(rname).emit("server:hp", hpChangeData)
}
export const changeHP_damage = function (rname: string, hpChangeData: any) {
	if (isInstant(rname)) {
		return
	}
	console.log("Change hp damage")
	io.to(rname).emit("server:damage", hpChangeData)
}
export const changeHP_heal = function (rname: string, hpChangeData: any) {
	if (isInstant(rname)) {
		return
	}
	console.log("Change hp heal")
	io.to(rname).emit("server:heal", hpChangeData)
}

export const changeShield = function (rname: string, shieldData: any) {
	if (isInstant(rname)) {
		return
	}
	console.log("Change shield" + shieldData.shield)
	io.to(rname).emit("server:shield", shieldData)
}

export const changeMoney = function (rname: string, who: number, amt: number, result: any) {
	if (isInstant(rname)) {
		return
	}
	console.log("change money")

	io.to(rname).emit("server:money", { turn: who, amt: amt, result: result })
}
export const giveEffect = function (rname: string, who: number, effect: number, num: number) {
	if (isInstant(rname)) {
		return
	}
	console.log("change effect" + effect)
	io.to(rname).emit("server:status_effect", { turn: who, effect: effect, num: num })
}
export const tp = function (rname: string, who: number, pos: number, movetype: string) {
	if (isInstant(rname)) {
		return
	}
	console.log("change pos")
	io.to(rname).emit("server:teleport_pos", { turn: who, pos: pos, movetype: movetype })
}
export const removeProj = function (rname: string, UPID: string) {
	if (isInstant(rname)) {
		return
	}
	console.log("remove projectile")
	io.to(rname).emit("server:delete_projectile", UPID)
}
export const die = function (rname: string, killData: any) {
	if (isInstant(rname)) {
		return
	}

	let room = findRoomByName(rname)
	if (!room) {
		return
	}
	console.log(killData.target + " died")

	io.to(rname).emit("server:death", killData)
}

export const respawn = function (rname: string, target: number, respawnPos: number, isRevived: boolean) {
	if (isInstant(rname)) {
		return
	}
	console.log(target + " respawn" + isRevived)

	io.to(rname).emit("server:respawn", target, respawnPos, isRevived)
}

export const message = function (rname: string, message: string) {
	console.log(message)
	if (isInstant(rname)) {
		return
	}
	io.to(rname).emit("server:message", message)
}
export const playsound = function (rname: string, sound: string) {
	if (isInstant(rname)) {
		return
	}
	io.to(rname).emit("server:sound", sound)
}
export const placePassProj = function (rname: string, type: String, pos: number, UPID: string) {
	if (isInstant(rname)) {
		return
	}
	io.to(rname).emit("server:create_passprojectile", type, pos, UPID)
}
export const placeProj = function (rname: string, proj: any) {
	if (isInstant(rname)) {
		return
	}
	io.to(rname).emit("server:create_projectile", proj)
}

export const update = function (rname: string, type: string, turn: number, amt: any) {
	if (isInstant(rname)) {
		return
	}
	console.log("update " + type)
	io.to(rname).emit("server:update_other_data", type, turn, amt)
}

export const updateSkillInfo = function (rname: string, turn: number, info_kor: string[], info_eng: string[]) {
	if (isInstant(rname)) {
		return
	}
	console.log("update_skill_info ")
	io.to(rname).emit("server:update_skill_info", turn, info_kor, info_eng)
}

export const effect = function (rname: string, turn: number, type: string) {
	if (isInstant(rname)) {
		return
	}
	console.log("effect " + type)
	io.to(rname).emit("server:visual_effect", turn, type)
}
export const indicateObstacle = function (rname: string, turn: number, obs: number) {
	if (isInstant(rname)) {
		return
	}
	io.to(rname).emit("server:indicate_obstacle", turn, obs)
}

export const goStore = function (rname: string, turn: number, storedata: any) {
	if (isInstant(rname)) {
		return
	}

	io.to(rname).emit("server:store", {
		turn: turn,
		storeData: storedata
		//room.game.getStoreData(room.game.thisturn)
	})
}
app.get("/rooms", function (req, res, next) {
	let list = ""

	for (let r of roomList) {
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
	if (room.game.mapId === 1) {
		fs.readFile(__dirname + "/../res/ocean_map.json", "utf8", function (err, data) {
			res.end(data)
		})
	} else if (room.game.mapId === 2) {
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
	console.log("chat " + req.body.msg + " " + req.body.rname)
	let room = findRoomByName(req.body.rname)
	if (!room || !room.game) {
		return
	}
	io.to(req.body.rname).emit(
		"server:receive_message",
		room.game.players[req.body.turn].name +
			"(" +
			SETTINGS.champnames[room.game.players[req.body.turn].champ] +
			"): " +
			req.body.msg
	)
	res.end("")
})
app.post("/reset_game", function (req, res) {
	let room = findRoomByName(req.body.rname)
	if (!room) {
		return
	}
	io.to(req.body.rname).emit("server:quit")
	room.reset()
	room = null
	res.end()
})

app.get("/stat", function (req: any, res) {
	if (req.query.rname == null) return
	let room = findRoomByName(req.query.rname)
	if (!room) {
		return
	}
	let stat = {}

	let isSimulation = false
	if (room.stats.length === 0) {
		stat = room.game.getFinalStatistics()
	} else {
		stat = {
			stat: room.stats,
			count: room.stats.length,
			multiple: true,
			map: room.game.mapId
		}

		room.game = null
		isSimulation = true
	}
	let str = JSON.stringify(stat)

	writeStat(str, isSimulation)

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
