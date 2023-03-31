import { Bird } from "../characters/Bird"
import { AbilityUtilityScorecard, randInt, randomBoolean } from "../core/Util"
import { ITEM, SKILL } from "../data/enum"
import { AiAgent, ItemBuild } from "./AiAgent"
import { ItemBuildStage, UtilityCondition } from "../core/ItemBuild"

class BirdAgent extends AiAgent {
	itemBuild: ItemBuild
	player: Bird
	constructor(player: Bird) {
		super(player)
		this.itemBuild = new ItemBuild()
		this.gameStartMessage = "I will burn you all in the name of the phenix!"
	}
	applyInitialOpponentUtility(ut: AbilityUtilityScorecard): void {
		let entries = [
			new ItemBuildStage(ITEM.EPIC_CRYSTAL_BALL),
			new ItemBuildStage(ITEM.STAFF_OF_JUDGEMENT)
			.setChangeCondition(ITEM.CARD_OF_DECEPTION,UtilityCondition.IsUnadvantageous()),
			new ItemBuildStage(ITEM.TIME_WARP_POTION),
			new ItemBuildStage(ITEM.EPIC_WHIP),
			new ItemBuildStage(ITEM.ANCIENT_SPEAR).setChangeCondition(
				ITEM.CROSSBOW_OF_PIERCING,
				UtilityCondition.MoreTankers()
				),
			new ItemBuildStage(ITEM.GUARDIAN_ANGEL)
			.setChangeCondition(
				ITEM.BOOTS_OF_PROTECTION,UtilityCondition.MoreADThanAP(2)
			).setSecondaryChangeCondition(
				ITEM.BOOTS_OF_ENDURANCE,
				UtilityCondition.MoreADThanAP(2)
			),
			new ItemBuildStage(ITEM.INVISIBILITY_CLOAK).setChangeCondition(
				ITEM.WARRIORS_SHIELDSWORD,UtilityCondition.MoreAPOverall(1.5)
			)
		]

		//full ap build
		if ((ut.defence + ut.health) ===0 && randomBoolean()) {
			entries[1]=new ItemBuildStage(ITEM.CARD_OF_DECEPTION)
			entries[3]=new ItemBuildStage(ITEM.STAFF_OF_JUDGEMENT)
		}
		
		this.itemBuild
			.setItemStages(entries, new ItemBuildStage(ITEM.EPIC_CRYSTAL_BALL))
			.addAdditionalFinalItem(ITEM.EPIC_WHIP)
		super.applyInitialOpponentUtility(ut)
	}
	nextSkill(): number {
		if (!this.attemptedSkills.has(SKILL.ULT)) {
			if (this.player.cooltime[SKILL.Q] <= 2 && this.player.cooltime[SKILL.W] <= 1) return SKILL.ULT
		}
		if (!this.attemptedSkills.has(SKILL.W)) {
			if (this.player.cooltime[SKILL.Q] <= 1) return SKILL.W
		}
		if (this.player.canBasicAttack()) {
			return AiAgent.BASICATTACK
		}
		if (!this.attemptedSkills.has(SKILL.Q)) {
			if (this.player.cooltime[SKILL.W] === 1 || this.player.cooltime[SKILL.ULT] === 1) return -1

			return SKILL.Q
		}
		return -1
	}
}
export default BirdAgent
