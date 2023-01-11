import { PlayerComponent } from "./PlayerComponent";
import SETTINGS = require("../../res/globalsettings.json")
import type { Damage } from "../core/Damage";

export class DamageRecord{
    sourceTurn:number
    damageType:number
    attackType:string
    amt:number
    lifetime:number
    constructor(sourceTurn:number,
        damageType:number,
        amt:number,attackType?:string){
        this.sourceTurn=sourceTurn
        this.damageType=damageType
        this.amt=amt
        this.lifetime=SETTINGS.assist_turn
        if(!attackType) attackType=""
        this.attackType=attackType
    }
    onTurnEnd():boolean{
        this.lifetime-=1
        return this.lifetime<=0
    }
}

export class PlayerDamageRecorder implements PlayerComponent{
    onTurnStart: () => void;
    

    private record:Set<DamageRecord>//max length 3
    constructor(){
        this.record=new Set<DamageRecord>()
    }
    add(record:DamageRecord){
        this.record.add(record)
    }
    addFromAttack(damage:Damage,source:number,attackType?:string){
        if(damage.attack>0)
            this.record.add(new DamageRecord(source,0,damage.attack,attackType))
        if(damage.magic>0)
            this.record.add(new DamageRecord(source,1,damage.magic,attackType))
        if(damage.fixed>0)
            this.record.add(new DamageRecord(source,2,damage.fixed,attackType))
    }
    getTransferData(){
        return Array.from(this.record)
        .map((d)=>{return {sourceTurn:d.sourceTurn,
			damageType:d.damageType,
			attackType:d.attackType,
			amt:d.amt}})
    }
    hasSource(source:number){
        for(let d of this.record){
            if(d.sourceTurn===source) return true
        }
        return false
    }
    onTurnEnd(){
        for(let d of this.record){
            if(d.onTurnEnd()) this.record.delete(d)
         //   console.log(d)
        }
    }
    onDeath(){
        this.record.clear()
    }
}