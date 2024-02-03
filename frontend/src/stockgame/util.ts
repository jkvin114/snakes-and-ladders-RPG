export const round=function(num:number,digit?:number){
	if(!digit) digit=0

	num=num * (10**-digit)

	return Math.round(num) / (10**-digit)
}

export const rel_diff=function(prev:number,curr:number){
    if(prev===0 && curr===0) return 0
    else if(prev===0) return 1
    return (curr-prev)/prev
}
export const mean=function(arr:number[]){
    let sum=0
    for(let n of arr) sum+=n
    return sum/arr.length
}
export function randFloat(num:number){
	return (Math.random() * num)
}
export const triDist=function(mean:number,range:number){
	return mean + randFloat(range) + randFloat(range) - range
}
export const toPercentStr=function(val:number,noPlus?:boolean){
   return (!noPlus?(val>=0?"+":""):"")+round(val*100,-2)+"%"
}