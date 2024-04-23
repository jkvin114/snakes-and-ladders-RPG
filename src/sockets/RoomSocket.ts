import type { Socket } from "socket.io";
import { io } from "../app";
import { SocketSession } from "./SocketSession";
import express = require("express")
import { controlRoom } from "./Controller";
import CONFIG from "./../../config/config.json"
import { Logger } from "../logger";

const validTypes = new Set<string>(["matching","rpggame","marblegame"])

module.exports=function(socket:Socket){


    socket.on("user:update_playerlist", function (playerlist: any) {
		// console.table(playerlist)
		controlRoom(socket,(room,rname)=>{
			room.user_updatePlayerList(playerlist)
			io.to(rname).emit("server:update_playerlist", room.getPlayerList())
		})
	})

	
	socket.on("user:host_create_room", function () {

		controlRoom(socket,async (room,rname)=>{
			if(!room.isHost(await SocketSession.getId(socket))) return

			room.setSimulation(false)
			.registerClientInterface(function(roomname:string,type:string,...args:unknown[]){
				io.to(roomname).emit(type,...args)
			}).setHostNickname(await SocketSession.getUsername(socket), 0,await SocketSession.getUserClass(socket))
			Logger.log("create new room",rname)
			room.addSession(await SocketSession.getId(socket))
			socket.join(rname)
		})
		
		//	socket.emit("server:create_room",roomName)
	})
	//==========================================================================================
	socket.on("user:guest_request_register", async function (rname: string) {
		//check if current session has room name that was set up in /room/verify_join router
		if(await SocketSession.getRoomName(socket)!==rname){
			socket.emit("server:unavaliable_room")
			return
		}

		let hasroom=controlRoom(socket,async (room,rname)=>{
			if(room.user_guestRegister(await SocketSession.getId(socket)))
			{
				socket.join(rname)
				let username =await SocketSession.getUsername(socket)
			
				let turn = room.addGuestToPlayerList(username,await SocketSession.getUserClass(socket),socket)
				await SocketSession.setTurn(socket, turn)

				// socket.emit("server:guest_register", turn, room.getPlayerList())
				socket.emit("server:guest_join_room", rname, turn, room.getPlayerList())

				socket.broadcast.to(rname).emit("server:update_playerlist", room.getPlayerList())
				Logger.log("guest join",rname)
			}
			else{
				socket.emit("server:unavaliable_room")
			}
		})
		if(!hasroom) socket.emit("server:unavaliable_room")
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
		controlRoom(socket,async (room,rname)=>{
			let username =await SocketSession.getUsername(socket)
			
			let turn = room.addGuestToPlayerList(username,await SocketSession.getUserClass(socket),socket)
			await SocketSession.setTurn(socket, turn)

			socket.emit("server:guest_register", turn, room.getPlayerList())
			socket.broadcast.to(rname).emit("server:update_playerlist", room.getPlayerList())
		})
	})
	//==========================================================================================
	socket.on("user:kick_player", function (turn: number) {
		controlRoom(socket,async (room,rname)=>{
			if(!room.isHost(await SocketSession.getId(socket))) return

			io.to(rname).emit("server:kick_player", turn)
			await room.removeGuest(turn)
		})
		
	})


	//==========================================================================================

	socket.on("user:go_teampage", function () {
		controlRoom(socket,async (room,rname)=>{
			if(!room.isHost(await SocketSession.getId(socket))) return

			room.setTeamGame()
			io.to(rname).emit("server:go_teampage")
		})
		
	})
	socket.on("user:exit_teampage", function () {
		controlRoom(socket,async (room,rname)=>{
			if(!room.isHost(await SocketSession.getId(socket))) return

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
	//	console.log("changechamp" + turn + champ)
		controlRoom(socket,(room,rname)=>{
			
			room.user_updateChamp(turn, champ)
			io.to(rname).emit("server:update_champ", turn, champ)
		})
	})
	//==========================================================================================

	socket.on("user:update_map", function (map: number) {

		controlRoom(socket,async (room,rname)=>{
			if(!room.isHost(await SocketSession.getId(socket))) return

			room.user_updateMap(map)
			io.to(rname).emit("server:map", map)
		})
		//console.log("setmap" + map)
	})
	//==========================================================================================

	socket.on("user:update_team", function (check_status:boolean[]) {
		controlRoom(socket,(room,rname)=>{
			
			room.user_updateTeams(check_status)
			io.to(rname).emit("server:teams", check_status)
		})
	})

	
	socket.on("user:reload_game", async function () {
		//console.log("reloadgame")
		let rname =await SocketSession.getRoomName(socket)

	})
	//==========================================================================================
	socket.on("user:extend_timeout", async function () {
		let rname =await SocketSession.getRoomName(socket)
		let turn =await SocketSession.getTurn(socket)
	})
	//==========================================================================================

	socket.on("connection_checker", function () {
		socket.emit("connection_checker")
	})
	socket.on("user:reconnect",async function () {
		let turn = await SocketSession.getTurn(socket)
		controlRoom(socket,(room,rname)=>{
			
			room.user_reconnect(turn)
			Logger.log("user reconnect",rname,"turn:"+turn)
		})
	})
	
	socket.on("disconnect", async function () {
		
		if(!validTypes.has(socket.data.type)) return
		let turn =await SocketSession.getTurn(socket) 
		if(!await SocketSession.getRoomName(socket)) return
		controlRoom(socket,async (room,rname)=>{
			
			if(!room.isGameStarted && socket.data.type==="matching"){
				//if host quits in the matching page
				if(turn===0){
					room.reset()
					io.to(rname).emit("server:quit")
					Logger.log("host disconnected",rname)

				}//if guest quits in the matching page
				else{
					Logger.log("guest disconnected",rname)
					await room.removeGuest(turn)
					socket.broadcast.to(rname).emit("server:update_playerlist", room.removePlayer(turn))
				}
				await SocketSession.removeGameSession(socket)
			}
			else{
				Logger.log("user disconnected while game",rname)
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