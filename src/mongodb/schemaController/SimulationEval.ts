import type { Types } from "mongoose"
import { SimulationEval,ISimulationEval } from "../SimulationEvalDBSchema"
 
export namespace SimulationEvalSchema{
    export const create = async function (data:ISimulationEval) {
        return await new SimulationEval(data).save()
    }
    export const findAllVersions=async function() {
        return await SimulationEval.find({}).select("patchVersion")
    }
    export const findMapsInVersion=async function(version:string) {
        return await SimulationEval.find({patchVersion:version}).select("mapName")
    }
    export const findGameTypesInVersion=async function(version:string) {
        return await SimulationEval.find({patchVersion:version}).select("gameType")
    }
    
    export const findByVersion=async function(version:string) {
        return await SimulationEval.find({patchVersion:version})
    }

    export const findByVersionWithCharacters=async function(version:string,map:string) {
        return await SimulationEval.find({patchVersion:version,mapName:map}).populate<{characters:ISimulationEval[]}>("characters")
    }
    export const deleteBy=async function(version:string,map:string,gametype:string) {
        return await SimulationEval.deleteMany({patchVersion:version,mapName:map,gameType:gametype})
    }
}