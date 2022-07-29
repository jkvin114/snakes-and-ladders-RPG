import SETTINGS = require("../res/globalsettings.json")
import TRAINAVG = require("../res/trainavg.json")
import TRAIN_SETTINGS = require("../res/train_setting.json")

import { makeArrayOf, roundToNearest, writeFile } from "./core/Util"

import { items as ItemList } from "../res/item.json"


const CORE_ITEMS=ItemList.filter((i)=>i.itemlevel===3).map((i)=>i.id)

const COUNT=SETTINGS.characters.length

const ITEM_COUNT=6
function defaultCoreItemMap(){
    let map=new Map<number,number>()
    for(let item of CORE_ITEMS){   
        map.set(item,0)
    }
    return map
}
function differenceRatio(base:number,toCompare:number){
    return (toCompare - base)/base
}
function differencePercent(base:number,toCompare:number){
    return ratioToPercent((toCompare - base)/base)
}
function ratioToPercent(ratio:number){
    return (roundToNearest(ratio,-4) * 100).toFixed(2)
}
class Indicator{
    character:number
    damage_per_death:number
    damage_reduction_per_turn:number
    damage_reduction_rate:number
    damage_per_gold:number
    damage_reduction_per_gold:number
    heal_per_gold:number
    end_position:number
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
    }
    add(ind:Indicator){
        this.damage_per_death+=ind.damage_per_death
        this.damage_per_gold+=ind.damage_per_gold
        this.damage_reduction_per_gold+=ind.damage_reduction_per_gold
        this.damage_reduction_per_turn+=ind.damage_reduction_per_turn
        this.heal_per_gold+=ind.heal_per_gold
        this.end_position+=ind.end_position
        this.damage_reduction_rate+=ind.damage_reduction_rate
    }
    divide(count:number){
        this.damage_per_death/=count
        this.damage_per_gold/=count
        this.damage_reduction_per_gold/=count
        this.damage_reduction_per_turn/=count
        this.heal_per_gold/=count
        this.end_position/=count
        this.damage_reduction_rate/=count
        return this
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
  
        return reward>0 ? reward * position_weight : reward / position_weight
    }
}


class PlayerRecord{
    indicator:Indicator
    character:number
    isWinner:boolean
    coreItemBuild:number[]
    constructor(indicator:Indicator,items:number[]){
        this.indicator=indicator
        this.coreItemBuild=items
        this.character=indicator.character
        this.isWinner=indicator.isWinner
    }
}

class GameRecord{
    players:PlayerRecord[]
    totalturn:number

    constructor(totalturn:number){
        this.totalturn=totalturn
        this.players=[]
    }
    add(indicator:Indicator,items:number[]){
        this.players.push(new PlayerRecord(indicator,items))
    }
}
class TrainData{
    focusedCharacter:number
    randomItem:boolean
    gameRecords:GameRecord[]
    averageInd:Indicator
    characterAverageInd:Indicator[]
    winnerCharacterAverageInd:Indicator[]
    characterWinRates:number[]
    characterToCharacterWinRates:number[][]
    characterItemWinRates:Map<number,number>[]
    coreItemOrderWinRates:Map<number,number[]>
    constructor(){
        this.focusedCharacter=-1
        this.gameRecords=[]
        this.characterItemWinRates=[]
        this.randomItem=true
        this.characterToCharacterWinRates=[]
        this.coreItemOrderWinRates=new Map<number,number[]>()
    }
    addGame(gi:GameRecord){
        this.gameRecords.push(gi)
    }
    calcAverageIndicator(){
        let total=0
        let ind=new Indicator(-1)
        for(let game of this.gameRecords){
            for(let p of game.players){
                total+=1
                ind.add(p.indicator)
            }
        }
        this.averageInd = ind.divide(total)
    }

