import { EntityMediator } from "../EntityMediator";
import { SKILL } from "../enum";
import { Player } from "../player";
import { SkillTargetSelector } from "../Util";

abstract class AiAgent{
    player:Player
    mediator:EntityMediator
    constructor(player:Player){
        this.player=player
        this.mediator=player.mediator
    }
    static aiSkill(){

    }
    nextSkill():SKILL{
        return SKILL.Q
    }
    useSkill(skill:SKILL){

    }
    
    getTarget(targets:Player[]) {

	}
	getProjPos(selector:SkillTargetSelector) {

	}
	getAreaPos(selector:SkillTargetSelector){

	}


}

class EmptyAiAgent extends AiAgent{
    constructor(player:Player){
        super(player)
    }
}
export {AiAgent}