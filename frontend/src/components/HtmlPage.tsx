import { useContext, useEffect, useState } from "react";
import {Helmet} from "react-helmet";
import { PAGES } from "../rawpages";
import { RootContext } from "../context/context";
import { backend_url } from "../variables";
import { useSearchParams } from "react-router-dom";
import GameInviteModal from "./GameInviteModal";

type Props={
    htmlPath:string
}
type PageData={
  html:string,scripts?:string[],modules?:string[]
}
const sleep = (m: any) => new Promise((r) => setTimeout(r, m))

export default function HtmlPage({htmlPath}:Props){
    let[htmlData, setHtmlData] = useState<PageData>({
      html:""
    });	
    
    const {context,setContext}= useContext(RootContext);
    const [isGame,setIsGame] = useState(false)
    let loaded=false
    const [ searchParams,_] = useSearchParams()
    const [isMatchingHost,setIsMatchingHost] = useState(false)
  async function fetchHtml() {
    if(loaded) return
    const pagedata:PageData=(PAGES as any)[htmlPath ]
    if(!pagedata) 
    {
      setHtmlData({html:`<h1>Cannot load a page</h1>`});
      return

    }

    try{
        console.log(pagedata.html)
        console.log(process.env.PUBLIC_URL)
        let htmlname = pagedata.html
        if(process.env.NODE_ENV==="production"){
            htmlname=htmlname.replace(".html",".txt")
        }
        console.log(process.env.NODE_ENV)
        console.log(htmlname)
        const html=await (await fetch("html/"+htmlname)).text()
        
        setHtmlData({
          html:html,
          scripts:pagedata.scripts,
          modules:pagedata.modules
        })

    }
    catch(e){
      console.error(e)
      setHtmlData({html:`<h1 style='color:red;'>Cannot load a page</h1><p style='color:red;'>${e}</p>`});
    }
    finally{
      const cover= document.getElementById("html-cover") as HTMLElement
      await sleep(200);
      cover.style.opacity="0";
      await sleep(500);
      cover.style.display="none"
    }
  }
  useEffect(() => {
    fetchHtml();
    if(htmlPath==="rpggame" || htmlPath==="marblegame" || htmlPath==="matching" ){
        setContext({...context,showToolbar:false})
        setIsGame(true)
    }
    if(htmlPath==="matching" && searchParams.get("join")!=="true" && context.loggedin){
      // alert("host")
      setIsMatchingHost(true)
    }
  }, []);

 
  return(
    <div className="App" >
      <div id="html-cover">
      </div>
      {isMatchingHost && 
        <GameInviteModal/>}
        <div id="rawhtml" className={isGame? "gamepage":""} dangerouslySetInnerHTML={{ __html: htmlData.html }} style={{position:"relative",height: "100vh"}}></div>
        <Helmet>
        <script> 
					 {/*line break is required here*/}
				{`const server_url = "${backend_url}"`}</script>

          {htmlData.scripts && htmlData.scripts.map((v,i)=>(<script src={v} key={i}></script>))}
          {htmlData.modules && htmlData.modules.map((v,i)=>(<script type="module" src={v} key={i}></script>))}
        </Helmet>
      
      
      {/* <iframe src="index-old.html" style={{width:"100vw",height:"100vh"}}></iframe> */}
    </div>
  );

}