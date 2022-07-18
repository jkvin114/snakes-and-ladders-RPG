import { GAME } from "./marble.js"
import { moneyToString } from "./marble_board.js"
class BuildingSelector{
    constructor(builds,buildsHave,discount,avaliableMoney){
        this.builds=builds
        this.discount=discount
        this.avaliableMoney=avaliableMoney
        this.buildsHave=buildsHave
        this.doms={
            buildingSelections:$(".building-selection").toArray(),
            buildingSelectionChecks:$(".building-selection-check").toArray(),
            buildingSelectionDescriptions:$(".building-selection-desc").toArray(),
            buildingSelectionPrices:$(".building-selection-price").toArray(),
        }
        this.state=[false,false,false,false,false]
        Object.freeze(this.doms)
        this.setState()
        this.setButtons()
    }
    /**
     * 창 처음 켜질때만 호출
     */
    setState()
    {
        for(const b of this.builds){
            this.state[b.type]=true
        }

        //보유중인 건물 체크
        for(let i=0;i<4;++i){
            if(this.buildsHave.includes(i+1)){
                $(this.doms.buildingSelections[i]).addClass("have")
                $(this.doms.buildingSelections[i]).off()
                $(this.doms.buildingSelectionChecks[i]).hide()
                //깃발
                if(i === 0) $(this.doms.buildingSelectionDescriptions[i]).hide()
            }
            else{
                $(this.doms.buildingSelections[i]).removeClass("have")
                //깃발
                if(i === 0) $(this.doms.buildingSelectionDescriptions[i]).show()
            }
        }
    }

    /**
     * 건물 체크 변경시마다 호출
     */
    setButtons(){
        let totalprice=0
        let totaltoll=0

        for(let i=0;i<this.builds.length;++i){
            let buildType=this.builds[i].type - 1

            $(this.doms.buildingSelectionPrices[buildType]).html(moneyToString(this.builds[i].buildPrice))


            if(this.state[buildType+1]){//체크됨
                $(this.doms.buildingSelectionChecks[buildType]).show()
                totalprice+=this.builds[i].buildPrice
                totaltoll+=this.builds[i].toll
            }
            else{//체크 안됨
                $(this.doms.buildingSelectionChecks[buildType]).hide()
            }
        }
        $(".window-content-text1").html("건설 비용: "+moneyToString(totalprice))
        $(".window-content-text2").html("건설비용할인: "+moneyToString(totalprice * (1-this.discount)))

        let price=totalprice * this.discount
        if(this.avaliableMoney < price){
            $("#landwindow .window-confirm-btn").addClass("disabled")
            $("#window-confirm-btn-price").html("잔액 부족")
        }
        else{
            $("#landwindow .window-confirm-btn").removeClass("disabled")
            $("#window-confirm-btn-price").html(moneyToString(price))
        }
        
        $(".window-content-text-nobackground").html("통행료: "+moneyToString(totaltoll))
    }
    /**
     * 건물 체크 변경시 호출
     * @param {*} building 
     */
    onClick(building){
        this.state[Number(building)] = !this.state[Number(building)]
        this.setButtons()
    }
    /**
     * 
     * @returns 서버 전송용 결과 리스트
     */
    result(){
        let list=[]
        for(let i=1;i<5;++i){
            if(this.state[i]) list.push(i)
        }
        return list
    }

}


