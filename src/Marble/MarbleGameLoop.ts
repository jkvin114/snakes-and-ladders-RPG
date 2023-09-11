import { ACTION_TYPE, Action } from "./action/Action";
import { DelayedAction } from "./action/DelayedAction";
import {MarbleGame } from "./Game"
import {  GAME_CYCLE_NAME } from "./gamecycleEnum"
import { GameOverAction, InstantAction } from "./action/InstantAction";
import { MarbleGameEventObserver } from "./MarbleGameEventObserver";
import { QueryAction } from "./action/QueryAction";
import { ServerRequestModel } from "./Model/ServerRequestModel";
import { GameInitializer } from "./GameState";
import { ServerEventModel } from "./Model/ServerEventModel";
import QueryEventResult from "./QueryEventResult";
import MarbleGameCycleState from "./GameState/MarbleGameCycleState";
import WaitingState from "./GameState/WaitingState"
import { ProtoPlayer } from "./util";
import { BaseProtoPlayer } from "../Room/BaseProtoPlayer";
import { GameResultStat } from "./Model/GameResultStat";
import { SimulationSetting } from "./Simulation/SimulationSetting";
const sleep = (m: any) => new Promise((r) => setTimeout(r, m))

class MarbleGameLoop{
    rname:string
    isTeam:boolean
    game:MarbleGame
    gameOverCallBack:Function
    
    state:MarbleGameCycleState<Action>
    idleTimeout: NodeJS.Timeout
    clientInterface:MarbleGameEventObserver
	idleTimeoutTurn: number
    loopRunning:boolean
    gameover:boolean
    resetTimeout:NodeJS.Timeout|null
    onReset:Function

    isSimulation:boolean
    simulationOverCallBack:(stat:GameResultStat)=>void

    constructor(rname:string,game:MarbleGame,isTeam:boolean,isSimulation:boolean){
        this.rname=rname
        this.game=game
        this.isTeam=isTeam
        this.clientInterface=new MarbleGameEventObserver(rname)
        this.game.setTurns()
        
        this.loopRunning=false
        this.gameover=false
        this.isSimulation=isSimulation
        this.restartResetTimeout()
    }
    registerItems(itemSetting:ServerEventModel.ItemSetting){
        this.game.setItems(itemSetting)
    }

	restartResetTimeout(){
        if(this.isSimulation) return
		if(this.resetTimeout!=null)
			clearTimeout(this.resetTimeout)
		this.resetTimeout=setTimeout(()=>{
			this.reset()
		},120*1000)
	}
    reset(){
        if(this.onReset) this.onReset()
    }
    static createLoop(
		rname: string,
		isTeam: boolean,
        map:number,
        playerlist:BaseProtoPlayer[]
	): MarbleGameLoop {
		return new MarbleGameLoop(rname,new MarbleGame(playerlist,this.name,isTeam,map),isTeam,false)
	}
    static createSimulationLoop(
		rname: string,
        setting:SimulationSetting
	): MarbleGameLoop {
        let game=new MarbleGame(setting.players,this.name,false,setting.map)
        if(setting.saveLabelCSV) game.setSaveVector()
		return new MarbleGameLoop(rname,game,false,true)
	}
    setClientInterface(ci:MarbleGameEventObserver){
        if(this.isSimulation) return
        this.clientInterface=ci
        this.game.setClientInterface(ci)
    }
    setOnGameOver(gameOverCallBack: Function) {
		this.gameOverCallBack = gameOverCallBack
		return this
	}
    setOnReset(onReset:Function){
        this.onReset=onReset
    }
    startTurn(){
        this.state=new GameInitializer(this.game).getNext(null)
        this.state.onCreate()
        this.loop()
    }
    setOnSimulationOver(gameOverCallBack:(stat:GameResultStat)=>void){
        this.simulationOverCallBack = gameOverCallBack
		return this
    }

