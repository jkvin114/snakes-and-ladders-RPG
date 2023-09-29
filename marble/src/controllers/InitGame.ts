import { ServerUnaryCall, sendUnaryData } from "@grpc/grpc-js/build/src/server-call";
import { marblegame } from "../grpc/services/marblegame";
import { Server, ServerCredentials, ServerReadableStream, ServerWritableStream } from "@grpc/grpc-js";
import RoomStorage from "../RoomStorage";


export default function InitGame(call: ServerUnaryCall<marblegame.GameSetting,marblegame.Bool>, callback: sendUnaryData<marblegame.Bool>){
    const setting = call.request
    let result = RoomStorage.create(setting)
    
    callback(null,new marblegame.Bool({val:result}))
}