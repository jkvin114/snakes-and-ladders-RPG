import { Types } from "mongoose"
import type{ ISimulationEval } from "../../../mongodb/SimulationEvalDBSchema"
import { CharacterSimulationEvalSchema } from "../../../mongodb/schemaController/CharacterSimulationEval"
import { SimulationEvalSchema } from "../../../mongodb/schemaController/SimulationEval"
import type{ GameRecord } from "../data/GameRecord"
import { Indicator } from "../data/Indicator"
import type{ PlayerRecord } from "../data/PlayerRecord"
import  { CharacterEval } from "./CharacterEval"
import { GameType, MapName, EVAL_VERSION } from "./types"
import SETTINGS = require("../../../../res/globalsettings.json")

export class SimulationEval{
    gameType:GameType
    mapName:MapName
   characterEvals:(CharacterEval|null)[]
   count:number
   totalturn:number
   constructor(gameType:GameType,mapname:MapName){
       this.gameType=gameType
       this.mapName=mapname
       this.characterEvals=[]
       this.count=0
       this.totalturn=0
       this.characterEvals=new Array(SETTINGS.characters.length).fill(null)
   }
   async save(){
       let ids=[]
       for(const char of this.characterEvals){
           if(char===null) continue
           const data=await CharacterSimulationEvalSchema.create(char.serialize(this.gameType,this.mapName))
           ids.push(data._id)
       }
       await SimulationEvalSchema.create(this.serialize(ids))
   }

   serialize(chars:Types.ObjectId[]):ISimulationEval{
       let avgturn=this.count===0?0:this.totalturn/this.count

       return {
           gameType:this.gameType,
           mapName:this.mapName,
           version:EVAL_VERSION,
           serverVersion:SETTINGS.version,
           patchVersion:SETTINGS.patch_version,
           count:this.count,
           averageTotalTurn:avgturn,
           characters:chars
       } as ISimulationEval
   }
   addPlayer(p:PlayerRecord,won:boolean,game:GameRecord){
       

       if(this.characterEvals[p.character]===null){
           this.characterEvals[p.character]=new CharacterEval(p.character)
       }

       const charEval=this.characterEvals[p.character]
       charEval.count+=1
       Indicator.add(charEval.totalIndicator,p.indicator)

       if(won){
           charEval.wins+=1
           Indicator.add(charEval.winIndicator,p.indicator)
       } 

       for(const other of game.players){
           if(other===p) continue
           
           if(other.team!==p.team || !game.isTeam){//opponent
               if(charEval.opponents.has(other.character)){
                   charEval.opponents.get(other.character)[0]+=1
                   if(won) charEval.opponents.get(other.character)[1]+=1
               }
               else{
                   charEval.opponents.set(other.character,[1,won?1:0])
               }
           }
           else{ //ally
               if(charEval.duos.has(other.character)){
                   charEval.duos.get(other.character)[0]+=1
                   if(won) charEval.duos.get(other.character)[1]+=1
               }
               else{
                   charEval.duos.set(other.character,[1,won?1:0])
               }
           }
       }
       for(const item of p.coreItemBuild){
           if(charEval.items.has(item)){
               charEval.items.get(item)[0]+=1
               if(won) charEval.items.get(item)[1]+=1
           }
           else{
               charEval.items.set(item,[1,won?1:0])
           }
       }

       if(p.coreItemBuild.length >=3){
           const buildStr=p.coreItemBuild.slice(0,3).join(",")
           if(charEval.itembuilds.has(buildStr)){
               charEval.itembuilds.get(buildStr)[0]+=1
               if(won) charEval.itembuilds.get(buildStr)[1]+=1
           }
           else{
               charEval.itembuilds.set(buildStr,[1,won?1:0])
           }
       }

   }
   addGame(game:GameRecord){
       this.count+=1
       this.totalturn+=game.totalturn
       let winner=game.players.find(p=>p.isWinner)
       for(const p of game.players){
           this.addPlayer(p,p.isWinner || (game.isTeam && p.team === winner.team),game)
       }
   }


}