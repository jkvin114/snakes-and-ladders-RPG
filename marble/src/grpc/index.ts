
import { Server, ServerCredentials } from "@grpc/grpc-js"
import { loadSync } from "@grpc/proto-loader"
const PROTO_PATH = __dirname + "/proto/marblegame.proto"
import { loadPackageDefinition } from "@grpc/grpc-js"
import { HandleClientEvent,SubscribeEventEmitter,InitGame, RequestGameStart, RequestSetting, ResetGame } from "../controllers"
import { userEvents } from "../Model/models"
import RequestItem from "../controllers/RequestItem"
import Ping from "../controllers/ping"
import { Logger } from "../logger"
const packageDefinition = loadSync(PROTO_PATH, {
	keepCase: true,
	longs: String,
	enums: String,
	defaults: true,
	oneofs: true,
})

const PORT = process.env.PORT?process.env.PORT:50051

export default function StartGRPCServer() {
	const game_proto: any = loadPackageDefinition(packageDefinition).marblegame //package marblegame
	const server = new Server()
	server.bindAsync("0.0.0.0:" + PORT, ServerCredentials.createInsecure(), () => server.start())
	Logger.log("start grpc server at port:"+PORT)
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
        ResetGame:ResetGame,
        RequestItem:RequestItem,
        Ping:Ping
    })
}
