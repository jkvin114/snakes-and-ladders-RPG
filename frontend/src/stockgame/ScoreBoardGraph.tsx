import PieChart from "../components/stockgame/PieChart"

type Props={
    money:number
    totalAsset:number
    shares:number
    sharePrice:number
}
export default function ScoreBoardGraph({money,totalAsset,shares,sharePrice}:Props){
    return (
        <div className="graph">
                <PieChart ratios={[(shares*sharePrice)/totalAsset,money/totalAsset]}/>
                <div className="graph-desc">
                    <div>
                        <span style={{background:"#efac39"}} className="color-label"></span>
                        <span>주식: {shares} {`  ($${shares*sharePrice})`}</span>
                    </div>
                    <br></br>
                    <div>   
                        <span style={{background:"#16BC5A"}} className="color-label"></span>
                        <span>현금 :  ${money}</span>
                    </div>
                </div>
            </div>
    )
}