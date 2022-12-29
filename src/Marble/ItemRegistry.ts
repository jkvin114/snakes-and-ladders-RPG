
import * as csvParse from 'csv-parse';
import fs from 'fs';
import { ABILITY_NAME, ABILITY_REGISTRY } from './Ability/AbilityRegistry';
import { AbilityValues } from './Ability/AbilityValues';
const headers=["code","name","name_kor","ability","chance","value","upgradevalue","firstonly","limit","cost"]

interface itemData{
    limit:string,code:string,name:string,ability:string
    ,name_kor:string,chance:string,value:string,upgradevalue:string
    ,firstonly:string,cost:number
}

const myParser = csvParse.parse({delimiter: ',',columns: headers,
fromLine: 2,encoding:"utf-8"});
const ITEMS:itemData[]=[]
fs.createReadStream(__dirname+'/items.csv',{encoding:"utf-8"}).pipe(myParser).on('data', (data) => ITEMS.push(data))
.on('end', () => {
    
 //   console.log("marble items registered"+ITEMS[0].name_kor)
});


export namespace ITEM_REGISTRY{
    export function get(code:number):[ABILITY_NAME,AbilityValues,number]|null{
        if(code >= ITEMS.length) code = 0
        const item=ITEMS[code]

        if(!ABILITY_REGISTRY.has(item.ability as ABILITY_NAME)) return null
        let value=new AbilityValues().setItemName(item.name,item.name_kor)

        if(item.chance!=="") value.setChance(Number(item.chance))
        if(item.value!=="") {
            if(item.upgradevalue!=="") value.setValue(Number(item.value),Number(item.upgradevalue))
            else value.setValue(Number(item.value))
        }
        
        if(item.firstonly==="1") value.setFirstOnly()
        else if(item.limit!=="") value.setLimit(Number(item.limit))
        

        return [item.ability as ABILITY_NAME,value,Number(item.cost)]

    }
    export function getAllDescriptions():{code:number,name:string,desc:string,cost:number}[]{
        let list:{code:number,name:string,desc:string,cost:number}[]=[]
        for(let i=0;i<ITEMS.length;++i){
            let item=get(i)
            if(!item) continue
            let desc=""
            let ability=ABILITY_REGISTRY.get(item[0])
            if(ability!=null)
                desc=item[1].getDescription(ability.description)

            list.push({
                code:i,name:item[1].getItemKorName(),desc:desc,cost:item[2]
            })
        }
        return list
    }
}
