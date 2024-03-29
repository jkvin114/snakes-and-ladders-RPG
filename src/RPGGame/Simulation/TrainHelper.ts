import SETTINGS = require("../../../res/globalsettings.json")
import TRAINAVG = require("../../../res/trainavg.json")
import TRAIN_SETTINGS = require("../../../res/train_setting.json")
import fs = require("fs")

import { getCurrentTime, makeArrayOf, roundToNearest, writeFile, writeToFile } from "..//core/Util"

import { items as ItemList } from "../../../res/item_new.json"
import { Indicator } from "./data/Indicator"
import { GameRecord } from "./data/GameRecord"
import type { SimulationSetting } from "./Setting"


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
    labels:string[][]
    winners:number[]
    writer1:fs.WriteStream
    writer2:fs.WriteStream
    constructor(){
        this.focusedCharacter=-1
        this.gameRecords=[]
        this.characterItemWinRates=[]
        this.randomItem=true
        this.characterToCharacterWinRates=[]
        this.coreItemOrderWinRates=new Map<number,number[]>()
        this.labels=[]
        this.winners=[]
        
    }
    createFileStream(){
        this.writer1=fs.createWriteStream("stats/csv/train_input_labels"+getCurrentTime()+".csv")
        this.writer2=fs.createWriteStream("stats/csv/train_output_labels"+getCurrentTime()+".csv")
    }
    addGame(gi:GameRecord){
        this.gameRecords.push(gi)
    }
    addTrainLabel(labels:string[],winner:number){
        this.labels.push(labels)
        this.winners.push(winner)
    }
    calcAverageIndicator(){
        let total=0
        let ind=new Indicator(-1)
        for(let game of this.gameRecords){
            for(let p of game.players){
                total+=1
                Indicator.add(ind,p.indicator)
            }
        }
        this.averageInd = Indicator.divide(ind,total)
    }

    calcAverageIndicatorForCharacters(){
      //  console.log("calcAverageIndicatorForCharacters"+this.gameRecords.length)
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
                Indicator.add(all_ind,p.indicator)

                character_total[p.character]+=1
                Indicator.add(character_ind[p.character],p.indicator)

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
                    Indicator.add(winner_character_ind[p.character],p.indicator)
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
                character_ind[i]=Indicator.divide(character_ind[i],character_total[i])
            }

            if(winner_character_total[i]>0)
                winner_character_ind[i]=Indicator.divide(winner_character_ind[i],winner_character_total[i])
            
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
        this.averageInd = Indicator.divide(all_ind,total)
        this.winnerCharacterAverageInd=winner_character_ind
        this.characterWinRates=win_rates

    }
    saveTrainData(maps:number[]){
        
        let str="맵:"+["기본","바다","카지노","신속난투전","실험"][maps[0]]+"\n"
        str+=(`게임 횟수:${this.gameRecords.length}, 아이템 랜덤:${TRAIN_SETTINGS.random_item}\n`)
        this.calcAverageIndicatorForCharacters()
       // console.log("saveTrainData")
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
                    str+=(ItemList[item].name + ": " + ratioToPercent(rate) +"%" + `(${differencePercent(this.characterWinRates[i],rate)}%)\n`)
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
        return
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
    saveTrainLabel(){
        let inputstr=""
        let outputstr=""
        for(let i=0;i<this.labels.length;i++){
            for(const label of this.labels[i]){
                outputstr+=this.winners[i]+","
                inputstr+=label+"\n"
            }
        }
        this.labels=[]
        this.winners=[]
        // outputstr=outputstr.slice(0,outputstr.length-1)
        // inputstr=inputstr.slice(0,inputstr.length-2)
        try{
            this.writer1.write(inputstr)
            this.writer2.write(outputstr)
            // writeToFile(inputstr,"stats/train_input_labels"+filename+".csv")
            // writeToFile(outputstr,"stats/train_output_labels"+filename+".csv")
        }
        catch(e){
            console.error("error during saving train labels")
            console.error(e)
        }
    }
    
    onFinish(maps:number[],setting:SimulationSetting){
        this.printRewardData()
        this.saveTrainData(maps)
        if(setting.saveLabelCSV)
            this.saveTrainLabel()
        if(this.writer1 && this.writer2){
            
            this.writer1.close()
            this.writer2.close()
        }

        if(!setting.saveEvaluation) return []
        
        return this.gameRecords
    }
}

export {TrainData}