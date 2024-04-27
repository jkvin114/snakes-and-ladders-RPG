import type { ChangeEvent, ChangeEventHandler } from "react"

type Props={
    name:string,
    desc?:string,
    onChange:(e:ChangeEvent<HTMLInputElement>,id:string)=>void,
    id:string,
    checked:boolean

}

export default function CheckBoxSetting({name,desc,onChange,id,checked}:Props){
    return (<div className="onesetting">
    <label className="setting-name" data-lkey="room.loginonly">
        {name}
    </label>
    {
        desc && (<div className="setting-desc">
            {desc}
        </div>)
    }
    
    <label className="switch" >
        <input type="checkbox" onChange={(e)=>onChange(e,id)} checked={checked}></input>
        <span className="switchslider"></span>
    </label>
</div>)
}