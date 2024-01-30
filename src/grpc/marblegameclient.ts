import { credentials } from "@grpc/grpc-js";
import { marblegame } from "./services/marblegame";
import { MarbleRoom } from "../Marble/MarbleRoom";
import { Logger } from "../logger";
const PORT=50051

export default class MarbleGameGRPCClient{
    private static stub:marblegame.MarbleGameClient=null 
    

    static connect(){
        try{
            
            MarbleGameGRPCClient.stub = new marblegame.MarbleGameClient('localhost:'+PORT,credentials.createInsecure());
            MarbleGameGRPCClient.RequestItem((items)=>{
                MarbleRoom.ItemDescriptionCache = JSON.parse(items)
            })
            // Logger.log("created marblegame grpc client")
        }
        catch(e){
            Logger.error("Failed to connect marble grpc server",String(e))
        }
   }
   /**
    * -1: connection not established
    * -2: error  while conenction 
    * 1: normal
    * @returns 
    */
   static Ping(){
        return new Promise<number>(res=>{
            if(!MarbleGameGRPCClient.stub ) res(-1)
            MarbleGameGRPCClient.stub.Ping(new marblegame.Int(), (error:any, response:marblegame.Int) => {
            if (error) {
                res(-2)
            }else
            res(1)
        });
     })
   }
   static RequestItem(callback:(items:string)=>void){
        if(!MarbleGameGRPCClient.stub ) return
        MarbleGameGRPCClient.stub.RequestItem(new marblegame.Void(), (error:any, response:marblegame.String) => {
            if (error) {
                Logger.err(error);
            }else
            callback(response.val)
        });
    }

    static InitGame(setting:marblegame.GameSetting,callback:()=>void){
        if(!MarbleGameGRPCClient.stub ) return
        MarbleGameGRPCClient.stub.InitGame(setting, (error:any, response:marblegame.Bool) => {
            if (error) {
                Logger.err(error);
            }else
            callback()
        });
    }
    static RequestGameStart(rname:string,callback:(res:boolean)=>void){
        if(!MarbleGameGRPCClient.stub ) return
        MarbleGameGRPCClient.stub.RequestGameStart(new marblegame.String({val:rname}), (error:any, response:marblegame.Bool) => {
            if (error) {
                Logger.err(error);
            }
            else callback(response.val)
        });
    }
    static RequestSetting(req:marblegame.GameSettingRequest,callback:(res:marblegame.GameSettingReponse|null)=>void)
    {
        if(!MarbleGameGRPCClient.stub ) return
        MarbleGameGRPCClient.stub.RequestSetting(req, (error:any, response:marblegame.GameSettingReponse) => {
            if (error) {
                Logger.err(error);
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
                Logger.log("end marble grpc stream",rname)
            })
            stream.on("error",(e)=>{
                Logger.err(String(e))
            })
        }
        catch(e){
            Logger.err(String(e))

        }
    }
    static ResetGame(rname:string){
        if(!MarbleGameGRPCClient.stub ) return
        MarbleGameGRPCClient.stub.ResetGame(new marblegame.String({val:rname}), (error:any, response:marblegame.Bool) => {
            if (error) {
                Logger.err(error);
            }
        });
    }
    static PressDice(data:marblegame.UserPressDice){
        if(!MarbleGameGRPCClient.stub ) return
        MarbleGameGRPCClient.stub.PressDice(data, (error:any, response:marblegame.Bool) => {
            if (error) {
                Logger.err(error);
            }
        });
    }
    static SelectBuild(data:marblegame.UserSelectBuild){
        if(!MarbleGameGRPCClient.stub ) return
        MarbleGameGRPCClient.stub.SelectBuild(data, (error:any, response:marblegame.Bool) => {
            if (error) {
                Logger.err(error);
            }
        });
    }
    static SelectBuyout(data:marblegame.BoolUserResponse){
        if(!MarbleGameGRPCClient.stub ) return
        MarbleGameGRPCClient.stub.SelectBuyout(data, (error:any, response:marblegame.Bool) => {
            if (error) {
                Logger.err(error);
            }
        });
    }
    static SelectLoan(data:marblegame.BoolUserResponse){
        if(!MarbleGameGRPCClient.stub ) return
        MarbleGameGRPCClient.stub.SelectLoan(data, (error:any, response:marblegame.Bool) => {
            if (error) {
                Logger.err(error);
            }
        });
    }
    static SelectTile(data:marblegame.UserSelectTile){
        if(!MarbleGameGRPCClient.stub ) return
        MarbleGameGRPCClient.stub.SelectTile(data, (error:any, response:marblegame.Bool) => {
            if (error) {
                Logger.err(error);
            }
        });
    }
    static ObtainCard(data:marblegame.BoolUserResponse){
        if(!MarbleGameGRPCClient.stub ) return
        MarbleGameGRPCClient.stub.ObtainCard(data, (error:any, response:marblegame.Bool) => {
            if (error) {
                Logger.err(error);
            }
        });
    }
    static ConfirmCardUse(data:marblegame.UserConfirmCardUse){
        if(!MarbleGameGRPCClient.stub ) return
        MarbleGameGRPCClient.stub.ConfirmCardUse(data, (error:any, response:marblegame.Bool) => {
            if (error) {
                Logger.err(error);
            }
        });
    }
    static SelectGodhandSpecial(data:marblegame.BoolUserResponse){
        if(!MarbleGameGRPCClient.stub ) return
        MarbleGameGRPCClient.stub.SelectGodhandSpecial(data, (error:any, response:marblegame.Bool) => {
            if (error) {
                Logger.err(error);
            }
        });
    }
    static SelectIsland(data:marblegame.BoolUserResponse){
        if(!MarbleGameGRPCClient.stub ) return
        MarbleGameGRPCClient.stub.SelectIsland(data, (error:any, response:marblegame.Bool) => {
            if (error) {
                Logger.err(error);
            }
        });
    }



}