import { useEffect, useState } from "react";
import {Helmet} from "react-helmet";
import { PAGES } from "../rawpages";

type Props={
    htmlPath:string
}
type PageData={
  html:string,scripts:string[],modules:string[]
}
const sleep = (m: any) => new Promise((r) => setTimeout(r, m))

export default function HtmlPage({htmlPath}:Props){
    let[htmlData, setHtmlData] = useState<PageData>({
      html:"",scripts:[],modules:[]
    });
    let loaded=false

    
  async function fetchHtml() {
    if(loaded) return
    const pagedata:PageData=(PAGES as any)[htmlPath ]
    if(!pagedata) 
    {
      setHtmlData({html:`<h1>Cannot load a page</h1>`,scripts:[],modules:[]});
      return

    }

    try{
        const html=await (await fetch("html/"+pagedata.html)).text()
        setHtmlData({
          html:html,
          scripts:pagedata.scripts,
          modules:pagedata.modules
        })

    }
    catch(e){
      console.error(e)
      setHtmlData({html:`<h1>Cannot load a page</h1>`,scripts:[],modules:[]});
    }
  }
  useEffect(() => {
    fetchHtml();
  }, []);

  return(
    <div className="App">
      <div id="rawhtml" dangerouslySetInnerHTML={{ __html: htmlData.html }}></div>
      <Helmet>
        {htmlData.scripts.map((v,i)=>(<script src={v} key={i}></script>))}
        {htmlData.modules.map((v,i)=>(<script type="module" src={v} key={i}></script>))}

      </Helmet>
      {/* <iframe src="index-old.html" style={{width:"100vw",height:"100vh"}}></iframe> */}
    </div>
  );

}