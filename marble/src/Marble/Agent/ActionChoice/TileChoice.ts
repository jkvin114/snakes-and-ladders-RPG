import { ClientResponseModel } from "../../../Model/ClientResponseModel";
import { ServerRequestModel } from "../../../Model/ServerRequestModel";
import ActionChoice  from "./ActionChoice";

export class TileChoice extends ActionChoice<ServerRequestModel.TileSelection,ClientResponseModel.SelectTile>{
    generate(req: ServerRequestModel.TileSelection): ClientResponseModel.SelectTile[] {
        let list=req.tiles.map(t=>{return {pos:t,name:req.source,result:true}})
        list.push({pos:0,name:req.source,result:false})
        return list
    }
    /**
     * generate tile list without an option to cancel the choice
     * @param req 
     * @returns 
     */
    generateNoCancel(req: ServerRequestModel.TileSelection){
        let list=req.tiles.map(t=>{return {pos:t,name:req.source,result:true}})
        return list
    }

}