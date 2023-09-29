import { ServerWritableStream } from "@grpc/grpc-js";
import Room from "./Room";
import { marblegame } from "./grpc/services/marblegame";
import { GameType } from "./Marble/enum";

export default class RoomStorage{
    private static readonly ROOMS = new Map<string,Room>()
    static create(setting:marblegame.GameSetting){
        const room=new Room(setting.rname,setting.map,setting.gametype,setting.isTeam,setting.playerlist)
        RoomStorage.ROOMS.set(setting.rname,room)
        room.user_gameReady(setting.rname,setting.items,setting.gametype)
        return true
    }
    static remove(rname:string){
        if(!RoomStorage.ROOMS.has(rname)) return false
        RoomStorage.ROOMS.get(rname)?.onDestroy()

        RoomStorage.ROOMS.delete(rname)
        return true
    }
    
    static SubscribeEventEmitter(rname:string,call:ServerWritableStream<marblegame.String,marblegame.GameEvent>){
        if(!RoomStorage.ROOMS.has(rname)) return false
        RoomStorage.ROOMS.get(rname)?.registerClientInterface(call)
        return true
    }
    static clientEvent(rname:string,type:string,invoker:number,args:any[]){
        if(!RoomStorage.ROOMS.has(rname)) return false
        
        RoomStorage.ROOMS.get(rname)?.onClientEvent(type,invoker,args)
        return true
    }
    static GetSetting(rname:string,turn:number){
        const room=RoomStorage.ROOMS.get(rname)
        if(!room) return null
        return room.user_requestSetting()
    }
    static TryStartGame(rname:string){
        const room=RoomStorage.ROOMS.get(rname)
        if(!room) return false
        let canstart=room.user_startGame()
		if (!canstart) {
			console.log("connecting incomplete")
            return false
		}
        return true
    }
}