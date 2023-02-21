import { Creed } from "../characters/Creed"
import { AbilityUtilityScorecard } from "../core/Util"
import { ITEM, SKILL } from "../data/enum"
import { ServerGameEventFormat } from "../data/EventFormat"
import { Player } from "../player/player"
import { AiAgent, ItemBuild } from "./AiAgent"
import { ItemBuildEntry, UtilityCondition } from "./ItemBuild"

class CreedAgent extends AiAgent {
	itemBuild: ItemBuild
	player: Creed
	constructor(player: Creed) {
		super(player)
		this.itemBuild = new ItemBuild()
			.setItemEntries(
				[
					new ItemBuildEntry(ITEM.EPIC_SWORD),
					new ItemBuildEntry(ITEM.FLAIL_OF_JUDGEMENT),
					new ItemBuildEntry(ITEM.SWORD_OF_BLOOD).setChangeCondition(
						ITEM.EPIC_WHIP,
						UtilityCondition.MoreTankers()
					),
					new ItemBuildEntry(ITEM.ANCIENT_SPEAR).setChangeCondition(
						ITEM.CROSSBOW_OF_PIERCING,
						UtilityCondition.MoreTankers()
					),
					new ItemBuildEntry(ITEM.WARRIORS_SHIELDSWORD).setChangeCondition(
						ITEM.ANCIENT_SPEAR,
						UtilityCondition.MoreTankers(0.75)
					),
					new ItemBuildEntry(ITEM.GUARDIAN_ANGEL)
						.setChangeCondition(
							ITEM.BOOTS_OF_PROTECTION,
							UtilityCondition.MoreADThanAP(2)
						)
						.setSecondChangeCondition(
							ITEM.BOOTS_OF_ENDURANCE,
							UtilityCondition.MoreAPThanAD(2)
						)
				],
				new ItemBuildEntry(ITEM.EPIC_SWORD)
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
		if (!this.attemptedSkills.has(SKILL.Q)) {
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
