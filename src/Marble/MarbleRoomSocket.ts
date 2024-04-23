import type { Socket } from "socket.io"
import { SocketSession } from "../sockets/SocketSession"
import { MarbleRoom } from "./MarbleRoom"
import { R } from "../Room/RoomStorage"
import { io } from "../app"
import MarbleGameGRPCClient from "../grpc/marblegameclient"
import { marblegame } from "../grpc/services/marblegame"
import grpcController from "../sockets/gRPCController"
import { Room } from "../Room/room"

const prefix = "marble:user:"
const userEvents = {
	REQUEST_SETTING: `${prefix}request_setting`,
	GAMEREADY: `${prefix}gameready`,
	START_GAME: `${prefix}start_game`,
	PRESS_DICE: `${prefix}press_dice`,
	SELECT_BUILD: `${prefix}select_build`,
	SELECT_BUYOUT: `${prefix}select_buyout`,
	SELECT_LOAN: `${prefix}select_loan`,
	SELECT_TILE: `${prefix}select_tile`,
	OBTAIN_CARD: `${prefix}obtain_card`,
	CONFIRM_CARD_USE: `${prefix}confirm_card_use`,
	SELECT_GODHAND_SPECIAL: `${prefix}select_godhand_special`,
	SELECT_ISLAND: `${prefix}select_island`,
	RUN_SIMULATION: prefix + "start_sim",
}

