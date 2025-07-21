import { ServerRequestModel } from "../../../Model/ServerRequestModel";
import { BUILDING } from "../../tile/Tile";
import { BuildType } from "../../tile/enum";
import  ActionChoice  from "./ActionChoice";

export class BuildChoice extends ActionChoice<ServerRequestModel.LandBuildSelection,number[]>{
   private static readonly builds=[BUILDING.LAND,BUILDING.VILLA,BUILDING.BUILDING,BUILDING.HOTEL]
    
    generate(req: ServerRequestModel.LandBuildSelection): number[][] {
        if(req.type===BuildType.LANDMARK){
            return [[BUILDING.LANDMARK],[]]
        }
        if(req.type===BuildType.SIGHT){
            return [[BUILDING.SIGHT],[]]
        }

        let avaliableBuilds:BUILDING[]=[]
        let requiredMoney=0
        //land,villa,building,hotel
        for (const b of BuildChoice.builds) {
            if (req.buildsHave.includes(b)) {
                continue
            }
            requiredMoney += req.builds[b-1].buildPrice * req.discount
            if(req.builds[b-1].cycleLeft > 0 || req.money<requiredMoney) continue

            avaliableBuilds.push(b as BUILDING)
        }


        let choices=[[...avaliableBuilds],[]]


        //3건 방지
        if(req.buildsHave.length+avaliableBuilds.length==4){

            if(avaliableBuilds[0]===BUILDING.LAND)
            {
                //exclude first building except for the land
                choices.push(avaliableBuilds.filter((b,i)=>i!==1))
            }
            else if(avaliableBuilds.length>1){
                //exclude first building
                choices.push(avaliableBuilds.filter((b,i)=>i>0))
                
            }
        }

        return choices

    }

}