import { Creed } from "../characters/Creed";
import { ITEM, SKILL } from "../data/enum";
import { ServerGameEventInterface } from "../data/PayloadInterface";
import { Player } from "../player/player";
import { AiAgent } from "./AiAgent";

class CreedAgent extends AiAgent{
    itemtree: {
		level: number
		items: number[]
		final: number
	}
    constructor(player:Creed){
        super(player)
        this.itemtree = {
			level: 0,
			items: [
				ITEM.EPIC_SWORD,
				ITEM.EPIC_WHIP,
				ITEM.SWORD_OF_BLOOD,
				ITEM.WARRIORS_SHIELDSWORD,
				ITEM.CROSSBOW_OF_PIERCING,
				ITEM.GUARDIAN_ANGEL
			],
			final: ITEM.EPIC_SWORD
		}
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
	selectTarget(skill: SKILL, targets: ServerGameEventInterface.PlayerTargetSelector): Player {
		//가장 앞에있는 플레이어 선택, 본인보다 3칸이상 뒤쳐져있으면 사용안함
		if(skill===SKILL.ULT){
			let players = targets.targets
			let ps = this.player.mediator.allPlayer()

			players.sort(function (b, a) {
				return ps[a].pos - ps[b].pos
			})
			
			if(ps[players[0]].pos + 3 <this.player.pos) return null

			return ps[players[0]]
		}
		return super.selectTarget(skill,targets)
	}
	getMessageOnGameStart(): string {
		return "The death is upon you!"
	}
}
export default CreedAgent