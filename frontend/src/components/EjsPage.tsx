import { useEffect, useState } from "react"
import { Helmet } from "react-helmet"
import { PAGES } from "../rawpages"
import { AxiosApi } from "../api/axios"
import { useLocation } from "react-router-dom"
type PageData = {
	html: string
	scripts?: string[]
	mainScript?: string
}
const sleep = (m: any) => new Promise((r) => setTimeout(r, m))

export default function EjsPage() {
	let [htmlData, setHtmlData] = useState<PageData>({
		html: "",
	})
	let loaded = false
	const { pathname, search } = useLocation()

	function fetchHtml() {
		if (loaded) return
		const pagedata: PageData = PAGES.board
		if (!pagedata) {
			setHtmlData({ html: `<h1>Cannot load a page</h1>` })
			return
		}
		AxiosApi.get(pathname + search)
			.then((res) => {
				setHtmlData({
					html: res.data.html,
					scripts: pagedata.scripts,
					mainScript: "/src/board/" + res.data.script + ".js",
				})
			})
			.catch((e) => {
				console.error(e)
				setHtmlData({ html: `<h1 style='color:red;'>Cannot load a page</h1><p style='color:red;'>${e}</p>` })
			})
			.finally(async () => {
				const cover = document.getElementById("html-cover") as HTMLElement
				await sleep(200)
				cover.style.opacity = "0"
				await sleep(500)
				cover.style.display = "none"
			})
	}
	useEffect(fetchHtml, [])

	return (
		<div className="App">
			<div id="html-cover"></div>
			<div id="rawhtml" dangerouslySetInnerHTML={{ __html: htmlData.html }}></div>
			<Helmet>
				{htmlData.mainScript && <script src={htmlData.mainScript}></script>}
				{htmlData.scripts && htmlData.scripts.map((v, i) => <script src={v} key={i}></script>)}
			</Helmet>

			{/* <iframe src="index-old.html" style={{width:"100vw",height:"100vh"}}></iframe> */}
		</div>
	)
}
