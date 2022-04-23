import { Silver } from "../characters/Silver";
import { ITEM, SKILL } from "../data/enum";
import { AiAgent } from "./AiAgent";

class SilverAgent extends AiAgent{
    itemtree: {
		level: number
		items: number[]
		final: number
	}
    constructor(player:Silver){
        super(player)
        this.itemtree = {
			level: 0,
			items: [
				ITEM.EPIC_SHIELD,
				ITEM.EPIC_ARMOR,
				ITEM.POWER_OF_MOTHER_NATURE,
				ITEM.EPIC_FRUIT,
				ITEM.BOOTS_OF_ENDURANCE,
				ITEM.GUARDIAN_ANGEL
			],
			final: ITEM.EPIC_SHIELD
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
export default SilverAgent