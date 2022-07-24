import { MarbleScene,moneyToString,MONOPOLY,Player } from "./marble_board.js"
import { openConnection } from "./socket.js"
import { GameInterface } from "./interface.js"
const sleep = (m) => new Promise((r) => setTimeout(r, m))

export var GAME
class Game{
    constructor(){
        this.scene=new MarbleScene(this)
        this.playerCount=4
        this.players=[]
        this.addPlayers()
        this.diceGageInterval=null
        this.diceGage=2
        this.diceGageForwardDirection=true
        this.pressingDice=false
        this.connection
        this.begun=false
        this.myNum=0
        this.myTurn=0
        this.ui=new GameInterface(this)
        this.isTeam=false
    }
    turnToPlayerNum(turn){
        for(let i=0;i<this.playerCount;++i){
            if(this.players[i].turn === turn) return i
        }
        return 0
    }
    init(setting,num,turn)
    {

        console.log(num,turn)
        console.log("game init")
        this.myNum=num
        this.myTurn=turn
        this.isTeam=setting.isTeam
        this.playerCount=setting.players.length

        for(let i=0;i<this.playerCount;++i){
            let p=setting.players[i]
            this.players.push(new Player(p.turn,p.turn,p.char,p.name,p.team))
        }
        this.scene.players=this.players
        this.ui.init(setting)
        console.log(setting)
        requestMap()
    }
    onReady(){
        console.log("game ready")
        this.connection.gameReady()
        this.scene.startRenderInterval()
    }
    turnStart(player){
        this.ui.onTurnStart(player)
        this.scene.focusPlayer(this.turnToPlayerNum(player))
    }
    showDiceBtn(player,data){
        this.scene.showArrow(this.turnToPlayerNum(player))
        this.ui.showDiceBtn(data.hasOddEven,data.origin)

    }
    diceRoll(data){
        toast(data.dice + ((data.isDouble)?"(더블)":""))
    }
    playerWalkMove(player,from,distance){
        let list=[]
        if(distance >0){
            for(let i=1;i<=distance;++i){
                list.push((from+i)%32)
            }
        }
        else{
            for(let i=1;i<=distance;++i){
                list.push(((from+320)-i)%32)
            }
        }
        this.scene.movePlayerThrough(list, this.turnToPlayerNum(player),(turn)=>this.moveComplete(turn))
    }
    playerTeleport(player,pos){
        this.scene.teleportPlayer(this.turnToPlayerNum(player),pos,"levitate")
    }
    payMoney(payer,receiver,amount){
        toast("paymoney "+amount)
    }
    chooseBuild(pos,builds,buildsHave,discount,avaliableMoney){
        let landname=this.scene.getNameAt(pos)
        if(builds.length===0) this.buildChooseComplete([])

        this.ui.showBuildSelection(landname,builds,buildsHave,discount,avaliableMoney,()=>{
            this.buildChooseComplete([])
        })
    }
    askLoan(amount){
        this.ui.showLoanSelection(amount)
    }
    buildChooseComplete(builds){
        // console.log(builds)
        this.connection.chooseBuild(builds)
    }
    async build(pos,builds,player){
        for(const b of builds){
            if((b===1 && builds.length===1)||b===6){
                this.scene.addLandFlag(pos,player)
            }
            else if(b===5){
                this.scene.addLandMark(pos,player)
            }
            else{
                this.scene.addHouse(pos,player,b-1)
            }
            this.scene.render()
            await sleep(500)
        }

    }
    chooseBuyout(player,pos,price,originalPrice)
    {
        let landname=this.scene.getNameAt(pos)
        this.ui.showBuyoutSelection(landname,price,originalPrice,()=>{
            this.buyoutComplete(false)
        })
    }
    buyoutComplete(result){
        this.connection.chooseBuyout(result)
    }
    updateMultipliers(changes){
        for(const c of changes){
            this.updateToll(c.pos,c.toll,c.mul)
        }
    }
    updateToll(pos,toll,mul){
        this.scene.setToll(pos,toll,mul)
    }
    setLandOwner(pos,player){
        this.scene.setLandOwner(pos,this.turnToPlayerNum(player))
    }
    setOlympic(pos){
        this.scene.setOlympic(pos)
    }
    onDiceHoldStart(){
        if(this.pressingDice) return

        this.pressingDice=true
        $("#gage").css("width","0")
        this.diceGage=1
        this.diceGageForwardDirection=true

        this.onDiceGageInterval()
        this.diceGageInterval=setInterval(()=>{
            this.onDiceGageInterval()
        },60)
        
        $("#gage").animate({
            width:'100%'
        },600,'linear')
    }
    onDiceHoldEnd(){
        if(!this.pressingDice) return

        clearInterval(this.diceGageInterval)

        this.connection.clickDice(this.diceGage,this.ui.oddeven)

        $("#dice_container").hide()
        $("#gage").stop()
        $("#gage").css("width","0")
        this.pressingDice=false
    }
    onDiceGageInterval(){
        if(this.diceGageForwardDirection){
            this.diceGage+=1
            if(this.diceGage === 12){
                this.diceGageForwardDirection=false
               $("#gage").animate({
                    width:'0%'
                },600,'linear')
            }
        }
        else{
            this.diceGage-=1
            if(this.diceGage === 2){
                this.diceGageForwardDirection=true
                $("#gage").animate({
                    width:'100%'
                },600,'linear')
            }
        }
      //  console.log(this.diceGage)
    }

