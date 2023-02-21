import { Tree } from "../characters/Tree";
import { ITEM, SKILL } from "../data/enum";
import { AiAgent, ItemBuild } from "./AiAgent";
import { ItemBuildEntry, UtilityCondition } from "./ItemBuild";

class TreeAgent extends AiAgent{
    itemBuild: ItemBuild
	player:Tree
    constructor(player:Tree){
        super(player)
		this.itemBuild = new ItemBuild().setItemEntries([
			new ItemBuildEntry(ITEM.EPIC_CRYSTAL_BALL),
			new ItemBuildEntry(ITEM.CARD_OF_DECEPTION),
			new ItemBuildEntry(ITEM.TIME_WARP_POTION),
			new ItemBuildEntry(ITEM.INVISIBILITY_CLOAK)
			,new ItemBuildEntry(ITEM.STAFF_OF_JUDGEMENT).setChangeCondition(
				ITEM.CROSSBOW_OF_PIERCING,
				UtilityCondition.MoreTankers()
				)
			,new ItemBuildEntry(ITEM.BOOTS_OF_PROTECTION).setChangeCondition(
				ITEM.ANCIENT_SPEAR,
				UtilityCondition.MoreTankers(0.3)
				).setSecondChangeCondition(
					ITEM.BOOTS_OF_ENDURANCE,
					UtilityCondition.MoreAPThanAD(2)
				)
		],new ItemBuildEntry(ITEM.EPIC_CRYSTAL_BALL))

		this.gameStartMessage= "I will not be your giving tree!"
    }
	nextSkill(): number {
		
		if (!this.attemptedSkills.has(SKILL.ULT)) {
			return SKILL.ULT
		}
		if (!this.attemptedSkills.has(SKILL.W)) {
			return SKILL.W
		}
		if (!this.attemptedSkills.has(SKILL.Q)) {
			return SKILL.Q
		}
		if (this.player.canBasicAttack()) {
			return AiAgent.BASICATTACK
		}
		return -1
	}
}
export default TreeAgent