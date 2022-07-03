import { Gorae } from "../characters/Gorae";
import { EFFECT, ITEM, SKILL } from "../data/enum";
import { ServerPayloadInterface } from "../data/PayloadInterface";
import { EntityFilter } from "../entity/EntityFilter";
import { Player } from "../player/player";
import { AiAgent } from "./AiAgent";

class GoraeAgent extends AiAgent{
    itemtree: {
		level: number
		items: number[]
		final: number
	}
    constructor(player:Gorae){
        super(player)
        this.itemtree = {
			level: 0,
			items: [ITEM.FULL_DIAMOND_ARMOR,
				 	ITEM.EPIC_FRUIT,
				 	ITEM.EPIC_SHIELD, 
				 	ITEM.EPIC_ARMOR,
				  	ITEM.POWER_OF_MOTHER_NATURE,
					ITEM.WARRIORS_SHIELDSWORD
				],
			final: ITEM.FULL_DIAMOND_ARMOR,
		}
    }
	nextSkill(): number {
		if (this.player.canBasicAttack()) {
			return AiAgent.BASICATTACK
		}
		if (!this.attemptedSkills.has(SKILL.W)) {
			//사거리내에 1~3 명이상 있으면 사용
			if (
				this.player.mediator.selectAllFrom(EntityFilter.ALL_ATTACKABLE_PLAYER(this.player).inRadius(5)).length >=
				this.player.game.totalnum - 1 || (this.player.HP/this.player.MaxHP < 0.3)
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
	selectTarget(skill: SKILL, targets: ServerPayloadInterface.PlayerTargetSelector): Player {
		if(skill===SKILL.ULT){
			return this.getUltTarget(targets.targets)
		}
		return super.selectTarget(skill,targets)
	}
	private getUltTarget(validtargets:number[]) {
		let ps = this.player.mediator.allPlayer()
		validtargets.sort((b:number, a:number):number => {
			return ps[a].pos - ps[b].pos
		})

		for (let p of validtargets) {
			if (ps[p].HP+ ps[p].shield < this.player.getSkillBaseDamage(SKILL.ULT) 
			&& !ps[p].effects.has(EFFECT.SHIELD)) {
				return ps[p]
			}
		}
		return null
	}
}
export default GoraeAgent