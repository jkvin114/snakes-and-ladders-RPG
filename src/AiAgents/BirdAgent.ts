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
				ITEM.TIME_WARP_POTION,
				ITEM.ANCIENT_SPEAR,
				ITEM.CARD_OF_DECEPTION,
				ITEM.GUARDIAN_ANGEL
			],
			final: ITEM.ANCIENT_SPEAR
		}
    }
	nextSkill(): number {
		
		if (!this.attemptedSkills.has(SKILL.ULT)) {
			return SKILL.ULT
		}
		if (!this.attemptedSkills.has(SKILL.W)) {
			return SKILL.W
		}
		if (this.player.canBasicAttack()) {
			return AiAgent.BASICATTACK
		}
		if (!this.attemptedSkills.has(SKILL.Q)) {
			return SKILL.Q
		}
		return -1
	}
}
export default BirdAgent