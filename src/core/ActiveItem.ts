import { ITEM } from "../data/enum"
import { decrement } from "./Util"

export class ActiveItem {
	name: string
	id: number
	cooltime: number
	private resetVal: number
	
	constructor(name: string, id: number, resetVal: number) {
		this.name = name
		this.id = id
		this.cooltime = 0
		this.resetVal = resetVal
	}
	selialize():{id:number,cool:number,coolRatio:number}{
		return { id: this.id, cool: this.cooltime, coolRatio: 1 - this.cooltime / this.resetVal }
	}
	cooldown() {
		this.cooltime = decrement(this.cooltime)
	}
	use() {
		this.cooltime = this.resetVal
	}
}

export class ItemData{
	private data:Map<string,number>
	item:ITEM
	constructor(item:ITEM){
		this.item=item
		this.data=new Map<string,number>()
	}
	addDataValue(key:string,amt:number){
		let val=this.data.get(key)
		amt=Math.floor(amt)
		if(val!==undefined)
		{
			this.data.set(key,val+amt)
		}
		else{
			this.data.set(key,amt)
		}
	}
	resetDataValue(key:string){
		this.data.set(key,0)
	}
	getDataValue(key:string):number{
		if(!this.data.has(key)) return 0
		return this.data.get(key)
	}
	serialize():{kor:string,eng:string,val:number,item:number}|null{
		let data:{kor:string,eng:string,val:number,item:number}|null={kor:"",eng:"",val:0,item:this.item}
		switch(this.item){
			case ITEM.ANCIENT_SPEAR:
			case ITEM.SPEAR:
			case ITEM.CROSSBOW_OF_PIERCING:
			case ITEM.CARD_OF_DECEPTION:
			case ITEM.DAGGER:
			case ITEM.FLAIL_OF_JUDGEMENT:
			case ITEM.STAFF_OF_JUDGEMENT:
				data.kor="총 추가 피해량:"
				data.eng="Total additional damage:"
				data.val=this.getDataValue("damage")
			break
			case ITEM.POWER_OF_MOTHER_NATURE:
				data.kor="총 감소 피해량:"
				data.eng="Total reduced damage:"
				data.val=this.getDataValue("damage")
			break
			case ITEM.EPIC_FRUIT:
				data.kor="총 추가 체력재생량:"
				data.eng="Total additional HP regeneration:"
				data.val=this.getDataValue("regen")
			break
			case ITEM.FULL_DIAMOND_ARMOR:
				data.kor="총 추가 체력:"
				data.eng="Total additional HP:"
				data.val=this.getDataValue("hp")
			break
			case ITEM.WARRIORS_SHIELDSWORD:
				data.kor="총 획득 방어막:"
				data.eng="Total shield gained:"
				data.val=this.getDataValue("shield")
			break
			default: data = null
		}
		return data
	}
}
