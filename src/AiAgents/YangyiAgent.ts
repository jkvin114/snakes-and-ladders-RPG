import { Yangyi } from "../characters/Yangyi";
import { EFFECT, ITEM, SKILL } from "../data/enum";
import { ServerGameEventFormat } from "../data/EventFormat";
import { Player } from "../player/player";
import { AiAgent, ItemBuild } from "./AiAgent";
import { ItemBuildEntry, UtilityCondition } from "./ItemBuild";

class YangyiAgent extends AiAgent{
    itemBuild: ItemBuild
	player:Yangyi
    constructor(player:Yangyi){
        super(player)
        this.itemBuild = new ItemBuild().setItemEntries(
			[
				new ItemBuildEntry(ITEM.EPIC_SWORD),
				new ItemBuildEntry(ITEM.ANCIENT_SPEAR).setChangeCondition(
					ITEM.CROSSBOW_OF_PIERCING,
					UtilityCondition.MoreTankers()
				),
				new ItemBuildEntry(ITEM.EPIC_WHIP),
				new ItemBuildEntry(ITEM.FLAIL_OF_JUDGEMENT),
				new ItemBuildEntry(ITEM.SWORD_OF_BLOOD).setChangeCondition(
					ITEM.WARRIORS_SHIELDSWORD,
					UtilityCondition.IsUnadvantageous()
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
					,new ItemBuildEntry(ITEM.EPIC_WHIP).setChangeCondition(
						ITEM.ANCIENT_SPEAR,
						UtilityCondition.MoreTankers()
					)
			],
			new ItemBuildEntry(ITEM.EPIC_SWORD)
		)
		
		this.gameStartMessage= "You all will die under my claw and fire!"
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
}
export default YangyiAgent