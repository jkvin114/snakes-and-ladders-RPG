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
			ITEM.FLAIL_OF_JUDGEMENT,
			ITEM.EPIC_WHIP,
			ITEM.CROSSBOW_OF_PIERCING,
			ITEM.WARRIORS_SHIELDSWORD,
			ITEM.BOOTS_OF_HASTE
		]).setFinal(ITEM.EPIC_SWORD)
		this.gameStartMessage="Everyone will be equal under my bullet!"
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