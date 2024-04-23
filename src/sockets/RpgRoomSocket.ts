import type { Socket } from "socket.io";
import { io } from "../app";
import { R } from "../Room/RoomStorage";
import { SocketSession } from "./SocketSession";
import { ClientInputEventFormat, ServerGameEventFormat } from "../RPGGame/data/EventFormat";
import { RPGRoom } from "../RPGGame/RPGRoom";
import { controlRoom, controlRPGRoom } from "./Controller";
import { Logger } from "../logger";
const { User } = require("../mongodb/UserDBSchema")
module.exports=function(socket:Socket){

	socket.on("user:simulationready", async function (setting:ClientInputEventFormat.SimulationSetting, count:number, isTeam:boolean) {
		if (!await SocketSession.getUsername(socket)) {
			Logger.err("user not logined for simulation")
			return
		}
		
		let rname = "simulation_" + String(Math.floor(Math.random() * 1000000))
		await SocketSession.setRoomName(socket, rname)
		socket.join(rname)

		let room = new RPGRoom(rname).setSimulation(true)
		.registerSimulationClientInterface(function(roomname:string,type:string,...args:unknown[]){
			io.to(roomname).emit(type,...args)
		}).registerResetCallback(() => {
			R.remove(rname)
		})
		Logger.log("create simulation room",rname)

		R.setRPGRoom(rname, room)

		let u = await SocketSession.getUsername(socket)
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

	socket.on("user:gameready", async function (setting:ClientInputEventFormat.GameSetting) {
		let rname = await SocketSession.getRoomName(socket)
		console.log("gameready")
		if (!R.hasRoom(rname)) return

		R.getRPGRoom(rname)?.user_gameReady(setting, rname)

		//호스트,게스트 페이지 바꾸기
		io.to(rname).emit("server:to_gamepage")
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
		
		controlRPGRoom(socket,async (room,rname,turn)=>{
			if (!room.hasGameLoop()) {
				socket.emit("server:quit")
				return
			}
			
			socket.join(rname)
			let setting:ServerGameEventFormat.initialSetting = room.user_requestSetting()
			let newturn=-1

			//dont update if turn is -1(spectator)
			if(turn!==-1){

				newturn = turn

				//do not update turn from second access
				if(!room.registeredSessions.has(await SocketSession.getId(socket))){
	
					newturn=room.getChangedTurn(turn)
					await SocketSession.setTurn(socket,newturn)
					
					const session = await SocketSession.getSession(socket)
					if(session.loggedin){
						room.addRegisteredUser(newturn,session.userId,session.username)
					}
				}
				
				room.registeredSessions.add(await SocketSession.getId(socket))
				
			}
			
			socket.emit("server:initialsetting", setting, newturn, room.getGameTurnToken(newturn))
		})
	})
	//==========================================================================================

	socket.on("user:request_item_status",function(){
		controlRPGRoom(socket,(room,rname,turn)=>{
			let items=room.getGameLoop.game.getItemStatus()
			socket.emit("server:item_status",items)
		})
	})
	//==========================================================================================

	socket.on("user:start_game", function () {
		controlRPGRoom(socket,async (room,rname,turn)=>{
			const canstart = room.onUserGameReady(await SocketSession.getId(socket))
			if(canstart.canStart) room.onAllUserReady()

			io.to(rname).emit("server:game_ready_status",canstart)
		},true)
		
	})
	//==========================================================================================
	socket.on("start_instant_simulation", function () {
	})

	socket.on("user:update", function (type:string,data:any) {
		controlRPGRoom(socket,async (room,rname,turn)=>{
			room.getGameLoop.user_update(await SocketSession.getTurn(socket),type,data)
		},true)

	})
	
	//==========================================================================================

	/**
	 * 장애물에 도착하는 즉시 실행
	 * -장애물 효과 받음
	 * -게임오버 체크
	 */
	socket.on("user:arrive_square", function () {
	})
	//==========================================================================================

	/**
	 * 클라이언트에서 장애물에 도착 후 0.5초 후에 실행
	 */
	socket.on("user:obstacle_complete", function () {
	})
	//==========================================================================================

	/**
	 * 선택 장애물(신의손,납치범 등) 선택 완료후 정보 전송 받음
	 * 처리 후 선댁 action(잠수함, 갈림길선택 등) 체크
	 */
	socket.on("user:complete_obstacle_selection", function (crypt_turn:string,info: ClientInputEventFormat.PendingObstacle) {
		controlRPGRoom(socket,(room,rname,turn)=>{
			room.getGameLoop.user_completePendingObs(info,crypt_turn)
		},true)
	})
	//==========================================================================================
	
	/**
	 * 선택 action 선택 완료후 처리
	 * 처리 후 스킬 사용
	 */
	socket.on("user:complete_action_selection", function (crypt_turn:string,info: ClientInputEventFormat.PendingAction) {
		controlRPGRoom(socket,(room,rname,turn)=>{
			room.getGameLoop.user_completePendingAction(info,crypt_turn)
		},true)
	})
	//==========================================================================================
	//execute when player clicks basic attack
	socket.on("user:basicattack", function (crypt_turn: string) {
		controlRPGRoom(socket,(room,rname,turn)=>{
			room.getGameLoop.user_basicAttack(crypt_turn)
		},true)
	})
	//==========================================================================================
	socket.on("user:press_dice", function (crypt_turn: string, dicenum: number) {

		controlRPGRoom(socket,(room,rname,turn)=>{
			room.getGameLoop.user_pressDice(dicenum,crypt_turn)
		},true)
	})
    //execute when player clicks skill button, use skill or return targets or return proj positions
	socket.on("user:get_skill_data", function (crypt_turn: string, s: number) {
		controlRPGRoom(socket,(room,rname,turn)=>{
			let result=room.getGameLoop.user_clickSkill(s,crypt_turn)
			socket.emit("server:skill_data", result)
		})
	})
	
	//==========================================================================================
	//execute when player chose a target
	socket.on("user:chose_target", function (crypt_turn: string, target: number) {
		controlRPGRoom(socket,(room,rname,turn)=>{
			room.getGameLoop.user_choseSkillTarget(target,crypt_turn)
		},true)
	})
	//==========================================================================================
	//execute when player chose a projectile location
	socket.on("user:chose_location", function (crypt_turn: string, location: number) {
		controlRPGRoom(socket,(room,rname,turn)=>{
			room.getGameLoop.user_choseSkillLocation(location,crypt_turn)
		},true)
	})
	socket.on("user:chose_area_skill_location", function (crypt_turn: string, location: number) {
		controlRPGRoom(socket,(room,rname,turn)=>{
			room.getGameLoop.user_choseAreaSkillLocation(location,crypt_turn)
		},true)
	})
	//==========================================================================================

	socket.on("user:store_data", function (data: ClientInputEventFormat.ItemBought) {
		controlRPGRoom(socket,(room,rname,turn)=>{
			room.getGameLoop.user_storeComplete(data)
		},true)
	})

	//==========================================================================================

	socket.on("user:nextturn", function (crypt_turn: string) {
		controlRPGRoom(socket,(room,rname,turn)=>{
			room.getGameLoop.user_clickNextturn(crypt_turn)
		},true)
	})

	//==========================================================================================

	socket.on("user:reset_game", function () {

		controlRPGRoom(socket,(room,rname,quitter)=>{
			io.to(rname).emit("server:quit", quitter)
			Logger.log("user has been disconnected ",rname," turn:"+quitter)
			room.reset()
			R.remove(rname)
		})
	})

	socket.on("user:turn_roullete", function () {
		// let rname = SocketSession.getRoomName(socket)
		controlRPGRoom(socket,(room,rname,quitter)=>{
			io.to(rname).emit("server:turn_roullete")
		},true)
	})
	socket.on("user:chat", function (turn,message) {
		controlRPGRoom(socket,(room,rname,turn)=>{
			const header = room.getPlayerMessageHeader(turn)
			Logger.log("rpg game chat",rname,header,message)
			io.to(rname).emit("server:receive_message",header,message)
		},true)
	})
}