import { Bird } from "../characters/Bird";
import { ITEM, SKILL } from "../data/enum";
import { AiAgent } from "./AiAgent";

class BirdAgent extends AiAgent{
    itemtree: {
		level: number
		items: number[]
		final: number
	}
    constructor(player:Bird){
        super(player)
        this.itemtree = {
			level: 0,
			items: [
				ITEM.EPIC_CRYSTAL_BALL,
				ITEM.EPIC_WHIP,
				ITEM.ANCIENT_SPEAR,
				ITEM.TIME_WARP_POTION,
				ITEM.CARD_OF_DECEPTION,
				ITEM.GUARDIAN_ANGEL
			],
			final: ITEM.ANCIENT_SPEAR
		}
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