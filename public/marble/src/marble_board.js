import { Board } from "./../../src/board.js"
const TILE_IMG_SIZE=100
const BUILDING_IMG_SIZE=100
const PLAYER_POS_DIFF = [
	[8, 9],
	[-17, 2],
	[6, -5],
	[-12, -9]
] 
function getFlagCoord(coordinate){
    if(coordinate.rot === 'right'){
        return {x:coordinate.x - 30,y:coordinate.y -10}
    }
    if(coordinate.rot === 'left'){
        return {x:coordinate.x + 30,y:coordinate.y - 10}
    }
    if(coordinate.rot === 'up'){
        return {x:coordinate.x,y:coordinate.y - 40}
    }
    if(coordinate.rot === 'down'){
        return {x:coordinate.x,y:coordinate.y - 30}
    }
    return null
}
function getHouseCoord(coordinate,level){
    level -= 2
    if(coordinate.rot === 'right'){
        return {x:coordinate.x - 30,y:coordinate.y + (level * 30)}
    }
    if(coordinate.rot === 'left'){
        return {x:coordinate.x + 30,y:coordinate.y - (level * 30)}
    }
    if(coordinate.rot === 'up'){
        return {x:coordinate.x + (level * 30),y:coordinate.y - 40}
    }
    if(coordinate.rot === 'down'){
        return {x:coordinate.x - (level * 30),y:coordinate.y - 30}
    }
    return null
}
function getLandMarkCoord(coordinate){
    if(coordinate.rot === 'right'){
        return {x:coordinate.x - 45,y:coordinate.y+5}
    }
    if(coordinate.rot === 'left'){
        return {x:coordinate.x + 20,y:coordinate.y+5}
    }
    if(coordinate.rot === 'up'){
        return {x:coordinate.x-10,y:coordinate.y - 40}
    }
    if(coordinate.rot === 'down'){
        return {x:coordinate.x-10,y:coordinate.y - 40}
    }
    return null
}
function getLandNameCoord(coordinate){
    if(coordinate.rot === 'right'){
        return {x:coordinate.x + 25,y:coordinate.y-20}
    }
    if(coordinate.rot === 'left'){
        return {x:coordinate.x - 25,y:coordinate.y-20}
    }
    if(coordinate.rot === 'up'){
        return {x:coordinate.x-5,y:coordinate.y}
    }
    if(coordinate.rot === 'down'){
        return {x:coordinate.x,y:coordinate.y+10}
    }
    if(coordinate.rot === 'center'){
        return {x:coordinate.x-10,y:coordinate.y+30}
    }
    return null
}
function getLandTollCoord(coordinate){
    if(coordinate.rot === 'right'){
        return {x:coordinate.x + 25,y:coordinate.y+10}
    }
    if(coordinate.rot === 'left'){
        return {x:coordinate.x - 25,y:coordinate.y+10}
    }
    if(coordinate.rot === 'up'){
        return {x:coordinate.x-5,y:coordinate.y+30}
    }
    if(coordinate.rot === 'down'){
        return {x:coordinate.x,y:coordinate.y+40}
    }
    return null
}
export function moneyToString(money){
    money=Math.floor(money)
    if(money < 10000){
        return String(money)
    }
    else if(money >=10000 && money < 100000){
        let t=Math.floor(money/10000)
        return String(t)+"만 "+ ((money%10000===0)?"":String(money-t*10000))
    }
    else if(money >=10*10000 && money < 10000 * 10000){
        return String(Math.floor(money/10000))+"만"
    }
    else if(money >=10000 * 10000 && money < 10 * 10000 * 10000){
        let t=Math.floor(money/(10000 * 10000))
        return String(t)+"억 "+((money%100000000===0)?"":String(Math.floor((money - t*100000000)/10000)) + "만")
    }else{
        return String(Math.floor(money/100000000))+"억"
    }
}
export const MONOPOLY=["","트리플 독점","라인 독점","관광지 독점"]
class Tile{
    
