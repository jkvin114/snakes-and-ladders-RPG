import type { Socket } from "socket.io";
import { io } from "../app";
import { R } from "../RoomStorage";
import { SocketSession } from "../SocketSession";
import express = require("express")

module.exports=function(socket:Socket){
    socket.on("user:update_playerlist", function (playerlist: any) {
		try {
			let rname = SocketSession.getRoomName(socket)
			console.log(rname)
			if (!R.hasRoom(rname)) return
			let room = R.getRoom(rname)
			let turnchange = room.user_updatePlayerList(playerlist)
			io.to(rname).emit("server:update_playerlist", room.playerlist, turnchange)
		} catch (e) {
			console.error(e)
		}
	})
	
	socket.on("user:host_connect", function () {
		let roomName = SocketSession.getRoomName(socket)
		if (!R.hasRoom(roomName)) return

		// if (ROOMS.get(roomName) != null) {
		// 	socket.emit("server:room_name_exist")
		// 	return
		// }
		/*
		Test.create({name:"hello",turn:2,sub:{name:"d"}})
		.then((resolvedData)=>console.log(resolvedData))
		.catch((e)=>console.error(e))
*/
		R.getRoom(roomName).setSimulation(false)
		.registerClientInterface(function(roomname:string,type:string,...args:unknown[]){
			//console.log(args)
			io.to(roomname).emit(type,...args)
		}).setNickname(SocketSession.getUsername(socket), 0)
		// ROOMS.set(roomName, room)
		socket.join(roomName)
		console.log(socket.rooms)
		//	socket.emit("server:create_room",roomName)
	})
	//==========================================================================================
	socket.on("user:register", function (rname: string) {
		if (!R.hasRoom(rname)) {
			socket.emit("server:room_full")
			return
		}
		let room = R.getRoom(rname)

		if (room.hosting <= 0) {
			socket.emit("server:room_full")
		}
		try {
			SocketSession.setRoomName(socket, rname)
			socket.join(rname)
			room.guestnum += 1
			socket.emit("server:join_room", rname)
		} catch (e) {
			console.error(e)
		}
	})

	//==========================================================================================
	
	//==========================================================================================
	socket.on("user:update_ready", function (turn: number, ready: boolean) {
		let rname = SocketSession.getRoomName(socket)

		if (!R.hasRoom(rname)) return
		R.getRoom(rname).user_updateReady(turn, ready)

		io.to(rname).emit("server:update_ready", turn, ready)
	})
	socket.on("user:request_players", function () {
		try {
			let rname = SocketSession.getRoomName(socket)
			let nickname = SocketSession.getUsername(socket)
			if (!R.hasRoom(rname)) return

			let room = R.getRoom(rname)
			let turn = room.user_requestPlayers(nickname)
			SocketSession.setTurn(socket, turn)

			socket.emit("server:guest_register", turn, room.playerlist)
			socket.broadcast.to(rname).emit("server:update_playerlist", room.playerlist)
		} catch (e) {
			console.error(e)
		}
	})
	socket.on("user:guest_quit", function () {
		const req = socket.request as express.Request
		delete req.session.turn
		//req.session.destroy((e)=>{console.log("destroy guest session")})
	})
	//==========================================================================================

	socket.on("user:kick_player", function (turn: number) {
		try {
			let rname = SocketSession.getRoomName(socket)
			if (!R.hasRoom(rname)) return
			let room = R.getRoom(rname)
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
		let rname = SocketSession.getRoomName(socket)

		if (!R.hasRoom(rname)) return
		R.getRoom(rname).setTeamGame()
		io.to(rname).emit("server:go_teampage")
	})
	socket.on("user:exit_teampage", function () {
		let rname = SocketSession.getRoomName(socket)

		if (!R.hasRoom(rname)) return
		R.getRoom(rname).unsetTeamGame()
		io.to(rname).emit("server:exit_teampage")
	})

	socket.on("user:request_names", function () {
		let rname = SocketSession.getRoomName(socket)

		if (!R.hasRoom(rname)) return
		let names = R.getRoom(rname).user_requestNames()

		io.to(rname).emit("server:player_names", names)
	})
	//==========================================================================================

	socket.on("user:update_champ", function (turn: number, champ: number) {
		let rname = SocketSession.getRoomName(socket)
		if (!R.hasRoom(rname)) return
		R.getRoom(rname).user_updateChamp(turn, champ)
		io.to(rname).emit("server:update_champ", turn, champ)
		console.log("changechamp" + turn + champ)
	})
	//==========================================================================================

	socket.on("user:update_map", function (map: number) {
		let rname = SocketSession.getRoomName(socket)

		if (!R.hasRoom(rname)) return
		R.getRoom(rname).user_updateMap(map)

		io.to(rname).emit("server:map", map)
		console.log("setmap" + map)
	})
	//==========================================================================================

	socket.on("user:update_team", function (check_status:boolean[]) {
		let rname = SocketSession.getRoomName(socket)

		console.log("set team" + check_status)
		if (!R.hasRoom(rname)) return
		R.getRoom(rname).user_updateTeams(check_status)
		io.to(rname).emit("server:teams", check_status)
	})

	
	socket.on("user:reload_game", function () {
		console.log("reloadgame")
		let rname = SocketSession.getRoomName(socket)

		if (!R.hasRPGRoom(rname)) return
		//ROOMS.get(rname).goNextTurn()
	})
	//==========================================================================================
	socket.on("user:extend_timeout", function () {
		let rname = SocketSession.getRoomName(socket)
		let turn = SocketSession.getTurn(socket)
		if (!R.hasRPGRoom(rname)) return
	//	ROOMS.get(rname).extendTimeout(turn)
	})
	//==========================================================================================

	socket.on("connection_checker", function () {
		socket.emit("connection_checker")
	})
	socket.on("user:reconnect", function () {
		let rname = SocketSession.getRoomName(socket)
		let turn = SocketSession.getTurn(socket)
		if (!R.hasRPGRoom(rname)) return
		console.log("reconnect"+rname)
		R.getRPGRoom(rname).user_reconnect(turn)
	})
	
	socket.on("disconnect", function () {
		console.log("disconnected")
	})
}