
function range(end: number, start?: number): number[] {
	if (!start) start = 0
	let list: number[] = []
	for (let i = start; i <= end; ++i) {
		list.push(i)
	}
	return list
}
export const MAP_SIZE=32
export const SAME_LINE_TILES:Set<number>[]=[0,8,16,24].map((i)=>new Set(range((i+8),i).map((i)=>i%MAP_SIZE)))
export const START_POS=0
export const ISLAND_POS=8
export const OLYMPIC_POS=16
export const TRAVEL_POS=24