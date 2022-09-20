import { Jean } from "../characters/Jean";
import { ITEM, SKILL } from "../data/enum";
import { AiAgent, ItemBuild } from "./AiAgent";

class JeanAgent extends AiAgent{
    itemtree: ItemBuild
	player:Jean
    constructor(player:Jean){
        super(player)
		this.itemtree = 
		new ItemBuild().setItems([
			ITEM.EPIC_SWORD,
			ITEM.SWORD_OF_BLOOD,
			ITEM.EPIC_WHIP,
			ITEM.BOOTS_OF_HASTE,
			ITEM.CROSSBOW_OF_PIERCING,
			ITEM.WARRIORS_SHIELDSWORD
		]).setFinal(ITEM.EPIC_SWORD)
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
	getMessageOnGameStart(): string {
		return "Everyone will be equal under my bullet!"
	}
}
export default JeanAgent