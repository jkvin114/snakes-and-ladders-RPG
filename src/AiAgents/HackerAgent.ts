import { Hacker } from "../characters/Hacker";
import { AbilityUtilityScorecard } from "../core/Util";
import { ITEM, SKILL } from "../data/enum";
import { AiAgent, ItemBuild } from "./AiAgent";
import { ItemBuildEntry, UtilityCondition } from "./ItemBuild";

class HackerAgent extends AiAgent{
    itemBuild: ItemBuild
	player:Hacker
    constructor(player:Hacker){
        super(player)
        this.itemBuild = new ItemBuild()
		this.gameStartMessage= "I know everything about you!"
    }
	applyInitialOpponentUtility(ut: AbilityUtilityScorecard): void {

		let entries = [
			new ItemBuildEntry(ITEM.EPIC_SWORD),
			new ItemBuildEntry(ITEM.EPIC_CRYSTAL_BALL),
			new ItemBuildEntry(ITEM.ANCIENT_SPEAR),
			new ItemBuildEntry(ITEM.EPIC_WHIP),
			new ItemBuildEntry(ITEM.FLAIL_OF_JUDGEMENT).setChangeCondition(
				ITEM.CROSSBOW_OF_PIERCING,
				UtilityCondition.MoreTankers()
			).setSecondChangeCondition(ITEM.STAFF_OF_JUDGEMENT,UtilityCondition.MoreAPThanAD(1.5)),
			new ItemBuildEntry(ITEM.GUARDIAN_ANGEL)
			.setChangeCondition(
				ITEM.BOOTS_OF_PROTECTION,
				UtilityCondition.MoreADThanAP(2)
			).setSecondChangeCondition(
				ITEM.BOOTS_OF_ENDURANCE,
				UtilityCondition.MoreAPThanAD(2)
			)
		]

		//attack focus
		if (UtilityCondition.MoreADOverall(1.5)(ut)) {
			entries[1]=new ItemBuildEntry(ITEM.EPIC_SWORD)
		}//magic focus
		else if (UtilityCondition.MoreAPOverall(1.5)(ut)) {
			entries[0]=new ItemBuildEntry(ITEM.EPIC_CRYSTAL_BALL)
			entries[3]=new ItemBuildEntry(ITEM.TIME_WARP_POTION)
		}

		this.itemBuild.setItemEntries(entries,new ItemBuildEntry(ITEM.EPIC_CRYSTAL_BALL).setChangeCondition(
			ITEM.EPIC_SWORD,
			UtilityCondition.MoreADThanAP(1.5)
		))
		super.applyInitialOpponentUtility(ut)
	}

	nextSkill(): number {
		
		if (!this.attemptedSkills.has(SKILL.ULT)) {
			return SKILL.ULT
		}
        
		if (!this.attemptedSkills.has(SKILL.Q)) {
			return SKILL.Q
		}
		if (!this.attemptedSkills.has(SKILL.W)) {
			return SKILL.W
		}
		if (this.player.canBasicAttack()) {
			return AiAgent.BASICATTACK
		}
		return -1
	}
}
export default HackerAgent