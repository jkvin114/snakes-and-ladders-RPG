import type { Socket } from "socket.io";
import { io } from "../app";
// import { R } from "../RoomStorage";
import { SocketSession } from "../SocketSession";
import express = require("express")
import { controlRoom } from "./Controller";

module.exports=function(socket:Socket){
    socket.on("user:update_playerlist", function (playerlist: any) {
		controlRoom(socket,(room,rname)=>{
			let turnchange = room.user_updatePlayerList(playerlist)
			io.to(rname).emit("server:update_playerlist", room.playerlist, turnchange)
		})
	})
	
	socket.on("user:host_connect", function () {

		// if (ROOMS.get(roomName) != null) {
		// 	socket.emit("server:room_name_exist")
		// 	return
		// }
		/*
		Test.create({name:"hello",turn:2,sub:{name:"d"}})
		.then((resolvedData)=>console.log(resolvedData))
		.catch((e)=>console.error(e))
		
*/
		controlRoom(socket,(room,rname)=>{
			room.setSimulation(false)
			.registerClientInterface(function(roomname:string,type:string,...args:unknown[]){
				io.to(roomname).emit(type,...args)
			}).setNickname(SocketSession.getUsername(socket), 0)
			socket.join(rname)
			console.log(socket.rooms)
		})
		
		//	socket.emit("server:create_room",roomName)
	})
	//==========================================================================================
	socket.on("user:register", function (rname: string) {
		// if (!R.hasRoom(rname)) {
		// 	socket.emit("server:room_full")
		// 	return
		// }
		SocketSession.setRoomName(socket, rname)
		let hasroom=controlRoom(socket,(room,rname)=>{
			if (room.hosting <= 0) {
				socket.emit("server:room_full")
			}
			
			socket.join(rname)
			room.guestnum += 1
			socket.emit("server:join_room", rname)
		})
		if(!hasroom) socket.emit("server:room_full")
	})

	//==========================================================================================
	
	//==========================================================================================
	socket.on("user:update_ready", function (turn: number, ready: boolean) {
		controlRoom(socket,(room,rname)=>{
			room.user_updateReady(turn, ready)
			io.to(rname).emit("server:update_ready", turn, ready)
		})
		
	})
	socket.on("user:request_players", function () {
		controlRoom(socket,(room,rname)=>{
			let nickname = SocketSession.getUsername(socket)

			let turn = room.user_requestPlayers(nickname)
			SocketSession.setTurn(socket, turn)

			socket.emit("server:guest_register", turn, room.playerlist)
			socket.broadcast.to(rname).emit("server:update_playerlist", room.playerlist)
		})
	})
	socket.on("user:guest_quit", function () {
		const req = socket.request as express.Request
		delete req.session.turn
		//req.session.destroy((e)=>{console.log("destroy guest session")})
	})
	//==========================================================================================
//controlRoom(socket,(room,rname)=>{})
	socket.on("user:kick_player", function (turn: number) {
		controlRoom(socket,(room,rname)=>{
			room.guestnum -= 1

			io.to(rname).emit("server:kick_player", turn)

		})
		// try {
		// 	let rname = SocketSession.getRoomName(socket)
		// 	if (!R.hasRoom(rname)) return
		// 	let room = R.getRoom(rname)
			
		// 	console.log("kick" + turn)
		// 	//room.playerlist[turn]=null
		// } catch (e) {
		// 	console.log(e)
		// }
	})

	//==========================================================================================

	socket.on("user:go_teampage", function () {
		controlRoom(socket,(room,rname)=>{
			room.setTeamGame()
			io.to(rname).emit("server:go_teampage")
		})
		
	})
	socket.on("user:exit_teampage", function () {
		controlRoom(socket,(room,rname)=>{
			room.unsetTeamGame()
			io.to(rname).emit("server:exit_teampage")
		})

		// if (!R.hasRoom(rname)) return
		// R.getRoom(rname).unsetTeamGame()
		// io.to(rname).emit("server:exit_teampage")
	})

	socket.on("user:request_names", function () {
		controlRoom(socket,(room,rname)=>{
			let names = room.user_requestNames()

			io.to(rname).emit("server:player_names", names)
		})
		
	})
	//==========================================================================================

	socket.on("user:update_champ", function (turn: number, champ: number) {
		console.log("changechamp" + turn + champ)
		controlRoom(socket,(room,rname)=>{
			
			room.user_updateChamp(turn, champ)
			io.to(rname).emit("server:update_champ", turn, champ)
		})
	})
	//==========================================================================================

	socket.on("user:update_map", function (map: number) {

		controlRoom(socket,(room,rname)=>{
			
			room.user_updateMap(map)
			io.to(rname).emit("server:map", map)
		})
		console.log("setmap" + map)
	})
	//==========================================================================================

	socket.on("user:update_team", function (check_status:boolean[]) {
		// let rname = SocketSession.getRoomName(socket)

		// console.log("set team" + check_status)
		// if (!R.hasRoom(rname)) return
		// R.getRoom(rname).user_updateTeams(check_status)
		// io.to(rname).emit("server:teams", check_status)
		controlRoom(socket,(room,rname)=>{
			
			room.user_updateTeams(check_status)
			io.to(rname).emit("server:teams", check_status)
		})
	})

	
	socket.on("user:reload_game", function () {
		console.log("reloadgame")
		let rname = SocketSession.getRoomName(socket)

		// if (!R.hasRPGRoom(rname)) return
		//ROOMS.get(rname).goNextTurn()
	})
	//==========================================================================================
	socket.on("user:extend_timeout", function () {
		let rname = SocketSession.getRoomName(socket)
		let turn = SocketSession.getTurn(socket)
		// if (!R.hasRPGRoom(rname)) return
	//	ROOMS.get(rname).extendTimeout(turn)
	})
	//==========================================================================================

	socket.on("connection_checker", function () {
		socket.emit("connection_checker")
	})
	socket.on("user:reconnect", function () {
		let turn = SocketSession.getTurn(socket)
		controlRoom(socket,(room,rname)=>{
			
			room.user_reconnect(turn)
			console.log("reconnect"+rname)
		})
		// R.getRPGRoom(rname).user_reconnect(turn)
	})
	
	socket.on("disconnect", function () {
		console.log("disconnected")
		let turn = SocketSession.getTurn(socket)
		controlRoom(socket,(room,rname)=>{
			room.user_disconnect(turn)
		})
	})
}