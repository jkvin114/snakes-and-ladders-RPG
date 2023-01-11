import { Timo } from "../characters/Timo";
import { ITEM, SKILL } from "../data/enum";
import { AiAgent, ItemBuild } from "./AiAgent";

class TimoAgent extends AiAgent{
    itemtree: ItemBuild
	player:Timo
    constructor(player:Timo){
        super(player)
		this.itemtree = new ItemBuild().setItems([
			ITEM.INVISIBILITY_CLOAK,
			ITEM.EPIC_CRYSTAL_BALL,
			ITEM.TIME_WARP_POTION,
			ITEM.CARD_OF_DECEPTION,
			ITEM.ANCIENT_SPEAR,
			ITEM.BOOTS_OF_PROTECTION
		]).setFinal(ITEM.EPIC_CRYSTAL_BALL)
		this.gameStartMessage= "Beware of the silent assasination!"
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
export default TimoAgent