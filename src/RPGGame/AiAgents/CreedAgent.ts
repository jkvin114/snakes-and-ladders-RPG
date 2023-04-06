import type{ Creed } from "../characters/Creed"
import { AbilityUtilityScorecard } from "../core/Util"
import { ITEM, SKILL } from "../data/enum"
import { ServerGameEventFormat } from "../data/EventFormat"
import type{ Player } from "../player/player"
import { AiAgent, ItemBuild } from "./AiAgent"
import { ItemBuildStage, UtilityCondition } from "../core/ItemBuild"

class CreedAgent extends AiAgent {
	itemBuild: ItemBuild
	skillManager: Creed
	constructor(player: Player,skillManager: Creed) {
		super(player)
		this.skillManager=skillManager
		this.itemBuild = new ItemBuild()
			.setItemStages(
				[
					new ItemBuildStage(ITEM.EPIC_SWORD),
					new ItemBuildStage(ITEM.FLAIL_OF_JUDGEMENT),
					new ItemBuildStage(ITEM.SWORD_OF_BLOOD).setChangeCondition(
						ITEM.EPIC_WHIP,
						UtilityCondition.MoreTankers()
					),
					new ItemBuildStage(ITEM.ANCIENT_SPEAR).setChangeCondition(
						ITEM.CROSSBOW_OF_PIERCING,
						UtilityCondition.MoreTankers()
					),
					new ItemBuildStage(ITEM.WARRIORS_SHIELDSWORD).setChangeCondition(
						ITEM.ANCIENT_SPEAR,
						UtilityCondition.MoreTankers(0.75)
					),
					new ItemBuildStage(ITEM.GUARDIAN_ANGEL)
						.setChangeCondition(
							ITEM.BOOTS_OF_PROTECTION,
							UtilityCondition.MoreADThanAP(2)
						)
						.setSecondaryChangeCondition(
							ITEM.BOOTS_OF_ENDURANCE,
							UtilityCondition.MoreAPThanAD(2)
						)
				],
				new ItemBuildStage(ITEM.EPIC_SWORD)
			)


		this.gameStartMessage = "The death is upon you!"
	}
	nextSkill(): number {
		if (!this.attemptedSkills.has(SKILL.ULT)) {
			return SKILL.ULT
		}
		if (this.player.canBasicAttack()) {
			return AiAgent.BASICATTACK
		}
		if (!this.attemptedSkills.has(SKILL.W)) {
			return SKILL.W
		}
		if (this.skillUseCounter.countItem(SKILL.Q)<2) {
			return SKILL.Q
		}
		return -1
	}
	selectTarget(skill: SKILL, targets: ServerGameEventFormat.PlayerTargetSelector): Player | null {
		//가장 앞에있는 플레이어 선택, 본인보다 3칸이상 뒤쳐져있으면 사용안함
		if (skill === SKILL.ULT) {
			let players = targets.targets
			let ps = this.player.mediator.allPlayer()

			players.sort(function (b, a) {
				return ps[a].pos - ps[b].pos
			})

			if (ps[players[0]].pos + 3 < this.player.pos) return null

			return ps[players[0]]
		}
		return super.selectTarget(skill, targets)
	}
}
export default CreedAgent