    constructor(name,pos,type,coord){
        this.coordinate=coord
        this.type=type
        this.originalName=name
        this.multiplier=1
        this.toll=0
        this.pos=pos
        this.color=-1
        this.olympic=false
        this.festival=false
        this.owner=-1
        this.builds=[false,false,false,false,false] //land, house1,house2,house3,landmark
    }
    setColor(c){
        this.color=c
        return this
    }
    hasOnlyLand(){
        return this.builds[0] && !this.builds[1] && !this.builds[2] && !this.builds[3] && !this.builds[4]
    }
    clear(){
        this.multiplier=1
        this.toll=0
        this.owner=-1
        this.olympic=false
        this.builds=[false,false,false,false,false]
    }
}
class TileObject{
    constructor(tiledata,tileimage){
        this.data=tiledata
        this.tile=tileimage
        this.nameIndicator
        this.type='nonbuildable'
        this.decorator
        this.effectOverlay
    }
    setLandFlag(flagobj){

    }
    setHouse(houseobj,num){
    }
    setLandMark(landmarkObj){
    }
    onTileLift(){
        if(this.nameIndicator) 
            this.nameIndicator.bringToFront()
        if(this.decorator) 
            this.decorator.bringToFront()
        if(this.effectOverlay) 
            this.effectOverlay.bringToFront()
    }
    setNameIndicator(name){
        this.nameIndicator=name
    }
    setTollIndicator(toll){

    }
    setDecorator(deco){
        this.decorator=deco
    }
    changeToll(toll){

    }
    clear(){}

}
class BuildableTileObject extends TileObject{
    constructor(tiledata,tile){
        super(tiledata,tile)
        this.buildings=[null,null,null,null,null]
        this.tollIndicator
        this.type='buildable'
    }
    setLandFlag(flagobj){
        this.buildings[0]=flagobj
        if(!flagobj)
            this.data.builds[0]=false
        else
            this.data.builds[0]=true
    }
    setHouse(houseobj,level){
        this.buildings[level]=houseobj
        if(!houseobj)
            this.data.builds[level]=false
        else
            this.data.builds[level]=true
    }
    setLandMark(landmarkObj){
        this.buildings[4]=landmarkObj
        if(!landmarkObj)
            this.data.builds[4]=false
        else
            this.data.builds[4]=true
    }
    setTollIndicator(toll){
        this.tollIndicator=toll
    }
    onTileLift(){
        super.onTileLift()
        if(this.tollIndicator) 
            this.tollIndicator.bringToFront()

        for(let b of this.buildings){
            if(!b) continue
            b.bringToFront()
        }
    }
    changeToll(toll){
        if(this.tollIndicator){
            if(toll.length <= 3){
                this.tollIndicator.set({text:toll,fontSize:24})
            }
            else{
                this.tollIndicator.set({text:toll,fontSize:18})
            }
        }
    }
    clear(){
        this.tollIndicator.set({text:""})
        this.data.clear()
        
        this.buildings=[null,null,null,null,null]
    }
}

export class Player{
    constructor(turn,color,char,name,team){
        
        this.pos=0
        this.turn=turn
        this.color=color
        this.money=0
        this.name=name
        this.team=team
        this.char=char
        this.retired=false

        this.playerimg
        this.nametext
        this.retired=false
    }
    setObjects(player,name){
        this.playerimg=player
        this.nametext=name
    }
    updateNameText(text){
        if(this.nametext)
            this.nametext.set({text:text})
    }
    setOpacity(isOpaque){
        if(this.nametext)
            this.playerimg.set({opacity:(isOpaque?1:0.6)})
    }
}