    askTileSelection(tiles,source){
        this.ui.showSelectionTitle(source)
        this.scene.showRangeTilesByList(tiles,source, 1)
    }

    onTileSelect(pos,type){
        this.ui.hideSelectionTitle()
        this.connection.onTileSelect(pos,type,true)
    }
    onTileSelectCancel(type){
        this.ui.hideSelectionTitle()
        this.connection.onTileSelect(-1,type,false)
        this.scene.tileReset()
    }
    obtainCard(name,level,type){
        this.ui.obtainCard(name,level,type)
    }
    finishObtainCard(result){
        this.connection.finishObtainCard(result)
    }
    addPlayers(){
        
    }
    moveComplete(turn){
    }
    alertMonopoly(player,type,pos){
        this.ui.largeText(MONOPOLY[type]+" 경고!",false)
        this.scene.showTileHighlight(pos,'red')
        setTimeout(()=>{
            this.scene.clearTileHighlight('red')
        },14000)
    }
    bankrupt(turn){
        this.scene.removePlayer(this.turnToPlayerNum(turn))
        this.ui.onBankrupt(turn)
    }
    gameoverBankrupt(winner){   
        this.ui.largeText((winner+1)+"P 파산 승리",false)
    }
    gameoverMonopoly(winner,monopoly){
        this.ui.largeText((winner+1)+"P "+MONOPOLY[monopoly]+"으로 승리",false)
	}
    onQuit(){
        this.ui.showDialog(
				"정말 게임을 떠나시겠습니까?(나가면 게임이 초기화됩니다)"
			,
			() => {
				document.onbeforeunload = () => {}
				window.location.href = "/index.html"
			}
		)
    }
}
function toast(msg) {
    $("#toastmessage").html(msg)
    $("#toastmessage").fadeIn(500)
    setTimeout(() => $("#toastmessage").fadeOut(500), 2000)
}

function auth() {
	$.ajax({
		method: "POST",
		url: "/room/game",
		data: {}
	})
		.done(function (data, statusText, xhr) {
			let status = xhr.status
			console.log(status)
		})
		.fail(function (data, statusText, xhr) {
			if (data.status === 401) {
				console.error("unauthorized")
				alert("unauthorized access")
				window.location.href = "index.html"
			}
		})
}


$(document).ready(function(){
    //auth()
    window.onbeforeunload = function (e) {
		sessionStorage.roomName = null
		// GAME.connection.resetGame()
		$.ajax({
			method: "POST",
			url: "/reset_game"
		})
		return true
	}
})
$(window).on("load", function (e) {
	console.log("window onload")
	$("#loadingtext").html("CONNECTING WITH SERVER..")
    GAME=new Game()
    openConnection(true)

    $("#testbtn").click(()=>{
        GAME.scene.test()
    })

    $("#dicebtn").on('mousedown touchstart',function(e){    
        GAME.scene.clearTileHighlight('yellow')
        GAME.onDiceHoldStart()
        return false
    })
    $("#dicebtn").on('mouseup mouseleave touchend',function(e){

        GAME.onDiceHoldEnd()
        return false
    })
})

function requestMap(){
    console.log("requestMap")
    var list = [];
    var urls = ['/resource/marble_map', '/resource/marble_map_coordinates'];

    urls.forEach(function(url, i) { // (1)
        list.push( // (2)
            fetch(url).then(async function(res){
                //map
                console.log(res)
                let data=await res.json()
                if(!data.length){
                    GAME.scene.setMap(data)
                }//coordinates
                else{
                    GAME.scene.setMapCoordinates(data)
                }
            })
        );
    });

    Promise
    .all(list) // (4)
    .then(function() {
        GAME.scene.setToMarble()
        GAME.scene.drawBoard()
        GAME.onReady()
        GAME.scene.onReady()
      //  alert('all requests finished!'); // (5)
    });
}

