import type { Socket } from "socket.io";
// import { R } from "../RoomStorage";
import { controlMarbleRoom } from "../sockets/Controller";
import { SocketSession } from "../sockets/SocketSession";
import { ServerRequestModel } from "./Model/ServerRequestModel";
import { ServerEventModel } from "./Model/ServerEventModel";
import { MarbleRoom } from "./MarbleRoom";
import { R } from "../Room/RoomStorage";
import { io } from "../app";
import { AgentType, PlayerType } from "./util";

const prefix="marble:user:"
const userEvents={
	REQUEST_SETTING:`${prefix}request_setting`,
	GAMEREADY:`${prefix}gameready`,
	START_GAME:`${prefix}start_game`,
	PRESS_DICE:`${prefix}press_dice`,
	SELECT_BUILD:`${prefix}select_build`,
	SELECT_BUYOUT:`${prefix}select_buyout`,
	SELECT_LOAN:`${prefix}select_loan`,
	SELECT_TILE:`${prefix}select_tile`,
	OBTAIN_CARD:`${prefix}obtain_card`,
	CONFIRM_CARD_USE:`${prefix}confirm_card_use`,
	SELECT_GODHAND_SPECIAL:`${prefix}select_godhand_special`,
	SELECT_ISLAND:`${prefix}select_island`,
	RUN_SIMULATION:prefix+"start_sim"
}
function getRoom(socket:Socket){
	
}

module.exports=function(socket:Socket){

	socket.on("user:marble_simulation_ready", function (count:number,savelabel:boolean) {
		
		let rname = "simulation_marble_" + String(Math.floor(Math.random() * 1000000))
		SocketSession.setRoomName(socket, rname)
		socket.join(rname)

		let room = new MarbleRoom(rname)
		.registerSimulationClientInterface(function(roomname:string,type:string,...args:unknown[]){
			io.to(roomname).emit(type,...args)
		}).registerResetCallback(() => {
			R.remove(rname)
		})

		R.setMarbleRoom(rname, room)
		room.user_startSimulation({
			count:count,
			saveLabelCSV:savelabel,
			map:1,
			players:[
				{
					type:PlayerType.AI,name:"",team:true,champ:0,ready:true,userClass:0,data:{agentType:AgentType.RATIONAL_RANDOM}
				},
				{
					type:PlayerType.AI,name:"",team:true,champ:0,ready:true,userClass:0,data:{agentType:AgentType.SMART_CUSTOM_1}
				}
			]
		})
	})

    socket.on(userEvents.GAMEREADY, function (itemsetting:ServerEventModel.ItemSetting) {

		controlMarbleRoom(socket,(room,rname,turn)=>{
			room.user_gameReady(rname,itemsetting)
			socket.to(rname).emit("server:to_marble_gamepage")
		})
	})

	socket.on(userEvents.REQUEST_SETTING, function () {

		controlMarbleRoom(socket,(room,rname,turn)=>{
			if (!room.gameloop) {
				socket.emit("server:quit")
				return
			}
			socket.join(rname)
			let setting=room.user_requestSetting()
			let gameturn=setting.players[turn].turn
			SocketSession.setTurn(socket,gameturn) //세선에 저장되있는 턴 진짜 게임 턴으로 변경
	
			socket.emit("server:initialsetting",setting,turn,gameturn)
		})


	})

	socket.on(userEvents.START_GAME, function () {
		controlMarbleRoom(socket,(room,rname,turn)=>{
			let canstart=room.user_startGame()
			if (!canstart) {
				console.log("connecting incomplete")
			}
		})
	})
	socket.on(userEvents.PRESS_DICE, function (invoker:number,target:number,oddeven:number) {

		controlMarbleRoom(socket,(room,rname,turn)=>{
			room.onClientEvent("press_dice",invoker,target,oddeven)
		})


	})
	socket.on(userEvents.SELECT_BUILD, function (invoker:number,builds:number[]) {
		controlMarbleRoom(socket,(room,rname,turn)=>{
			room.onClientEvent("select_build",invoker,builds)
		})
	})
	socket.on(userEvents.SELECT_BUYOUT, function (invoker:number,result:boolean) {
		controlMarbleRoom(socket,(room,rname,turn)=>{
			room.onClientEvent("select_buyout",invoker,result)
		})
	})
	socket.on(userEvents.SELECT_LOAN, function (invoker:number,result:boolean) {
		controlMarbleRoom(socket,(room,rname,turn)=>{
			room.onClientEvent("select_loan",invoker,result)
		})
	})
	socket.on(userEvents.SELECT_TILE, function (invoker:number,pos:number,source:string,result:boolean) {
	
		controlMarbleRoom(socket,(room,rname,turn)=>{
			room.onClientEvent("select_tile",invoker,pos,source,result)
		})
	})
	socket.on(userEvents.OBTAIN_CARD, function (invoker:number,result:boolean) {
		controlMarbleRoom(socket,(room,rname,turn)=>{
			room.onClientEvent("obtain_card",invoker,result)
		})
	})
	socket.on(userEvents.CONFIRM_CARD_USE, function (invoker:number,result:boolean,cardname:string) {

		controlMarbleRoom(socket,(room,rname,turn)=>{
			room.onClientEvent("confirm_card_use",invoker,result,cardname)
		})
	})
	socket.on(userEvents.SELECT_GODHAND_SPECIAL, function (invoker:number,result:boolean) {

		controlMarbleRoom(socket,(room,rname,turn)=>{
			room.onClientEvent("select_godhand_special",invoker,result)
		})
	})
	socket.on(userEvents.SELECT_ISLAND, function (invoker:number,result:boolean) {

		controlMarbleRoom(socket,(room,rname,turn)=>{
			room.onClientEvent("select_island",invoker,result)
		})
	})
}