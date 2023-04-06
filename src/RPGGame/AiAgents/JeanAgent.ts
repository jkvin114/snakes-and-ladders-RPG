import type { Jean } from "../characters/Jean";
import {  ITEM, SKILL } from "../data/enum";
import { AiAgent, ItemBuild } from "./AiAgent";
import { ItemBuildStage, UtilityCondition } from "../core/ItemBuild";
import { ServerGameEventFormat } from "../data/EventFormat";
import { EFFECT } from "../StatusEffect/enum"
import type { Player } from "../player/player";

class JeanAgent extends AiAgent{
    itemBuild: ItemBuild
	skillManager:Jean
    constructor(player:Player,skillManager:Jean){
        super(player)
		this.skillManager=skillManager
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
	selectTarget(skill: SKILL, targets: ServerGameEventFormat.PlayerTargetSelector){
		let players = targets.targets
		if (players.length === 1) {
			return this.player.game.pOfTurn(players[0])
		}
		let ps = this.player.mediator.allPlayer()
		players.sort(function (b, a) {
			if (Math.abs(ps[a].pos - ps[b].pos) < 8) {
				return ps[b].HP - ps[a].HP
			} else {
				return ps[a].pos - ps[b].pos
			}
		})

		//priotize rooted or grounded player
		for(const p of players){
			let plyr=this.player.game.pOfTurn(p)
			if(plyr.effects.has(EFFECT.ROOT) || plyr.effects.has(EFFECT.GROUNGING)) 
				return plyr
		}
		return ps[players[0]]
	}
}
export default JeanAgent