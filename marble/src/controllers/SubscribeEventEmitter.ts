import { ServerWritableStream } from "@grpc/grpc-js";
import { marblegame } from "../grpc/services/marblegame";
import RoomStorage from "../RoomStorage";


export default function SubscribeEventEmitter(call:ServerWritableStream<marblegame.String,marblegame.GameEvent>){
   let res= RoomStorage.SubscribeEventEmitter(call.request.val,call)
    if(!res) console.error("Failed to subscribe event emitter! room id:"+call.request.val)
}