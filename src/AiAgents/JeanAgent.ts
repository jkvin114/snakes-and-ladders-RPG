import { Jean } from "../characters/Jean";
import { AbilityUtilityScorecard } from "../core/Util";
import { ITEM, SKILL } from "../data/enum";
import { AiAgent, ItemBuild } from "./AiAgent";
import { ItemBuildStage, UtilityCondition } from "../core/ItemBuild";

class JeanAgent extends AiAgent{
    itemBuild: ItemBuild
	player:Jean
    constructor(player:Jean){
        super(player)
		this.itemBuild = 
		this.itemBuild = new ItemBuild()
			.setItemStages(
				[
					new ItemBuildStage(ITEM.EPIC_SWORD),
					new ItemBuildStage(ITEM.EPIC_WHIP),
					new ItemBuildStage(ITEM.FLAIL_OF_JUDGEMENT),
					new ItemBuildStage(ITEM.ANCIENT_SPEAR).setChangeCondition(
						ITEM.CROSSBOW_OF_PIERCING,
						UtilityCondition.MoreTankers(0.75)
					),
					new ItemBuildStage(ITEM.BOOTS_OF_HASTE).setChangeCondition(
						ITEM.ANCIENT_SPEAR,
						UtilityCondition.MoreTankers()
					),
					new ItemBuildStage(ITEM.GUARDIAN_ANGEL)
						.setChangeCondition(
							ITEM.WARRIORS_SHIELDSWORD,
							UtilityCondition.IsAdvantageous()
						)
				],
				new ItemBuildStage(ITEM.EPIC_SWORD)
			)
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