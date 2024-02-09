import { RPGPlayerStat } from "../../types/stat";
import { getDateStringDifference } from "../../util";
import RPGItem from "./RPGItem";

function multiKillText(count: number) {
	let multiKillText = ""
	if (count >= 2) {
		multiKillText = "Double Kill"
	}
	if (count >= 3) {
		multiKillText = "Triple Kill"
	}
	if (count >= 4) {
		multiKillText = "Quadra Kill"
	}
	if (count >= 5) {
		multiKillText = "Penta Kill"
	}
	return multiKillText
}
type Props = {
    g:RPGPlayerStat
    getCharImgUrl:(champ_id:number)=>string
}

export default function RPGGameStat({g,getCharImgUrl}:Props){
    
    return (
        <div className="game-item divlink">
            <a className="divlink" href={"/stat?type=game&statid=" + g.gameId + "&turnfocus=" + g.turn}></a>
            <div className={"game-header " + (g.isWon ? "" : "lost")}>
                <div>{g.isWon ? "Win" : "Lose"}</div>
                <a>{g.totalturn}T</a>
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
                <div>{getDateStringDifference(g.createdAt,Date.now())} ago</div>
                    {g.player.bestMultiKill>=2 && 
                        <b className="multikill-text" data-lkey="multikill.double">
                            {multiKillText(g.player.bestMultiKill)}
                        </b>
                    }
            </div>
        </div>)
}