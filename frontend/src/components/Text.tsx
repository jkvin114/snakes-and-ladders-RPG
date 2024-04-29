import { useContext } from "react"
import { LocaleContext } from "../context/localeContext"
import { lText } from "../util"

type Props={
    lkey:string,
    args?:(string|number)[]
}
export default function Text({lkey,args}:Props){
    const { locale } = useContext(LocaleContext)
    return (<>{lText(locale,lkey,args)}</>)
}