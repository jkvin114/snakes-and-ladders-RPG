import { ServerRequestModel } from "../../../Model/ServerRequestModel";
import ActionChoice from "./ActionChoice";

export default class IslandChoice extends ActionChoice<ServerRequestModel.IslandSelection,boolean>{

    generate(req:ServerRequestModel.IslandSelection): boolean[] {
        if(req.canEscape) return [true,false]
        return [false]
    }
}