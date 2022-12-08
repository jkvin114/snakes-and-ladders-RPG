import { decrement } from "./Util"

export class ActiveItem {
	name: string
	id: number
	cooltime: number
	private resetVal: number
	private data:Map<string,number>
	constructor(name: string, id: number, resetVal: number) {
		this.name = name
		this.id = id
		this.cooltime = 0
		this.resetVal = resetVal
		this.data=new Map<string,number>()
	}
	addDataValue(key:string,amt:number){
		let val=this.data.get(key)
		if(val!==undefined)
		{
			this.data.set(key,val+amt)
		}
		else{
			this.data.set(key,amt)
		}
	}
	getDataValue(key:string){
		return this.data.get(key)
	}
	getTransferData():{id:number,cool:number,coolRatio:number}{
		return { id: this.id, cool: this.cooltime, coolRatio: 1 - this.cooltime / this.resetVal }
	}
	cooldown() {
		this.cooltime = decrement(this.cooltime)
	}
	use() {
		this.cooltime = this.resetVal
	}
}