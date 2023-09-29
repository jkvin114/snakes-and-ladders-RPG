import { ServerErrorResponse, ServerUnaryCall, ServerWritableStream, sendUnaryData } from "@grpc/grpc-js";
import { marblegame } from "../grpc/services/marblegame";
import RoomStorage from "../RoomStorage";
export default function RequestSetting(call:ServerUnaryCall<marblegame.GameSettingRequest,marblegame.GameSettingReponse>,callback: sendUnaryData<marblegame.GameSettingReponse>){
    let settingObj = RoomStorage.GetSetting(call.request.rname,call.request.turn)

    callback(null,new marblegame.GameSettingReponse({
        jsonPayload:JSON.stringify(settingObj)
    }))
}