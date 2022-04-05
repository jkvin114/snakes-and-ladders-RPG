import { Entity } from "./Entity"
import * as ENUM from "./enum"
import { Player } from "./player"
const CALC_TYPE = {
	set: (o: number, n: number) => n,
	plus: (o: number, n: number) => o + n,
	multiply: (o: number, n: number) => o * n,
	minus: (o: number, n: number) => o - n,
	divide: (o: number, n: number) => o / n
}
class PercentDamage{
	percent:number
	base:number
	type:number

	static readonly MAX_HP=1
	static readonly MISSING_HP=2
	static readonly CURR_HP=3
	constructor(percent:number,base:number,type?:number){
		this.percent=percent
		this.base=base
		this.type=type
		if(!type) this.type=Damage.TRUE
	}

	getTotal(target:Player){
		if(this.base===PercentDamage.MAX_HP){
			return Math.floor(target.MaxHP*this.percent/100)
		}
		if(this.base===PercentDamage.MISSING_HP){
			return Math.floor((target.MaxHP-target.HP)*this.percent/100)
		}
		if(this.base===PercentDamage.CURR_HP){
			return Math.floor(target.HP*this.percent/100)
		}
		return 0
	}
	/**
	 * converts it to damage object
	 * @param target 
	 * @returns Damage
	 */
	pack(target:Player){
		if(this.type===Damage.ATTACK){
			return new Damage(this.getTotal(target),0,0)
		}
		else if(this.type===Damage.MAGIC){
			return new Damage(0,this.getTotal(target),0)
		}
		else{
			return new Damage(0,0,this.getTotal(target))
		}
		
	}
}


class Damage {
	attack: number
	magic: number
	fixed: number
	static readonly ATTACK= 1
	static readonly MAGIC= 2
	static readonly TRUE= 3

	constructor(attack: number, magic: number, fixed: number) {
		this.attack = Math.floor(attack)
		this.magic = Math.floor(magic)
		this.fixed = Math.floor(fixed)
	}

	getTotalDmg(): number {
		return this.attack + this.magic + this.fixed 
	}
	mergeWith(d:Damage){
		this.attack+=d.attack
		this.magic+=d.magic
		this.fixed+=d.fixed
		return this
	}


	updateDamages(calctype:Function,val:number,type:number[]){
		for(const t of type){
			if(t==Damage.ATTACK){
				this.attack = Math.floor(calctype(this.attack, val))
			}
			if(t==Damage.MAGIC){
				this.magic = Math.floor(calctype(this.magic, val))
			}
			if(t==Damage.TRUE){
				this.fixed = Math.floor(calctype(this.fixed, val))
			}
		}
		return this
	}

	updateMagicDamage(calctype: Function, val: number) {
		this.magic = Math.floor(calctype(this.magic, val))
		return this
	}
	updateAttackDamage(calctype: Function, val: number) {
		this.attack = Math.floor(calctype(this.attack,val))
		return this
	}
	updateTrueDamage(calctype: Function, val: number) {
		this.fixed = Math.floor(calctype(this.fixed,val))
		return this
	}
	/**
	 * update attack and magic damage
	 * @param calctype 
	 * @param val 
	 * @returns 
	 */
	updateNormalDamage(calctype:Function,val:number){
		this.magic = Math.floor(calctype(this.magic, val))
		this.attack = Math.floor(calctype(this.attack,val))
		return this
	}

	updateAllDamage(calctype:Function,val:number){
		this.magic = Math.floor(calctype(this.magic, val))
		this.attack = Math.floor(calctype(this.attack,val))
		this.fixed = Math.floor(calctype(this.fixed,val))

		return this
	}

