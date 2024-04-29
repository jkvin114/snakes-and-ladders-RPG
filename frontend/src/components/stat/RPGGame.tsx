import { useContext } from "react";
import { RPGPlayerStat } from "../../types/stat";
import { getDateStringDifference } from "../../util";
import Text from "../Text";
import RPGItem from "./RPGItem";
import { RootContext } from "../../context/context";


type Props = {
    g:RPGPlayerStat
    getCharImgUrl:(champ_id:number)=>string
}

export default function RPGGameStat({g,getCharImgUrl}:Props){
    const { context } = useContext(RootContext)

    function multiKillText(count: number) {
        let multiKillText = ""
        if (count >= 2) {
            multiKillText = "rpgstat.multikill.double"
        }
        if (count >= 3) {
            multiKillText = "rpgstat.multikill.triple"
        }
        if (count >= 4) {
            multiKillText = "rpgstat.multikill.quadra"
        }
        if (count >= 5) {
            multiKillText = "rpgstat.multikill.penta"
        }
        return multiKillText
    }
    return (
        <div className="game-item divlink">
            <a className="divlink" href={"/stat?type=game&statid=" + g.gameId + "&turnfocus=" + g.turn}></a>
            <div className={"game-header " + (g.isWon ? "" : "lost")}>
                <div><Text lkey={g.isWon?"rpgstat.win":"rpgstat.lose"}/></div>
                <a><Text lkey="rpgstat.turn" args={[g.totalturn]}/></a>
            </div>
            <div className="game-content">
                <div>
                    <div className="charimg">
                        <img src={getCharImgUrl(g.player.champ_id)}></img>
                    </div>
                    <b className="kda">{`${g.player.kill}/${g.player.death}/${g.player.assist}`}</b>
                </div>
                <div>
                    <RPGItem items={g.player.items} />
                </div>
            </div>
            <div className="game-desc">
                <div>{g.map} map</div>
                <div>{getDateStringDifference(g.createdAt,Date.now(),context.lang)} <Text lkey="generic.ago"/></div>
                    {g.player.bestMultiKill>=2 && 
                        <b className="multikill-text">
                           <Text lkey={multiKillText(g.player.bestMultiKill)}/>
                        </b>
                    }
            </div>
        </div>)
}