import { ClientResponseModel } from "../../../Model/ClientResponseModel";
import { ServerRequestModel } from "../../../Model/ServerRequestModel";
import  ActionChoice  from "./ActionChoice";

export class CardChoice extends ActionChoice<ServerRequestModel.CardSelection,ClientResponseModel.UseCard>{
    generate(req: ServerRequestModel.CardSelection): ClientResponseModel.UseCard[] {
        return [{result:true,cardname:req.cardname},{result:false,cardname:req.cardname}]
    }
}