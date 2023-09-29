import { ServerErrorResponse, ServerUnaryCall, ServerWritableStream, sendUnaryData } from "@grpc/grpc-js";
import { marblegame } from "../grpc/services/marblegame";
import RoomStorage from "../RoomStorage";
export default function RequestGameStart(call:ServerUnaryCall<marblegame.String,marblegame.Bool>,callback: sendUnaryData<marblegame.Bool>){
    let result = RoomStorage.TryStartGame(call.request.val)

    callback(null,new marblegame.Bool({
        val:result
    }))
}