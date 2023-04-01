import { ItemBuild, ItemBuildStage } from "../src/RPGGame/core/ItemBuild"
import { AbilityUtilityScorecard } from "../src/RPGGame/core/Util"
import { ITEM } from "../src/RPGGame/data/enum"

describe("itembuild", () => {

    test("utility", () => {
        let itemBuild = new ItemBuild().setItemStages(
			[
				new ItemBuildStage(ITEM.EPIC_SHIELD).setChangeCondition(
					ITEM.EPIC_ARMOR,
					(util: AbilityUtilityScorecard) => util.magic > util.attack * 2
				),
				new ItemBuildStage(ITEM.EPIC_ARMOR).setChangeCondition(
					ITEM.EPIC_SHIELD,
					(util: AbilityUtilityScorecard) => util.attack > util.magic * 2
				),
				new ItemBuildStage(ITEM.EPIC_FRUIT).setChangeCondition(
					ITEM.POWER_OF_MOTHER_NATURE,
					(util: AbilityUtilityScorecard) => util.magic > util.attack
				),
				new ItemBuildStage(ITEM.EPIC_FRUIT).setChangeCondition(
					ITEM.FULL_DIAMOND_ARMOR,
					(util: AbilityUtilityScorecard) => util.magic <= util.attack
				),
				new ItemBuildStage(ITEM.GUARDIAN_ANGEL),
				new ItemBuildStage(ITEM.BOOTS_OF_ENDURANCE).setChangeCondition(
					ITEM.BOOTS_OF_PROTECTION,
					(util: AbilityUtilityScorecard) => util.magic < util.attack
				),
			],
			new ItemBuildStage(ITEM.EPIC_SHIELD).setChangeCondition(
				ITEM.EPIC_ARMOR,
				(util: AbilityUtilityScorecard) => util.magic > util.attack
			)
		)
        expect(itemBuild.nextIncompleteItemEntry().item).toBe(ITEM.EPIC_SHIELD)
        itemBuild.setOpponentUtility({attack:1,magic:10,health:0,defence:0,myutilRatio:1})
        expect(itemBuild.nextIncompleteItemEntry().item).toBe(ITEM.EPIC_ARMOR)
        itemBuild.onBuyCoreItem(ITEM.EPIC_ARMOR)
        itemBuild.onBuyCoreItem(ITEM.EPIC_ARMOR)
        expect(itemBuild.nextIncompleteItemEntry().item).toBe(ITEM.POWER_OF_MOTHER_NATURE)
        itemBuild.onBuyCoreItem(ITEM.GUARDIAN_ANGEL)
        expect(itemBuild.nextIncompleteItemEntry().item).toBe(ITEM.POWER_OF_MOTHER_NATURE)
        expect(itemBuild.nextCoreItem()).toBe(ITEM.POWER_OF_MOTHER_NATURE)
        itemBuild.setOpponentUtility({attack:10,magic:1,health:0,defence:0,myutilRatio:1})
        expect(itemBuild.nextIncompleteItemEntry().item).toBe(ITEM.POWER_OF_MOTHER_NATURE)
        itemBuild.onBuyCoreItem(ITEM.POWER_OF_MOTHER_NATURE)
        itemBuild.onBuyCoreItem(ITEM.FULL_DIAMOND_ARMOR)
        itemBuild.setOpponentUtility({attack:1,magic:10,health:0,defence:0,myutilRatio:1})
        itemBuild.onBuyCoreItem(ITEM.EPIC_FRUIT)
        expect(itemBuild.nextIncompleteItemEntry().item).toBe(ITEM.BOOTS_OF_ENDURANCE)
        itemBuild.setOpponentUtility({attack:10,magic:1,health:0,defence:0,myutilRatio:1})
        expect(itemBuild.nextIncompleteItemEntry().item).toBe(ITEM.BOOTS_OF_PROTECTION)
        expect(itemBuild.nextCoreItem()).toBe(ITEM.BOOTS_OF_PROTECTION)
        itemBuild.setOpponentUtility({attack:1,magic:10,health:0,defence:0,myutilRatio:1})
        expect(itemBuild.nextCoreItem()).toBe(ITEM.BOOTS_OF_PROTECTION)
	})

    test("final recommended items", () => {
        let itemBuild = new ItemBuild().setItemStages(
			[
				new ItemBuildStage(ITEM.EPIC_SHIELD).setChangeCondition(
					ITEM.EPIC_ARMOR,
					(util: AbilityUtilityScorecard) => util.magic > util.attack * 2
				),
				new ItemBuildStage(ITEM.EPIC_ARMOR).setChangeCondition(
					ITEM.EPIC_SHIELD,
					(util: AbilityUtilityScorecard) => util.attack > util.magic * 2
				),
				new ItemBuildStage(ITEM.EPIC_FRUIT).setChangeCondition(
					ITEM.POWER_OF_MOTHER_NATURE,
					(util: AbilityUtilityScorecard) => util.magic > util.attack
				),
				new ItemBuildStage(ITEM.EPIC_FRUIT).setChangeCondition(
					ITEM.FULL_DIAMOND_ARMOR,
					(util: AbilityUtilityScorecard) => util.magic <= util.attack
				),
				new ItemBuildStage(ITEM.GUARDIAN_ANGEL),
				new ItemBuildStage(ITEM.BOOTS_OF_ENDURANCE).setChangeCondition(
					ITEM.BOOTS_OF_PROTECTION,
					(util: AbilityUtilityScorecard) => util.magic < util.attack
				),
			],
			new ItemBuildStage(ITEM.EPIC_SHIELD).setChangeCondition(
				ITEM.EPIC_ARMOR,
				(util: AbilityUtilityScorecard) => util.magic > util.attack
			)
		)
        itemBuild.setOpponentUtility({attack:1,magic:10,health:0,defence:0,myutilRatio:1})
        itemBuild.onBuyCoreItem(ITEM.EPIC_ARMOR)
        itemBuild.onBuyCoreItem(ITEM.EPIC_ARMOR)
        itemBuild.onBuyCoreItem(ITEM.POWER_OF_MOTHER_NATURE)
        itemBuild.onBuyCoreItem(ITEM.EPIC_FRUIT)
        let recommendedItem=itemBuild.getRecommendedItems()
        expect(recommendedItem).toContain(ITEM.GUARDIAN_ANGEL)
        itemBuild.onBuyCoreItem(ITEM.GUARDIAN_ANGEL)

        recommendedItem=itemBuild.getRecommendedItems()
        expect(recommendedItem).not.toContain(ITEM.GUARDIAN_ANGEL)
        expect(recommendedItem).not.toContain(ITEM.EPIC_SHIELD)
        expect(recommendedItem).toContain(ITEM.EPIC_ARMOR)
	
        itemBuild.setOpponentUtility({attack:100,magic:10,health:0,defence:0,myutilRatio:1})

        recommendedItem=itemBuild.getRecommendedItems()
        expect(recommendedItem).toContain(ITEM.EPIC_SHIELD)
        itemBuild.onBuyCoreItem(ITEM.BOOTS_OF_PROTECTION)

        recommendedItem=itemBuild.getRecommendedItems()
        expect(recommendedItem).toContain(ITEM.BOOTS_OF_HASTE)
        itemBuild.onBuyCoreItem(ITEM.BOOTS_OF_HASTE)
        recommendedItem=itemBuild.getRecommendedItems()
        console.log(recommendedItem)
        expect(recommendedItem).not.toContain(ITEM.BOOTS_OF_HASTE)
    })
})