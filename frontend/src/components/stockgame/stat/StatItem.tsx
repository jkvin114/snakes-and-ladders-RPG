
type Props={
    name:string
    value:string
    type:string
}
export default function StatItem({name,value,type}:Props){
    // console.log(day.date)
    return (<div className="stat-item">
        <div className="stat-item-name">
            {name}
        </div>
        <div className={"stat-item-value "+type}>
            {value}
        </div>
    </div>)
}