    calcAverageIndicatorForCharacters(){
        let total=0
        let all_ind=new Indicator(-1)

        let character_total=[]
        let character_ind=[]
        
        let winner_character_ind=[]
        let winner_character_total:number[]=[]
        let win_rates:number[]=[]
        let character_item_total:Map<number,number>[]=[]
        let character_item_win_count:Map<number,number>[]=[]

        let char_to_char_total=[]
        let char_to_char_win_count=[]

        let item_order_total=new Map<number,number[]>()
        let item_order_win_count=new Map<number,number[]>()

        for(let item of CORE_ITEMS){   

            this.coreItemOrderWinRates.set(item,makeArrayOf(0,ITEM_COUNT))
            item_order_total.set(item,makeArrayOf(0,ITEM_COUNT))
            item_order_win_count.set(item,makeArrayOf(0,ITEM_COUNT))
        }

        for(let i=0;i<COUNT;++i){
            character_total.push(0)
            character_ind.push(new Indicator(i))

            character_item_win_count.push(defaultCoreItemMap())
            character_item_total.push(defaultCoreItemMap())

            char_to_char_total.push(makeArrayOf(0,COUNT))
            char_to_char_win_count.push(makeArrayOf(0,COUNT))
            winner_character_ind.push(new Indicator(i))
            winner_character_total.push(0)
            win_rates.push(0)
        }
        for(const game of this.gameRecords){
            let champs_in_game=[]
            for(let p of game.players){
                champs_in_game.push(p.character)
            }

            for(const p of game.players){
                total+=1
                all_ind.add(p.indicator)

                character_total[p.character]+=1
                character_ind[p.character].add(p.indicator)

                for(const [i,item] of p.coreItemBuild.entries()){
                    character_item_total[p.character].set(item,character_item_total[p.character].get(item)+1)
                    let list=item_order_total.get(item)
                    list[i]+=1
                    item_order_total.set(item,list)
                    
                }
                for(const champ of champs_in_game){
                    if(p.character!==champ)
                        char_to_char_total[p.character][champ]+=1
                }

                if(p.isWinner){
                    winner_character_total[p.character]+=1
                    winner_character_ind[p.character].add(p.indicator)
                    win_rates[p.character]+=1
                    for(const [i,item] of p.coreItemBuild.entries()){
                        character_item_win_count[p.character].set(item,character_item_win_count[p.character].get(item)+1)
                        let list=item_order_win_count.get(item)
                        list[i]+=1
                        item_order_win_count.set(item,list)
                    }

                    for(const champ of champs_in_game){
                        if(p.character!==champ)
                            char_to_char_win_count[p.character][champ]+=1
                    }
                }

            }
        }


        for(let i=0;i<COUNT;++i){
            if(character_total[i]>0){
                win_rates[i]=win_rates[i]/character_total[i]
                character_ind[i]=character_ind[i].divide(character_total[i])
            }

            if(winner_character_total[i]>0)
                winner_character_ind[i]=winner_character_ind[i].divide(winner_character_total[i])
            
            this.characterItemWinRates.push(defaultCoreItemMap())

            for(const item of this.characterItemWinRates[i].keys()){
                if(character_item_total[i].get(item) === 0) 
                    this.characterItemWinRates[i].set(item,-1)
                else
                    this.characterItemWinRates[i].set(item,character_item_win_count[i].get(item)/ character_item_total[i].get(item))
            }

            this.characterToCharacterWinRates.push([])

            for(let j=0;j<COUNT;++j){

                if(char_to_char_total[i][j]===0) 
                    this.characterToCharacterWinRates[i].push(-1)
                else
                    this.characterToCharacterWinRates[i].push(char_to_char_win_count[i][j]/char_to_char_total[i][j])
            }
        }

        for(const item of CORE_ITEMS){   
            
            let list=[]
            for(let i=0;i<ITEM_COUNT;++i){
                if(item_order_total.get(item)[i]===0) list.push(-1)
                else
                    list.push(item_order_win_count.get(item)[i]/item_order_total.get(item)[i])
            }
            this.coreItemOrderWinRates.set(item,list)
        }

        this.characterAverageInd=character_ind
        this.averageInd = all_ind.divide(total)
        this.winnerCharacterAverageInd=winner_character_ind
        this.characterWinRates=win_rates

    }
    saveTrainData(){
        let str=""
        str+=(`게임 횟수:${this.gameRecords.length}, 아이템 랜덤:${TRAIN_SETTINGS.random_item}\n`)
        this.calcAverageIndicatorForCharacters()
        str+=("전체 평균=======================================\n")
        str+=(this.averageInd.toString())
        let data=[]
        for(let i=0;i<COUNT;++i){
            if(TRAIN_SETTINGS.focus_character >=0 && TRAIN_SETTINGS.focus_character !== i) continue
            
            data.push([])
            str+=("캐릭터 평균=======================================\n")

            str+=(this.characterAverageInd[i].toString())
           str+=("승리 시 평균=======================================\n")
           str+=(this.winnerCharacterAverageInd[i].toString())
           str+=("승리/전체 차이율=======================================\n")
            let diff=this.characterAverageInd[i].getDiffRatio(this.winnerCharacterAverageInd[i])
           str+=(diff.toString())
            data[i].push(this.characterAverageInd[i],this.winnerCharacterAverageInd[i],diff)
            data[i].push(this.characterWinRates[i])

            str+=("전체승률:"+SETTINGS.characters[i].name+": "+ratioToPercent(this.characterWinRates[i])+"%")
            str+=("아이템 승률=======================================\n")
            for(let [item,rate] of this.characterItemWinRates[i].entries()){
                if(rate > -1){
                    str+=(ItemList[item].kor_name + ": " + ratioToPercent(rate) +"%" + `(${differencePercent(this.characterWinRates[i],rate)}%)\n`)
                }
            }
            str+=("상대별 승률=======================================\n")
            for(let j=0;j<COUNT;++j){
                if(this.characterToCharacterWinRates[i][j] > -1){
                    str+=(SETTINGS.characters[j].name + ": " + ratioToPercent(this.characterToCharacterWinRates[i][j])+"%"
                    + `(${differencePercent(this.characterWinRates[i],this.characterToCharacterWinRates[i][j])}%)\n`)
                }
            }
        }
        str+=("승률=======================================\n")
        for(let i in this.characterWinRates){
            str+=(SETTINGS.characters[i].name+": "+ ratioToPercent(this.characterWinRates[i])+"%\n")
        }
      //  str+=("아이템 빌드순서 승률=======================================")
        for(const item of this.coreItemOrderWinRates.keys()){
          //  str+=(ItemList[item].kor_name)
            for(let i=0;i<ITEM_COUNT;++i){
                if(this.coreItemOrderWinRates.get(item)[i]===-1) continue
               // str+=(`${i+1} 코어: ${ratioToPercent(this.coreItemOrderWinRates.get(item)[i])}%`)
            }
        }

        if(TRAIN_SETTINGS.save_indicator_text){
            writeFile(str,"stats/train_avg","txt","The trainavg txt have been saved!")
        }

        if(TRAIN_SETTINGS.save_indicator_json){
            writeFile(JSON.stringify(data),"stats/trainavg","json","The trainavg have been saved!")
        }
    }
    printRewardData(){
        let focusCharacter=TRAIN_SETTINGS.focus_character
        let total=0
        let count=0
        for(let game of this.gameRecords){
            for(let p of game.players){
                if(p.character===focusCharacter)
                {
                    count+=1
                    total+=p.indicator.getReward()
                //    console.log(p.getReward())
                }
            }
        }
        console.log(total/count)
    }

    onFinish(){
        this.printRewardData()
        this.saveTrainData()
    }
}

export {GameRecord,TrainData,Indicator}