import { Bird } from "../characters/Bird"
import { AbilityUtilityScorecard, randInt, randomBoolean } from "../core/Util"
import { ITEM, SKILL } from "../data/enum"
import { AiAgent, ItemBuild } from "./AiAgent"
import { ItemBuildEntry, UtilityCondition } from "./ItemBuild"

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
			new ItemBuildEntry(ITEM.EPIC_CRYSTAL_BALL),
			new ItemBuildEntry(ITEM.EPIC_WHIP),
			new ItemBuildEntry(ITEM.ANCIENT_SPEAR),
			new ItemBuildEntry(ITEM.STAFF_OF_JUDGEMENT).setChangeCondition(
				ITEM.CROSSBOW_OF_PIERCING,
				UtilityCondition.MoreTankers()
				),
				new ItemBuildEntry(ITEM.TIME_WARP_POTION),
			new ItemBuildEntry(ITEM.GUARDIAN_ANGEL)
			.setChangeCondition(
				ITEM.BOOTS_OF_PROTECTION,UtilityCondition.MoreADThanAP(2)
			).setSecondChangeCondition(
				ITEM.BOOTS_OF_ENDURANCE,
				UtilityCondition.MoreADThanAP(2)
			),
			new ItemBuildEntry(ITEM.INVISIBILITY_CLOAK).setChangeCondition(
				ITEM.WARRIORS_SHIELDSWORD,UtilityCondition.MoreADThanAP(1.5)
			)
		]

		//ap build
		if ((ut.defence + ut.health) ===0 && randomBoolean()) {
			entries[1]=new ItemBuildEntry(ITEM.CARD_OF_DECEPTION)
			let temp=entries[4]
			entries[4]=entries[2]
			entries[2]=temp
		}
		
		this.itemBuild
			.setItemEntries(entries, new ItemBuildEntry(ITEM.EPIC_CRYSTAL_BALL))
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
