import { Yangyi } from "../characters/Yangyi";
import { EFFECT, ITEM, SKILL } from "../data/enum";
import { ServerGameEventFormat } from "../data/EventFormat";
import { Player } from "../player/player";
import { AiAgent, ItemBuild } from "./AiAgent";
import { ItemBuildStage, UtilityCondition } from "../core/ItemBuild";

class YangyiAgent extends AiAgent{
    itemBuild: ItemBuild
	player:Yangyi
    constructor(player:Yangyi){
        super(player)
        this.itemBuild = new ItemBuild().setItemStages(
			[
				new ItemBuildStage(ITEM.EPIC_SWORD),
				new ItemBuildStage(ITEM.ANCIENT_SPEAR).setChangeCondition(
					ITEM.CROSSBOW_OF_PIERCING,
					UtilityCondition.MoreTankers()
				),
				new ItemBuildStage(ITEM.EPIC_WHIP),
				new ItemBuildStage(ITEM.FLAIL_OF_JUDGEMENT),
				new ItemBuildStage(ITEM.SWORD_OF_BLOOD).setChangeCondition(
					ITEM.WARRIORS_SHIELDSWORD,
					UtilityCondition.IsUnadvantageous()
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
					,new ItemBuildStage(ITEM.EPIC_WHIP).setChangeCondition(
						ITEM.ANCIENT_SPEAR,
						UtilityCondition.MoreTankers()
					)
			],
			new ItemBuildStage(ITEM.EPIC_SWORD)
		).addAdditionalFinalItem(ITEM.EPIC_WHIP)
		
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