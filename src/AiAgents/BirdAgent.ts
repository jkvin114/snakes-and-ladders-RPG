import { Bird } from "../characters/Bird";
import { ITEM, SKILL } from "../data/enum";
import { AiAgent, ItemBuild } from "./AiAgent";

class BirdAgent extends AiAgent{
    itemtree: ItemBuild
	player:Bird
    constructor(player:Bird){
        super(player)
        this.itemtree = new ItemBuild().setItems([
				ITEM.EPIC_CRYSTAL_BALL,
				ITEM.EPIC_WHIP,
				ITEM.STAFF_OF_JUDGEMENT,
				ITEM.TIME_WARP_POTION,
				ITEM.ANCIENT_SPEAR,
				ITEM.GUARDIAN_ANGEL
			]).setFinal(ITEM.ANCIENT_SPEAR)
		this.gameStartMessage="I will burn you all in the name of the phenix!"
		//  {
		// 	level: 0,
		// 	items: 
		// 	final: 
		// }
    }
	nextSkill(): number {
		
		if (!this.attemptedSkills.has(SKILL.ULT)) {
			if(this.player.cooltime[SKILL.Q] <=2 && this.player.cooltime[SKILL.W] <=1)
				return SKILL.ULT
		}
		if (!this.attemptedSkills.has(SKILL.W)) {
			if(this.player.cooltime[SKILL.Q] <=1)
				return SKILL.W
		}
		if (this.player.canBasicAttack()) {
			return AiAgent.BASICATTACK
		}
		if (!this.attemptedSkills.has(SKILL.Q)) {
			if(this.player.cooltime[SKILL.W] === 1 || this.player.cooltime[SKILL.ULT] === 1) return -1

			return SKILL.Q
		}
		return -1
	}
}
export default BirdAgent