export class GameInterface
{
    constructor(game){
        this.game=game
        this.doms={
            buildingSelections:$(".building-selection").toArray(),
            buildingSelectionChecks:$(".building-selection-check").toArray(),
            buildingSelectionDescriptions:$(".building-selection-desc").toArray(),
            buildingSelectionPrices:$(".building-selection-price").toArray(),
            moneyTable:$(".money-table").toArray()
        }
        Object.freeze(this.doms)
        this.onCreate()
        this.oddeven=0
        this.diceThrowerPos=0
    }
    onCreate(){
        $("#dialog").hide()

        $(".loan-window-confirm").click(()=>{
            this.onSelectLoan(true)

        })
        $(".loan-window-bankrupt").click(()=>{
            this.onSelectLoan(false)
        })
        $("#odd").click(()=>{
            this.clickOdd()
        })
        $("#even").click(()=>{
            this.clickEven()
        })
        $("#toggle_fullscreen").click(async function(){
			console.log($(this).data("on"))
            
			if(!$(this).data("on")){
			  
			    await document.documentElement.requestFullscreen()
			    $(this).data("on",true)
			}
			else {
                await document.exitFullscreen()
			    $(this).data("on",false)
			}
            GAME.scene.setBoardScale()
		  })

          $("#quit").click(()=>GAME.onQuit())
    }
    init(setting){
        for(let i=0;i<setting.players.length;++i){
            let p=setting.players[i]
            $(this.doms.moneyTable[p.turn]).html(moneyToString(p.money))
        }
    }
    largeText(text,good){
        $("#largetext").html(text)
		$("#largetext-container").removeClass('good')
		$("#largetext-container").removeClass('bad')
		if(good){
			$("#largetext-container").addClass('good')
		}
		else{
			$("#largetext-container").addClass('bad')
		}
		$("#largetext-container").show()
		setTimeout(()=>$("#largetext-container").hide(),2500)
    }
    clickOdd(){
        $("#dicebtn").html("홀")
        this.oddeven=1
        let positions=[]
        for(let i=0;i<5;++i){
            positions.push((this.diceThrowerPos + 3 + 2*i)%32)
        }
        GAME.scene.clearTileHighlight('yellow')
        GAME.scene.showTileHighlight(positions,'yellow')
    }
    clickEven(){
        $("#dicebtn").html("짝")
        this.oddeven=2
        let positions=[]
        for(let i=0;i<6;++i){
            positions.push((this.diceThrowerPos + 2 + 2*i)%32)
        }
        GAME.scene.clearTileHighlight('yellow')
        GAME.scene.showTileHighlight(positions,'yellow')
    }
    onSelectLoan(result){
        $("#overlay").hide()
        $("#loan-window").hide()
        this.game.connection.chooseLoan(result)
    }
    updateMoney(player,money){
        $(this.doms.moneyTable[player]).html(moneyToString(money))
    }
    showDiceBtn(hasOddEven,origin){
        this.diceThrowerPos=origin
        this.oddeven=0
        $("#dice_container").show()
        $("#dicebtn").html("ROLL")
        if(hasOddEven){
            $("#odd").removeClass("disabled")
            $("#even").removeClass("disabled")
        }
        else{
            $("#odd").addClass("disabled")
            $("#even").addClass("disabled")
        }
    }
    showBuildSelection(landname,builds,buildsHave,discount,avaliableMoney,onCancel){
        $("#landwindow").show()
        $("#landwindow .window-header-content").html(landname)
        let selector=new BuildingSelector(builds,buildsHave,discount,avaliableMoney)

        $("#landwindow .window-close").off()
        $("#landwindow .window-close").click(function(){
            $("#landwindow").hide()
            onCancel()
        })

        $("#landwindow .window-confirm-btn").off()

        $("#window-confirm-btn-type").html("건설")

        //landmark
        if(builds[builds.length-1].type===5){
            $("#landwindow .selection-text").html("랜드마크 건설").show()
            $("#landwindow .building-selection-container").hide()

            $("#landwindow .window-confirm-btn").click(()=>{
                $("#landwindow").hide()
                this.game.buildChooseComplete([5])
            })

            $(".window-content-text1").html("건설 비용: "+moneyToString(builds[builds.length-1].buildPrice))
            $(".window-content-text2").html("건설비용할인: "+moneyToString(builds[builds.length-1].buildPrice * (1-discount)))
            $("#window-confirm-btn-price").html(moneyToString(builds[builds.length-1].buildPrice * discount))
            $(".window-content-text-nobackground").html("통행료: "+moneyToString(builds[builds.length-1].toll))
        }
        //관광지
        else if(builds[0].type===6){
            $("#landwindow .selection-text").html("관광지 구매").show()
            $("#landwindow .building-selection-container").hide()

            $("#landwindow .window-confirm-btn").click(()=>{
                $("#landwindow").hide()
                this.game.buildChooseComplete([6])
            })

            $(".window-content-text1").html("건설 비용: "+moneyToString(builds[0].buildPrice))
            $(".window-content-text2").html("건설비용할인: "+moneyToString(builds[0].buildPrice * (1-discount)))
            $("#window-confirm-btn-price").html(moneyToString(builds[0].buildPrice * discount))
            $(".window-content-text-nobackground").html("통행료: "+moneyToString(builds[0].toll))
        }
        else{

            $("#landwindow .selection-text").hide()
            $("#landwindow .building-selection-container").show()
            $(".building-selection").off()
            $(".building-selection").click(function(){
                let build=$(this).data('building')
                selector.onClick(build)
            })
            $(this.doms.buildingSelections[0]).off()

            $("#landwindow .window-confirm-btn").click(()=>{
                $("#landwindow").hide()
                this.game.buildChooseComplete(selector.result())
            })

        }
        
    }
    showBuyoutSelection(landname,price,originalPrice,onCancel){
        $("#landwindow").show()
        $("#landwindow .window-header-content").html(landname)
        $("#landwindow .window-close").off()
        $("#landwindow .window-close").click(function(){
            $("#landwindow").hide()
            onCancel()
        })
        $("#landwindow .selection-text").html(landname+" 인수 하시겠습니까?").show()
        $("#landwindow .building-selection-container").hide()

        $("#landwindow .window-confirm-btn").click(()=>{
            $("#landwindow").hide()
            this.game.buyoutComplete(true)
        })
        $(".window-content-text1").html("인수 비용: "+moneyToString(originalPrice))
        $(".window-content-text2").html("인수비용할인: "+moneyToString(originalPrice-price))
        $("#window-confirm-btn-price").html(moneyToString(price))
        $(".window-content-text-nobackground").html("주의: 건설비용의 2배지불")
        
    }
    showSelectionTitle(source){
        //신의손 특수지역 건섷
        if(source===9){
            $("#selectionname").html('특수 지역')
            $("#selectiondesc").html('건설할 땅을 선택하세요')
        }//시작지점 건섷
        if(source===10){
            $("#selectionname").html('시작지점 혜택')
            $("#selectiondesc").html('건설할 땅을 선택하세요')
        }//세계여행
        if(source===11){
            $("#selectionname").html('세계여행')
            $("#selectiondesc").html('이동할 땅을 선택하세요')
        }//올림픽
        if(source===13){
            $("#selectionname").html('올림픽')
            $("#selectiondesc").html('올림픽 개최할 땅을 선택하세요')
        }
        $(".selectiontitle").show()
    }
    hideSelectionTitle(){
        $(".selectiontitle").hide()
    }
    showLoanSelection(amount)
    {
        $("#overlay").show()
        $(".loan-window-amount").html(`부족한 금액: -${moneyToString(amount)}`)
        $("#loan-window").show()
    }
    onBankrupt(turn){
        $(this.doms.moneyTable[turn]).html("파산")
    }
    showDialog(content,onconfirm,oncancel){
		$("#dialog p").html(content)
		$("#dialog .dialog_cancel").off()
		$("#dialog .dialog_confirm").off()
		$("#dialog .dialog_cancel").click(()=>{
			if(oncancel!=null) oncancel()
			$("#dialog").hide()
		})
		$("#dialog .dialog_confirm").click(()=>{
			if(onconfirm!=null) onconfirm()
			$("#dialog").hide()
		})
		$("#dialog").show()
	}
}