import type { Socket } from "socket.io";
import { io } from "../app";
import { R } from "../RoomStorage";
import { SocketSession } from "./SocketSession";
import { ClientInputEventFormat, ServerGameEventFormat } from "../data/EventFormat";
import { RPGRoom } from "../RPGRoom";
import { controlRoom, controlRPGRoom } from "./Controller";
const { User } = require("../mongodb/DBHandler")
module.exports=function(socket:Socket){

	socket.on("user:simulationready", function (setting:ClientInputEventFormat.SimulationSetting, count:number, isTeam:boolean) {
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

	socket.on("user:gameready", function (setting:ClientInputEventFormat.GameSetting) {
		let rname = SocketSession.getRoomName(socket)

		if (!R.hasRoom(rname)) return

		R.getRPGRoom(rname)?.user_gameReady(setting, rname)

		//게스트 페이지 바꾸기
		socket.to(rname).emit("server:to_gamepage")
	})
	
	//==========================================================================================

	//즉시 시뮬레이션 전용
	socket.on("server:join_room", function () {
		controlRoom(socket,(room,rname)=>{
			socket.join(rname)
		})
		
	})
	//==========================================================================================

	socket.on("user:requestsetting", function () {
		// let rname = SocketSession.getRoomName(socket)
		// let turn = SocketSession.getTurn(socket)
		// if (!R.hasRPGRoom(rname)) return
		// let room =R.getRPGRoom(rname)
		
		controlRPGRoom(socket,(room,rname,turn)=>{
			if (!room.hasGameLoop()) {
				socket.emit("server:quit")
				return
			}
			socket.join(rname)
			let setting:ServerGameEventFormat.initialSetting = room.user_requestSetting()
			let newturn= room.getChangedTurn(turn)
			SocketSession.setTurn(socket,newturn)
	
			socket.emit("server:initialsetting", setting, newturn, room.getGameTurnToken(newturn))
		})

		// if (!room.hasGameLoop()) {
		// 	socket.emit("server:quit")
		// 	return
		// }
		// socket.join(rname)
		// let setting:ServerGameEventInterface.initialSetting = room.user_requestSetting()

		// socket.emit("server:initialsetting", setting, turn, room.cryptTurn(turn))
	})
	//==========================================================================================

	socket.on("user:start_game", function () {
		//if (!room.game) return
		controlRPGRoom(socket,(room,rname,turn)=>{
			let canstart = room.user_startGame()
			if (!canstart) {
				console.log("connecting incomplete")
			}
		})
		
	})
	//==========================================================================================
	socket.on("start_instant_simulation", function () {
		// let rname = SocketSession.getRoomName(socket)

		// if (!R.hasRPGRoom(rname)) return

		//socket.join(rname)
	//	R.getRPGRoom(rname).doInstantSimulation()
	})

	socket.on("user:update", function (type:string,data:any) {
		//	console.log("action selection complete")
		// let rname = SocketSession.getRoomName(socket)

		// if (!R.hasRPGRoom(rname)) return
		// if (!ROOMS.get(rname).isThisTurn(crypt_turn)) return
		controlRPGRoom(socket,(room,rname,turn)=>{
			room.getGameLoop.user_update(SocketSession.getTurn(socket),type,data)
		})

		// R.getRPGRoom(rname)
	})
	
	//==========================================================================================

	
	//==========================================================================================

	/**
	 * 장애물에 도착하는 즉시 실행
	 * -장애물 효과 받음
	 * -게임오버 체크
	 */
	socket.on("user:arrive_square", function () {
		// let rname = SocketSession.getRoomName(socket)
		// if (!R.hasRPGRoom(rname)) return
		//ROOMS.get(rname).user_arriveSquare()
	})
	//==========================================================================================

	/**
	 * 클라이언트에서 장애물에 도착 후 0.5초 후에 실행
	 */
	socket.on("user:obstacle_complete", function () {
		// let rname = SocketSession.getRoomName(socket)

		// if (!R.hasRPGRoom(rname)) return
		//ROOMS.get(rname).user_obstacleComplete()
	})
	//==========================================================================================

	/**
	 * 선택 장애물(신의손,납치범 등) 선택 완료후 정보 전송 받음
	 * 처리 후 선댁 action(잠수함, 갈림길선택 등) 체크
	 */
	socket.on("user:complete_obstacle_selection", function (crypt_turn:string,info: ClientInputEventFormat.PendingObstacle) {
		//	console.log("obs selection complete")

		// let rname = SocketSession.getRoomName(socket)

	//	console.log("complete_obstacle_selection")

		// if (!R.hasRPGRoom(rname)) return
		controlRPGRoom(socket,(room,rname,turn)=>{
			room.getGameLoop.user_completePendingObs(info,crypt_turn)
		})
		// if (!ROOMS.get(rname).isThisTurn(crypt_turn)) return
		// R.getRPGRoom(rname).getGameLoop().user_completePendingObs(info,crypt_turn)
	})
	//==========================================================================================
	
	/**
	 * 선택 action 선택 완료후 처리
	 * 처리 후 스킬 사용
	 */
	socket.on("user:complete_action_selection", function (crypt_turn:string,info: ClientInputEventFormat.PendingAction) {
		//	console.log("action selection complete")

		// if (!ROOMS.get(rname).isThisTurn(crypt_turn)) return
		controlRPGRoom(socket,(room,rname,turn)=>{
			room.getGameLoop.user_completePendingAction(info,crypt_turn)
		})
		// R.getRPGRoom(rname).getGameLoop().user_completePendingAction(info,crypt_turn)
	})
	//execute when player clicks basic attack
	socket.on("user:basicattack", function (crypt_turn: string) {
		controlRPGRoom(socket,(room,rname,turn)=>{
			room.getGameLoop.user_basicAttack(crypt_turn)
		})
		// room.getGameLoop().user_basicAttack(crypt_turn)
	})
	//==========================================================================================
	socket.on("user:press_dice", function (crypt_turn: string, dicenum: number) {
		// let rname = SocketSession.getRoomName(socket)

		// if (!R.hasRPGRoom(rname)) return
		// if (!R.getRPGRoom(rname).isThisTurn(crypt_turn)) return

		controlRPGRoom(socket,(room,rname,turn)=>{
			room.getGameLoop.user_pressDice(dicenum,crypt_turn)
			// if(dice!=null)
			// io.to(rname).emit("server:rolldice", dice)
		})

		// let dice = R.getRPGRoom(rname).getGameLoop().user_pressDice(dicenum,crypt_turn)
		// //console.log("press_dice" + dice)
		// if(dice!=null)
		// 	io.to(rname).emit("server:rolldice", dice)

		//	console.log("pressdice")
	})
    //execute when player clicks skill button, use skill or return targets or return proj positions
	socket.on("user:get_skill_data", function (crypt_turn: string, s: number) {
		// let rname = SocketSession.getRoomName(socket)

		// if (!R.hasRPGRoom(rname)) return
		// if (!R.getRPGRoom(rname).isThisTurn(crypt_turn)) return
		// let room = R.getRPGRoom(rname)
		controlRPGRoom(socket,(room,rname,turn)=>{
			let result=room.getGameLoop.user_clickSkill(s,crypt_turn)
			socket.emit("server:skill_data", result)
		})

	// 	let result = room.getGameLoop().user_clickSkill(s,crypt_turn)
	// //	console.log(result)
	// 	socket.emit("server:skill_data", result)
	})
	
	//==========================================================================================
	//execute when player chose a target
	socket.on("user:chose_target", function (crypt_turn: string, target: number) {
		//	console.log("sendtarget")
		// let rname = SocketSession.getRoomName(socket)

		// if (!R.hasRPGRoom(rname)) return
		// if (!ROOMS.get(rname).isThisTurn(crypt_turn)) return
		controlRPGRoom(socket,(room,rname,turn)=>{
			room.getGameLoop.user_choseSkillTarget(target,crypt_turn)
		})
		// R.getRPGRoom(rname).getGameLoop().user_choseSkillTarget(target,crypt_turn)

		// if (status != null) {
		// 	setTimeout(() => socket.emit("server:used_skill", status), 500)
		// }
	})
	//==========================================================================================
	//execute when player chose a projectile location
	socket.on("user:chose_location", function (crypt_turn: string, location: number) {
		//	console.log("sendprojlocation")
		// let rname = SocketSession.getRoomName(socket)

		// if (!R.hasRPGRoom(rname)) return
		// if (!ROOMS.get(rname).isThisTurn(crypt_turn)) return
		controlRPGRoom(socket,(room,rname,turn)=>{
			room.getGameLoop.user_choseSkillLocation(location,crypt_turn)
		})
		// R.getRPGRoom(rname).getGameLoop().user_choseSkillLocation(location,crypt_turn)
		// socket.emit("server:used_skill", skillstatus)
	})
	socket.on("user:chose_area_skill_location", function (crypt_turn: string, location: number) {
		//	console.log("sendprojlocation")
		// let rname = SocketSession.getRoomName(socket)

		// if (!R.hasRPGRoom(rname)) return
		// if (!ROOMS.get(rname).isThisTurn(crypt_turn)) return
		controlRPGRoom(socket,(room,rname,turn)=>{
			room.getGameLoop.user_choseAreaSkillLocation(location,crypt_turn)
		})
		// R.getRPGRoom(rname).getGameLoop().user_choseAreaSkillLocation(location,crypt_turn)
		// socket.emit("server:used_skill", skillstatus)
	})
	//==========================================================================================

	socket.on("user:store_data", function (data: ClientInputEventFormat.ItemBought) {
		// let rname = SocketSession.getRoomName(socket)

		// if (!R.hasRPGRoom(rname)) return
		controlRPGRoom(socket,(room,rname,turn)=>{
			room.getGameLoop.user_storeComplete(data)
		})
		// R.getRPGRoom(rname).getGameLoop().user_storeComplete(data)
	})

	//==========================================================================================

	socket.on("user:nextturn", function (crypt_turn: string) {
		// let rname = SocketSession.getRoomName(socket)

		// if (!R.hasRPGRoom(rname)) return
		// if (!R.getRPGRoom(rname).isThisTurn(crypt_turn)) return
		controlRPGRoom(socket,(room,rname,turn)=>{
			room.getGameLoop.startNextTurn(false)
		})
		// R.getRPGRoom(rname).getGameLoop().startNextTurn(false)
	})

	//==========================================================================================

	socket.on("user:reset_game", function () {
		// let rname = SocketSession.getRoomName(socket)
		// let quitter = SocketSession.getTurn(socket)
		//console.log(rname, quitter)
		// if (!R.hasRPGRoom(rname)) return
		// let room = R.getRPGRoom(rname)

		controlRPGRoom(socket,(room,rname,quitter)=>{
			io.to(rname).emit("server:quit", quitter)
			console.log("an user has been disconnected ")
			room.reset()
			R.remove(rname)
		})

		// io.to(rname).emit("server:quit", quitter)
		// console.log("an user has been disconnected " + R.getRPGRoom(rname))

		// try {
		// 	room.reset()
		// } catch (e) {
		// 	console.error("Error while resetting room " + e)
		// }

		// R.remove(rname)
	})

	socket.on("user:turn_roullete", function () {
		// let rname = SocketSession.getRoomName(socket)
		controlRPGRoom(socket,(room,rname,quitter)=>{
			io.to(rname).emit("server:turn_roullete")
		})
	})
	socket.on("user:chat", function (turn,message) {
		// let rname = SocketSession.getRoomName(socket)
		controlRPGRoom(socket,(room,rname,turn)=>{
			io.to(rname).emit("server:receive_message",room.getPlayerMessageHeader(turn),message)
		})
	})
}