import { GrGamepad } from "react-icons/gr"
import "../../styles/home.scss"
import { RiBarChartFill, RiBillFill, RiMessage2Fill } from "react-icons/ri"
import { Link } from "react-router-dom"
import { TbWorldQuestion } from "react-icons/tb"
import { createRoom } from "../../api/room"
import { randName } from "../../types/names"

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
                        <p>A multiplayer role-playing game that combined traditional dice game(snakes-and-ladders) and RPG-style combat.</p>
						<div>
							<div className="mainbtn button-19 divlink" onClick={quickplay}>
                            {/* <Link to="/match" reloadDocument className="divlink"></Link> */}

								<GrGamepad />
								<b>Quick Play</b>
								<br></br>
								Play with computer or other players
							</div>
							<div className="mainbtn btn-dark button-19 divlink">
                                <Link reloadDocument to="/stat" className="divlink"></Link>
								<RiBarChartFill />
								<b>Statistics</b>
								<br></br>
								Check game records and character analysis
							</div>
						</div>
					</div>
				</div>

				<div className="section section-dark">
					<div>
						<h1>MockStock</h1>
                        <p>Achieve a largest possible profit in trade simulation</p>
						<button className="mainbtn button-19 divlink">
                        <Link to="/stockgame" className="divlink"></Link>
							<img src="/stock.png"></img>
							<b>Play Now</b>
							<br></br>
							
						</button>
					</div>
					<div>
						<img className="largeimg" src="/home/bg.jpg"></img>
					</div>
				</div>
				<div>
					<h1>Other Features</h1>
				</div>
				<div className="section section-dark" style={{flexWrap:"wrap"}}>


                <div className="card card-2 divlink">
                        <Link to="https://jkvin114.github.io/Snakes-and-Ladders-RPG-wiki/index.html" className="divlink"></Link>

						<div className="card__icon">
							<TbWorldQuestion /> Wiki Page
						</div>
						<h2 className="card__title">Visit wiki page of Snakes-and-Ladders RPG</h2>
						<p className="card__apply">
							<a className="card__link">
                                Try it
							</a>
						</p>
					</div>

					<div className="card card-4 divlink">
                        <Link to="/board" className="divlink"></Link>
						<div className="card__icon">
							<RiBillFill />Post Board
						</div>
						<h2 className="card__title">Write and share post, and discuss with others.</h2>
						<p className="card__apply">
							<a className="card__link">
								Try it
							</a>
						</p>
					</div>

                    <div className="card card-1 divlink">
                        <Link to="/" className="divlink"></Link>

						<div className="card__icon">
							<RiMessage2Fill /> Group Chat
						</div>
						<h2 className="card__title">Chat with your friends.</h2>
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