    onGameOver(windata:GameOverAction){
        this.gameover=true

        if(this.isSimulation){
            if(this.simulationOverCallBack)
                this.simulationOverCallBack(this.game.getResultStat(windata))
        }
        else{

            if(this.resetTimeout)
                clearTimeout(this.resetTimeout)
            if(this.gameOverCallBack)
                this.gameOverCallBack(windata.turn)
        }
    }
    onDestroy(){
        this.gameover=true
        if(this.resetTimeout)
            clearTimeout(this.resetTimeout)
    }
    stopTimeout(){
        if (this.idleTimeout != null && this.state != null && this.idleTimeoutTurn === this.state.turn) {
			clearTimeout(this.idleTimeout)
		}
    }
    startTimeOut(onTimeOut: Function): number {
		if (!this.idleTimeout) {

            this.idleTimeout = setTimeout(() => {
				if (!this.game) return
				if (onTimeOut != null) onTimeOut()
			}, 10000)
		}
		return this.game.thisturn
	}

    clearPriorityActions(){
        for(const action of this.game.getPriorityActions())
        {
            // let action=this.game.nextAction()
            if(!action) break

            if(action.type===ACTION_TYPE.GAMEOVER){
                this.loopRunning=false
                this.onGameOver(action as GameOverAction)
                return
            }

            // 액션 무시
            if(!action.valid || action.type===ACTION_TYPE.EMPTY) {
                // console.log("action ignored")
                continue
            }

            //방어된 액션 처리
            if(action.blocked){
                this.game.handleBlockedAction(action)
                continue
            }

            this.game.executeAction(action)
            

        }
    }
    async loop(){
        if(this.loopRunning || this.gameover) 
        {
            console.error("multiple loop instances!")
            return
        }

        this.loopRunning=true
        while(!this.gameover){
            this.clearPriorityActions()
            
            let action=this.game.nextAction()
            if(!action || this.gameover) {
                this.loopRunning=false
                break
            }

            
            
            // 액션 무시
            if(!action.valid || action.type===ACTION_TYPE.EMPTY) {
             //   console.log("action ignored")
                continue
            }

            //방어된 액션 처리
            if(action.blocked){
                this.game.handleBlockedAction(action)
                continue
            }

            //상태 변화 없이 즉시 실행되는 액션
            if(action instanceof InstantAction){
                this.game.executeAction(action)
                continue
            }
            if(!this.isSimulation)
                await sleep(500)
            let nextstate=this.state.getNext(action)
      //      console.log('set state: '+GAME_CYCLE_NAME[nextstate.id])

            if(nextstate.id===MarbleGameCycleState.ERROR_STATE) {
                this.loopRunning=false
                break
            }
            
            this.state.onDestroy()
            nextstate.onCreate()
            this.state=nextstate
            if(action instanceof DelayedAction){
                this.clearPriorityActions()
                if(!this.isSimulation)
                    await sleep(action.delay)
                this.state.afterDelay()
            }
            else if(action instanceof QueryAction && this.state instanceof WaitingState){
                // this.startTimeOut(()=>{})

                
                if(this.state.isAI){
                    let success= await this.state.runAISelection()
                    if(!success) {
                        console.error("Error while AI selection, state id:"+GAME_CYCLE_NAME[this.state.id])
                        break
                    }
                    if(!this.isSimulation)
                        await sleep(300)
                    this.clearPriorityActions()
                }
                else{
                    this.state.sendQueryRequest()
                    this.clearPriorityActions()
                    this.loopRunning=false
                    break
                }
            }
        }
    }

    onClientEvent(event:string,invoker:number,...args:any[]){
        this.restartResetTimeout()

        if(this.gameover) return
        let result=new QueryEventResult(false)
        // if(invoker !== this.state.getInvoker()) return
        args=args[0]
   //     console.log(args)
        if(args.length===0) return
        
        switch(event){
            case 'press_dice':
                result=this.state.onUserPressDice(args[0],args[1])
                break
            case 'select_build':
                result=this.state.onUserSelectBuild(args[0])
                break
            case 'select_buyout':
                result=this.state.onUserBuyOut(args[0])
                break
            case 'select_loan':
                result=this.state.onUserConfirmLoan(args[0])
                break
            case 'select_tile':
                result=this.state.onUserSelectTile(args[0],args[1],args[2])
                break
            case 'obtain_card':
                result=this.state.onUserConfirmObtainCard(args[0])
                break
            case 'confirm_card_use':
                result=this.state.onUserConfirmUseCard(args[0],args[1])
                break
            case 'select_godhand_special':
                result=this.state.onUserSelectGodHandSpecial(args[0])
                break
            case 'select_island':
                result=this.state.onUserSelectIsland(args[0])
                break
        }
     //   console.log(result)
//
        if(result.result) this.loop()
        
    }
}


export {MarbleGameLoop}