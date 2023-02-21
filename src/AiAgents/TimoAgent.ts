import { Timo } from "../characters/Timo";
import { ITEM, SKILL } from "../data/enum";
import { AiAgent, ItemBuild } from "./AiAgent";
import { ItemBuildEntry, UtilityCondition } from "./ItemBuild";

class TimoAgent extends AiAgent{
    itemBuild: ItemBuild
	player:Timo
    constructor(player:Timo){
        super(player)
		this.itemBuild = new ItemBuild().setItemEntries([
			new ItemBuildEntry(ITEM.INVISIBILITY_CLOAK),
			new ItemBuildEntry(ITEM.EPIC_CRYSTAL_BALL),
			new ItemBuildEntry(ITEM.TIME_WARP_POTION),
			new ItemBuildEntry(ITEM.CARD_OF_DECEPTION),
			new ItemBuildEntry(ITEM.BOOTS_OF_HASTE).setChangeCondition(
				ITEM.STAFF_OF_JUDGEMENT,
				UtilityCondition.IsAdvantageous()
			),new ItemBuildEntry(ITEM.ANCIENT_SPEAR).setChangeCondition(
				ITEM.CROSSBOW_OF_PIERCING,
				UtilityCondition.MoreTankers()
				)
			,new ItemBuildEntry(ITEM.BOOTS_OF_PROTECTION).setChangeCondition(
				ITEM.ANCIENT_SPEAR,
				UtilityCondition.MoreTankers()
				).setSecondChangeCondition(
					ITEM.BOOTS_OF_ENDURANCE,
					UtilityCondition.MoreAPThanAD(2)
				)
		],new ItemBuildEntry(ITEM.EPIC_CRYSTAL_BALL))

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