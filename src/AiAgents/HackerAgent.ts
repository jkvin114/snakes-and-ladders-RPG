import { Hacker } from "../characters/Hacker";
import { ITEM, SKILL } from "../data/enum";
import { AiAgent, ItemBuild } from "./AiAgent";

class HackerAgent extends AiAgent{
    itemtree: ItemBuild
	player:Hacker
    constructor(player:Hacker){
        super(player)
        this.itemtree = new ItemBuild().setItems([
			ITEM.EPIC_SWORD,
			ITEM.EPIC_CRYSTAL_BALL,
			ITEM.ANCIENT_SPEAR,
			ITEM.EPIC_WHIP,
			ITEM.CROSSBOW_OF_PIERCING,
			ITEM.GUARDIAN_ANGEL,
		]).setFinal(ITEM.EPIC_SWORD)
		this.gameStartMessage= "I know everything about you!"
    }
	nextSkill(): number {
		
		if (!this.attemptedSkills.has(SKILL.ULT)) {
			return SKILL.ULT
		}
        
		if (!this.attemptedSkills.has(SKILL.Q)) {
			return SKILL.Q
		}
		if (!this.attemptedSkills.has(SKILL.W)) {
			return SKILL.W
		}
		if (this.player.canBasicAttack()) {
			return AiAgent.BASICATTACK
		}
		return -1
	}
}
export default HackerAgent