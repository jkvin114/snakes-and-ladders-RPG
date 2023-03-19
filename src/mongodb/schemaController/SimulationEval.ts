import type { Types } from "mongoose"
import { SimulationEval,ISimulationEval } from "../SimulationEvalDBSchema"
 
export namespace SimulationEvalSchema{
    export const create = async function (data:ISimulationEval) {
        return await new SimulationEval(data).save()
    }
    export const findAllVersions=async function() {
        return await SimulationEval.find({}).select("serverVersion")
    }
    export const findMapsInVersion=async function(version:string) {
        return await SimulationEval.find({serverVersion:version}).select("mapName")
    }
    export const findGameTypesInVersion=async function(version:string) {
        return await SimulationEval.find({serverVersion:version}).select("gameType")
    }
    
    export const findByVersion=async function(version:string) {
        return await SimulationEval.find({serverVersion:version})
    }

    export const findByVersionWithCharacters=async function(version:string,map:string) {
        return await SimulationEval.find({serverVersion:version,mapName:map}).populate<{characters:ISimulationEval[]}>("characters")
    }

}