import type { Socket } from "socket.io";
// import { R } from "../RoomStorage";
import { controlMarbleRoom } from "../sockets/Controller";
import { SocketSession } from "../SocketSession";
import { ServerPayloadInterface } from "./ServerPayloadInterface";

const prefix="marble:user:"
const USER_EVENTS={
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
}
function getRoom(socket:Socket){
	
}

module.exports=function(socket:Socket){


    socket.on(USER_EVENTS.GAMEREADY, function (itemsetting:ServerPayloadInterface.ItemSetting) {

		controlMarbleRoom(socket,(room,rname,turn)=>{
			room.user_gameReady(rname,itemsetting)
			socket.to(rname).emit("server:to_marble_gamepage")
		})
		// R.getMarbleRoom(rname).user_gameReady(rname,itemsetting)

		// //게스트 페이지 바꾸기
		// socket.to(rname).emit("server:to_marble_gamepage")
	})

	socket.on(USER_EVENTS.REQUEST_SETTING, function () {
		// let rname = SocketSession.getRoomName(socket)
		// let turn = SocketSession.getTurn(socket)
		// if (!R.hasMarbleRoom(rname)) return
		// let room=R.getMarbleRoom(rname)

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

		// if (!room.gameloop) {
		// 	socket.emit("server:quit")
		// 	return
		// }
		// socket.join(rname)
		// let setting=room.user_requestSetting()
		// let gameturn=setting.players[turn].turn
		// SocketSession.setTurn(socket,gameturn) //세선에 저장되있는 턴 진짜 게임 턴으로 변경

		// socket.emit("server:initialsetting",setting,turn,gameturn)

	})

	socket.on(USER_EVENTS.START_GAME, function () {
		// let rname = SocketSession.getRoomName(socket)
		// if (!R.hasMarbleRoom(rname)) return
		controlMarbleRoom(socket,(room,rname,turn)=>{
			let canstart=room.user_startGame()
			if (!canstart) {
				console.log("connecting incomplete")
			}
		})

		// let canstart=R.getMarbleRoom(rname).user_startGame()
		// if (!canstart) {
		// 	console.log("connecting incomplete")
		// }
	})
	socket.on(USER_EVENTS.PRESS_DICE, function (invoker:number,target:number,oddeven:number) {

		controlMarbleRoom(socket,(room,rname,turn)=>{
			room.onClientEvent("press_dice",invoker,target,oddeven)
		})


		// R.getMarbleRoom(rname).onClientEvent("press_dice",invoker,target,oddeven)
	})
	socket.on(USER_EVENTS.SELECT_BUILD, function (invoker:number,builds:number[]) {
		// console.log(builds)
		// let rname = SocketSession.getRoomName(socket)
		// if (!R.hasMarbleRoom(rname)) return
		controlMarbleRoom(socket,(room,rname,turn)=>{
			room.onClientEvent("select_build",invoker,builds)
		})
		// R.getMarbleRoom(rname).onClientEvent("select_build",invoker,builds)
	})
	socket.on(USER_EVENTS.SELECT_BUYOUT, function (invoker:number,result:boolean) {
		// let rname = SocketSession.getRoomName(socket)
		// if (!R.hasMarbleRoom(rname)) return
		controlMarbleRoom(socket,(room,rname,turn)=>{
			room.onClientEvent("select_buyout",invoker,result)
		})
		// R.getMarbleRoom(rname).onClientEvent("select_buyout",invoker,result)
	})
	socket.on(USER_EVENTS.SELECT_LOAN, function (invoker:number,result:boolean) {
		// let rname = SocketSession.getRoomName(socket)
		// if (!R.hasMarbleRoom(rname)) return
		controlMarbleRoom(socket,(room,rname,turn)=>{
			room.onClientEvent("select_loan",invoker,result)
		})
		// R.getMarbleRoom(rname).onClientEvent("select_loan",invoker,result)
	})
	socket.on(USER_EVENTS.SELECT_TILE, function (invoker:number,pos:number,source:string,result:boolean) {
	
		controlMarbleRoom(socket,(room,rname,turn)=>{
			room.onClientEvent("select_tile",invoker,pos,source,result)
		})
		// R.getMarbleRoom(rname).onClientEvent("select_tile",invoker,pos,source,result)
	})
	socket.on(USER_EVENTS.OBTAIN_CARD, function (invoker:number,result:boolean) {
		controlMarbleRoom(socket,(room,rname,turn)=>{
			room.onClientEvent("obtain_card",invoker,result)
		})
		// R.getMarbleRoom(rname).onClientEvent("obtain_card",invoker,result)
	})
	socket.on(USER_EVENTS.CONFIRM_CARD_USE, function (invoker:number,result:boolean,cardname:string) {

		controlMarbleRoom(socket,(room,rname,turn)=>{
			room.onClientEvent("confirm_card_use",invoker,result,cardname)
		})
		// R.getMarbleRoom(rname).onClientEvent("confirm_card_use",invoker,result,cardname)
	})
	socket.on(USER_EVENTS.SELECT_GODHAND_SPECIAL, function (invoker:number,result:boolean) {

		controlMarbleRoom(socket,(room,rname,turn)=>{
			room.onClientEvent("select_godhand_special",invoker,result)
		})
		// R.getMarbleRoom(rname).onClientEvent("select_godhand_special",invoker,result)
	})
	socket.on(USER_EVENTS.SELECT_ISLAND, function (invoker:number,result:boolean) {

		controlMarbleRoom(socket,(room,rname,turn)=>{
			room.onClientEvent("select_island",invoker,result)
		})
		// R.getMarbleRoom(rname).onClientEvent("select_island",invoker,result)
	})
}