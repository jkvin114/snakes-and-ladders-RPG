
export class Counter<T>{
	map:Map<T,number>
	size:number
	constructor(elem?:Iterable<T>){
		this.map=new Map<T,number>()
		this.size=0
		if(elem!=null){
			for(const e of elem){
				this.add(e)
			}
		}
	}
	copy(){
		return new Counter<T>(this.toArray())
	}
	add(toadd:T){
		let val=this.map.get(toadd)
		if(val!==undefined){
			this.map.set(toadd,val+1)
		}
		else{
			this.map.set(toadd,1)
		}
		this.size++
		return this
	}
	countItem(item:T){
		if(!this.map.has(item)) return 0
		return this.map.get(item)
	}
	delete(e:T){
		let val=this.map.get(e)
		if(val!==undefined){
			this.size--
			this.map.set(e,val-1)
			if(this.map.get(e)===0) this.map.delete(e)
		}
		return this
	}
	has(e:T,count?:number){
		if(count===undefined) count=0
		let val=this.map.get(e)
		return val!==undefined && val>count
	}
	clear(){
		this.map.clear()
		this.size = 0 
	}
	toArray(){
		let list=[]
		for(const [e,count] of this.map.entries()){
			for(let i=0;i<count;++i){
				list.push(e)
			}
		}
		return list
	}
}