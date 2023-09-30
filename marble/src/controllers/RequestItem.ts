import { ServerErrorResponse, ServerUnaryCall, ServerWritableStream, sendUnaryData } from "@grpc/grpc-js";
import { marblegame } from "../grpc/services/marblegame";
import { ITEM_REGISTRY } from "../Marble/ItemRegistry";
export default function RequestItem(call:ServerUnaryCall<marblegame.Void,marblegame.String>,callback: sendUnaryData<marblegame.String>){
    let items = ITEM_REGISTRY.getAllDescriptions()
    callback(null,new marblegame.String({
        val:JSON.stringify(items)
    }))
}