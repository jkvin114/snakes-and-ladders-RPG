import { Yangyi } from "../characters/Yangyi";
import { EFFECT, ITEM, SKILL } from "../data/enum";
import { ServerGameEventFormat } from "../data/EventFormat";
import { Player } from "../player/player";
import { AiAgent, ItemBuild } from "./AiAgent";

class YangyiAgent extends AiAgent{
    itemtree: ItemBuild
	player:Yangyi
    constructor(player:Yangyi){
        super(player)
        this.itemtree = new ItemBuild().setItems([
			ITEM.EPIC_SWORD,
			ITEM.ANCIENT_SPEAR,
			ITEM.EPIC_WHIP,
			ITEM.SWORD_OF_BLOOD,
			ITEM.WARRIORS_SHIELDSWORD,
			ITEM.EPIC_FRUIT
		]).setFinal(ITEM.EPIC_SWORD)
    }
	nextSkill(): number {
		if (this.player.canBasicAttack()) {
			return AiAgent.BASICATTACK
		}
		if (!this.attemptedSkills.has(SKILL.Q)) {
			return SKILL.Q
		}
		if (!this.attemptedSkills.has(SKILL.W)) {
			//체력이 50% 이하, 끝지점에서 6칸 이상 떨어져있을시 사용
			if (this.player.HP < this.player.MaxHP * 0.5 && this.player.mapHandler.gamemap.finish - this.player.pos > 6) {
				return SKILL.W
			}
		}
		if (!this.attemptedSkills.has(SKILL.ULT)) {
			return SKILL.ULT
		}
		return -1
	}
	selectTarget(skill: SKILL, targets: ServerGameEventFormat.PlayerTargetSelector): Player|null {
		if(skill===SKILL.ULT){
			return this.getUltTarget(targets.targets)
		}
		return super.selectTarget(skill,targets)
	}
	 /**
	* 체력 50%이하인 플레이어중
	*  가장 앞에있는 플레이어반환
	* @param {} validtargets int[]
	* return int
	*/
   private getUltTarget(validtargets: number[]) {
	   let ps = this.player.mediator.allPlayer()

	   validtargets.sort((b: number, a: number): number => {
		   return ps[a].pos - ps[b].pos
	   })

	   for (let p of validtargets) {
		   if (ps[p].HP / ps[p].MaxHP < 0.5 && !ps[p].effects.has(EFFECT.SHIELD)) {
			   return ps[p]
		   }
	   }
	   return null
   }
   getMessageOnGameStart(): string {
	return "You all will die under my claw and fire!"
}
}
export default YangyiAgent