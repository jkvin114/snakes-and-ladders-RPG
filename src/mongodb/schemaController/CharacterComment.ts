import type { Types } from "mongoose"
import { CharacterComment,ICharacterComment } from "../SimulationEvalDBSchema"
 
export namespace CharacterCommentSchema{
    
    export const create = async function (data:ICharacterComment) {
        return await new CharacterComment(data).save()
    }
    export const findByCharacter = async function (charId:number) {
        return await CharacterComment.find({charId:charId})
    }
}