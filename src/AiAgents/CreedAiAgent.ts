import { Creed } from "../characters/Creed";
import { AiAgent } from "./AiAgent";

class CreedAiAgent extends AiAgent{
    constructor(player:Creed){
        super(player)
    }
}
export default CreedAiAgent