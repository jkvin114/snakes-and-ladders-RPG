import { ACTION_TYPE, Action } from "./action/Action";
import { DelayedAction } from "./action/DelayedAction";
import {MarbleGame } from "./Game"
import {  GAME_CYCLE_NAME } from "./gamecycleEnum"
import { GameOverAction, InstantAction } from "./action/InstantAction";
import { MarbleGameEventObserver } from "./MarbleGameEventObserver";
import { QueryAction } from "./action/QueryAction";
import { ServerRequestModel } from "../Model/ServerRequestModel";
import { GameInitializer } from "./GameState";
import { ServerEventModel } from "../Model/ServerEventModel";
import QueryEventResult from "./QueryEventResult";
import MarbleGameCycleState from "./GameState/MarbleGameCycleState";
import WaitingState from "./GameState/WaitingState"
import { GameResultStat } from "../Model/GameResultStat";
import { SimulationSetting } from "./Simulation/SimulationSetting";
import { GameType } from "./enum";
import { ProtoPlayer } from "../Model/models";
import { Logger } from "../logger";
const sleep = (m: any) => new Promise((r) => setTimeout(r, m))

class MarbleGameLoop{
    rname:string
    isTeam:boolean
    game:MarbleGame
    gameOverCallBack:Function|undefined
    
    state:MarbleGameCycleState<Action>
    idleTimeout: NodeJS.Timeout|undefined
    eventEmitter:MarbleGameEventObserver
	idleTimeoutTurn: number
    loopRunning:boolean
    gameover:boolean
    resetTimeout:NodeJS.Timeout|undefined
    onReset:Function | undefined

    readonly gametype:GameType
    simulationOverCallBack:((stat: GameResultStat) => void) | undefined

    constructor(rname:string,game:MarbleGame,isTeam:boolean,gametype:GameType){
        this.rname=rname
        this.game=game
        this.isTeam=isTeam
        this.eventEmitter=new MarbleGameEventObserver(rname)
        this.game.setTurns()
        
        this.loopRunning=false
        this.gameover=false
        this.gametype=gametype
        this.restartResetTimeout()
        this.idleTimeoutTurn=0
        this.state=new GameInitializer(this.game)
    }
    registerItems(itemSetting:ServerEventModel.ItemSetting){
        this.game.setItems(itemSetting)
    }
    get isSimulation(){
        return this.gametype===GameType.INSTANT_SIMULATION
    }

	restartResetTimeout(){
        if(this.gametype===GameType.INSTANT_SIMULATION) return
		if(this.resetTimeout!=null)
			clearTimeout(this.resetTimeout)
		this.resetTimeout=setTimeout(()=>{
			this.reset()
		},1200*1000)
	}
    reset(){
        if(this.onReset) this.onReset()
    }
    static createLoop(
		rname: string,
		isTeam: boolean,
        map:number,
        playerlist:ProtoPlayer[],
        gametype:GameType
	): MarbleGameLoop {
		return new MarbleGameLoop(rname,new MarbleGame(playerlist,this.name,isTeam,map,gametype),isTeam,gametype)
	}
    static createSimulationLoop(
		rname: string,
        setting:SimulationSetting
	): MarbleGameLoop {
        let game=new MarbleGame(setting.players,this.name,false,setting.map,GameType.INSTANT_SIMULATION)
        if(setting.saveLabelCSV) game.setSaveVector()
		return new MarbleGameLoop(rname,game,false,GameType.INSTANT_SIMULATION)
	}
    setGameEventObserver(ci:MarbleGameEventObserver){
        if(this.gametype===GameType.INSTANT_SIMULATION) return
        this.eventEmitter=ci
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
    setOnSimulationOver(simulationOverCallBack:(stat:GameResultStat)=>void){
        this.simulationOverCallBack = simulationOverCallBack
		return this
    }

    onGameOver(windata:GameOverAction){
        this.gameover=true

        if(this.gametype===GameType.INSTANT_SIMULATION){
            if(this.simulationOverCallBack)
                this.simulationOverCallBack(this.game.getSimulationResultStat(windata))
        }
        else{
            const stat=this.game.getResultStat(windata)
            

            if(this.resetTimeout)
                clearTimeout(this.resetTimeout)
            if(this.gameOverCallBack)
                this.gameOverCallBack(windata.turn,stat)
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
            Logger.error("multiple loop instances!",this.rname)
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
                        Logger.err("Error while AI selection, state id:"+GAME_CYCLE_NAME[this.state.id],this.rname)
                        break
                    }
                    this.clearPriorityActions()
                    if(!this.isSimulation)
                        await sleep(300)
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

    onClientEvent(event:string,invoker:number,args:any[]){
        this.restartResetTimeout()
        // console.log(event)
        // console.log(args)
        if(this.gameover||this.loopRunning) return
        let result=new QueryEventResult(false)
        // if(invoker !== this.state.getInvoker()) return
        // args=args[0]
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