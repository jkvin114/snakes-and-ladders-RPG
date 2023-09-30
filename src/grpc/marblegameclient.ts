import { credentials } from "@grpc/grpc-js";
import { marblegame } from "./services/marblegame";
import { MarbleRoom } from "../Marble/MarbleRoom";
const PORT=50051

export default class MarbleGameGRPCClient{
    private static stub:marblegame.MarbleGameClient=null 
    

    static connect(){
        console.log("create grpc client")
        try{

            MarbleGameGRPCClient.stub = new marblegame.MarbleGameClient('localhost:'+PORT,credentials.createInsecure());
            MarbleGameGRPCClient.RequestItem((items)=>{
                MarbleRoom.ItemDescriptionCache = JSON.parse(items)
            })
        }
        catch(e){
            console.error(e)
        }
   }
   /**
    * -1: connection not established
    * -2: error  while conenction 
    * 0>: a time at which the grpc server received the request
    * @returns 
    */
   static Ping(){
        return new Promise<number>(res=>{
            if(!MarbleGameGRPCClient.stub ) res(-1)
            MarbleGameGRPCClient.stub.Ping(new marblegame.Int(), (error:any, response:marblegame.Int) => {
            if (error) {
                console.error(error);
                res(-2)
            }else
            res(response.val)
        });
     })
   }
   static RequestItem(callback:(items:string)=>void){
        if(!MarbleGameGRPCClient.stub ) return
        MarbleGameGRPCClient.stub.RequestItem(new marblegame.Void(), (error:any, response:marblegame.String) => {
            if (error) {
                console.error(error);
            }else
            callback(response.val)
        });
    }

    static InitGame(setting:marblegame.GameSetting,callback:()=>void){
        if(!MarbleGameGRPCClient.stub ) return
        MarbleGameGRPCClient.stub.InitGame(setting, (error:any, response:marblegame.Bool) => {
            if (error) {
                console.error(error);
            }else
            callback()
        });
    }
    static RequestGameStart(rname:string,callback:(res:boolean)=>void){
        if(!MarbleGameGRPCClient.stub ) return
        MarbleGameGRPCClient.stub.RequestGameStart(new marblegame.String({val:rname}), (error:any, response:marblegame.Bool) => {
            if (error) {
                console.error(error);
            }
            else callback(response.val)
        });
    }
    static RequestSetting(req:marblegame.GameSettingRequest,callback:(res:marblegame.GameSettingReponse|null)=>void)
    {
        if(!MarbleGameGRPCClient.stub ) return
        MarbleGameGRPCClient.stub.RequestSetting(req, (error:any, response:marblegame.GameSettingReponse) => {
            if (error) {
                console.error(error);
                callback(null)
            }
            else callback(response)
        });
    }
    static ListenGameEvent(rname:string,callback:(res:marblegame.GameEvent)=>void){
        if(!MarbleGameGRPCClient.stub ) return
        try{
            const stream = MarbleGameGRPCClient.stub.ListenGameEvent(new marblegame.String({val:rname}));
            stream.on("data", (data) => {
                callback(data)
            })
            stream.on("end", () => {
                console.log("end stream")
            })
            stream.on("error",(e)=>{
                console.error(e)
            })
        }
        catch(e){
            
        }
    }
    static ResetGame(rname:string){
        if(!MarbleGameGRPCClient.stub ) return
        MarbleGameGRPCClient.stub.ResetGame(new marblegame.String({val:rname}), (error:any, response:marblegame.Bool) => {
            if (error) {
                console.error(error);
            }
        });
    }
    static PressDice(data:marblegame.UserPressDice){
        if(!MarbleGameGRPCClient.stub ) return
        MarbleGameGRPCClient.stub.PressDice(data, (error:any, response:marblegame.Bool) => {
            if (error) {
                console.error(error);
            }
        });
    }
    static SelectBuild(data:marblegame.UserSelectBuild){
        if(!MarbleGameGRPCClient.stub ) return
        MarbleGameGRPCClient.stub.SelectBuild(data, (error:any, response:marblegame.Bool) => {
            if (error) {
                console.error(error);
            }
        });
    }
    static SelectBuyout(data:marblegame.BoolUserResponse){
        if(!MarbleGameGRPCClient.stub ) return
        MarbleGameGRPCClient.stub.SelectBuyout(data, (error:any, response:marblegame.Bool) => {
            if (error) {
                console.error(error);
            }
        });
    }
    static SelectLoan(data:marblegame.BoolUserResponse){
        if(!MarbleGameGRPCClient.stub ) return
        MarbleGameGRPCClient.stub.SelectLoan(data, (error:any, response:marblegame.Bool) => {
            if (error) {
                console.error(error);
            }
        });
    }
    static SelectTile(data:marblegame.UserSelectTile){
        if(!MarbleGameGRPCClient.stub ) return
        MarbleGameGRPCClient.stub.SelectTile(data, (error:any, response:marblegame.Bool) => {
            if (error) {
                console.error(error);
            }
        });
    }
    static ObtainCard(data:marblegame.BoolUserResponse){
        if(!MarbleGameGRPCClient.stub ) return
        MarbleGameGRPCClient.stub.ObtainCard(data, (error:any, response:marblegame.Bool) => {
            if (error) {
                console.error(error);
            }
        });
    }
    static ConfirmCardUse(data:marblegame.UserConfirmCardUse){
        if(!MarbleGameGRPCClient.stub ) return
        MarbleGameGRPCClient.stub.ConfirmCardUse(data, (error:any, response:marblegame.Bool) => {
            if (error) {
                console.error(error);
            }
        });
    }
    static SelectGodhandSpecial(data:marblegame.BoolUserResponse){
        if(!MarbleGameGRPCClient.stub ) return
        MarbleGameGRPCClient.stub.SelectGodhandSpecial(data, (error:any, response:marblegame.Bool) => {
            if (error) {
                console.error(error);
            }
        });
    }
    static SelectIsland(data:marblegame.BoolUserResponse){
        if(!MarbleGameGRPCClient.stub ) return
        MarbleGameGRPCClient.stub.SelectIsland(data, (error:any, response:marblegame.Bool) => {
            if (error) {
                console.error(error);
            }
        });
    }



}