import { useContext, useState } from "react"
import "../../styles/login.css"
import { RiArrowLeftLine, RiErrorWarningFill } from "react-icons/ri"
import { backend_url } from "../../variables"

export function RegisterPage() {


    const [error,setError] =useState("")

    const url = backend_url+"/user/register"

    async function submitLogin(){
        const email = (document.getElementById("register-email") as HTMLInputElement).value

        const username = (document.getElementById("register-username") as HTMLInputElement).value
        const pw = (document.getElementById("register-password") as HTMLInputElement).value
        const pw2 = (document.getElementById("register-password2") as HTMLInputElement).value

        if(username==="" ||email==="" || pw === "" || pw2 === ""){
            setError("Missing values")
            return
        }
        if(pw !== pw2){
            setError("Passwords not match")
            return
        }
        if (email.match(/[^@]+@[^.]+\.[a-z]+/) == null) {
			setError("Invalid email")
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
                alert("Registered")
                window.location.href="/login"
            }
            const data = await res.text()
            if(data==="username"){
                setError("invalid username length")
            }
            else if(data==="password"){
                setError("invalid password")
            }
            else if(data==="duplicate username")
            {
                setError("duplicate username")
            }
        }
        catch(e){
            console.error(e)
            setError("Server Error")
        }
        
    }

	return (
		<>
			<div className="signin">
            <a className="back" href="/"><RiArrowLeftLine  /></a>

				<div className="content">
					<h2>Register</h2>

					<div className="form">
						
                        <div className="inputBox">
							<input type="text" id="register-username"/>
								<i>Username</i>
						</div>
						<div className="inputBox">
							<input type="password" id="register-password"/>
								<i>Password</i>
						</div>
                        <div className="inputBox">
							<input type="password" id="register-password2"/>
								<i>Verify Password</i>
						</div>
                        <div className="inputBox">
							<input type="text" id="register-email"/>
								<i>Email</i>
						</div>
						<div className="links">
                            {error!=="" && (<i id="login-error"><RiErrorWarningFill /> {error}</i>)}
                            <br></br>
							<a href="/login">Login</a>
						</div>

						<div className="inputBox">
							<input type="submit" value="Register" onClick={submitLogin}/>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}
