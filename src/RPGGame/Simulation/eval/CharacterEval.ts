import { ICharacterSimulationEval } from "../../../mongodb/SimulationEvalDBSchema"
import  { CHARACTER, ITEM } from "../../data/enum"
import { Indicator } from "../data/Indicator"
import { EVAL_VERSION, GameType, MapName } from "./types"
import SETTINGS = require("../../../../res/globalsettings.json")


export class CharacterEval{
    charId:CHARACTER
    opponents:Map<CHARACTER,[number,number]>
    duos:Map<CHARACTER,[number,number]>
    items:Map<ITEM,[number,number]>
    itembuilds:Map<string,[number,number]>
    count:number
    wins:number
    totalIndicator:Indicator
    winIndicator:Indicator
    constructor(charId:CHARACTER){
        this.charId=charId
        this.count=0
        this.wins=0
        this.totalIndicator=new Indicator(-1)
        this.winIndicator=new Indicator(-1)
        this.opponents=new Map<CHARACTER,[number,number]>()
        this.duos=new Map<CHARACTER,[number,number]>()
        this.items=new Map<ITEM,[number,number]>()
        this.itembuilds=new Map<string,[number,number]>()
    }
    selializeMap<T>(map:Map<T,[number,number]>)
    {
        let arr=[]
        for(const [key,val] of map.entries()){
            arr.push({
                for:key,count:val[0],wins:val[1]
            })
        }
        map.clear()
        return arr
    }

    serialize(gameType:GameType,mapname:MapName):ICharacterSimulationEval{
        if(this.count>0)
            Indicator.divide(this.totalIndicator,this.count)
        if(this.wins>0)
            Indicator.divide(this.winIndicator,this.wins)

        return {
            charId:this.charId,
            gameType:gameType,
            mapName:mapname,
            version:EVAL_VERSION,
            serverVersion:SETTINGS.version,
            patchVersion:SETTINGS.patch_version,
            count:this.count,
            wins:this.wins,
            opponents:this.selializeMap<CHARACTER>(this.opponents),
            duos:this.selializeMap<CHARACTER>(this.duos),
            items:this.selializeMap<ITEM>(this.items),
            itembuilds:this.selializeMap<string>(this.itembuilds),
            scores:Indicator.getEvalScores(this.totalIndicator,this.winIndicator)
        } as ICharacterSimulationEval
    }
}
