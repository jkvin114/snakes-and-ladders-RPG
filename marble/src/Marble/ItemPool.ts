import { shuffle } from "./util"

export class ItemPool{
    name:string|undefined
    count:number
    entries:(number|number[])[]
}
export class ItemPreset{
    version:number
    name:string
    pools:ItemPool[]

    /**
     * roll
     */
    public roll():number[] {
        let items = new Set<number>()
        for(const pool of this.pools){
            if(pool.entries && pool.entries.length>0){
                let shuffled = shuffle(pool.entries)
                for(let i=0;i<Math.min(pool.entries.length,pool.count);++i){
                    if(typeof shuffled[i] === "number"){
                        items.add(shuffled[i] as number)
                    }
                    else{
                        for(const item of shuffled[i] as number[])
                            items.add(item)
                    }
                }
            }
        }
        return [...items]
    }
    public selectedItems():number[]{
        let items = new Set<number>()
        for(const pool of this.pools){
            if(pool.entries && pool.entries.length>0){
                for(let i=0;i<pool.entries.length;++i){
                    if(typeof pool.entries[i] === "number"){
                        items.add(pool.entries[i] as number)
                    }
                    else{
                        for(const item of pool.entries[i] as number[])
                            items.add(item)
                    }
                }
            }
        }
        return [...items]
    }
}