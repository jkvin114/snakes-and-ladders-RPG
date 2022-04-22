import { Gorae } from "../characters/Gorae";
import { ITEM, SKILL } from "../enum";
import { AiAgent } from "./AiAgent";

class GoraeAgent extends AiAgent{
    itemtree: {
		level: number
		items: number[]
		final: number
	}
    constructor(player:Gorae){
        super(player)
        this.itemtree = {
			level: 0,
			items: [ITEM.FULL_DIAMOND_ARMOR,
				 	ITEM.EPIC_FRUIT,
				 	ITEM.EPIC_SHIELD, 
				 	ITEM.EPIC_ARMOR,
				  	ITEM.POWER_OF_MOTHER_NATURE,
					ITEM.WARRIORS_SHIELDSWORD
				],
			final: ITEM.FULL_DIAMOND_ARMOR,
		}
    }
	nextSkill(): number {
		if (this.player.canBasicAttack()) {
			return AiAgent.BASICATTACK
		}
		if (!this.attemptedSkills.has(SKILL.W)) {
			return SKILL.W
		}
		if (!this.attemptedSkills.has(SKILL.Q)) {
			return SKILL.Q
		}
		if (!this.attemptedSkills.has(SKILL.ULT)) {
			return SKILL.ULT
		}
		return -1
	}
}
export default GoraeAgent