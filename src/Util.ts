import * as ENUM from "./enum"

const CALC_TYPE = {
	set: (o: number, n: number) => n,
	plus: (o: number, n: number) => o + n,
	multiply: (o: number, n: number) => o * n,
	minus: (o: number, n: number) => o - n,
	divide: (o: number, n: number) => o / n
}
class Damage {
	attack: number
	magic: number
	fixed: number
	static ATTACK= 1
	static MAGIC= 2
	static TRUE= 3
	

	constructor(attack: number, magic: number, fixed: number) {
		this.attack = Math.floor(attack)
		this.magic = Math.floor(magic)
		this.fixed = Math.floor(fixed)
	}

	getTotalDmg(): number {
		return this.attack + this.magic + this.fixed
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

	applyResistanceToDamage(data: { AR: number; MR: number; arP: number; MP: number; percentPenetration: number }): number
	{
		let AR: number = data.AR
		let MR: number = data.MR
		let arP: number = data.arP
		let MP: number = data.MP
		let percentPenetration: number = data.percentPenetration

		AR = AR * (1 - percentPenetration / 100)
		MR = MR * (1 - percentPenetration / 100)

		let pdmg = Math.floor(this.attack * (100 / (100 + Math.max(AR - arP, 0))))
		let mdmg = Math.floor(this.magic * (100 / (100 + Math.max(MR - MP, 0))))

		return pdmg + mdmg + this.fixed
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

export type SkillDamage = { damage: Damage; skill: number; onKill?: Function; onHit?: Function }

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
 * @param upperbound return one in [0,upperbound-1]
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
 * array of zeros
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
	constructor(m: singleMap[]) {
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

}



class HPChangeData {
	static FLAG_SHIELD=1
	static FLAG_NODMG_HIT=2
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
		this.hp = hp
		return this
	}
	setMaxHpChange(maxhp: number) {
		this.maxHp = maxhp
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

class SkillTargetSelector {
	resultType: number
	skill_id: number
	range: number
	projSize: number

	constructor(type: number) {
		this.resultType = type
		this.skill_id
		this.range
		this.projSize
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
	setProjectileSize(s: number) {
		this.projSize = s
		return this
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

//added 2021.07.07

export { Damage,ActiveItem, MapStorage, HPChangeData, CALC_TYPE, SkillTargetSelector }
