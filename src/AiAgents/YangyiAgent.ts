import { Yangyi } from "../characters/Yangyi";
import { ITEM, SKILL } from "../enum";
import { AiAgent } from "./AiAgent";

class YangyiAgent extends AiAgent{
    itemtree: {
		level: number
		items: number[]
		final: number
	}
    constructor(player:Yangyi){
        super(player)
        this.itemtree = {
			level: 0,
			items: [
				ITEM.EPIC_SWORD,
				ITEM.ANCIENT_SPEAR,
				ITEM.EPIC_WHIP,
				ITEM.SWORD_OF_BLOOD,
				ITEM.WARRIORS_SHIELDSWORD,
				ITEM.EPIC_FRUIT
			],
			final: ITEM.EPIC_SWORD
		}
    }
	nextSkill(): number {
		if (this.player.canBasicAttack()) {
			return  AiAgent.BASICATTACK
		}
		if (!this.attemptedSkills.has(SKILL.Q)) {
			return SKILL.Q
		}
		if (!this.attemptedSkills.has(SKILL.W)) {
			return SKILL.W
		}
		if (!this.attemptedSkills.has(SKILL.ULT)) {
			return SKILL.ULT
		}
		return -1
	}
}
export default YangyiAgent