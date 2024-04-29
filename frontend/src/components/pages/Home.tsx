import { GrGamepad } from "react-icons/gr"
import "../../styles/home.scss"
import { RiBarChartFill, RiBillFill, RiMessage2Fill } from "react-icons/ri"
import { Link } from "react-router-dom"
import { TbWorldQuestion } from "react-icons/tb"
import { createRoom } from "../../api/room"
import Text from "../Text"

export default function HomePage() {


	function quickplay(){
		createRoom("rpg",false,false)
	}

	return (
		<div id="homepage-root">
			<div className="homepage">
				<div className="section section-dark">
					<div>
						<img className="largeimg" src="/home/bg.jpg"></img>
					</div>

					<div>
						<h1>Snakes-and-Ladders RPG</h1>
                        <p><Text lkey="homepage.salr-desc"></Text></p>
						<div>
							<div className="mainbtn button-19 divlink" onClick={quickplay}>
                            {/* <Link to="/match" reloadDocument className="divlink"></Link> */}

								<GrGamepad />
								<b><Text lkey="homepage.quickplay"></Text></b>
								<br></br>
								<Text lkey="homepage.quickplay-desc"></Text>
							</div>
							<div className="mainbtn btn-dark button-19 divlink">
                                <Link reloadDocument to="/stat" className="divlink"></Link>
								<RiBarChartFill />
								<b><Text lkey="homepage.stat"></Text></b>
								<br></br>
								<Text lkey="homepage.stat-desc"></Text>
							</div>
						</div>
					</div>
				</div>

				<div className="section section-dark">
					<div>
						<h1>MockStock</h1>
                        <p><Text lkey="homepage.stockgame-desc"></Text></p>
						<button className="mainbtn button-19 divlink">
                        <Link to="/stockgame/play" className="divlink"></Link>
							<img src="/stock.png"></img>
							<b>Play Now</b>
							<br></br>
							
						</button>
					</div>
					<div>
						<img className="largeimg" src="stockgame.png"></img>
					</div>
				</div>
				<div>
					<h1><Text lkey="homepage.other.name"></Text></h1>
				</div>
				<div className="section section-dark" style={{flexWrap:"wrap"}}>


                <div className="card card-2 divlink">
                        <Link to="https://jkvin114.github.io/Snakes-and-Ladders-RPG-wiki/index.html" className="divlink"></Link>

						<div className="card__icon">
							<TbWorldQuestion /> <Text lkey="homepage.other.wiki"></Text>
						</div>
						<h2 className="card__title"><Text lkey="homepage.other.wiki-desc"></Text></h2>
						<p className="card__apply">
							<a className="card__link">
                                Try it
							</a>
						</p>
					</div>

					<div className="card card-4 divlink">
                        <Link to="/board" className="divlink"></Link>
						<div className="card__icon">
							<RiBillFill /><Text lkey="homepage.other.post"></Text>
						</div>
						<h2 className="card__title"><Text lkey="homepage.other.post-desc"></Text></h2>
						<p className="card__apply">
							<a className="card__link">
								Try it
							</a>
						</p>
					</div>

                    <div className="card card-1 divlink">
                        <Link to="/chat" className="divlink"></Link>

						<div className="card__icon">
							<RiMessage2Fill /> <Text lkey="homepage.other.chat"></Text>
						</div>
						<h2 className="card__title"><Text lkey="homepage.other.chat-desc"></Text></h2>
						<p className="card__apply">
							<a className="card__link">
                                Try it
							</a>
						</p>
					</div>


				</div>
			</div>
		</div>
	)
}
