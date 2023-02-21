import {  AbilityUtilityScorecard } from "../core/Util"
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
export class ItemBuildEntry{
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
	setSecondChangeCondition(newItem:ITEM,func:UtilityConditionFunction)
	{
		this.conditionItem2=newItem
		this.coditionFunc2=func
		return this
	}

}

export class ItemBuild{
	private coreItemCount: number
	items: ITEM[]
	private itemEntries:ItemBuildEntry[]
	private finalEntry:ItemBuildEntry
	final: ITEM
	private currentBuilding:ItemBuildEntry|null
	private opponentUtility: AbilityUtilityScorecard
	private additionalFinalItems:Set<ITEM>
	coreItemBuildRecord:ITEM[]
	constructor(){
		this.coreItemCount=0
		this.items=[]
		this.final=0
		this.currentBuilding=null
		this.additionalFinalItems=new Set<ITEM>([
			ITEM.BOOTS_OF_HASTE,ITEM.GUARDIAN_ANGEL
		])
		this.finalEntry=new ItemBuildEntry(ITEM.EPIC_SWORD)
		this.itemEntries=[]
		this.coreItemBuildRecord=[]
	}
	isFull(itemLimit:number){
		return this.coreItemCount >= itemLimit
	}
	setItemEntries(entries:ItemBuildEntry[],final:ItemBuildEntry){
		this.itemEntries=entries
		this.finalEntry=final
		return this
	}
	setItems(items: ITEM[]){
		this.items=items
		return this
	}
	setFinal(final:ITEM){
		this.final=final
		return this
	}
	addAdditionalFinalItem(item:ITEM){
		this.additionalFinalItems.add(item)
		return this
	}
	// onBuyCoreItem(){
	// 	this.coreItemCount+=1
	// 	this.currentBuilding.complete=true
	// 	this.currentBuilding=null
	// }

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
	getRecommendedItems(count:number):ITEM[]{
		const matchingItems=this.itemEntries.filter((val)=>!val.complete && !val.building).map((entry)=>entry.item)
		
		if(matchingItems.length===0) return [this.finalEntry.item,...this.additionalFinalItems]
		else if(matchingItems.length < count) return [...matchingItems,this.finalEntry.item]
		else return matchingItems.slice(0,count)
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

		const matchingItems=this.itemEntries.filter((val)=>!val.complete && !val.building && val.item==item)

		//if buying the item is currently not planned
		if(matchingItems.length===0) return

		//if buying the item is currently planned
		matchingItems[0].complete=true
		this.coreItemCount+=1
	}
	nextIncompleteItemEntry():ItemBuildEntry{
		if (this.coreItemCount >= this.itemEntries.length) {
			return this.finalEntry
		}
		for(const item of this.itemEntries){
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

		// if (this.coreItemCount >= this.items.length) {
		// 	return this.final
		// } else {
		// //	this.currentBuilding=this.items[this.coreItemCount]
		// 	return this.items[this.coreItemCount]
		// }
	}

	setOpponentUtility(opponentUtility: AbilityUtilityScorecard) {
		this.opponentUtility=opponentUtility
		for(const item of this.itemEntries){
			console.log(item)
			item.applyUtility(opponentUtility)
		}
		this.finalEntry.applyUtility(opponentUtility)
	}
}