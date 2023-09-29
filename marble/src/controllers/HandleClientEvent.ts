import { ServerUnaryCall, sendUnaryData } from "@grpc/grpc-js";
import { marblegame } from "../grpc/services/marblegame";
import RoomStorage from "../RoomStorage";
import { userEvents } from "../Model/models";
interface ParsedPayload{
    rname:string,
    invoker:number,
    type:string,
    args:any[]
}


function HandleEvent<T>(call: ServerUnaryCall<T,marblegame.Bool>,reqParser:(payload:T)=>ParsedPayload, callback: sendUnaryData<marblegame.Bool>){
    let status =true
        try{
            const parsed = reqParser(call.request)
            status= RoomStorage.clientEvent(parsed.rname,parsed.type,parsed.invoker,parsed.args)
        }
        catch(e){
            status=false
            console.error(e)
        }
        finally{
            callback(null,new marblegame.Bool({val:status}))
        }
}

export namespace HandleClientEvent{
    export const PressDice = function(call: ServerUnaryCall<marblegame.UserPressDice,marblegame.Bool>, callback: sendUnaryData<marblegame.Bool>){
       HandleEvent(call,(payload:marblegame.UserPressDice)=>{
            return {
                rname:payload.rname,
                invoker:payload.invoker,
                type:userEvents.PRESS_DICE,
                args:[payload.target,payload.oddeven]
            }
       },callback)
    }

    export const SelectBuild = function(call: ServerUnaryCall<marblegame.UserSelectBuild,marblegame.Bool>, callback: sendUnaryData<marblegame.Bool>){
        HandleEvent(call,(payload)=>{
             return {
                 rname:payload.rname,
                 invoker:payload.invoker,
                 type:userEvents.SELECT_BUILD,
                 args:[payload.builds]
             }
        },callback)
     }

    export const SelectBoolOf =function (type:string){
        return (call: ServerUnaryCall<marblegame.BoolUserResponse,marblegame.Bool>, callback: sendUnaryData<marblegame.Bool>)=>{
            HandleEvent(call,(payload)=>{
                return {
                    rname:payload.rname,
                    invoker:payload.invoker,
                    type:type,
                    args:[payload.result]
                }
           },callback)
        }
    }
     export const SelectTile = function(call: ServerUnaryCall<marblegame.UserSelectTile,marblegame.Bool>, callback: sendUnaryData<marblegame.Bool>){
        HandleEvent(call,(payload)=>{
             return {
                 rname:payload.rname,
                 invoker:payload.invoker,
                 type:userEvents.SELECT_TILE,
                 args:[payload.pos,payload.source,payload.result]
             }
        },callback)
     }
     export const ConfirmCardUse = function(call: ServerUnaryCall<marblegame.UserConfirmCardUse,marblegame.Bool>, callback: sendUnaryData<marblegame.Bool>){
        HandleEvent(call,(payload)=>{
             return {
                 rname:payload.rname,
                 invoker:payload.invoker,
                 type:userEvents.CONFIRM_CARD_USE,
                 args:[payload.result,payload.cardname]
             }
        },callback)
     }

}