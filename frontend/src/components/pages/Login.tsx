import { useContext, useState } from "react"
import "../../styles/login.css"
import { RiArrowLeftLine, RiErrorWarningFill } from "react-icons/ri"
import { useParams, useSearchParams } from "react-router-dom"
import { backend_url } from "../../variables"
import axios from "axios"
export function LoginPage() {


    const [error,setError] =useState("")

    const  url = backend_url+"/user/login"
    let [searchParams, setSearchParams] = useSearchParams()
    const redirect=searchParams.get("redirect")
    const API = axios.create({ baseURL: backend_url })
    async function submitLogin(){
        
        const email = (document.getElementById("login-email") as HTMLInputElement).value
        const pw = (document.getElementById("login-password") as HTMLInputElement).value
        if(email==="" || pw === ""){
            setError("Enter username and password")
            return
        }
        let token=sessionStorage.getItem("jwt")
        try{
            const res = await API.post("/user/login",{
                username:email,
                password:pw
            })
            // const res = await fetch(url, {
            //     method: "POST",
            //     mode:'cors',
            //     credentials:"include",
            //     headers: {
            //         "Content-Type": "application/json",
            //         // 'Content-Type': 'application/x-www-form-urlencoded',
            //       },
            //     body:JSON.stringify({
            //         username:email,
            //         password:pw
            //     })
            // })
            console.log(res.headers)

            const data = res.data
            if(data === "username"){
                setError("Wrong username")
            }
            else if(data === "password"){
                setError("Wrong password")
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
            setError("Server Error")
        }
    }

	return (
		<>
			<div className="signin">
                <a className="back" href="/"><RiArrowLeftLine  /></a>
				<div className="content">
					<h2>Log In</h2>

					<div className="form">
						<div className="inputBox">
							<input type="text" id="login-email"/>
								<i>Username</i>
						</div>

						<div className="inputBox">
							<input type="password" id="login-password"/>
								<i>Password</i>
						</div>

						<div className="links">
                            {error!=="" && (<i id="login-error"><RiErrorWarningFill /> {error}</i>)}
                            <br></br><a href="/register">Register</a>
							{/* <a href="#">Forgot Password</a> <a href="#">Signup</a> */}
						</div>

						<div className="inputBox">
							<input type="submit" value="Login" onClick={submitLogin}/>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}