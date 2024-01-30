import { useContext, useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { RootContext } from "../../context/context"
import 'react-quill/dist/quill.snow.css';
import "../../styles/writepost.scss"
import {Quill} from "react-quill"
//npm i -D @types/quill@1.3 (version issue)
import  {Delta, DeltaOperation,Quill as IQuill } from "quill";
import { AxiosApi } from "../../api/axios";
import { ToastHelper } from "../../ToastHelper";
import { IPostEdit } from "../../types/post";
import { RiArrowLeftSLine, RiSave3Line } from "react-icons/ri";

const  toolbarOptions = [
    ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
    [{ 'direction': 'rtl' }],                         // text direction
  
    [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
  
    [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
    [{ 'align': [] }],
    [ 'image'],
  ];
  const IMAGE_PATH="/uploads/"
  
export default function WritePostPage(){
    const navigate = useNavigate()
    const {context,setContext}= useContext(RootContext);
    const loggedin = context.loggedin
    const [searchParams, setSearchParams]  = useSearchParams()
    const postUrl = searchParams.get("postUrl")
    let  quill:IQuill|null= null
    let loaded=false
      
    // const [quill,setQuill] = useState<IQuill|null>(null)
    const allImages:string[] = []//stores all images that were uploaded or seen in editing
    

    function onload(){
        

       quill =  new Quill(document.getElementById("quill-root") as HTMLElement,{
            theme: "snow",
            bounds: ".editor",
            placeholder: "Write content..",
            modules: {
                toolbar: toolbarOptions,
            },
        })
        quill.getModule("toolbar").addHandler("image",selectLocalImage);
        if(postUrl){
            AxiosApi.get("/board/post/edit/"+postUrl)
            .then(res=>setData(res.data))
            .catch(e=>{
                console.error(e)
            })
        }
        
        // window.onbeforeunload=()=>true;
        
    }


    useEffect(()=>{
        if(!loggedin){
            navigate("/login?redirect=/writepost")
            return
        }
        // setContext({...context,showToolbar:false})
        if(loaded) return
        loaded=true
        
        onload()

    },[searchParams])

    function setData(data:IPostEdit){
        (document.getElementById("title") as HTMLInputElement).value = data.title
        if(data.formattedContent && quill){
            try{
                quill.setContents(JSON.parse(data.formattedContent))
            }
            catch(e){
                console.error(e)
                quill.setText("Format error!")
            }
        }
        else quill?.setText(data.content)
        allImages.push(...extractCurrentImages())
    }
    function save(){
        console.log(quill)
        if(quill){
            const content = quill.getContents().ops
            const text = quill.getText()
            let images=extractCurrentImages()
            const removedImages = getRemovedImages(images)
            const title = (document.getElementById("title") as HTMLInputElement).value
            const thumbnail = images.length>0? images[0]:""
            let url = postUrl?"/board/post/edit":"/board/post/write"
            //PUBLIC,FRIENDS,LINK_ONLY,PRIVATE
            let body={
                removedImages:removedImages,
                thumbnail:thumbnail,
                title:title,
                content : text,
                formattedContent:JSON.stringify(content),
                visibility:"PUBLIC",
                url:postUrl
            }
            if(!title || !text.replaceAll(" ","").replaceAll("\n","")){
                ToastHelper.ErrorToast("title and content are required")
                return
            }
            
            AxiosApi.post(url,body)
            .then(res=>{
                window.onbeforeunload=()=>{}
                //console.log(res.data)
                window.location.href="/board/post/"+res.data.url
            })
            .catch(e=>{
                console.error(e)
                ToastHelper.ErrorToast("failed to save")
            })
        }
    }

    function getRemovedImages(current:string[]){
        const curr = new Set(current)
        let removed=new Set()
        for(const img of allImages){
            if(!curr.has(img)) removed.add(img)
        }
        return Array.from(removed)
    }

    function uploadImage(file:File){
        const formData = new FormData()
        // console.log(file)
		formData.append("img", file)

		AxiosApi.post("/board/post/image", formData)
			.then((res) => {
				ToastHelper.InfoToast("image uploaded")
                insertToEditor(IMAGE_PATH+res.data)
                allImages.push(res.data)
			})
			.catch((e) => {
				console.error(e)
				ToastHelper.ErrorToast("Failed to upload image")
			})
    }

    function selectLocalImage(){
        const  input = document.createElement("input");
        input.setAttribute("type", "file");
        input.setAttribute("accept", "image/jpeg, image/png");
        input.click();
        // Listen upload local image and save to server
        input.onchange = () => {
            if(!input.files) return
            const file = input.files[0];
            // file type is only image.
            if (/^image\//.test(file.type)) {
                uploadImage(file);
            } else {
                console.warn("Only images can be uploaded here.");
            }
        };
    }

    function extractCurrentImages(){
        if(!quill) return []

        const contents= quill.getContents().ops
        if(!contents) return []
        let images=[]
        for(const delta of contents){
            if(delta.insert && delta.insert.image){
                images.push(delta.insert.image.split("/").at(-1))
            }
        }
        return images
    }
    function insertToEditor(url:string) {
        if(!quill) return
        // push image url to editor.
        const range = quill.getSelection();
        let idx=range?range.index:0
        quill.insertEmbed(idx, "image", url);
        //limit image width to 300px
        quill.formatText(idx, 1, 'width', '300px');
    }
    function cancel(){
        window.location.href="/"
    }
    
    
    return (<div id="writepost-root">
       

        <div className="toolbar">
            <button className="button dark" onClick={cancel}><RiArrowLeftSLine />Cancel</button>
            <b>{postUrl?"Edit":"Write"} Post</b>
            <button className="button" onClick={save}><RiSave3Line />Save</button>
        </div>
        <div className="editor">
            <div id="title-container"><input id="title" placeholder="Title"></input></div>
            <div id="content">
                <div id="image"></div>
                <div id="quill-root">
                </div>
            </div>
        </div>
    </div>)

}