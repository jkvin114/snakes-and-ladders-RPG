import { useContext, useState } from "react"
import "../../styles/login.css"
import { RiArrowLeftLine, RiErrorWarningFill } from "react-icons/ri"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"

import { AxiosApi } from "../../api/axios"
import { LocaleContext } from "../../context/localeContext"
import { lText } from "../../util"
import Text from "../Text"
export function LoginPage() {


    const [error,setError] =useState("")
    const navigate = useNavigate()

    let [searchParams, setSearchParams] = useSearchParams()
    const redirect=searchParams.get("redirect")
    const { locale } = useContext(LocaleContext)
    async function submitLogin(){
        const email = (document.getElementById("login-email") as HTMLInputElement).value
        const pw = (document.getElementById("login-password") as HTMLInputElement).value
        if(email==="" || pw === ""){
            setError("Enter username and password")
            return
        }
        try{
            const res = await AxiosApi.post("/api/user/login",{
                username:email,
                password:pw
            })
            console.log(res.headers)

            const data = res.data
            if(data === "username"){
                setError(lText(locale,"authpage.error.username"))
            }
            else if(data === "password"){
                setError(lText(locale,"authpage.error.password"))
            }
            else if(res.status === 200){
                localStorage.setItem("username", email)
                localStorage.setItem("loggedIn", "true")
                
                if(redirect){
                    window.location.href = redirect
                }
                else{
                    window.location.href="/"
                }
            }
        }
        catch(e){
            setError(lText(locale,"authpage.error.servererror"))
        }
    }
    const handleKeyPress = (event:any) => {
        if (event.key === 'Enter') {
          submitLogin()
        }
      };
    
	return (
		<>
			<div className="signin" onKeyDown={handleKeyPress}>
                <Link to="/" className="back"><RiArrowLeftLine  /> </Link>
				<div className="content">
					<h2><Text lkey="generic.login"></Text></h2>

					<div className="form">
						<div className="inputBox">
							<input type="text" id="login-email" required/>
								<i><Text lkey="generic.username"/></i>
						</div>

						<div className="inputBox">
							<input type="password" id="login-password" required/>
								<i><Text lkey="generic.pw"/></i>
						</div>

						<div className="links">
                            {error!=="" && (<i id="login-error"><RiErrorWarningFill /> {error}</i>)}
                            <br></br>
                            <Link to={"/register"}><Text lkey="generic.register"/></Link>
							{/* <a href="#">Forgot Password</a> <a href="#">Signup</a> */}
						</div>

						<div className="inputBox">
							<input type="submit" value={lText(locale,"generic.login")} onClick={submitLogin}/>
						</div>
					</div>
				</div>
			</div>
            
		</>
	)
}
