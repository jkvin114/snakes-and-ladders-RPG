import { ClientResponseModel } from "../../../Model/ClientResponseModel";
import { ServerRequestModel } from "../../../Model/ServerRequestModel";
import { range } from "../../util";
import  ActionChoice  from "./ActionChoice";

export class DiceChoice extends ActionChoice<ServerRequestModel.DiceSelection,ClientResponseModel.PressDice>{
    generate(req: ServerRequestModel.DiceSelection): ClientResponseModel.PressDice[] {
        let list=range(12,2).map(n=>{return {target:n,oddeven:0}})
        if(!req.hasOddEven){
            return list
        }
        //3,5,7,9,11
        for(let i=3;i<=11;i+=2){
            list.push( {target:i,oddeven:1})
        }
        //2,4,6,8,10,12
        for(let i=2;i<=12;i+=2){
            list.push( {target:i,oddeven:2})
        }

        return list

    }

}