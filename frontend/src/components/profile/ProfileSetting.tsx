import { ChangeEvent, FormEvent, useContext, useState } from "react";
import { RiErrorWarningFill } from "react-icons/ri";
import { AxiosApi } from "../../api/axios";
import { useNavigate } from "react-router-dom";
import { LocaleContext } from "../../context/localeContext";
import { lText } from "../../util";
import Text from "../Text";

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
    const { locale } = useContext(LocaleContext)

    const [formData, setFormData] = useState<FormData>({
        originalpw: '',
        newpw: '',
        newpw2:''
      });
      const [error,setError] = useState("")
      const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        if(!formData.newpw || !formData.newpw2 || !formData.originalpw){
            //setError("Empty content")
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
                    setError(lText(locale,"profilepage.error.pw_old"))
                }
                else if(r.data==="pw error"){
                    setError(lText(locale,"profilepage.error.pw_condition"))
                }
            }else if(r.status===201){
                alert(lText(locale,"profilepage.message.pw_changed"))
                navigate(0)
            }
        })
        .catch(e=>{
            if(e.status===401){
                alert("unauthorized")
                return
            }

            alert(lText(locale,"generic.servererror"))
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
        if(!window.confirm(lText(locale,"profilepage.message.confirm_image_remove"))) return
        AxiosApi.post("/api/user/remove_profileimg")
        .then(r=>{
            alert(lText(locale,"profilepage.message.image_update"))
			navigate(0)
        })
        .catch(e=>{
            if(e.status===401){
                alert("unauthorized")
                return
            }
            alert(lText(locale,"profilepage.message.image_update_fail"))
            console.error(e)
        })
      }
    
	return (
		<div className="profile-setting">
			{hasImg && <button className="button" onClick={removeProfileImg}><Text lkey="profilepage.removeprofile"/></button>}

			<br></br>
			<h3 ><Text lkey="profilepage.security"/></h3>
			<hr></hr>
			<form className="form" id="password-change-form" method="patch" action="/user/password" onSubmit={handleSubmit}>
				<div className="inputBox">
					<input type="password" name="originalpw" value={formData.originalpw} onChange={handleChange} required  />
					<i><Text lkey="profilepage.prevpw"/></i>
				</div>
				<div className="inputBox">
					<input type="password" name="newpw" value={formData.newpw} onChange={handleChange} required />
					<i><Text lkey="profilepage.pw"/></i>
				</div>
				<div className="inputBox">
					<input type="password" name="newpw2" value={formData.newpw2} onChange={handleChange} required />
					<i><Text lkey="profilepage.pw2"/></i>
				</div>
                <div className="links">
                        {error!=="" && (<i className="login-error"><RiErrorWarningFill /> {error}</i>)}
				</div>
				<button className="button" type="submit">
                    <Text lkey="profilepage.changepw"/>
				</button>
			</form>
		</div>
	)
}