export class MarbleScene extends Board{
    constructor(game){
        super(game)
        this.tileData=new Map() //number -> Tile
        this.tileObj=new Map() //number -> TileObject
        this.tileHighlights=new Map() // string => TileHghlightImage[]
        this.tileHighlights.set("red",[])
        this.tileHighlights.set("yellow",[])
        this.tileHighlights.set("white",[])
        this.olympic=-1
    }
    getCoord(i){
		return this.coordinates[i%this.mapLength()]
	}
    getNameAt(pos){
        return this.tileData.get(pos).originalName
    }
    setBoardScale(){
        
        const winwidth=window.innerWidth
		const winheight=window.innerHeight
        
        this.boardScale=winheight/this.boardInnerHeight
        this.canvas.setWidth(winheight)
		this.canvas.setHeight(winheight)
        this.canvas.setZoom(this.boardScale)
     //   this.forceRender()
    }
    drawTiles(){
        
        for(const land of this.Map.lands){
            let tile=new Tile(land.name,land.pos,"land",this.getCoord(land.pos)).setColor(land.color)
            this.tileData.set(land.pos,tile)
            let tileobj=this.getTileOf(land.color,this.getCoord(land.pos))
            let obj=new BuildableTileObject(tile,tileobj)
            this.tileObj.set(land.pos,obj)
            this.canvas.add(tileobj)

            let name=this.getTileTextObj(land.name,getLandNameCoord(this.getCoord(land.pos)),14)
            obj.setNameIndicator(name)

            let toll=this.getTileTextObj("",getLandTollCoord(this.getCoord(land.pos)),18)
            obj.setTollIndicator(toll)
        }


        for(const sight of this.Map.sights){
            let tile=new Tile(sight.name,sight.pos,"sight",this.getCoord(sight.pos))
            this.tileData.set(sight.pos,tile)

            let tileobj=this.getTileOf((sight.type==='blue'?4:5),this.getCoord(sight.pos))
            let obj=new BuildableTileObject(tile,tileobj)
            this.tileObj.set(sight.pos,obj)
            this.canvas.add(tileobj)

            let name=this.getTileTextObj(sight.name,getLandNameCoord(this.getCoord(sight.pos)),15)
            obj.setNameIndicator(name)
            let toll=this.getTileTextObj("",getLandTollCoord(this.getCoord(sight.pos)),18)
            obj.setTollIndicator(toll)
        }


        for(const sp of this.Map.specials){
            let tile=new Tile("특수 지역",sp,"special",this.getCoord(sp))
            this.tileData.set(sp,tile)

            let tileobj=this.getTileOf(12,this.getCoord(sp))
            this.tileObj.set(sp,new TileObject(tile,tileobj))
            this.canvas.add(tileobj)
        }



        for(const cn of this.Map.corners){  
            let tile
            if(cn === this.Map.start){
                tile=new Tile(this.Map.corner_names.start,cn,"corner",this.getCoord(cn))
            }
            if(cn === this.Map.island){
                tile=new Tile(this.Map.corner_names.island,cn,"corner",this.getCoord(cn))
            }
            if(cn === this.Map.olympic){
                tile=new Tile(this.Map.corner_names.olympic,cn,"corner",this.getCoord(cn))
            }
            if(cn === this.Map.travel){
                tile=new Tile(this.Map.corner_names.travel,cn,"corner",this.getCoord(cn))
            }
            if(!tile) continue
            this.tileData.set(cn,tile)
            let tileobj=this.getTileOf(11,this.getCoord(cn))
            let obj=new TileObject(tile,tileobj)
            this.tileObj.set(cn,obj)
            this.canvas.add(tileobj)

            let name=this.getTileTextObj(tile.originalName,getLandNameCoord(this.getCoord(cn)),27)
            obj.setNameIndicator(name)
        }


        for(const cd of this.Map.cards){
            let tile=new Tile("포춘 카드",cd,"card",this.getCoord(cd))
            this.tileData.set(cd,tile)
            let tileobj=this.getTileOf(13,this.getCoord(cd))
            this.tileObj.set(cd,new TileObject(tile,tileobj))
            this.canvas.add(tileobj)
        }
        
        for(let i=0;i<this.mapLength();++i){
            this.tiles.push(this.tileObj.get(i).tile)
        }
        // let tileshadows=[]
        // for(let i=0;i<32;++i){
        //     tileshadows.push(this.tileShadowLarge(i))
        // }
        // let tileshadowgroup = new fabric.Group(tileshadows, { evented: false })

		// // this.lockFabricObject(tileshadowgroup)
		// this.canvas.add(tileshadowgroup)
		// this.tile_shadows = tileshadowgroup

        
    }

