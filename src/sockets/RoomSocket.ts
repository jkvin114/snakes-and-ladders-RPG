import type { Socket } from "socket.io";
import { io } from "../app";
import { SocketSession } from "./SocketSession";
import express = require("express")
import { controlRoom } from "./Controller";
import CONFIG from "./../../config/config.json"

module.exports=function(socket:Socket){
    socket.on("user:update_playerlist", function (playerlist: any) {
		controlRoom(socket,(room,rname)=>{
			room.user_updatePlayerList(playerlist)
			io.to(rname).emit("server:update_playerlist", room.getPlayerList())
		})
	})
	
	socket.on("user:host_connect", function () {

		controlRoom(socket,(room,rname)=>{
			room.setSimulation(false)
			.registerClientInterface(function(roomname:string,type:string,...args:unknown[]){
				io.to(roomname).emit(type,...args)
			}).setHostNickname(SocketSession.getUsername(socket), 0,SocketSession.getUserClass(socket))

			room.addSession(SocketSession.getId(socket))
			socket.join(rname)
			console.log(socket.rooms)
		})
		
		//	socket.emit("server:create_room",roomName)
	})
	//==========================================================================================
	socket.on("user:register", function (rname: string) {
		SocketSession.setRoomName(socket, rname)
		let hasroom=controlRoom(socket,(room,rname)=>{
			if(room.user_guestRegister(SocketSession.getId(socket)))
			{
				socket.join(rname)
				socket.emit("server:join_room", rname)
			}
			else{
				socket.emit("server:room_full")
			}
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
			let username = SocketSession.getUsername(socket)

			let turn = room.addGuestToPlayerList(username,SocketSession.getUserClass(socket))
			SocketSession.setTurn(socket, turn)

			socket.emit("server:guest_register", turn, room.getPlayerList())
			socket.broadcast.to(rname).emit("server:update_playerlist", room.getPlayerList())
		})
	})
	//==========================================================================================
	socket.on("user:kick_player", function (turn: number) {
		controlRoom(socket,(room,rname)=>{
			room.user_guestKick(SocketSession.getId(socket))
			io.to(rname).emit("server:kick_player", turn)
		})
		
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

	})

	socket.on("user:request_names", function () {
		controlRoom(socket,(room,rname)=>{
			let names = room.getPlayerNamesForTeamSelection()

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
		controlRoom(socket,(room,rname)=>{
			
			room.user_updateTeams(check_status)
			io.to(rname).emit("server:teams", check_status)
		})
	})

	
	socket.on("user:reload_game", function () {
		console.log("reloadgame")
		let rname = SocketSession.getRoomName(socket)

	})
	//==========================================================================================
	socket.on("user:extend_timeout", function () {
		let rname = SocketSession.getRoomName(socket)
		let turn = SocketSession.getTurn(socket)
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
	})
	
	socket.on("disconnect", function () {
		console.log("disconnected")
		let turn = SocketSession.getTurn(socket)
		controlRoom(socket,(room,rname)=>{
			
			if(!room.isGameStarted){
				//if host quits in the matching page
				if(turn===0){
					room.reset()
					io.to(rname).emit("server:quit")

				}//if guest quits in the matching page
				else{
					room.deleteSession(SocketSession.getId(socket))
				}
				SocketSession.removeGameSession(socket)
			}
			else{
				if(CONFIG.dev_settings.enabled && CONFIG.dev_settings.reset_room_on_disconnect && room.isGameRunning){
					room.reset()
					io.to(rname).emit("server:quit")
				}
				else
					room.user_disconnect(turn)
			}

		})
	})
}