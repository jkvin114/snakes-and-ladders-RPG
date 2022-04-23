import { Jean } from "../characters/Jean";
import { ITEM, SKILL } from "../data/enum";
import { AiAgent } from "./AiAgent";

class JeanAgent extends AiAgent{
    itemtree: {
		level: number
		items: number[]
		final: number
	}
    constructor(player:Jean){
        super(player)
		this.itemtree = {
			level: 0,
			items: [
				ITEM.EPIC_SWORD,
				ITEM.SWORD_OF_BLOOD,
				ITEM.EPIC_WHIP,
				ITEM.BOOTS_OF_HASTE,
				ITEM.CROSSBOW_OF_PIERCING,
				ITEM.WARRIORS_SHIELDSWORD
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
export default JeanAgent