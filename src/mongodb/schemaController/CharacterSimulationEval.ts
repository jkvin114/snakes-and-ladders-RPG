import type { Types } from "mongoose"
import { CharacterSimulationEval,ICharacterSimulationEval } from "../SimulationEvalDBSchema"
 
export namespace CharacterSimulationEvalSchema{
    export const create = async function (data:ICharacterSimulationEval) {
        return await new CharacterSimulationEval(data).save()
    }
    export const findByVersion=async function(version:string,char:number) {
        return await CharacterSimulationEval.find({patchVersion:version,charId:char})
    }

    export const findTrend=async function(char:number,map:string,gametype:string) {
        return await CharacterSimulationEval.find({charId:char,mapName:map,gameType:gametype}).select("count wins patchVersion")
    }
    export const findByMapAndGameType=async function(version:string,char:number,map:string,gametype:string) {
        return await CharacterSimulationEval.find({patchVersion:version,charId:char,mapName:map,gameType:gametype})
    }
    export const  findCharacterApperances=async function(char:number){
        return await CharacterSimulationEval.find({charId:char}).select("mapName gameType patchVersion")
    }
    export const deleteBy=async function(version:string,map:string,gametype:string) {
        return await CharacterSimulationEval.deleteMany({patchVersion:version,mapName:map,gameType:gametype})
    }
}