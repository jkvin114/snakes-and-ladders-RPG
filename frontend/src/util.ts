export function limitString(str?:string,size?:number){
    if(!str) return ""
    if(!size) size=15
   return str.length > 15 ? str?.slice(0,15)+"..":str
}