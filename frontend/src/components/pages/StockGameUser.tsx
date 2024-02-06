import { useParams } from "react-router-dom"
import StockGameUserInfo from "../../stockgame/UserInfo"

export default function StockGameUserPage()
{
    const { userId } = useParams()
    return (<StockGameUserInfo userId={userId}/>)
}