
import crypto from "crypto";
/**
 *
 * @param end inclusive
 * @param start inclusive
 * @returns
 */
export function range(end: number, start?: number): number[] {
	if (!start) start = 0
	let list: number[] = []
	for (let i = start; i <= end; ++i) {
		list.push(i)
	}
	return list
}
export function chooseRandom<T>(list: T[]): T {
	return list[Math.floor(Math.random() * list.length)]
}
export function chooseRandomMultiple<T>(list: T[],count:number): T[] {
	if(count > list.length) return []
	return shuffle(list).slice(0,count)
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
export function sample(probability: number): boolean {
	return Math.random() < probability
}
export function randDice() {
	return Math.ceil(Math.random() * 6)
}
export function clamp(num: number, min: number, max: number) {
	return Math.max(Math.min(num, max), min)
}
export function distance(pos1: number, pos2: number) {
	return Math.min(Math.abs(pos1 - pos2), 32 - Math.abs(pos1 - pos2))
}
export function forwardDistance(start: number, dest: number): number {
	return start <= dest ? dest - start : 32 - (start - dest)
}
export function backwardDistance(start: number, dest: number): number {
	return start <= dest ? 32 - (dest - start) : start - dest
}
export function forwardBy(pos: number, dist: number) {
	return (pos + dist) % 32
}
export function backwardBy(pos: number, dist: number) {
	if (pos - dist >= 0) return pos - dist
	else return 32 + (pos - dist)
}
/**
 * 시작,끝지점 사이 타일 인덱스 반환
 * 시작,끝지점 포함안함
 * @param start
 * @param dest
 * @returns
 */
export function getTilesBewteen(start: number, dest: number): number[] {
	if (start < dest) {
		return range(dest - 1, start + 1)
	} else {
		return range(31, start + 1).concat(range(dest - 1, 0))
	}
}
export function countList<T>(list: T[], condition: Function): number {
	let count = 0
	for (const i of list) {
		if (condition(i)) count += 1
	}
	return count
}
export function countIterator<T>(list: IterableIterator<T>, condition: Function): number {
	let count = 0
	for (const i of list) {
		if (condition(i)) count += 1
	}
	return count
}

export function arrayOf<T>(length: number, elem: T): T[] {
	return Array<T>(length).fill(elem)
}

export enum PlayerType {
	EMPTY = "none",
	AI = "ai",
	PLAYER = "player",
	PLAYER_CONNECED = "player_connected",
	SIM_AI = "sim_ai"
}
export type ProtoPlayer = {
    type: PlayerType;
    name: string;
    team: boolean;
    champ: number;
    ready: boolean;
}
export function cl(...str:any){
	console.log(str)
}
export function hexId(){
	return crypto.randomBytes(8).toString("hex");
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