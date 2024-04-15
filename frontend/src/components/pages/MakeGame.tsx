import { useSearchParams } from "react-router-dom"

import "../../styles/makegame.scss"
import "../../styles/form.scss"
import { createRoom } from "../../api/room"
import { randName } from "../../types/names"

export function MakeGamePage() {
	const [searchParams, _] = useSearchParams()
	const gametype = searchParams.get("type")
	if (gametype !== "rpg" && gametype !== "marble") {
		alert("Invalid game type!")
	}
	function submit() {
		let rname = (document.getElementById("room-name-input") as HTMLInputElement).value
		let pw = (document.getElementById("room-password-input") as HTMLInputElement).value
		let isPrivate = (document.getElementById("room_private") as HTMLInputElement).checked
		let isLoginOnly = (document.getElementById("room_loggedin_only") as HTMLInputElement).checked
        if (gametype !== "rpg" && gametype !== "marble") {
            return
        }
        createRoom(gametype,isPrivate,isLoginOnly,"",rname,pw)
	}

	return (
		<div id="makegame-root">
			<div className="form">
				<h1>
					Create {gametype === "rpg" && "RPG"} {gametype === "marble" && "Marble"} Game
				</h1>
				<div className="inputBox">
					<input type="text" name="room_name" id="room-name-input" lkey-ph="ph.room.name" />
					<i>Room Name(optional)</i>
				</div>

				<div className="inputBox">
					<input type="password" name="room_password" id="room-password-input" lkey-ph="ph.room.pw" />
					<i>Room Password(optional)</i>
				</div>

				{/* <input type='text' name="room_name" value=""  placeholder="Room Name(optional)" id="room-name-input"></input> */}
				{/* <br></br> */}
				{/* <input type='text' name="room_password" value="" lkey-ph="ph.room.pw" placeholder="Room Password(optional)" id="room-password-input"></input> */}
				<div id="room-settings">
					<div className="onesetting">
						<label className="switch">
							<input type="checkbox" name="room_private" className="toggleallstat" id="room_private"></input>
							<span className="switchslider"></span>
						</label>
						<label htmlFor="room_private" data-lkey="room.private">
							Make private
						</label>
					</div>
					<div className="onesetting">
						<label className="switch">
							<input
								type="checkbox"
								name="room_loggedin_only"
								className="toggleallstat"
								id="room_loggedin_only"></input>
							<span className="switchslider"></span>
						</label>
						<label htmlFor="room_loggedin_only" data-lkey="room.loginonly">
							Logged in user only
						</label>
					</div>
				</div>
				<button className="button" onClick={submit}>Create Game</button>
			</div>
		</div>
	)
}
