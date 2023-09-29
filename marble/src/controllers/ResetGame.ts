import { ServerUnaryCall, ServerWritableStream, sendUnaryData } from "@grpc/grpc-js";
import { marblegame } from "../grpc/services/marblegame";
import RoomStorage from "../RoomStorage";

export default function ResetGame(call:ServerUnaryCall<marblegame.String,marblegame.GameEvent>,callback: sendUnaryData<marblegame.Bool>){
    RoomStorage.remove(call.request.val)
    callback(null,new marblegame.Bool({val:true}))
}