    showObjects(){
        super.showObjects()

        for(let i=0;i<this.game.playerCount;++i){
            console.log('addplayer')
            let img = document.getElementById("playerimg" + (this.players[i].char + 1))
			let player = this.players[i]

			let p = new fabric.Image(img, {
				id: "player",
				left: this.getCoord(0).x + PLAYER_POS_DIFF[i][0],
				top: this.getCoord(0).y + PLAYER_POS_DIFF[i][1],
				objectCaching: false,
				evented: false,
                opacity:1
			})
			this.lockFabricObject(p)
			this.canvas.add(p.scale(0.5))

            let name = new fabric.Text("", {
				fontSize: 20,
				fill: "white",
				opacity: 1,
				evented: false,
                textBackgroundColor: "black",
                opacity:0.8,
				left: this.getCoord(0).x + PLAYER_POS_DIFF[i][0],
				top: this.getCoord(0).y + PLAYER_POS_DIFF[i][1] - 50,
				fontFamily: "nanumB"
			})
			this.lockFabricObject(name)
			this.canvas.add(name)
			name.bringToFront()

            player.setObjects(p,name)
        }
    //    console.log(this.players)
    }

    scaleTileImage(tile,rot){
        switch(rot){
            case 'center':
                tile.scale(1.5)
            break
            case 'right':
                tile.set({scaleX:1.3,flipX:true})
            break
            case 'left':
                tile.set({scaleX:1.3})
            break
            case 'up':
                tile.set({scaleY:1.3})
            break
            case 'down':
                tile.set({scaleY:1.3,flipY:true})
            break
        }
    }
    getTileOf(tile_color,coord){

		let tile= new fabric.Image(document.getElementById('marble_tileimg'), {
			originX: "center",
			originY: "center",
			width: TILE_IMG_SIZE,
			height: TILE_IMG_SIZE,
			cropX: TILE_IMG_SIZE * tile_color,
			cropY: 0,
			objectCaching: false,
            evented:false,

			// top: coord.y,
			// left: coord.x
		})
        this.lockFabricObject(tile)
        this.scaleTileImage(tile,coord.rot)
        tile.set({top:coord.y,left:coord.x})

        return tile
    }

    getTileHighlight(coord,color){
        let image
        if(color==='red')
            image=document.getElementById('tile_highlight_red')
        else if(color==='yellow')
            image=document.getElementById('tile_highlight_yellow')
        else
            image=document.getElementById('tile_highlight_white')

        let tile= new fabric.Image(image, {
			originX: "center",
			originY: "center",
			width: TILE_IMG_SIZE,
			height: TILE_IMG_SIZE,
			objectCaching: false,
            evented:false,
		})
        this.lockFabricObject(tile)
        this.scaleTileImage(tile,coord.rot)
        tile.set({top:coord.y,left:coord.x})
        
        return tile
    }
    getTileTextObj(str,coord,fontsize){
        let text=new fabric.Text(str, {
            fontSize: fontsize,
            fill: "#707070",
            opacity: 1,
            fontWeight: "bold",
            evented: false,
            top: coord.y,
            left: coord.x,
            fontFamily: "nanumEB",
        })
        this.lockFabricObject(text)
        this.canvas.add(text)
        return text
    }
    getHouse(owner){


        let house= new fabric.Image(document.getElementById('marble_buildingimg'), {
			width: BUILDING_IMG_SIZE,
			height: BUILDING_IMG_SIZE,
			cropX: BUILDING_IMG_SIZE * (4+owner),
			cropY: 0,
			objectCaching: false,
            evented:false,
		})
        house.scale(0.6)
        this.lockFabricObject(house)
        this.canvas.add(house)

        return house
    }
    getLandMark(owner){
        let house= new fabric.Image(document.getElementById('marble_buildingimg'), {
			width: BUILDING_IMG_SIZE,
			height: BUILDING_IMG_SIZE,
			cropX: BUILDING_IMG_SIZE * (8+owner),
			cropY: 0,
			objectCaching: false,
            evented:false,
		})
        house.scale(1.2)
        this.lockFabricObject(house)
        this.canvas.add(house)
        return house
    }
    getFlag(owner){
        let flag= new fabric.Image(document.getElementById('marble_buildingimg'), {
			width: BUILDING_IMG_SIZE,
			height: BUILDING_IMG_SIZE,
			cropX: BUILDING_IMG_SIZE * (owner),
			cropY: 0,
			objectCaching: false,
            evented:false,
		})
        flag.scale(0.8)
        this.lockFabricObject(flag)
        this.canvas.add(flag)
        return flag
    }

