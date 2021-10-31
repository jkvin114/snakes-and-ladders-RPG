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
	TYPE = {
		ATTACK: 1,
		MAGIC: 2,
		TRUE: 3
	}

	constructor(attack: number, magic: number, fixed: number) {
		this.attack = Math.floor(attack)
		this.magic = Math.floor(magic)
		this.fixed = Math.floor(fixed)
	}

	getTotalDmg(): number {
		return this.attack + this.magic + this.fixed
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

	mergeDamageWithResistance(data: { AR: number; MR: number; arP: number; MP: number; percentPenetration: number }): {
		damage: number
		reducedDamage: number
	} {
		let AR: number = data.AR
		let MR: number = data.MR
		let arP: number = data.arP
		let MP: number = data.MP
		let percentPenetration: number = data.percentPenetration

		AR = AR * (1 - percentPenetration / 100)
		MR = MR * (1 - percentPenetration / 100)

		let pdmg = Math.floor(this.attack * (100 / (100 + Math.max(AR - arP, 0))))
		let mdmg = Math.floor(this.magic * (100 / (100 + Math.max(MR - MP, 0))))

		let reduced = this.attack - pdmg + (this.magic - mdmg)

		return {
			damage: pdmg + mdmg,
			reducedDamage: reduced
		}
	}
}
class SkillEffect {
	type: string
	owner_turn: number
	dur: number
	name: string
	skillattr: Damage

	constructor(type: string, owner_turn: number, dur: number, name: string, skillattr: Damage) {
		this.type = type
		this.owner_turn = owner_turn
		this.dur = dur
		this.name = name
		this.skillattr = skillattr
	}
}

class ActiveItem {
	name: string
	id: number
	cooltime: number
	resetVal: number
	constructor(name: string, id: number, cooltime: number, resetVal: number) {
		this.name = name
		this.id = id
		this.cooltime = cooltime
		this.resetVal = resetVal
	}
}
export type Skillattr =
	| number
	| { range: number; skill: number; type: number }
	| { range: number; skill: number; type: number; size: number }

export type SkillDamage = { damage: Damage; skill: number; onKill?: Function; onHit?: Function }

export const decrement = (val: number): number => Math.max(val - 1, 0)
/**
 * copy elements in arr2 to arr1 without creating new array
 * @param {*} arr1
 * @param {*} arr2
 */
export const copyElementsOnly = function (arr1: number[], arr2: number[]): number[] {
	for (let i = 0; i < arr1.length; ++i) {
		arr1[i] = arr2[i]
	}
	return arr1
}

export const shuffle=function(array:any[]):any[] {
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
export const makeArrayOf = function (element:number,count: number): number[] {
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
	goldperturn: number
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

class Map {
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
		let obslist=[]
		for(let c of thismap.coordinates){
			obslist.push({obs:c.obs,money:c.money})
		}

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
}

enum HPChangeDataFlag{
	SHIELD,NODMG_HIT
}

class HPChangeData {
	hp: number
	maxHp: number
	type: string
	source: number
	isRespawn: boolean
	needDelay: boolean
	killedByDamage: boolean
	willRevive: boolean
	skillTrajectorySpeed: number
	flags:HPChangeDataFlag[]
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
		this.flags=[]
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
	addFlag(flag:HPChangeDataFlag){
		this.flags.push(flag)
		return this
	}
	hasFlag(flag:HPChangeDataFlag){
		return this.flags.indexOf(flag) !==-1
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

export { Damage, SkillEffect, ActiveItem, Map, HPChangeData, CALC_TYPE, SkillTargetSelector,HPChangeDataFlag }
