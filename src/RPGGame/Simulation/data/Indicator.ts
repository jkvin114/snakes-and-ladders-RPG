import SETTINGS = require("../../../../res/globalsettings.json")

export class Indicator{
    character:number
    damage_per_death:number
    damage_reduction_per_turn:number
    damage_reduction_rate:number
    damage_per_gold:number
    damage_reduction_per_gold:number
    heal_per_gold:number
    end_position:number
    kda:number
    isWinner:boolean
    constructor(char:number){
        this.isWinner=false
        this.character=char
        this.damage_per_death=0
        this.damage_per_gold=0
        this.damage_reduction_per_gold=0
        this.damage_reduction_per_turn=0
        this.heal_per_gold=0
        this.end_position=0
        this.damage_reduction_rate=0
        this.kda=0
    }
    static add(original:Indicator,ind:Indicator){
        original.damage_per_death+=ind.damage_per_death
        original.damage_per_gold+=ind.damage_per_gold
        original.damage_reduction_per_gold+=ind.damage_reduction_per_gold
        original.damage_reduction_per_turn+=ind.damage_reduction_per_turn
        original.heal_per_gold+=ind.heal_per_gold
        original.end_position+=ind.end_position
        original.damage_reduction_rate+=ind.damage_reduction_rate
        original.kda+=ind.kda
        return original
    }
    static divide(ind:Indicator,count:number){
        ind.damage_per_death/=count
        ind.damage_per_gold/=count
        ind.damage_reduction_per_gold/=count
        ind.damage_reduction_per_turn/=count
        ind.heal_per_gold/=count
        ind.end_position/=count
        ind.damage_reduction_rate/=count
        ind.kda/=count
        return ind
    }
    getDiffRatio(other:Indicator){
        let ind=new Indicator(this.character)
        ind.damage_per_death=(other.damage_per_death-this.damage_per_death)/this.damage_per_death
        ind.damage_reduction_per_turn=(other.damage_reduction_per_turn-this.damage_reduction_per_turn)/this.damage_reduction_per_turn
        ind.damage_reduction_rate=(other.damage_reduction_rate-this.damage_reduction_rate)/this.damage_reduction_rate
        ind.damage_per_gold=(other.damage_per_gold-this.damage_per_gold)/this.damage_per_gold 
        ind.damage_reduction_per_gold=(other.damage_reduction_per_gold-this.damage_reduction_per_gold)/this.damage_reduction_per_gold
        ind.heal_per_gold=(other.heal_per_gold-this.heal_per_gold)/this.heal_per_gold 
        ind.end_position=(other.end_position-this.end_position)/this.end_position 
        return ind
    }
    static getEvalScores(totalavg:Indicator,winavg:Indicator):{name:string,average:number,winAverage:number}[]{
        let arr=[]
        arr.push({
            name:"damage_per_death",
            average:totalavg.damage_per_death,
            winAverage:winavg.damage_per_death
        })
        arr.push({
            name:"damage_reduction_per_turn",
            average:totalavg.damage_reduction_per_turn,
            winAverage:winavg.damage_reduction_per_turn
        })
        arr.push({
            name:"damage_reduction_per_gold",
            average:totalavg.damage_reduction_per_gold,
            winAverage:winavg.damage_reduction_per_gold
        })
        arr.push({
            name:"damage_reduction_rate",
            average:totalavg.damage_reduction_rate,
            winAverage:winavg.damage_reduction_rate
        })
        arr.push({
            name:"damage_per_gold",
            average:totalavg.damage_per_gold,
            winAverage:winavg.damage_per_gold
        })
        arr.push({
            name:"heal_per_gold",
            average:totalavg.heal_per_gold,
            winAverage:winavg.heal_per_gold
        })
        arr.push({
            name:"kda",
            average:totalavg.kda,
            winAverage:winavg.kda
        })

        return arr
    }
    toString(){
        if(this.end_position===0) return ""
        return `\n캐릭터:${this.character==-1?"전체 ":SETTINGS.characters[this.character].name}
        \n데스당 피해량: ${this.damage_per_death}
        \n턴당 피해감소량: ${this.damage_reduction_per_turn}
        \n피해감소율: ${this.damage_reduction_rate}
        \n골드당 피해량: ${this.damage_per_gold}
        \n골드당 피해감소량: ${this.damage_reduction_per_gold}
        \n골드당 회복량: ${this.heal_per_gold}
        \n마지막 위치: ${this.end_position}
        \n위치 가중치: ${(this.end_position-40)/40}\n`
    }

    getReward(){
        return 0
        /**
         * 
        let average=TRAINAVG[this.character][0]
        let weight=TRAINAVG[this.character][2]
        let position_weight= Math.max(1,this.end_position-40)/40
        let reward=0

        reward += weight.damage_per_death *  ((this.damage_per_death - average.damage_per_death)/average.damage_per_death)
        reward += weight.damage_reduction_per_turn *  ((this.damage_reduction_per_turn - average.damage_reduction_per_turn)/average.damage_reduction_per_turn)
        reward += weight.damage_reduction_rate *  ((this.damage_reduction_rate - average.damage_reduction_rate)/average.damage_reduction_rate)
        reward += weight.damage_per_gold *  ((this.damage_per_gold - average.damage_per_gold)/average.damage_per_gold)
        reward += weight.damage_per_death *  ((this.damage_reduction_per_gold - average.damage_reduction_per_gold)/average.damage_reduction_per_gold)
        reward += weight.heal_per_gold *  ((this.heal_per_gold - average.heal_per_gold)/average.heal_per_gold)
  
        return reward>0 ? reward * position_weight : reward / position_weight  */
    }
}
