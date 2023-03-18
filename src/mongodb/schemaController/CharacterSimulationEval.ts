import type { Types } from "mongoose"
import { CharacterSimulationEval,ICharacterSimulationEval } from "../SimulationEvalDBSchema"
 
export namespace CharacterSimulationEvalSchema{
    export const create = async function (data:ICharacterSimulationEval) {
        return await new CharacterSimulationEval(data).save()
    }

}