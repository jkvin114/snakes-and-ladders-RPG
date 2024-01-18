import { RiMessage2Fill } from "react-icons/ri"
import { ToastContainer, toast } from "react-toastify"
import { ToastIcon } from "react-toastify/dist/types"

export namespace ToastHelper{
    export function ChatToast(message:string,icon:ToastIcon){
        toast.info(message, {
			position: "bottom-right",
			autoClose: 3000,
			hideProgressBar: true,
			closeOnClick: true,
			pauseOnHover: false,
			draggable: false,
			progress: 0,
			theme: "colored",
			icon:icon
		})
    }
}