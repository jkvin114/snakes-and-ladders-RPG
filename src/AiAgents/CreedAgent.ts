import { Creed } from "../characters/Creed";
import { ITEM, SKILL } from "../data/enum";
import { AiAgent } from "./AiAgent";

class CreedAgent extends AiAgent{
    itemtree: {
		level: number
		items: number[]
		final: number
	}
    constructor(player:Creed){
        super(player)
        this.itemtree = {
			level: 0,
			items: [
				ITEM.EPIC_SWORD,
				ITEM.EPIC_WHIP,
				ITEM.SWORD_OF_BLOOD,
				ITEM.WARRIORS_SHIELDSWORD,
				ITEM.CROSSBOW_OF_PIERCING,
				ITEM.GUARDIAN_ANGEL
			],
			final: ITEM.EPIC_SWORD
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
export default CreedAgent