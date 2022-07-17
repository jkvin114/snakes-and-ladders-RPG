import type { Socket } from "socket.io";
import { io } from "../app";
import { R } from "../RoomStorage";
import { SocketSession } from "../SocketSession";
import { ClientPayloadInterface, ServerPayloadInterface } from "../data/PayloadInterface";
import { RPGRoom } from "../RPGRoom";
const { User } = require("../mongodb/DBHandler")
module.exports=function(socket:Socket){

	socket.on("user:simulationready", function (setting:ClientPayloadInterface.SimulationSetting, count:number, isTeam:boolean) {
		if (!SocketSession.getUsername(socket)) {
			console.error("user not logined for simulation")
			return
		}

		let rname = "simulation_" + String(Math.floor(Math.random() * 1000000))
		SocketSession.setRoomName(socket, rname)
		socket.join(rname)

		let room = new RPGRoom(rname).setSimulation(true)
		.registerSimulationClientInterface(function(roomname:string,type:string,...args:unknown[]){
			io.to(roomname).emit(type,...args)
		})

		R.setRPGRoom(rname, room)

		let u = SocketSession.getUsername(socket)
		User.findOneByUsername(u)
			.then((user: any) => {
				console.log(setting)
				console.log("team:" + isTeam + "   count:" + count + "runner:" + user._id)

				room.user_simulationStart(setting, count, isTeam, user._id.toString())
			})
			.catch((e: Error) => {

				console.error(e)
				console.error("Invalid user")
			})
	})

	socket.on("user:gameready", function (setting:ClientPayloadInterface.GameSetting) {
		let rname = SocketSession.getRoomName(socket)

		if (!R.hasRoom(rname)) return

		R.getRPGRoom(rname).user_gameReady(setting, rname)

		//게스트 페이지 바꾸기
		socket.to(rname).emit("server:to_gamepage")
	})
	
	//==========================================================================================

	//즉시 시뮬레이션 전용
	socket.on("server:join_room", function () {
		let rname = SocketSession.getRoomName(socket)

		let room = R.getRPGRoom(rname)
		if (!room) {
			return
		}
		socket.join(rname)
	})
	//==========================================================================================

	socket.on("user:requestsetting", function () {
		let rname = SocketSession.getRoomName(socket)
		let turn = SocketSession.getTurn(socket)
		if (!R.hasRPGRoom(rname)) return
		let room =R.getRPGRoom(rname)
		if (!room.gameloop) {
			socket.emit("server:quit")
			return
		}
		socket.join(rname)
		let setting:ServerPayloadInterface.initialSetting = room.user_requestSetting()

		socket.emit("server:initialsetting", setting, turn, room.cryptTurn(turn))
	})
	//==========================================================================================

	socket.on("user:start_game", function () {
		let rname = SocketSession.getRoomName(socket)

		if (!R.hasRPGRoom(rname)) return
		let room = R.getRPGRoom(rname)
		//if (!room.game) return

		let canstart = room.user_startGame()
		if (!canstart) {
			console.log("connecting incomplete")
		}
	})
	//==========================================================================================
	socket.on("start_instant_simulation", function () {
		let rname = SocketSession.getRoomName(socket)

		if (!R.hasRPGRoom(rname)) return

		//socket.join(rname)
	//	R.getRPGRoom(rname).doInstantSimulation()
	})

	socket.on("user:update", function (type:string,data:any) {
		//	console.log("action selection complete")
		let rname = SocketSession.getRoomName(socket)

		if (!R.hasRPGRoom(rname)) return
		// if (!ROOMS.get(rname).isThisTurn(crypt_turn)) return
		R.getRPGRoom(rname).gameloop.user_update(SocketSession.getTurn(socket),type,data)
	})
	
	//==========================================================================================

	
	//==========================================================================================

	/**
	 * 장애물에 도착하는 즉시 실행
	 * -장애물 효과 받음
	 * -게임오버 체크
	 */
	socket.on("user:arrive_square", function () {
		let rname = SocketSession.getRoomName(socket)
		if (!R.hasRPGRoom(rname)) return
		//ROOMS.get(rname).user_arriveSquare()
	})
	//==========================================================================================

	/**
	 * 클라이언트에서 장애물에 도착 후 0.5초 후에 실행
	 */
	socket.on("user:obstacle_complete", function () {
		let rname = SocketSession.getRoomName(socket)

		if (!R.hasRPGRoom(rname)) return
		//ROOMS.get(rname).user_obstacleComplete()
	})
	//==========================================================================================

	/**
	 * 선택 장애물(신의손,납치범 등) 선택 완료후 정보 전송 받음
	 * 처리 후 선댁 action(잠수함, 갈림길선택 등) 체크
	 */
	socket.on("user:complete_obstacle_selection", function (crypt_turn:string,info: ClientPayloadInterface.PendingObstacle) {
		//	console.log("obs selection complete")

		let rname = SocketSession.getRoomName(socket)

	//	console.log("complete_obstacle_selection")

		if (!R.hasRPGRoom(rname)) return
		// if (!ROOMS.get(rname).isThisTurn(crypt_turn)) return
		R.getRPGRoom(rname).gameloop.user_completePendingObs(info,crypt_turn)
	})
	//==========================================================================================
	
	/**
	 * 선택 action 선택 완료후 처리
	 * 처리 후 스킬 사용
	 */
	socket.on("user:complete_action_selection", function (crypt_turn:string,info: ClientPayloadInterface.PendingAction) {
		//	console.log("action selection complete")
		let rname = SocketSession.getRoomName(socket)

		if (!R.hasRPGRoom(rname)) return
		// if (!ROOMS.get(rname).isThisTurn(crypt_turn)) return
		R.getRPGRoom(rname).gameloop.user_completePendingAction(info,crypt_turn)
	})
	//execute when player clicks basic attack
	socket.on("user:basicattack", function (crypt_turn: string) {
		let rname = SocketSession.getRoomName(socket)

		if (!R.hasRPGRoom(rname)) return
		// if (!ROOMS.get(rname).isThisTurn(crypt_turn)) return
		let room = R.getRPGRoom(rname)
		room.gameloop.user_basicAttack(crypt_turn)
	})
	//==========================================================================================
	socket.on("user:press_dice", function (crypt_turn: string, dicenum: number) {
		let rname = SocketSession.getRoomName(socket)

		if (!R.hasRPGRoom(rname)) return
		if (!R.getRPGRoom(rname).isThisTurn(crypt_turn)) return

		let dice = R.getRPGRoom(rname).gameloop.user_pressDice(dicenum,crypt_turn)
		//console.log("press_dice" + dice)
		if(dice!=null)
			io.to(rname).emit("server:rolldice", dice)

		//	console.log("pressdice")
	})
    //execute when player clicks skill button, use skill or return targets or return proj positions
	socket.on("user:get_skill_data", function (crypt_turn: string, s: number) {
		let rname = SocketSession.getRoomName(socket)

		if (!R.hasRPGRoom(rname)) return
		if (!R.getRPGRoom(rname).isThisTurn(crypt_turn)) return
		let room = R.getRPGRoom(rname)
		let result = room.gameloop.user_clickSkill(s,crypt_turn)
	//	console.log(result)
		socket.emit("server:skill_data", result)
	})
	
	//==========================================================================================
	//execute when player chose a target
	socket.on("user:chose_target", function (crypt_turn: string, target: number) {
		//	console.log("sendtarget")
		let rname = SocketSession.getRoomName(socket)

		if (!R.hasRPGRoom(rname)) return
		// if (!ROOMS.get(rname).isThisTurn(crypt_turn)) return
		R.getRPGRoom(rname).gameloop.user_choseSkillTarget(target,crypt_turn)

		// if (status != null) {
		// 	setTimeout(() => socket.emit("server:used_skill", status), 500)
		// }
	})
	//==========================================================================================
	//execute when player chose a projectile location
	socket.on("user:chose_location", function (crypt_turn: string, location: number) {
		//	console.log("sendprojlocation")
		let rname = SocketSession.getRoomName(socket)

		if (!R.hasRPGRoom(rname)) return
		// if (!ROOMS.get(rname).isThisTurn(crypt_turn)) return
		R.getRPGRoom(rname).gameloop.user_choseSkillLocation(location,crypt_turn)
		// socket.emit("server:used_skill", skillstatus)
	})
	socket.on("user:chose_area_skill_location", function (crypt_turn: string, location: number) {
		//	console.log("sendprojlocation")
		let rname = SocketSession.getRoomName(socket)

		if (!R.hasRPGRoom(rname)) return
		// if (!ROOMS.get(rname).isThisTurn(crypt_turn)) return
		R.getRPGRoom(rname).gameloop.user_choseAreaSkillLocation(location,crypt_turn)
		// socket.emit("server:used_skill", skillstatus)
	})
	//==========================================================================================

	socket.on("user:store_data", function (data: ClientPayloadInterface.ItemBought) {
		let rname = SocketSession.getRoomName(socket)

		if (!R.hasRPGRoom(rname)) return

		R.getRPGRoom(rname).gameloop.user_storeComplete(data)
	})

	//==========================================================================================

	socket.on("user:nextturn", function (crypt_turn: string) {
		let rname = SocketSession.getRoomName(socket)

		if (!R.hasRPGRoom(rname)) return
		if (!R.getRPGRoom(rname).isThisTurn(crypt_turn)) return
		R.getRPGRoom(rname).gameloop.startNextTurn(false)
	})

	//==========================================================================================

	socket.on("user:reset_game", function () {
		let rname = SocketSession.getRoomName(socket)
		let quitter = SocketSession.getTurn(socket)
		//console.log(rname, quitter)
		if (!R.hasRPGRoom(rname)) return
		let room = R.getRPGRoom(rname)
		io.to(rname).emit("server:quit", quitter)
		console.log("an user has been disconnected " + R.getRPGRoom(rname))

		try {
			room.reset()
		} catch (e) {
			console.error("Error while resetting room " + e)
		}

		R.remove(rname)
	})

	socket.on("user:turn_roullete", function () {
		let rname = SocketSession.getRoomName(socket)

		io.to(rname).emit("server:turn_roullete")
	})

}