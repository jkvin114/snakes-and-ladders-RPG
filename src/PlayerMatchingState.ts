
import { PlayerType, ProtoPlayer, shuffle } from "./core/Util"
import SETTINGS = require("../res/globalsettings.json")

export class PlayerMatchingState{
	guestnum: number
	playerlist: ProtoPlayer[]
	teams: boolean[]
	turnMapping:number[]

	constructor(){
		this.teams = []
		this.guestnum = 0
		this.turnMapping=[0,1,2,3]
		this.playerlist = this.makePlayerList()
	}
	makePlayerList(): ProtoPlayer[] {
		let p = []
		for (let i = 0; i < 4; ++i) {
			p.push(this.createEmptyPlayer())
		}
		return p
	}
	createEmptyPlayer():ProtoPlayer{
		return {
			type: PlayerType.EMPTY,
			name: "",
			team: true,
			champ: -1,
			ready: false,
			userClass:0
		}
	}
	setHostNickname(name: string, turn: number,userClass:number) {
		this.playerlist[turn].name = name
		this.playerlist[turn].userClass=userClass
	}
	setPlayerList(playerlist: ProtoPlayer[]){
		

		for(let i=0;i<playerlist.length;++i){
			playerlist[i].userClass=this.playerlist[i].userClass
			if(playerlist[i].type===PlayerType.EMPTY) 
				this.playerlist[i] = this.createEmptyPlayer()
			else this.playerlist[i]=playerlist[i]
		}

		//console.log(this.playerlist)
	}
	setReady(turn:number,ready:boolean){
		this.playerlist[turn].ready = ready
	}
	addGuestToPlayerList(username: string,userClass:number) :number{

		let turn = this.playerlist.findIndex((r) => r.type === PlayerType.PLAYER)
		this.playerlist[turn].type = PlayerType.PLAYER_CONNECED
		if (username !== "") {
			this.playerlist[turn].name = username
		}
		this.playerlist[turn].userClass = userClass
		return turn
	}
	getPlayerNamesForTeamSelection():{name:string,userClass:number}[]{

		let names = []
		for (let i = 0; i < this.playerlist.length; ++i) {
			let n = this.playerlist[i].name

			if (this.playerlist[i].type === PlayerType.AI) {
				if (this.playerlist[i].champ === -1) {
					n = "?_Bot(" + String(i + 1) + "P)"
				} else {
					n = SETTINGS.characters[Number(this.playerlist[i].champ)].name + "_Bot(" + String(i + 1) + "P)"
				}
			}
			names.push({name:n,userClass:this.playerlist[i].userClass})
		}
		return names
	}
	setChamp(turn: number, champ_id: number) {
		if (turn < 0) return
		this.playerlist[turn].champ = champ_id
	}
	setTeams(teams:boolean[]){
		this.teams = teams
		teams.forEach((t,i)=>this.playerlist[i].team=t)
	}
	getTurnMapping(originalTurn:number){
		let newturn=this.turnMapping[originalTurn]
		
		return newturn
	}
	assignGameTurns(shouldShuffle:boolean){
		let newturns = this.playerlist.map((player,i)=>{
            return {type:player.type,turn:i}
        })
        if(shouldShuffle)
            newturns=shuffle(newturns)

        newturns.sort(function (a, b) {
            if (b.type === PlayerType.EMPTY) {
                return -1
            }
            if (a.type === PlayerType.EMPTY) {
                return 1
            }
            return 0
        })
        let newPlayerList=Array.from(this.playerlist)
        newturns.forEach((val,i)=>{
            this.turnMapping[val.turn]=i
            newPlayerList[i]=this.playerlist[val.turn]
        })
        this.playerlist=newPlayerList
        return newturns
	}
}

