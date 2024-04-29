import { ChangeEvent, useContext, useEffect, useState } from "react"
import { RootContext } from "../../context/context"
import { RiArrowDownSLine, RiBroadcastFill } from "react-icons/ri"
import "../../styles/form.scss"
import "../../styles/settingpage.scss"
import "../../styles/home.scss"

import { Link } from "react-router-dom"
import CheckBoxSetting from "../setting/CheckBoxSetting"
import { toast } from "react-toastify"
import { AxiosApi } from "../../api/axios"
import { LocaleContext } from "../../context/localeContext"
import Text from "../Text"

const LANGUAGES = [
	{ name: "English", value: "en" },
	{ name: "한국어", value: "ko" },
]
type INotiSettings = {
	chat: boolean
	comment: boolean
	post: boolean
	reply: boolean
	stockgameSurpass: boolean
	follower: boolean
}
export default function SettingPage() {
	const { context, setContext } = useContext(RootContext)
	//console.log(context)
	const loggedin = context.loggedin
	const [lang, setLang] = useState<string>(context.lang!=null ? context.lang : "en")
	//console.log(lang)
	//
	const [notiSettings, setNotiSettings] = useState<INotiSettings>({
		chat: true,
		comment: true,
		post: true,
		reply: true,
		stockgameSurpass: true,
		follower: true
	})
    useEffect(()=>{
        if(!loggedin) return
        AxiosApi.get("/api/notification/setting")
        .then(res=>{
            setNotiSettings({
                chat:!res.data.chat,
                comment:!res.data.comment,
                post:!res.data.post,
                reply:!res.data.reply,
                stockgameSurpass:!res.data.stockgameSurpass,
                follower:!res.data.follower
            })
        })
        .catch(e=>console.error(e))
    },[])
	function setLanguage(val: string) {
		setLang(val)
		setContext({ ...context, lang: val })
	}

	async function changeNoti(e: ChangeEvent<HTMLInputElement>, settingId: string) {
        let checked = e.target.checked
        AxiosApi.post("/api/notification/setting",{
            type:settingId,
            value:!checked
        })
        .then(res=>{
            showToast(`Turned ${checked?"on":"off"} notification`)
            let obj={ ...notiSettings }
            console.log(checked)
            switch(settingId){
                case "chat":
                obj.chat=checked
                break
                case "comment":
                obj.comment=checked  
                break
                case "post":
                obj.post=checked    
                break
                case "reply":
                obj.reply=checked    
                break
                case "stockgameSurpass":
                obj.stockgameSurpass=checked    
                break
                case "follower":
                obj.follower=checked    
                break
            }
            setNotiSettings(obj)
        })
        .catch(e=>console.error(e))
	}

	function showToast(msg: string) {
		toast.info(msg, {
			position: "bottom-right",
			autoClose: 2000,
			hideProgressBar: true,
			closeOnClick: true,
			pauseOnHover: false,
			draggable: false,
			progress: 0,
			theme: "colored",
		})
	}

	return (
		<div className="settingpage">
			<div className="form">
				<div>
					<h2><Text lkey="generic.setting"/> </h2>
					<hr></hr>
				</div>
				<div className="onesetting">
					<div className="select-box">
						<div className="select-box__current" tabIndex={1}>
							{LANGUAGES.map((l) => (
								<div key={l.value} className="select-box__value">
									<input
										className="select-box__input"
										type="radio"
										id={"lang_" + l.value}
										value={l.value}
										checked={(l.value === lang || (lang==null && l.value==="en"))}
									/>
									<p className="select-box__input-text">{l.name}</p>
								</div>
							))}
							<RiArrowDownSLine className="select-box__icon" aria-hidden />
							{/* <img className="select-box__icon" src="http://cdn.onlinewebfonts.com/svg/img_295694.svg" alt="Arrow Icon" aria-hidden="true"/> */}
						</div>
						<ul className="select-box__list">
							{LANGUAGES.map((l) => (
								<li key={l.value} onClick={() => setLanguage(l.value)}>
									<label className="select-box__option" htmlFor={"lang_" + l.value} aria-hidden>
										{l.name}
									</label>
								</li>
							))}
						</ul>
					</div>
				</div>
				{loggedin && (
					<>
						<div>
							<h2>Notifications</h2>
							<hr></hr>
						</div>
						<CheckBoxSetting
							namekey="settingpage.name.noti_chat"
							desckey="settingpage.desc.noti_chat"
							id="chat"
							onChange={changeNoti}
							checked={notiSettings.chat}></CheckBoxSetting>
						<CheckBoxSetting
							namekey="settingpage.name.noti_comment"
							desckey="settingpage.desc.noti_comment"
							id="comment"
							onChange={changeNoti}
							checked={notiSettings.comment}></CheckBoxSetting>
						<CheckBoxSetting
							namekey="settingpage.name.noti_post"
							desckey="settingpage.desc.noti_post"
							id="post"
							onChange={changeNoti}
							checked={notiSettings.post}></CheckBoxSetting>
						<CheckBoxSetting
							namekey="settingpage.name.noti_reply"
							desckey="settingpage.desc.noti_reply"
							id="reply"
							onChange={changeNoti}
							checked={notiSettings.reply}></CheckBoxSetting>
						<CheckBoxSetting
							namekey="settingpage.name.noti_stockgame"
							desckey="settingpage.desc.noti_stockgame"
							id="stockgameSurpass"
							onChange={changeNoti}
							checked={notiSettings.stockgameSurpass}></CheckBoxSetting>
						<CheckBoxSetting
							namekey="settingpage.name.noti_follower"
							desckey="settingpage.desc.noti_follower"
							id="follower"
							onChange={changeNoti}
							checked={notiSettings.follower}></CheckBoxSetting>
					</>
				)}

				<div>
					<div className="mainbtn btn-dark button-19 divlink">
						<Link to="/status" className="divlink"></Link>
						<RiBroadcastFill />
						<b><Text lkey="settingpage.status"/></b>
						<br></br>
					</div>
				</div>
			</div>
		</div>
	)
}
