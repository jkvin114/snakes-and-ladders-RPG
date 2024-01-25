import { range } from "../../util"

type Props={
    items:number[]
}
export default function RPGItem({items}:Props){
    const size = items.length - 1
    return (<>
    {range(size).map((i)=>{
        if(items[i]===-1){
            return (<><div className='toast_itemimg scalable'><img alt='empty' src='/res/img/store/emptyslot.png'></img> </div>
            {(i > 0 && i % 7 === 0) && <br></br>}</>)
        }
        else return (<><div className='toast_itemimg'><img src='/res/img/store/items.png' style={{marginLeft:(-1*items[i]*100)+"px"}}></img> </div>
        {(i > 0 && i % 7 === 0) && <br></br>}</>)
    })}
    
    </>
    )
}