import { AiAgent } from "../AiAgents/AiAgent";
import { CharacterSkillManager } from "./SkillManager/CharacterSkillManager";
import SETTINGS = require("../../../res/globalsettings.json")

export class Character<S extends CharacterSkillManager,A extends AiAgent>{
    skillManager:S
    AiAgent:A
    id:number
    name:string

    constructor(id:number,skillManager:S,AiAgent:A){
        this.id=id
        this.name=SETTINGS.characters[id].name
        this.skillManager=skillManager
        this.AiAgent=AiAgent
    }
}