    addLandFlag(pos,owner){
        let flag=this.getFlag(owner)
        let coord=getFlagCoord(this.getCoord(pos))
        if(!coord) return

        flag.set({top:coord.y,left:coord.x})
        flag.bringToFront()
        this.tileObj.get(pos).setLandFlag(flag)
    }
    removeLandFlag(pos){
        let tileobj=this.tileObj.get(pos)
        if(tileobj.type === 'nonbuildable') return
        let flag=tileobj.buildings[0]
        if(!flag) return
        this.canvas.remove(flag)
        tileobj.setLandFlag(null)
    }
    /**
     * 
     * @param {*} pos 
     * @param {*} owner 
     * @param {*} level 1~3
     * @returns 
     */
    addHouse(pos,owner,level){
        if(level < 1 || level > 3) return
        let h=this.getHouse(owner)
        let coord=getHouseCoord(this.getCoord(pos),level)
        if(!coord) return

        h.set({top:coord.y,left:coord.x})
        h.bringToFront()
        this.tileObj.get(pos).setHouse(h,level)
        this.removeLandFlag(pos)
    }
    /**
     * 
     * @param {*} pos 
     * @param {*} level 1~3
     * @returns 
     */
    removeHouse(pos,level){
        if(level < 1 || level > 3) return

        let tileobj=this.tileObj.get(pos)
        if(tileobj.type === 'nonbuildable') return
        let house=tileobj.buildings[level]
        if(!house) return
        this.canvas.remove(house)
        tileobj.setHouse(null,level)

        if(tileobj.data.hasOnlyLand()){
            this.addLandFlag(pos,tileobj.data.owner)
        }
    }
    removeAllHouse(pos){
        for(let i=1;i<4;++i)
            this.removeHouse(pos)
    }
    addLandMark(pos,owner){
        let lm=this.getLandMark(owner)
        let coord=getLandMarkCoord(this.getCoord(pos))
        if(!coord) return

        lm.set({top:coord.y,left:coord.x})
        lm.bringToFront()
        this.tileObj.get(pos).setLandMark(lm)
        for(let i=1;i<4;++i){
            this.removeHouse(pos,i)
        }
        this.removeLandFlag(pos)
    }
    removeLandMark(pos){
        let tileobj=this.tileObj.get(pos)
        if(tileobj.type === 'nonbuildable') return
        let flag=tileobj.buildings[4]
        if(!flag) return
        this.canvas.remove(flag)
        tileobj.setLandFlag(null)

        for(let i=1;i<4;++i){
            this.addHouse(pos,tileobj.data.owner,i)
        }
    }