	applyResistance(data: { AR: number; MR: number; arP: number; MP: number; percentPenetration: number }): Damage
	{
		let AR: number = data.AR
		let MR: number = data.MR
		let arP: number = data.arP
		let MP: number = data.MP
		let percentPenetration: number = data.percentPenetration

		AR = AR * (1 - percentPenetration / 100)
		MR = MR * (1 - percentPenetration / 100)

		this.attack = Math.floor(this.attack * (100 / (100 + Math.max(AR - arP, 0))))
		this.magic= Math.floor(this.magic * (100 / (100 + Math.max(MR - MP, 0))))

		return this
	}
}


class ActiveItem {
	name: string
	id: number
	cooltime: number
	resetVal: number
	constructor(name: string, id: number, resetVal: number) {
		this.name = name
		this.id = id
		this.cooltime = 0
		this.resetVal = resetVal
	}
	cooldown(){
		this.cooltime = decrement(this.cooltime)
	}
	use(){
		this.cooltime = this.resetVal
	}
}

// export type Skillattr =
// 	| number
// 	| { range: number; skill: number; type: number }
// 	| { range: number; skill: number; type: number; size: number }

// export type SkillDamage = { damage: Damage; skill: number; onKill?: Function; onHit?: Function }

// interface OnSkillHitFunction{
// 	(e:Player):void
// }
// interface OnKillFunction{
// 	(source:Player):void
// }
class SkillAttack{
	damage: Damage
	skill: number
	onKill: (this:Player)=>void  	//(player):void
	onHit: (this:Player)=>void 		//():void
	name:string
	constructor(damage:Damage,name:string){
		this.damage=damage
		this.name=name
	}
	ofSkill(skill:ENUM.SKILL){
		this.skill=skill
		return this
	}
	setOnHit(onhit:(this:Player)=>void ){
		this.onHit=onhit
		return this
	}
	setOnKill(onkill:(this:Player)=>void ){
		this.onKill=onkill
		return this
	}

}
export const clamp=(num:number,start:number,end:number)=>Math.max(Math.min(num,end),start)
export const decrement = (val: number): number => Math.max(val - 1, 0)
/**
 * copy elements in arr2 to arr1 without creating new array
 * @param {*} arr1
 * @param {*} arr2
 */
export const copyElementsOnly = function<T> (arr1: T[], arr2: T[]): T[] {
	for (let i = 0; i < arr1.length; ++i) {
		arr1[i] = arr2[i]
	}
	return arr1
}

export const pickRandom=function<T>(list: T[]):T {
	return list[Math.floor(Math.random() * list.length)]
}

/**
 * 
 * @param upperbound return a integer in range of [0,upperbound-1]
 * @returns 
 */
export const randInt=function(upperbound: number): number {
	return Math.floor(Math.random() * upperbound)
}
/**
 * 
 * @param weights 
 * @returns index of weight array
 */
export const chooseWeightedRandom=function(weights:number[]):number{
	for(let i=1;i<weights.length;++i){
		weights[i]=weights[i]+weights[i-1]
	}
	let rand=Math.random()*weights[weights.length-1]
	for(let i=0;i<weights.length;++i){
		if(weights[i] > rand) return i
	}
	return 0
	//2 3 5    2 5 10
}

/**
 * true or false by 50%:50%
 * @param n 
 * @returns 
 */
export const randomBoolean=function(): boolean {
	return Math.random() > 0.5
}
export const shuffle=function<T>(array:T[]):T[] {
	var m = array.length, t, i;
  
	// While there remain elements to shuffle…
	while (m) {
  
	  // Pick a remaining element…
	  i = Math.floor(Math.random() * m--);
  
	  // And swap it with the current element.
	  t = array[m];
	  array[m] = array[i];
	  array[i] = t;
	}
  
	return array;
  }
export const sleep = (m:any) => new Promise((r) => setTimeout(r, m))
/**
 * array of element
 * @param {} count
 * @returns
 */
export const makeArrayOf = function <T>(element:T,count: number): T[] {
	let arr = []
	for (let i = 0; i < count; ++i) {
		arr.push(element)
	}
	return arr
}
export const Normalize =function(list:number[]):number[]{
	let max=list.reduce((prev,curr)=>curr>prev?curr:prev)
	let min=list.reduce((prev,curr)=>curr<prev?curr:prev)
	return list.map((v)=>(v-min)/(max-min))
}

