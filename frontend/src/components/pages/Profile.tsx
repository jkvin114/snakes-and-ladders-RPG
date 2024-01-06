import { useEffect, useState } from "react"
import { AxiosApi } from "../../api/axios"
import { useParams } from "react-router-dom"
import "../../styles/profile.scss"
interface IUserProfile {
	isFriend: boolean
	isFollowing: boolean
	username: string
	email: string
	profile: string
	isme: boolean
	isadmin: boolean
	isLogined: boolean
	counts: number[] //length = 7
}

export default function ProfilePage() {
	const [profile, setProfile] = useState<IUserProfile>({
		isFriend: false,
		isFollowing: false,
		username: "",
		email: "",
		profile: "",
		isme: false,
		isadmin: false,
		isLogined: false,
		counts: [0, 0, 0, 0, 0, 0, 0],
	})
	const { username } = useParams()
	let storedName = localStorage.getItem("username")
	const name = username ? username : storedName

	useEffect(() => {
		if (!name) {
			window.location.href = "/login"
			return
		}
		AxiosApi.get("/user/" + name)
			.then((res) => {
				setProfile(res.data as IUserProfile)
			})
			.catch((e) => {
				if (e.response.status === 404) {
					alert("User not found")
				} else throw Error(e)
			})

	}, [])
	function logout() {
		if (!window.confirm("Are you sure you want to log out?")) return
		AxiosApi.post("/user/logout")
			.then((r) => {
				localStorage.removeItem("username")
				window.location.href = "/user/" + name
			})
			.catch((e) => console.error(e))
	}
	function golink(s: string) {
		window.location.href = s
	}

	function friendRequest() {
		AxiosApi.post("/user/relation/friend_request", { username: profile.username })
			.then((res) => {
				if (res.status === 200) setProfile({ ...profile, isFriend: true })
			})
			.catch((e) => {
				if (e.response.status === 401) alert("login required")
				else throw Error(e)
			})
	}
	function follow() {
		AxiosApi.post("/user/relation/follow", { username: profile.username })
			.then((res) => {
				if (res.status === 200) setProfile({ ...profile, isFollowing: true })
			})
			.catch((e) => {
				if (e.response.status === 401) alert("login required")
				else throw Error(e)
			})
	}
	function unfollow() {
		AxiosApi.post("/user/relation/unfollow", { username: profile.username })
			.then((res) => {
				if (res.status === 200) setProfile({ ...profile, isFollowing: false })
			})
			.catch((e) => {
				if (e.response.status === 401) alert("login required")
				else throw Error(e)
			})
	}
	return (
		<div style={{ textAlign: "center" }}>
			<div id="profilepage_container">
				<div className="profile">
					<div className={"profileimg-container" + (!profile.profile || profile.profile === "" ? " " : " has-img")}>
						{!profile.profile || profile.profile === "" ? (
							<a>{profile.username.charAt(0).toUpperCase()}</a>
						) : (
							<img className="profileimg" src={"/uploads/profile/" + profile.profile}></img>
						)}
					</div>

					<div className="userinfo">
						<div className="username" style={{ fontSize: "25px", margin: "4px" }}>
							<b>{profile.username}</b>
						</div>
						<div className="email">Email:{profile.email} </div>
						{profile.isme && (
							<>
								<a style={{ textDecoration: "underline", cursor: "pointer" }} onClick={logout} {...{ lkey: "logout" }}>
									Logout
								</a>
							</>
						)}
					</div>
				</div>
				<div style={{ textAlign: "center" }}>
					{!profile.isme && profile.isLogined && (
						<>
							<hr />
							<div style={{ display: "inline" }}>
								{profile.isFriend ? (
									<b className="button" style={{ color: "rgb(135, 255, 126)" }}>
										<img src="/res/img/ui/confirm.png" style={{ width: "15px", verticalAlign: "middle" }} />
										<b data-lkey="mypage.friend">Friend</b>
									</b>
								) : (
									<button
										className="button"
										id="friend-request-btn"
										onClick={friendRequest}
										data-lkey="mypage.friendrequest">
										Friend request
									</button>
								)}
							</div>
							<div style={{ display: "inline" }}>
								{profile.isFollowing ? (
									<button className="button" id="unfollow-btn" onClick={unfollow} data-lkey="mypage.unfollow">
										Unfollow
									</button>
								) : (
									<button
										className="button"
										id="follow-btn"
										onClick={follow}
										style={{ background: "#7E00BF" }}
										data-lkey="mypage.follow">
										Follow
									</button>
								)}
							</div>
						</>
					)}
				</div>
				<div className="content">
					<div className="linkbtn divlink">
                    <a className="divlink" href={`/relation/${profile.username}`}></a>

						<b data-lkey="mypage.friends">Friends</b> <a className="count">{"(" + profile.counts[0] + ")"}</a>
					</div>
					{profile.isme && (
						<>
							<div className="linkbtn divlink">
                            <a className="divlink" href={`/board/user/${profile.username}/following`}></a>

								<b>Following</b> <a className="count">{"(" + profile.counts[1] + ")"}</a>
							</div>
							<div className="linkbtn divlink" >
                            <a className="divlink" href={`/board/user/${profile.username}/followers`}></a>

								<b>Followers</b> <a className="count">{"(" + profile.counts[6] + ")"}</a>
							</div>
							<div className="linkbtn divlink">
                            <a className="divlink" href={`/board/user/${profile.username}/bookmarks`}></a>

								<b data-lkey="mypage.bookmarks">Bookmarks</b> <a className="count">{"(" + profile.counts[2] + ")"}</a>
							</div>
						</>
					)}

					<div className="linkbtn divlink">
                        <a className="divlink" href={`/board/user/${profile.username}/posts`}></a>
						<b data-lkey="mypage.posts">Posts</b> <a className="count">{"(" + profile.counts[3] + ")"}</a>
					</div>
					<div className="linkbtn divlink" >
                    <a className="divlink" href={`/board/user/${profile.username}/comments`}></a>
						<b data-lkey="mypage.comments">Comments</b> <a className="count">{"(" + profile.counts[4] + ")"}</a>
					</div>
					<div className="linkbtn divlink">
                    <a className="divlink" href={`/board/user/${profile.username}/likes`}></a>
                        <b data-lkey="mypage.likes">Liked Posts</b> <a className="count">{"(" + profile.counts[5] + ")"}</a>
					</div>

					{profile.isadmin && <button onClick={() => golink("/admin.html")}>Admin page</button>}
				</div>
			</div>
		</div>
	)
}
