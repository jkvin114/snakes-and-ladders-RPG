import type { Silver } from "../characters/Silver"
import { AbilityUtilityScorecard, randInt } from "../core/Util"
import { AbilityUtilityType, ITEM, SKILL } from "../data/enum"
import { AiAgent, ItemBuild } from "./AiAgent"
import { ItemBuildStage, UtilityCondition } from "../core/ItemBuild"
import { CharacterSkillManager } from "../characters/SkillManager/CharacterSkillManager"
import type { Player } from "../player/player"

export class SilverAgent extends AiAgent {
	skillManager: Silver
	itemBuild: ItemBuild
	player: Player

	constructor(player:Player,skillManager: Silver) {
		super(player)
		this.skillManager=skillManager
		this.itemBuild = new ItemBuild().setItemStages(
			[
				new ItemBuildStage(ITEM.EPIC_SHIELD).setChangeCondition(
					ITEM.EPIC_ARMOR,
					UtilityCondition.MoreAPThanAD(2)
				),
				new ItemBuildStage(ITEM.EPIC_ARMOR).setChangeCondition(
					ITEM.EPIC_SHIELD,
					UtilityCondition.MoreADThanAP(2)
				),
				new ItemBuildStage(ITEM.EPIC_FRUIT).setChangeCondition(
					ITEM.POWER_OF_MOTHER_NATURE,
					UtilityCondition.MoreAPThanAD()
				),
				new ItemBuildStage(ITEM.EPIC_FRUIT).setChangeCondition(
					ITEM.FULL_DIAMOND_ARMOR,
					UtilityCondition.MoreADThanAP()
				),
				new ItemBuildStage(ITEM.GUARDIAN_ANGEL),
				new ItemBuildStage(ITEM.BOOTS_OF_ENDURANCE).setChangeCondition(
					ITEM.BOOTS_OF_PROTECTION,
					UtilityCondition.MoreADThanAP()
				)
			],
			new ItemBuildStage(ITEM.EPIC_SHIELD).setChangeCondition(
				ITEM.EPIC_ARMOR,
				UtilityCondition.MoreAPThanAD()
			)
		)

		this.gameStartMessage = "I will defend everything against me!"
	}
	nextSkill(): number {
		if (this.player.canBasicAttack()) {
			return AiAgent.BASICATTACK
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
export default SilverAgent
