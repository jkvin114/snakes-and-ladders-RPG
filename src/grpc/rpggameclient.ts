import { credentials } from "@grpc/grpc-js";
import { marblegame } from "./services/marblegame";
import { rpggame } from "./services/rpggame";
const PORT=50052

export default class RPGGameGRPCClient{
    private static stub:rpggame.RPGGameClient=null 
    static connect(){
        console.log("create rpggame grpc client")
        try{

            RPGGameGRPCClient.stub = new rpggame.RPGGameClient('localhost:'+PORT,credentials.createInsecure());

        }
        catch(e){
            console.error(e)
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
        if(!RPGGameGRPCClient.stub ) res(-1)
        RPGGameGRPCClient.stub.Ping(new rpggame.Int(), (error:any, response:rpggame.Int) => {
        if (error) {
            res(-2)
        }else
        res(1)
    });
 })
}
}