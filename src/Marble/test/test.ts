import { ProtoPlayer,PlayerType } from "../../core/Util";
import { MarbleGame } from "../Game";
import { BuildableTile } from "../tile/BuildableTile";
import { backwardBy, backwardDistance, cl, distance, forwardBy, forwardDistance, getTilesBewteen, signedShortestDistance } from "../util";

let players:ProtoPlayer[]=[
    {
        type:PlayerType.AI,name:"",team:true,champ:0,ready:true
    },{
        type:PlayerType.AI,name:"",team:true,champ:1,ready:true
    },
    {
        type:PlayerType.AI,name:"",team:true,champ:2,ready:true
    }
]



const game=new MarbleGame(players,"",false,0)

game.setTurns();



// game.map.toString()
cl(signedShortestDistance(31,1))
cl(signedShortestDistance(1,31))
cl(signedShortestDistance(1,6))
cl(signedShortestDistance(6,1))



function testSellOff(){
    game.map.setLandOwner(game.map.tileAt(1) as BuildableTile,1)
    game.map.setLandOwner(game.map.tileAt(3) as BuildableTile,1)
    cl(game.map.toString())
    game.map.clearTile(game.map.tileAt(1) as BuildableTile)
    cl(game.map.toString())
}


function testFestival(){

    game.map.setFestival(1)
    game.map.setFestival(3)
    console.log(game.map.tileAt(1).toString())
    console.log(game.map.tileAt(3).toString())
    game.map.setFestival(5,3)
    console.log(game.map.tileAt(3).toString())
    console.log(game.map.tileAt(5).toString())
    game.map.setOlympic(5)
    console.log(game.map.tileAt(5).toString())
    
}

function testMonopoly(){
    game.map.setLandOwner(game.map.tileAt(1) as BuildableTile,0)
    game.map.setLandOwner(game.map.tileAt(3) as BuildableTile,0)
    
    game.map.setLandOwner(game.map.tileAt(7) as BuildableTile,1)
    game.map.setLandOwner(game.map.tileAt(14) as BuildableTile,1)
    game.map.setLandOwner(game.map.tileAt(23) as BuildableTile,1)
    game.map.setLandOwner(game.map.tileAt(21) as BuildableTile,1)
    game.map.setLandOwner(game.map.tileAt(22) as BuildableTile,1)
    // game.map.setLandOwner(game.map.tileAt(30) as BuildableTile,1)
    
    
    console.log(game.map.checkMonopolyAlert(game.map.tileAt(30) as BuildableTile,1))
    console.log(game.map.checkMonopoly(game.map.tileAt(30) as BuildableTile,1))
    
}


function testUtil(){
    
    console.log(getTilesBewteen(30,4))
    //[31,0,1,2,3]
    console.log(getTilesBewteen(1,4))
    //[2,3]
    console.log(distance(1,4))
    //3
    console.log(distance(30,4))
    //6
    console.log(distance(4,30))
    //6
    console.log(backwardDistance(4,30))
    //6
    console.log(forwardDistance(30,4))
    //6
    console.log(forwardBy(29,5))
    //2
    console.log(forwardBy(5,5))
    //10
    console.log(backwardBy(29,5))
    //24
    console.log(backwardBy(1,5))
    //28

    console.log("sameline")
    console.assert(game.map.isSameLine(1,5))
    console.assert(!game.map.isSameLine(1,15))
    console.assert(game.map.isSameLine(0,30))
    console.assert(game.map.isSameLine(0,1))
    console.assert(game.map.isSameLine(3,3))


}