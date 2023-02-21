import { Gorae } from "../characters/Gorae"
import { AbilityUtilityScorecard } from "../core/Util"
import { EFFECT, ITEM, SKILL } from "../data/enum"
import { ServerGameEventFormat } from "../data/EventFormat"
import { EntityFilter } from "../entity/EntityFilter"
import { Player } from "../player/player"
import { AiAgent, ItemBuild } from "./AiAgent"
import { ItemBuildEntry, UtilityCondition } from "./ItemBuild"

class GoraeAgent extends AiAgent {
	itemBuild: ItemBuild
	player: Gorae
	constructor(player: Gorae) {
		super(player)
		this.itemBuild = new ItemBuild().setItemEntries(
			[
				new ItemBuildEntry(ITEM.FULL_DIAMOND_ARMOR),
				new ItemBuildEntry(ITEM.EPIC_FRUIT),
				new ItemBuildEntry(ITEM.EPIC_SHIELD).setChangeCondition(
					ITEM.EPIC_ARMOR,
					UtilityCondition.MoreAPThanAD()
				),
				new ItemBuildEntry(ITEM.FULL_DIAMOND_ARMOR).setChangeCondition(
					ITEM.EPIC_ARMOR,
					UtilityCondition.MoreAPThanAD(2)
				).setSecondChangeCondition(
					ITEM.EPIC_SHIELD,
					UtilityCondition.MoreADThanAP(2)
				),
				new ItemBuildEntry(ITEM.POWER_OF_MOTHER_NATURE).setChangeCondition(
					ITEM.EPIC_FRUIT,
					UtilityCondition.MoreADThanAP(2)
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
			new ItemBuildEntry(ITEM.EPIC_SHIELD).setChangeCondition(
				ITEM.EPIC_ARMOR,
				UtilityCondition.MoreAPThanAD()
			)
		)
			this.gameStartMessage="I will devour you like a fish!"
	}
	nextSkill(): number {
		if (this.player.canBasicAttack()) {
			return AiAgent.BASICATTACK
		}
		if (!this.attemptedSkills.has(SKILL.W)) {
			//사거리내에 1~3 명이상 있으면 사용
			if (
				this.player.mediator.selectAllFrom(EntityFilter.ALL_ATTACKABLE_PLAYER(this.player).inRadius(5)).length >=
				this.player.game.totalnum - 1 ||
				this.player.HP / this.player.MaxHP < 0.3
			)
				return SKILL.W
		}
		if (!this.attemptedSkills.has(SKILL.Q)) {
			return SKILL.Q
		}
		if (!this.attemptedSkills.has(SKILL.ULT)) {
			return SKILL.ULT
		}
		return -1
	}
	selectTarget(skill: SKILL, targets: ServerGameEventFormat.PlayerTargetSelector): Player |null{
		if (skill === SKILL.ULT) {
			return this.getUltTarget(targets.targets)
		}
		return super.selectTarget(skill, targets)
	}
	private getUltTarget(validtargets: number[]) {
		let ps = this.player.mediator.allPlayer()
		validtargets.sort((b: number, a: number): number => {
			return ps[a].pos - ps[b].pos
		})

		for (let p of validtargets) {
			if (ps[p].HP + ps[p].shield < this.player.getSkillBaseDamage(SKILL.ULT) && !ps[p].effects.has(EFFECT.SHIELD)) {
				return ps[p]
			}
		}
		return null
	}
}
export default GoraeAgent