function forwardGameEvent(rname: string, event: marblegame.GameEvent) {
	io.to(rname).emit(event.type,event.player, JSON.parse(event.jsonObj))
}
function onGameOver(room:MarbleRoom,jsonObj:string){
	const data=JSON.parse(jsonObj)
	room.onGameover(data.stat)
}
module.exports = function (socket: Socket) {
	socket.on("user:marble_simulation_ready", async function (count: number, savelabel: boolean) {
		let rname = "simulation_marble_" + String(Math.floor(Math.random() * 1000000))
		await SocketSession.setRoomName(socket, rname)
		socket.join(rname)

		let room = new MarbleRoom(rname)
			.registerSimulationClientInterface(function (roomname: string, type: string, ...args: unknown[]) {
				io.to(roomname).emit(type, ...args)
			})
			.registerResetCallback(() => {
				R.remove(rname)
			})

		R.setMarbleRoom(rname, room)
		room.user_startSimulation({
			count: count,
			saveLabelCSV: savelabel,
			items: {
				randomCount: 0,
				items: [
					{ locked: true, code: 67, selected: true }, //사힐링,난투전헬멧,각도곰,
					{ locked: true, code: 61, selected: true },
					{ locked: true, code: 35, selected: true },
				],
			},
			map: 1,
			players: [
				{
					type: "ai",
					name: "",
					team: true,
					champ: 0,
					ready: true,
					userClass: 0,
					data: { agentType: "" },
				},
				{
					type: "ai",
					name: "",
					team: true,
					champ: 0,
					ready: true,
					userClass: 0,
					data: { agentType: "" },
				},
			],
		})
	})

	socket.on(userEvents.GAMEREADY, function (itemsetting: any) {
		let setting = new marblegame.GameSetting()
		


		grpcController<MarbleRoom>(socket, (room, rname, turn) => {
			

			setting.isTeam = room.isTeam
			setting.rname = rname
			setting.map = room.map
			setting.gametype=room.gametype
			console.log(room.gametype)
			setting.playerlist = room.getPlayerList().map((p) => {

				//if user is not logged in, clear the user name so that it will be assigned randomly in marble service.
				if(p.userClass===0) p.name=""

				if (p.data) p.data = JSON.stringify(p.data)
				return new marblegame.ProtoPlayer(p)
			})
			setting.items = new marblegame.ItemSetting({
				items: itemsetting.items.map((i:any) => new marblegame.Item(i)),
				randomCount: itemsetting.randomCount,
			})
			MarbleGameGRPCClient.InitGame(setting,()=>{
				
				MarbleGameGRPCClient.ListenGameEvent(rname, (event: marblegame.GameEvent) => {
					if(event)
						forwardGameEvent(rname, event)
					if(event.isGameOver)
						onGameOver(room,event.jsonObj)
				})

			})
			room.isGameStarted=true

			//호스트,게스트 페이지 바꾸기
			io.to(rname).emit("server:to_marble_gamepage")
		})

	})

	socket.on(userEvents.REQUEST_SETTING, function () {
		grpcController(socket,  (room, rname, turn) => {
			socket.join(rname)
			

			MarbleGameGRPCClient.RequestSetting(
				new marblegame.GameSettingRequest({
					rname: rname,
					turn: turn,
				}),
				async (event: marblegame.GameSettingReponse) => {
					if(!event) return
					const setting = JSON.parse(event.jsonPayload)

					let gameturn = setting.players[turn].turn
					await SocketSession.setTurn(socket, gameturn) //세선에 저장되있는 턴 진짜 게임 턴으로 변경
					
					const session = await SocketSession.getSession(socket)
					if(session.loggedin){
						room.addRegisteredUser(gameturn,session.userId,session.username)
					}

					socket.emit("server:initialsetting", setting, turn, gameturn)
				}
			)
		})

		// controlMarbleRoom(socket,(room,rname,turn)=>{

		// 	let setting=room.user_requestSetting()
		// 	let gameturn=setting.players[turn].turn
		// 	SocketSession.setTurn(socket,gameturn) //세선에 저장되있는 턴 진짜 게임 턴으로 변경

		// 	socket.emit("server:initialsetting",setting,turn,gameturn)
		// })
	})

	socket.on(userEvents.START_GAME, function () {

		grpcController(socket,async (room, rname, turn) => {
			const canstart = room.onUserGameReady(await SocketSession.getId(socket))
			console.log(canstart)
			io.to(rname).emit("server:game_ready_status",canstart)
			
			if(!canstart.canStart) return

			room.onUserInput()
			MarbleGameGRPCClient.RequestGameStart(rname,(res)=>{
				if(res) room.isGameRunning=true
			})
		})

		// controlMarbleRoom(socket, (room, rname, turn) => {
		// 	let canstart = room.user_startGame()
		// 	if (!canstart) {
		// 		console.log("connecting incomplete")
		// 	}
		// })
	})
	socket.on(userEvents.PRESS_DICE, function (invoker: number, target: number, oddeven: number) {
		const data=new marblegame.UserPressDice()
		grpcController(socket, (room, rname, turn) => {
			room.onUserInput()
			data.rname=rname
			data.invoker=invoker
			data.target=target
			data.oddeven=oddeven
			MarbleGameGRPCClient.PressDice(data)
		})

		// controlMarbleRoom(socket, (room, rname, turn) => {
		// 	room.onClientEvent("press_dice", invoker, target, oddeven)
		// })
	})
	socket.on(userEvents.SELECT_BUILD, function (invoker: number, builds: number[]) {

		
		grpcController(socket, (room, rname, turn) => {
			room.onUserInput()
			const data=new marblegame.UserSelectBuild({
				invoker:invoker,
				builds:builds,
				rname:rname
			})
			MarbleGameGRPCClient.SelectBuild(data)
		})
		// controlMarbleRoom(socket, (room, rname, turn) => {
		// 	room.onClientEvent("select_build", invoker, builds)
		// })
	})
	socket.on(userEvents.SELECT_BUYOUT, function (invoker: number, result: boolean) {

		grpcController(socket, (room, rname, turn) => {
			room.onUserInput()
			const data=new marblegame.BoolUserResponse({
				invoker:invoker,
				rname:rname,
				result:result
			})
			MarbleGameGRPCClient.SelectBuyout(data)
		})

		// controlMarbleRoom(socket, (room, rname, turn) => {
		// 	room.onClientEvent("select_buyout", invoker, result)
		// })
	})
	socket.on(userEvents.SELECT_LOAN, function (invoker: number, result: boolean) {
		// controlMarbleRoom(socket, (room, rname, turn) => {
		// 	room.onClientEvent("select_loan", invoker, result)
		// })
		grpcController(socket, (room, rname, turn) => {
			room.onUserInput()
			const data=new marblegame.BoolUserResponse({
				invoker:invoker,
				rname:rname,
				result:result
			})
			MarbleGameGRPCClient.SelectLoan(data)
		})
	})
	socket.on(userEvents.SELECT_TILE, function (invoker: number, pos: number, source: string, result: boolean) {
		// controlMarbleRoom(socket, (room, rname, turn) => {
		// 	room.onClientEvent("select_tile", invoker, pos, source, result)
		// })
		grpcController(socket, (room, rname, turn) => {
			room.onUserInput()
			const data=new marblegame.UserSelectTile({
				invoker:invoker,
				rname:rname,
				result:result,
				pos:pos,
				source:source
			})
			MarbleGameGRPCClient.SelectTile(data)
		})
	})
	socket.on(userEvents.OBTAIN_CARD, function (invoker: number, result: boolean) {
		// controlMarbleRoom(socket, (room, rname, turn) => {
		// 	room.onClientEvent("obtain_card", invoker, result)
		// })

		grpcController(socket, (room, rname, turn) => {
			room.onUserInput()
			const data=new marblegame.BoolUserResponse({
				invoker:invoker,
				rname:rname,
				result:result
			})
			MarbleGameGRPCClient.ObtainCard(data)
		})
	})
	socket.on(userEvents.CONFIRM_CARD_USE, function (invoker: number, result: boolean, cardname: string) {
		// controlMarbleRoom(socket, (room, rname, turn) => {
		// 	room.onClientEvent("confirm_card_use", invoker, result, cardname)
		// })
		grpcController(socket, (room, rname, turn) => {
			room.onUserInput()
			const data=new marblegame.UserConfirmCardUse({
				invoker:invoker,
				rname:rname,
				result:result,
				cardname:cardname
			})
			MarbleGameGRPCClient.ConfirmCardUse(data)
		})
	})
	socket.on(userEvents.SELECT_GODHAND_SPECIAL, function (invoker: number, result: boolean) {
		// controlMarbleRoom(socket, (room, rname, turn) => {
		// 	room.onClientEvent("select_godhand_special", invoker, result)
		// })
		grpcController(socket, (room, rname, turn) => {
			room.onUserInput()
			const data=new marblegame.BoolUserResponse({
				invoker:invoker,
				rname:rname,
				result:result
			})
			MarbleGameGRPCClient.SelectGodhandSpecial(data)
		})
	})
	socket.on(userEvents.SELECT_ISLAND, function (invoker: number, result: boolean) {
		// controlMarbleRoom(socket, (room, rname, turn) => {
		// 	room.onClientEvent("select_island", invoker, result)
		// })

		grpcController(socket, (room, rname, turn) => {
			room.onUserInput()
			const data=new marblegame.BoolUserResponse({
				invoker:invoker,
				rname:rname,
				result:result
			})
			MarbleGameGRPCClient.SelectIsland(data)
		})
	})
}
