import { ChangeEvent, FormEvent, useState } from "react";
import { RiErrorWarningFill } from "react-icons/ri";
import { AxiosApi } from "../../api/axios";
import { useNavigate } from "react-router-dom";

type Props = {
	username?: string
	hasImg: boolean
}
type FormData={
    originalpw:string,
    newpw:string
    newpw2:string
}
export default function ProfileSetting({ username, hasImg }: Props) {
    const navigate = useNavigate()

    const [formData, setFormData] = useState<FormData>({
        originalpw: '',
        newpw: '',
        newpw2:''
      });
      const [error,setError] = useState("")
      const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        // Perform any necessary form validation or data processing here
        // ...
        if(!formData.newpw || !formData.newpw2 || !formData.originalpw){
            setError("Empty content")
            return
        }
        if(formData.newpw !==  formData.newpw2) {
            setError("Password does not match")
            return
        }
        AxiosApi.patch("/api/user/password",{
            originalpw:formData.originalpw,
            newpw:formData.newpw
        })
        .then(r=>{
            if(r.status===200){
                if(r.data==='password not match'){
                    setError("Old password does not match")
                }
                else if(r.data==="pw error"){
                    setError("invalid password")
                }
            }else if(r.status===201){
                alert("changed password successfully")
                navigate(0)
            }
        })
        .catch(e=>{
            if(e.status===401){
                alert("unauthorized")
                return
            }

            alert("failed to change password")
            console.error(e)
        })
      };
    
      const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setFormData((prevData) => ({
          ...prevData,
          [name]: value,
        }));
      };

      function removeProfileImg(){
        if(!window.confirm("Delete profile image?")) return
        AxiosApi.post("/api/user/remove_profileimg")
        .then(r=>{
            alert("Profile image removed")
			navigate(0)
        })
        .catch(e=>{
            if(e.status===401){
                alert("unauthorized")
                return
            }
            alert("failed to remove profile image")
            console.error(e)
        })
      }
    
	return (
		<div className="profile-setting">
			{hasImg && <button className="button" onClick={removeProfileImg}>Remove profile image</button>}

			<br></br>
			<h3 data-lkey="mypage.security">Security</h3>
			<hr></hr>
			<form className="form" id="password-change-form" method="patch" action="/user/password" onSubmit={handleSubmit}>
				<div className="inputBox">
					<input type="password" name="originalpw" value={formData.originalpw} onChange={handleChange} required  />
					<i>Current Password</i>
				</div>
				<div className="inputBox">
					<input type="password" name="newpw" value={formData.newpw} onChange={handleChange} required />
					<i>New Password</i>
				</div>
				<div className="inputBox">
					<input type="password" name="newpw2" value={formData.newpw2} onChange={handleChange} required />
					<i>New Password Check</i>
				</div>
                <div className="links">
                        {error!=="" && (<i className="login-error"><RiErrorWarningFill /> {error}</i>)}
				</div>
				<button className="button" type="submit" data-lkey="mypage.changepw">
					Change Password
				</button>
			</form>
		</div>
	)
}
