import { Silver } from "../characters/Silver";
import { ITEM, SKILL } from "../data/enum";
import { AiAgent, ItemBuild } from "./AiAgent";

class SilverAgent extends AiAgent{
    itemtree: ItemBuild
	player:Silver
    constructor(player:Silver){
        super(player)
        this.itemtree = 
		new ItemBuild().setItems([
			ITEM.EPIC_SHIELD,
			ITEM.EPIC_ARMOR,
			ITEM.POWER_OF_MOTHER_NATURE,
			ITEM.EPIC_FRUIT,
			ITEM.BOOTS_OF_ENDURANCE,
			ITEM.GUARDIAN_ANGEL
		]).setFinal(ITEM.EPIC_SHIELD)
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
	getMessageOnGameStart(): string {
		return "I will defend everything against me!"
	}
}
export default SilverAgent