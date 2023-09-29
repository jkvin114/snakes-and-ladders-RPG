
import { Server, ServerCredentials } from "@grpc/grpc-js"
import { loadSync } from "@grpc/proto-loader"
const PROTO_PATH = __dirname + "/proto/marblegame.proto"
import { loadPackageDefinition } from "@grpc/grpc-js"
import { HandleClientEvent,SubscribeEventEmitter,InitGame, RequestGameStart, RequestSetting, ResetGame } from "../controllers"
import { userEvents } from "../Model/models"
const packageDefinition = loadSync(PROTO_PATH, {
	keepCase: true,
	longs: String,
	enums: String,
	defaults: true,
	oneofs: true,
})

const PORT = 50051

export default function StartGRPCServer() {
	const game_proto: any = loadPackageDefinition(packageDefinition).marblegame //package marblegame
	const server = new Server()
	server.bindAsync("0.0.0.0:" + PORT, ServerCredentials.createInsecure(), () => server.start())
	console.log("start grpc server")
	server.addService(game_proto.MarbleGame.service, {
        InitGame:InitGame,
        PressDice:HandleClientEvent.PressDice,
        SelectBuild:HandleClientEvent.SelectBuild,
        SelectTile:HandleClientEvent.SelectTile,
        ConfirmCardUse:HandleClientEvent.ConfirmCardUse,
        SelectBuyout:HandleClientEvent.SelectBoolOf(userEvents.SELECT_BUYOUT),
        SelectLoan:HandleClientEvent.SelectBoolOf(userEvents.SELECT_LOAN),
        ObtainCard:HandleClientEvent.SelectBoolOf(userEvents.OBTAIN_CARD),
        SelectGodhandSpecial:HandleClientEvent.SelectBoolOf(userEvents.SELECT_GODHAND_SPECIAL),
        SelectIsland:HandleClientEvent.SelectBoolOf(userEvents.SELECT_ISLAND),
        ListenGameEvent:SubscribeEventEmitter,
        RequestSetting:RequestSetting,
        RequestGameStart:RequestGameStart,
        ResetGame:ResetGame
    })
}
