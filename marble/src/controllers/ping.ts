import { ServerUnaryCall, sendUnaryData } from "@grpc/grpc-js/build/src/server-call";
import { marblegame } from "../grpc/services/marblegame";
import { Server, ServerCredentials, ServerReadableStream, ServerWritableStream } from "@grpc/grpc-js";
import RoomStorage from "../RoomStorage";


export default function Ping(call: ServerUnaryCall<marblegame.Int,marblegame.Int>, callback: sendUnaryData<marblegame.Int>){
    

    callback(null,new marblegame.Int({val:new Date().valueOf()}))
}