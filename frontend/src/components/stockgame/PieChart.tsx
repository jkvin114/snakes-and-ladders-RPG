import { round } from "../../stockgame/util"

type Props={
    ratios:number[]
}

export default function PieChart({ratios}:Props){

    if(ratios.some(n=>isNaN(n)) || ratios.length<2){ return (<div></div>)}


    const colors=["#efac39","#16BC5A","black"]
    let str=colors[0]+" "+round(ratios[0] * 100)+"%, "

    for(let i=1;i<ratios.length;++i){
        str+=colors[i%colors.length]+" "
        str += round(ratios[i-1] * 100)+"%, "
    }
    str+=colors[(ratios.length-1)%colors.length]+" "
    str += "100%"
    const divStyle = {
        color: 'blue',
        background: ` conic-gradient(${str})`
    }

    return (<div className="pie" style={divStyle}>
    </div>)
}