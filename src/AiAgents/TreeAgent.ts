import { Tree } from "../characters/Tree";
import { ITEM, SKILL } from "../data/enum";
import { AiAgent } from "./AiAgent";

class TreeAgent extends AiAgent{
    itemtree: {
		level: number
		items: number[]
		final: number
	}
    constructor(player:Tree){
        super(player)
        this.itemtree = {
			level: 0,
			items: [
				ITEM.EPIC_CRYSTAL_BALL,
				ITEM.CARD_OF_DECEPTION,
				ITEM.TIME_WARP_POTION,
				ITEM.ANCIENT_SPEAR,
				ITEM.INVISIBILITY_CLOAK,
				ITEM.BOOTS_OF_PROTECTION,
			],
			final: ITEM.EPIC_CRYSTAL_BALL
		}
    }
	nextSkill(): number {
		if (this.player.canBasicAttack()) {
			return  AiAgent.BASICATTACK
		}
		if (!this.attemptedSkills.has(SKILL.ULT)) {
			return SKILL.ULT
		}
		if (!this.attemptedSkills.has(SKILL.W)) {
			return SKILL.W
		}
		if (!this.attemptedSkills.has(SKILL.Q)) {
			return SKILL.Q
		}
		return -1
	}
}
export default TreeAgent