class PriorityArray<T> extends Array {
	constructor() {
		super()
	}
	getMax(priority: (this: T)=> number):T {
		let max = -Infinity
		let maxObject:T = null
		for (let e of this) {
			let val = priority.call(e)
			if (val > max) {
				max = val
				maxObject = e
			}
		}
		return maxObject
	}
	getMin(priority: (this: T)=> number):T {
		let min = Infinity
		let maxObject:T  = null
		for (let e of this) {
			let val = priority.call(e)

			if (val < min) {
				min = val
				maxObject = e
			}
		}
		return maxObject
	}
	getMaxIndex(priority: (this: T)=> number):number {
		let max = -Infinity
		let maxidx =0
		for (let i=0;i < this.length;++i) {
			let val = priority.call(this[i])
			if (val > max) {
				max = val
				maxidx = i
			}
		}
		return maxidx
	}
	getMinIndex(priority: (this: T)=> number):number {
		let min = Infinity
		let minidx=0
		for (let i=0;i < this.length;++i) {
			let val = priority.call(this[i])
			if (val < min) {
				min = val
				minidx = i
			}
		}
		return minidx
	}
}
export type singleMap = {
	mapname: string
	coordinates: { x: number; y: number; obs: number; money: number }[]
	finish: number
	muststop: number[]
	respawn: number[]
	store: number[]
	dc_limit_level: number
	goldperturn: number[]
	shuffle:{start:number,end:number}[]
	//ocean map only
	submarine_range?: {
		start: number
		end: number
	}
	//ocean map only
	way2_range?: {
		start: number
		end: number
		way_start: number
		way_end: number
	}
	//casino map only
	subway?:{
		start:number,
		end:number,
		default:number[],
		rapid:number[],
		express:number[],
		prices:number[],
	}
}

class MapStorage {
	map: singleMap[]
	static instance=false
	constructor(m: singleMap[]) {
		if(MapStorage.instance) return
		MapStorage.instance=true


		this.map = m
	}
	get(id: number): singleMap {
		return this.map[id]
	}
	getMuststop(id: number): number[] {
		return this.map[id].muststop
	}
	getRespawn(id: number): number[] {
		return this.map[id].respawn
	}
	getStore(id: number): number[] {
		return this.map[id].store
	}
	getFinish(id: number): number {
		return this.map[id].finish
	}
	getLimit(id: number): number {
		if(this.map[id].way2_range!=null){
			return this.map[id].way2_range.way_end
		}
		return this.map[id].finish
	}
	getShuffledObstacles(id:number):{obs:number,money:number}[]{
		let thismap=this.map[id]
		let obslist=this.getObstacleList(id)

		for(let sfdata of thismap.shuffle){
			let toshuffle=[]
			for(let i=sfdata.start;i<=sfdata.end;++i){
				toshuffle.push(thismap.coordinates[i])
			}
			toshuffle=shuffle(toshuffle)
			let j=0
			for(let i=sfdata.start;i<=sfdata.end;++i){
				
				if(obslist[i].obs>0){
					obslist[i].obs=toshuffle[j].obs
					obslist[i].money=toshuffle[j].money
				}
				
				++j
			}
		}

		return obslist
	}
	getTurnGold(id:number,lvl:number){
		if(lvl-1 >= this.map[id].goldperturn.length){
			lvl=this.map[id].goldperturn.length
		}
		return this.map[id].goldperturn[lvl-1] 
	}
	getObstacleList(id:number){
		return this.map[id]
		.coordinates.map((c)=>{return {obs:c.obs,money:c.money}})
	}

	getCoordinateDistance(id:number,pos1:number,pos2:number){
		let c1=this.map[id].coordinates[pos1]
		let c2=this.map[id].coordinates[pos2]
		return Math.sqrt((c1.x-c2.x)**2+(c1.y-c2.y)**2)
	}
}



