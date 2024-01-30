import fs = require("fs")
import { Logger } from "../../logger"

const CALC_TYPE = {
	set: (o: number, n: number) => n,
	plus: (o: number, n: number) => o + n,
	multiply: (o: number, n: number) => o * n,
	minus: (o: number, n: number) => o - n,
	divide: (o: number, n: number) => o / n
}


export function chooseRandom<T>(list: T[]): T {
	return list[Math.floor(Math.random() * list.length)]
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

export const clamp = (num: number, start: number, end: number) => Math.max(Math.min(num, end), start)
export const decrement = (val: number): number => Math.max(val - 1, 0)
/**
 * copy elements in arr2 to arr1 without creating new array
 * @param {*} arr1
 * @param {*} arr2
 */
export const copyElementsOnly = function <T>(arr1: T[], arr2: T[]): T[] {
	for (let i = 0; i < arr1.length; ++i) {
		arr1[i] = arr2[i]
	}
	return arr1
}

export const roundToNearest=function(num:number,digit?:number){
	if(!digit) digit=0

	num=num * (10**-digit)

	return Math.round(num) / (10**-digit)
}
export const pickRandom = function <T>(list: T[]): T {
	return list[Math.floor(Math.random() * list.length)]
}

/**
 *
 * @param upperbound return a integer in range of [0,upperbound-1]
 * @returns
 */
export const randInt = function (upperbound: number): number {
	return Math.floor(Math.random() * upperbound)
}
/**
 *
 * @param weights
 * @returns index of weight array
 */
export const chooseWeightedRandom = function (weights: number[]): number {
	for (let i = 1; i < weights.length; ++i) {
		weights[i] = weights[i] + weights[i - 1]
	}
	let rand = Math.random() * weights[weights.length - 1]
	for (let i = 0; i < weights.length; ++i) {
		if (weights[i] > rand) return i
	}
	return 0
	//2 3 5    2 5 10
}

/**
 * true or false by 50%:50%
 * @param n
 * @returns
 */
export const randomBoolean = function (): boolean {
	return Math.random() > 0.5
}
export const shuffle = function <T>(array: T[]): T[] {
	var m = array.length,
		t,
		i

	// While there remain elements to shuffle…
	while (m) {
		// Pick a remaining element…
		i = Math.floor(Math.random() * m--)

		// And swap it with the current element.
		t = array[m]
		array[m] = array[i]
		array[i] = t
	}

	return array
}
export const sleep = (m: any) => new Promise((r) => setTimeout(r, m))
/**
 * array of element
 * @param {} count
 * @returns
 */
export const makeArrayOf = function <T>(element: T, count: number): T[] {
	let arr = []
	for (let i = 0; i < count; ++i) {
		arr.push(element)
	}
	
	return arr
}
export const Normalize = function (list: number[]): number[] {
	let max = Math.max(...list)
	let min = Math.min(...list)
	return list.map((v) => (v - min) / (max - min))
}
//export type Movement = { player: number; to: number; type: string }

export const hasProp = <T>(
	varToBeChecked: unknown,
	propertyToCheckFor: keyof T
  ): varToBeChecked is T =>
	(varToBeChecked as T)[propertyToCheckFor] !== undefined


export const getCurrentTime = function(){
	let date_ob = new Date()
	let date = ("0" + date_ob.getDate()).slice(-2)

	// current month
	let month = ("0" + (date_ob.getMonth() + 1)).slice(-2)
	let year=date_ob.getFullYear()
	// current hours
	let hours = date_ob.getHours()

	// current minutes
	let minutes = date_ob.getMinutes()

	// current seconds
	let seconds = date_ob.getSeconds()

	return year+"_"+month + "_" + date + "_" + hours + "_" + minutes + "_" + seconds
}
export function writeFile(data:string,dir:string,extension:string,onSuccess:string){
	fs.writeFile(__dirname + "/../../"+dir +getCurrentTime()+ "."+extension, data, (err) => {
		if (err) {
			Logger.error("write file",err)
			throw err
		}
		//console.log(onSuccess)
	})
}
export function writeToFile(data:string,filename:string){
	fs.appendFile(__dirname + "/../../"+filename, data, (err) => {
		if (err) {
			Logger.error("write file",err)
			throw err
		}
		// console.log("successfully")
	})
}
export function dot(arr1:number[],arr2:number[]):number{
	let val=0
	for(let i=0;i<arr1.length;++i){
		val+=(arr1[i]*arr2[i])
	}
	return val
}
export function normalize(list:number[]){
	let sorted=list.sort((a,b)=>a-b)
	return list.map((val)=>(val-sorted[0])/(sorted[sorted.length-1]-sorted[0]))
}
export function sum(list:number[]){
	return list.reduce((pv,cr)=>pv+cr,0)
}
export function mean(list:number[]){
	return sum(list)/list.length
}
export function std(list:number[]){
	let avg=mean(list)
	let v=0
	for(let j=0;j<list.length;++j){
		v+= (list[j]-avg)**2
	}
	return Math.sqrt(v/list.length)
}

/**
 * normalize over columns to be standard normal distribution
 * @param list 
 */
export function normalize2D(list:number[][])
{
	for(let i=0;i<list[0].length;++i){
		let arr=[]
		for(let j=0;j<list.length;++j){
			arr.push(list[j][i])
		}
		let avg = mean(arr)
		let sd = std(arr)
		if(sd!==0)
			arr=arr.map(v=>(v-avg)/sd)
		for(let j=0;j<list.length;++j){
			list[j][i]=roundToNearest(arr[j],-2)
		}
	}
	return list
}
/**
 * normalize over columns to be standard normal distribution for indices features
 * @param list 
 */
export function normalize2DIndices(list:number[][],indices:number[])
{
	for(let i of indices){
		if(i<0 || i >=list[0].length) continue

		let arr=[]
		for(let j=0;j<list.length;++j){
			arr.push(list[j][i])
		}
		let avg = mean(arr)
		let sd = std(arr)
		if(sd!==0)
			arr=arr.map(v=>(v-avg)/sd)
		for(let j=0;j<list.length;++j){
			list[j][i]=roundToNearest(arr[j],-2)
		}
	}
	return list
}
export function removeDuplicate<T>(list:T[]):T[]{
	return [...new Set<T>(list)]
}
export function normNRound(val: number, divide: number) {
	return roundToNearest(val / divide, -3)
}
class PriorityArray<T> extends Array {
	constructor() {
		super()
	}
	getMax(priority: ((elem: T) => number)): T|null {
		if(this.length===0) return null
		let max = -Infinity
		let maxObject: T = this[0]
		for (let e of this) {
			let val = priority(e)
			if (val > max) {
				max = val
				maxObject = e
			}
		}
		return maxObject
	}
	getMin(priority: (elem: T) => number): T|null {
		if(this.length===0) return null
		let min = Infinity
		let maxObject: T = this[0]
		for (let e of this) {
			let val = priority(e)

			if (val < min) {
				min = val
				maxObject = e
			}
		}
		return maxObject
	}
	argmax(priority: (elem: T) => number): number {
		if(this.length===0) return -1
		let max = -Infinity
		let maxidx = 0
		for (let i = 0; i < this.length; ++i) {
			let val = priority(this[i])
			if (val > max) {
				max = val
				maxidx = i
			}
		}
		return maxidx
	}
	argmin(priority: (elem: T) => number): number {
		if(this.length===0) return -1
		let min = Infinity
		let minidx = 0
		for (let i = 0; i < this.length; ++i) {
			let val = priority(this[i])
			if (val < min) {
				min = val
				minidx = i
			}
		}
		return minidx
	}
}
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
export class Stack<T>{
	private top:StackNode<T>|null
	size:number
	constructor(){
		this.top=null
		this.size=0
	}
	push(val:T){
		let node=new StackNode<T>(val)
		if(this.top)
			node.setPrev(this.top.copy())
		this.top=node
		this.size+=1
		return this
	}
	pop(){
		if(!this.top) return null
		let val=this.top.val
		this.top=this.top.prev
		this.size-=1
		return val
	}
	toString():string{
		if(!this.top) return ""
		return "["+this.top.toString()+"]"
	}

}
class StackNode<T>{
	prev:StackNode<T>|null
	val:T
	constructor(val:T){
		this.val=val
		this.prev=null
	}
	setPrev(prev:StackNode<T>|null){
		this.prev=prev
		return this
	}
	toString():string{
		if(!this.prev) return this.val+""

		return this.prev.toString() + "," + this.val
	}
	
	copy(){
		return new StackNode<T>(this.val).setPrev(this.prev)
	}
}

class UniqueIdGenerator {
	count: number
	prefix: string
	constructor(prefix: string) {
		this.count = 1
		this.prefix = prefix
	}
	generate() {
		this.count += 1
		return this.prefix + String(this.count)
	}
}
enum PlayerType {
	EMPTY = "none",
	AI = "ai",
	PLAYER = "player",
	PLAYER_CONNECED = "player_connected",
	SIM_AI = "sim_ai"
}

type ProtoPlayer = { type: PlayerType; name: string; team: boolean; champ: number; ready: boolean,
userClass:number }

export type AbilityUtilityScorecard={
	attack:number,magic:number,defence:number,health:number,myutilRatio:number
}


export {
	CALC_TYPE,
	UniqueIdGenerator,
	PriorityArray,
	PlayerType,ProtoPlayer
}
