import { ServerWritableStream } from "@grpc/grpc-js";
import { marblegame } from "../grpc/services/marblegame";
import RoomStorage from "../RoomStorage";
import { Logger } from "../logger";


export default function SubscribeEventEmitter(call:ServerWritableStream<marblegame.String,marblegame.GameEvent>){
   let res= RoomStorage.SubscribeEventEmitter(call.request.val,call)
    if(!res) Logger.err("Failed to subscribe event emitter! room id:"+call.request.val)
}