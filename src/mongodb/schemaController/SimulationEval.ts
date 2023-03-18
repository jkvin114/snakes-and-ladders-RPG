import type { Types } from "mongoose"
import { SimulationEval,ISimulationEval } from "../SimulationEvalDBSchema"
 
export namespace SimulationEvalSchema{
    export const create = async function (data:ISimulationEval) {
        return await new SimulationEval(data).save()
    }
    
}