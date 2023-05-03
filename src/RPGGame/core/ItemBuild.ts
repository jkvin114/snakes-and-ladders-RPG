import {  AbilityUtilityScorecard } from "./Util"
import { AbilityUtilityType, ITEM } from "../data/enum"

interface UtilityConditionFunction{
	(opponentUtility: AbilityUtilityScorecard):boolean
}
export namespace UtilityCondition{

	export const IsAdvantageous =(val:number=1)=>((util: AbilityUtilityScorecard)=>util.myutilRatio>val)
	export const IsUnadvantageous =(val:number=1)=>((util: AbilityUtilityScorecard)=>util.myutilRatio<val)
	export const MoreTankers =(dealer_mul:number=0.5)=>((util: AbilityUtilityScorecard)=> util.defence + util.health > (util.attack + util.magic)*dealer_mul)
	export const LessTankers =(dealer_mul:number=0.5)=>((util: AbilityUtilityScorecard)=> util.defence + util.health < (util.attack + util.magic)*dealer_mul)

	export const MoreAPThanAD =(ad_mul:number=1)=>((util: AbilityUtilityScorecard)=> util.attack*ad_mul < util.magic)
	export const MoreADThanAP =(ap_mul:number=1)=>((util: AbilityUtilityScorecard)=> util.magic*ap_mul < util.attack)
	export const MoreADOverall =(other_mul:number=1)=>((util: AbilityUtilityScorecard)=> (util.defence + util.health + util.magic) * other_mul < util.attack)
	export const MoreAPOverall =(other_mul:number=1)=>((util: AbilityUtilityScorecard)=> (util.defence + util.health + util.attack) * other_mul < util.magic)

}
export class ItemBuildStage{
	readonly baseItem:ITEM
	item:ITEM
	complete:boolean
	building:boolean
	private conditionItem:ITEM
	private coditionFunc:UtilityConditionFunction
	private coditionFunc2:UtilityConditionFunction
	private conditionItem2:ITEM

	constructor(item:ITEM){
		this.item=item
		this.baseItem=item
		this.complete=false
		this.building=false
		this.coditionFunc=()=>false
		this.coditionFunc2=()=>false
	}
	applyUtility(opponentUtility: AbilityUtilityScorecard){

		if(this.complete || this.building) return

		if(this.coditionFunc(opponentUtility)) 
			this.item=this.conditionItem
		else if(this.coditionFunc2(opponentUtility))
			this.item=this.conditionItem2
		else this.item=this.baseItem

	}
	setChangeCondition(newItem:ITEM,func:UtilityConditionFunction)
	{
		this.conditionItem=newItem
		this.coditionFunc=func
		return this
	}
	setSecondaryChangeCondition(newItem:ITEM,func:UtilityConditionFunction)
	{
		this.conditionItem2=newItem
		this.coditionFunc2=func
		return this
	}

}

export class ItemBuild{
	private coreItemCount: number
	private itemStages:ItemBuildStage[]
	private finalEntry:ItemBuildStage
	private currentBuilding:ItemBuildStage|null
	private opponentUtility: AbilityUtilityScorecard
	private additionalFinalItems:Set<ITEM>
	coreItemBuildRecord:ITEM[]
	constructor(){
		this.coreItemCount=0
		this.currentBuilding=null
		this.additionalFinalItems=new Set<ITEM>([
			ITEM.BOOTS_OF_HASTE,ITEM.GUARDIAN_ANGEL
		])
		this.finalEntry=new ItemBuildStage(ITEM.EPIC_SWORD)
		this.itemStages=[]
		this.coreItemBuildRecord=[]
	}
	isFull(itemLimit:number){
		return this.coreItemCount >= itemLimit
	}
	setItemStages(entries:ItemBuildStage[],final:ItemBuildStage){
		this.itemStages=entries
		this.finalEntry=final
		return this
	}
	addAdditionalFinalItem(item:ITEM){
		this.additionalFinalItems.add(item)
		return this
	}

	/**
	 * 1. if there are more item entries left than count:
	 * 		slice item entries by count and return 
	 * 2. if there are less item entries left than count:
	 * 		return remaining item entries and final item entry
	 * 3. if all item entries are complete:
	 * 		return final item entry along with auxilaryFinalItems except items that are already bought
	 * @param count 
	 * @returns 
	 */
	getRecommendedItems():ITEM[]{
		const matchingItems=this.itemStages.filter((val)=>!val.complete).map((entry)=>entry.item)
		let items= [...new Set<ITEM>([...matchingItems,...this.additionalFinalItems])]
		items.push(this.finalEntry.item)
		return items
	}
	onBuyCoreItem(item:ITEM){

		this.additionalFinalItems.delete(item)
		this.coreItemBuildRecord.push(item)
		//if the item is a same item that is currently building
		if(this.currentBuilding!==null && this.currentBuilding.item==item){
			
	 		this.coreItemCount+=1
	 		this.currentBuilding.complete=true
	 		this.currentBuilding=null
			return
		}

		const matchingItems=this.itemStages.filter((val)=>!val.complete && !val.building && val.item==item)

		//if buying the item is currently not planned
		if(matchingItems.length===0) return

		//if buying the item is currently planned
		matchingItems[0].complete=true
		this.coreItemCount+=1
	}
	nextIncompleteItemEntry():ItemBuildStage{
		if (this.coreItemCount >= this.itemStages.length) {
			return this.finalEntry
		}
		for(const item of this.itemStages){
			if(!item.complete){
				return item
			}
		}
		return this.finalEntry
	}
	nextCoreItem():number
	{
		let entry= this.nextIncompleteItemEntry()
		entry.building=true
		this.currentBuilding=entry
		return entry.item

	}

	setOpponentUtility(opponentUtility: AbilityUtilityScorecard) {
		this.opponentUtility=opponentUtility
		for(const item of this.itemStages){
			item.applyUtility(opponentUtility)
		}
		this.finalEntry.applyUtility(opponentUtility)
	}
}