    showTileHighlight(positions,color){
        for(const p of positions){
            let image=this.getTileHighlight(this.getCoord(p),color)
            this.canvas.add(image)
            image.bringToFront()
            this.tileHighlights.get(color).push(image)
        }
        this.forceRender()
    }
    clearTileHighlight(color){
        this.tileHighlights.get(color).forEach((h)=>this.canvas.remove(h))
        this.tileHighlights.set(color,[])
        this.forceRender()
    }
    tileHighlightsToFront(){
        console.log(this.tileHighlights)
        for(let color of this.tileHighlights.values())
            color.forEach((h)=>h.bringToFront())

        this.forceRender()
    }
    clearBuildings(positions){
        for(const p of positions){
            let tileobj=this.tileObj.get(p)
            if(tileobj.type === 'nonbuildable') return
            tileobj.buildings.forEach((b)=>{
                this.canvas.remove(b)
            })

            this.tileObj.get(p).clear()
        }
        
    }
    removeBuildings(pos,toremove){
        toremove.forEach((b)=>{
            this.removeHouse(pos,b-1)
        })
        this.forceRender()

    }
    setTileStatusEffect(pos,name,dur){
        let tileobj=this.tileObj.get(pos)
        if(!tileobj) return
        
        if(name==="" && tileobj.effectOverlay!=null) {
            this.canvas.remove(tileobj.effectOverlay)
            tileobj.effectOverlay=null
        }
        if(name==="") return

        let img=this.getTileHighlight(this.getCoord(pos),"red")

        let color="white"
        if(name==='pandemic') color='green'
        if(name==='blackout') color='black'

        let filter = new fabric.Image.filters.BlendColor({
            color: color,
            mode: "tint",
            alpha: 0.9
        })
        img.filters = [filter]
        img.applyFilters()
        this.canvas.add(img)
        tileobj.effectOverlay=img
    }
    /**
     * 
     * @param {*} pos 
     * @param {*} toll number
     * @param {*} mul number
     */
    setToll(pos,toll,mul){
        if(this.tileObj.has(pos))
        {
            this.tileData.get(pos).toll=toll

            if(mul >1){
                this.tileObj.get(pos).changeToll("X"+String(mul))
            }
            else{
                this.tileObj.get(pos).changeToll(moneyToString(toll))
            }
        }
    }
    setLandOwner(pos,player){
        if(!this.tileData.has(pos)) return

        let currentbuilds=this.tileData.get(pos).builds

        for(let i=0;i<currentbuilds.length;++i){
            if(!currentbuilds[i]) continue

            if(i===0){
                this.removeLandFlag(pos)
                this.addLandFlag(pos,player)
            }
            else if(i===4){
                this.removeLandMark(pos)
                this.addLandMark(pos,player)
            }
            else{
                this.removeHouse(pos,i)
                this.addHouse(pos,player,i)
            }
        }
        this.forceRender()
    }
    setOlympic(pos){
        if(this.olympic!==-1){
            this.tileData.get(this.olympic).olympic=false
        }
        this.tileData.get(pos).olympic=true
    }
    focusPlayer(player){
        for(let i=0;i<this.players.length;++i){
            if(this.players[i].retired) continue
            
            if(i===player) this.players[i].playerimg.set({ opacity:1 })
            else this.players[i].playerimg.set({ opacity:0.3 })
        }
        this.forceRender()
    }
    onReady(){
        // 
        this.startRenderInterval()
    }
    tileReset(){
        super.tileReset()
        this.tileHighlightsToFront()
    }
    onTileClick(pos,type){
        
        this.tileReset()
        this.game.onTileSelect(pos,type)
        
    }
    liftTile(index, type,size) {
		if (this.tiles[index] === null || index >= this.tiles.length || index < 0) {
			return
		}

        let select=()=>{
            this.onTileClick(index,type)
        }
        //신의손 특수지역 건설
		if (type === "") {
			
		} 

		this.activateTile(index,select)
		this.tileObj.get(index).onTileLift()

		//this.tiles[t].set({'top':"-=10"})
		// this.tiles[index].animate('top','-=10',{
		//   onChange: this.canvas.renderAll.bind(this.canvas),
		//   duration: 0,
		//   easing: fabric.util.ease.easeOutCubic
		// });
	}
    removePlayer(player){
        this.players[player].retired=true
        this.players[player].playerimg.set({opacity:0})
    }
    test(){
       this.showRangeTilesByList([0,1,4,5,7,11,20,32], "", 1)
        this.players[1].updateNameText("지역 매각 중입니다..")
        this.teleportPlayer(0,8,"levitate")
        this.movePlayerThrough([31,30,29,28,27,26,25], 1,(turn)=>this.game.moveComplete(turn))
    }
}