class HPChangeData {
	static readonly FLAG_SHIELD=1
	static readonly FLAG_NODMG_HIT=2
	static readonly FLAG_TICKDMG=3
	static readonly FLAG_PLAINDMG=4

	hp: number
	maxHp: number
	type: string
	source: number
	isRespawn: boolean
	needDelay: boolean
	killedByDamage: boolean
	willRevive: boolean
	skillTrajectorySpeed: number
	flags:Set<number>
	constructor() {
		this.hp = 0
		this.maxHp = 0
		this.type = "noeffect"
		this.source = -1
		this.isRespawn = false
		this.needDelay = false
		this.killedByDamage = false
		this.willRevive = false
		this.skillTrajectorySpeed = 0
		this.flags=new Set<number>()
	}
	

	setHpChange(hp: number) {
		this.hp = Math.floor(hp)
		return this
	}
	setMaxHpChange(maxhp: number) {
		this.maxHp = Math.floor(maxhp)
		this.hp = maxhp
		return this
	}
	setSource(source: number) {
		this.source = source
		return this
	}
	setRespawn() {
		this.isRespawn = true
		return this
	}
	setDelay() {
		this.needDelay = true
		return this
	}
	setType(type: string) {
		this.type = type
		return this
	}
	setKilled() {
		this.killedByDamage = true
		return this
	}
	setWillRevive() {
		this.willRevive = true
		return this
	}
	setSkillTrajectorySpeed(speed: number) {
		this.skillTrajectorySpeed = speed
		return this
	}
	addFlag(flag:number){
		this.flags.add(flag)
		return this
	}
	hasFlag(flag:number){
		return this.flags.has(flag)
	}
}
interface SkillTargetConditionFunction{
	(this:Entity):boolean
}

class SkillTargetSelector {
	resultType: ENUM.SKILL_INIT_TYPE
	skill_id: number
	range: number
	projSize: number
	areaSize:number
	condition:SkillTargetConditionFunction
	conditionedRange:number

	constructor(skill: number) {
		this.resultType = ENUM.SKILL_INIT_TYPE.CANNOT_USE
		this.skill_id=skill
		this.range=-1
		this.projSize
		this.areaSize
		this.condition=()=>true
		this.conditionedRange=-1

	}
	setType(type: number) {
		this.resultType = type
		return this
	}
	setSkill(s: number) {
		this.skill_id = s
		return this
	}
	setRange(r: number) {
		this.range = r
		return this
	}
	setAreaSize(size:number){
		this.areaSize=size
		return this
	}

	setConditionedRange(condition:SkillTargetConditionFunction,range:number){
		this.condition=condition
		this.conditionedRange=range
		return this
	}

	meetsCondition(target:Player){
		if(!this.condition) return false

		return this.condition.call(target)
	}

	setProjectileSize(s: number) {
		this.projSize = s
		return this
	}
	isAreaTarget(): boolean {
		return this.resultType === ENUM.SKILL_INIT_TYPE.AREA_TARGETING
	}
	isNonTarget(): boolean {
		return this.resultType === ENUM.SKILL_INIT_TYPE.NON_TARGET
	}
	isNoTarget(): boolean {
		return this.resultType === ENUM.SKILL_INIT_TYPE.NO_TARGET
	}
	isProjectile(): boolean {
		return this.resultType === ENUM.SKILL_INIT_TYPE.PROJECTILE
	}
}


class UniqueIdGenerator{
	count:number
	prefix:string
	constructor(prefix:string){
		this.count=1
		this.prefix=prefix
	}
	generate(){
		this.count+=1
		return this.prefix + String(this.count)
	}
	
}
//added 2021.07.07

export { Damage,ActiveItem, MapStorage, HPChangeData, CALC_TYPE, SkillTargetSelector ,PercentDamage,SkillAttack,UniqueIdGenerator,PriorityArray}
