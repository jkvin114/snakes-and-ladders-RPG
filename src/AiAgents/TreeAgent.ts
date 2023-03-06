import { Tree } from "../characters/Tree";
import { ITEM, SKILL } from "../data/enum";
import { AiAgent, ItemBuild } from "./AiAgent";
import { ItemBuildStage, UtilityCondition } from "../core/ItemBuild";
import type { ServerGameEventFormat } from "../data/EventFormat";
import { EntityFilter } from "../entity/EntityFilter";
import type { Player } from "../player/player";

class TreeAgent extends AiAgent{
    itemBuild: ItemBuild
	player:Tree
    constructor(player:Tree){
        super(player)
		this.itemBuild = new ItemBuild().setItemStages([
			new ItemBuildStage(ITEM.EPIC_CRYSTAL_BALL),
			new ItemBuildStage(ITEM.CARD_OF_DECEPTION),
			new ItemBuildStage(ITEM.TIME_WARP_POTION),
			new ItemBuildStage(ITEM.INVISIBILITY_CLOAK)
			,new ItemBuildStage(ITEM.STAFF_OF_JUDGEMENT).setChangeCondition(
				ITEM.CROSSBOW_OF_PIERCING,
				UtilityCondition.MoreTankers()
				)
			,new ItemBuildStage(ITEM.BOOTS_OF_PROTECTION).setChangeCondition(
				ITEM.ANCIENT_SPEAR,
				UtilityCondition.MoreTankers(0.3)
				).setSecondaryChangeCondition(
					ITEM.BOOTS_OF_ENDURANCE,
					UtilityCondition.MoreAPThanAD(2)
				)
		],new ItemBuildStage(ITEM.EPIC_CRYSTAL_BALL))

		this.gameStartMessage= "I will not be your giving tree!"
    }
	nextSkill(): number {
		
		if (!this.attemptedSkills.has(SKILL.ULT)) {
			return SKILL.ULT
		}
		if (!this.attemptedSkills.has(SKILL.W)) {
			return SKILL.W
		}
		if (!this.attemptedSkills.has(SKILL.Q)) {
			return SKILL.Q
		}
		if (this.player.canBasicAttack()) {
			return AiAgent.BASICATTACK
		}
		return -1
	}
	getProjectilePos(skill: SKILL, selector: ServerGameEventFormat.LocationTargetSelector): number {
		let goal = null
		let targets = this.playersInProjRange(selector)

		//	console.log("getAiProjPos" + targets)
		if (targets.length === 0) {
			return -1
		}
		targets.sort(function (b: Player, a: Player): number {
			return a.pos - b.pos
		})

		goal = targets.getMax(e=>e.pos)
		
		return goal.pos+1
	}

}
export default TreeAgent