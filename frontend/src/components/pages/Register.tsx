import { useContext, useState } from "react"
import "../../styles/login.css"
import { RiArrowLeftLine, RiErrorWarningFill } from "react-icons/ri"
import { backend_url } from "../../variables"
import { Link } from "react-router-dom"
import Text from "../Text"
import { LocaleContext } from "../../context/localeContext"
import { lText } from "../../util"

export function RegisterPage() {


    const [error,setError] =useState("")

    const url = backend_url+"/api/user/register"
    const { locale } = useContext(LocaleContext)

    async function submitLogin(){
        const email = (document.getElementById("register-email") as HTMLInputElement).value

        const username = (document.getElementById("register-username") as HTMLInputElement).value
        const pw = (document.getElementById("register-password") as HTMLInputElement).value
        const pw2 = (document.getElementById("register-password2") as HTMLInputElement).value

        if(username==="" ||email==="" || pw === "" || pw2 === ""){
            setError("authpage.error.missing")
            return
        }
        if(pw !== pw2){
            setError("authpage.error.password")
            return
        }
        if (email.match(/[^@]+@[^.]+\.[a-z]+/) == null) {
			setError("authpage.error.email")
			return
		}
        try{
            const res = await fetch(url, {
                method: "POST",
                mode:'cors',
                headers: {
                    "Content-Type": "application/json",
                    // 'Content-Type': 'application/x-www-form-urlencoded',
                  },
                body:JSON.stringify({
                    username:username,
                    password:pw,
                    email:email
                })  
            })

            if(res.status===200){
                alert(lText(locale,"authpage.registered"))
                window.location.href="/login"
            }
            const data = await res.text()
            if(data==="username"){
                setError("authpage.error.username_length")
            }
            else if(data==="password"){
                setError("authpage.error.password_condition")
            }
            else if(data==="duplicate username")
            {
                setError("authpage.error.username_duplicate")
            }
        }
        catch(e){
            console.error(e)
            setError("authpage.error.servererror")
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
					<h2><Text lkey="generic.register"/></h2>

					<div className="form">
						
                        <div className="inputBox">
							<input type="text" id="register-username" required/>
								<i><Text lkey="generic.username"/></i>
						</div>
						<div className="inputBox">
							<input type="password" id="register-password" required/>
								<i><Text lkey="generic.pw"/></i>
						</div>
                        <div className="inputBox">
							<input type="password" id="register-password2" required/>
								<i><Text lkey="authpage.verify-pw"/></i>
						</div>
                        <div className="inputBox">
							<input type="text" id="register-email" required/>
								<i><Text lkey="generic.email"/></i>
						</div>
						<div className="links">
                            {error!=="" && (<i id="login-error"><RiErrorWarningFill /> <Text lkey={error}/></i>)}
                            <br></br>
                            <Link to={"/login"}><Text lkey="generic.login"/></Link>
						</div>

						<div className="inputBox">
							<input type="submit" value={lText(locale,"generic.register")} onClick={submitLogin}/>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}
