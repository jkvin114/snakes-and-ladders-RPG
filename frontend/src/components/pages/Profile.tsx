import { ChangeEvent, useEffect, useState } from "react"
import { AxiosApi } from "../../api/axios"
import { Link, useNavigate, useParams } from "react-router-dom"
import "../../styles/profile.scss"
import "../../styles/form.scss"

import type { IUserProfile } from "../../types/profile"
import FriendList from "../profile/FriendList"
import FollowList from "../profile/FollowList"
import { RiCloseFill, RiEditBoxLine, RiSettings5Fill } from "react-icons/ri"
import ProfileSetting from "../profile/ProfileSetting"
import MarbleStatPage from "./MarbleStat"
import RPGPlayerStatPage from "./RPGPlayerStat"
import ProfileImg from "../ProfileImg"

type Props = {
	modal?: "friend" | "follower" | "following" | "setting"
}

export default function ProfilePage({ modal }: Props) {
	const [profile, setProfile] = useState<IUserProfile>({
		isFriend: false,
		isFollowing: false,
		username: "",
		email: "",
		profile: "",
		isme: false,
		isadmin: false,
		isLogined: false,
		requestedFrield:false,
		counts: [0, 0, 0, 0, 0, 0, 0,0,0,0],
		id:""
	})
	const { username } = useParams()
	const navigate = useNavigate()

	let storedName = localStorage.getItem("username")
	const name = username ? username : storedName
	const isMyPage = name && storedName === username
	useEffect(() => {
		if (!name) {
			window.location.href = "/login"
			return
		}
		if (!username) {
			window.location.href="/user/" + name
			return
		}
		AxiosApi.get("/api/user/" + name)
			.then((res) => {
				console.log(res.data)
				setProfile(res.data as IUserProfile)
			})
			.catch((e) => {
				if (e.response.status === 404) {
					alert("User not found")
				} else throw Error(e)
			})
	}, [username])
	useEffect(() => {
		if (!name) {
			navigate("/login")
			return
		}
		if (!isMyPage && modal === "setting") {
			navigate("/user/" + name)
			return
		}
	}, [modal])
	function logout() {
		if (!window.confirm("Are you sure you want to log out?")) return
		AxiosApi.post("/api/user/logout")
			.then((r) => {
				localStorage.removeItem("username")
				localStorage.removeItem("loggedin")
				window.location.href = "/user/" + name
			})
			.catch((e) => console.error(e))
	}
	function golink(s: string) {
		window.location.href = s
	}

	function friendRequest() {
		AxiosApi.post("/api/user/relation/friend_request/send", { username: profile.username })
			.then((res) => {
				if (res.status === 200) setProfile({ ...profile, isFriend: true })
			})
			.catch((e) => {
				if (e.response.status === 401) alert("login required")
				else throw Error(e)
			})
	}
	function follow() {
		AxiosApi.post("/api/user/relation/follow", { username: profile.username })
			.then((res) => {
				if (res.status === 200) setProfile({ ...profile, isFollowing: true })
			})
			.catch((e) => {
				if (e.response.status === 401) alert("login required")
				else throw Error(e)
			})
	}
	function unfollow() {
		AxiosApi.post("/api/user/relation/unfollow", { username: profile.username })
			.then((res) => {
				if (res.status === 200) setProfile({ ...profile, isFollowing: false })
			})
			.catch((e) => {
				if (e.response.status === 401) alert("login required")
				else throw Error(e)
			})
	}

	const uploadImage = (event: ChangeEvent<HTMLInputElement>) => {
		const selectedImage = event.target.files && event.target.files[0]
		if (selectedImage) {
			const formData = new FormData()
			formData.append("img", selectedImage)

			AxiosApi.post("/api/user/profileimg", formData)
				.then((res) => {
					alert("Profile image updated")
					navigate(0)
				})
				.catch((e) => {
					console.error(e)
					alert("Failed to update progile image")
				})
		}
	}

	return (
		<div id="profile-root" style={{ position: "relative" }}>
			<div style={{ textAlign: "center" }}>
				<div id="profilepage_container">
					<div className="profile">
						{profile.isme && (
							<div className="profile-toolbar">
								<div>
									<Link className="divlink" to={`/user/${name}/setting`}>
										<RiSettings5Fill />
									</Link>
								</div>
							</div>
						)}
						<div className={"profileimg-container" + (!profile.profile || profile.profile === "" ? " " : " has-img")}>
							{!profile.profile || profile.profile === "" ? (
								<a>{profile.username.charAt(0).toUpperCase()}</a>
							) : (
								<ProfileImg className="profileimg" src={profile.profile}/>
								// <img className="profileimg" src={"/uploads/profile/" + profile.profile}></img>
							)}
							{profile.isme && (
								<>
									<label htmlFor="img" className="editimg">
										<RiEditBoxLine />
									</label>
									<input
										type="file"
										id="img"
										accept="image/jpg,image/png,image/jpeg"
										onChange={uploadImage}
										hidden={true}
									/>
								</>
							)}
						</div>

						<div className="userinfo">
							<div className="username" style={{ fontSize: "25px", margin: "4px" }}>
								<b>{profile.username}</b>
							</div>
							<div className="email">Email:{profile.email} </div>
							{profile.isme && (
								<>
									<a
										style={{ textDecoration: "underline", cursor: "pointer" }}
										onClick={logout}
										{...{ lkey: "logout" }}>
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
										profile.requestedFrield ?
										<b className="button">
											<img src="/res/img/ui/confirm.png" style={{ width: "15px", verticalAlign: "middle" }} />
											<b data-lkey="mypage.friend">Friend Request Sent</b>
										</b> :
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
							<Link to={`/user/${name}/friend`} preventScrollReset={true} className="divlink" replace={true}></Link>
							<b data-lkey="mypage.friends">Friends</b> <a className="count">{"(" + profile.counts[0] + ")"}</a>
						</div>
						{profile.isme && (
							<>
								<div className="linkbtn divlink">
									<Link className="divlink" to={`/user/${name}/following`} replace={true}></Link>
									<b>Following</b> <a className="count">{"(" + profile.counts[1] + ")"}</a>
								</div>
								<div className="linkbtn divlink">
									<Link className="divlink" to={`/user/${name}/follower`} replace={true}></Link>
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
						<div className="linkbtn divlink">
							<a className="divlink" href={`/board/user/${profile.username}/comments`}></a>
							<b data-lkey="mypage.comments">Comments</b> <a className="count">{"(" + profile.counts[4] + ")"}</a>
						</div>
						<div className="linkbtn divlink">
							<a className="divlink" href={`/board/user/${profile.username}/likes`}></a>
							<b data-lkey="mypage.likes">Liked Posts</b> <a className="count">{"(" + profile.counts[5] + ")"}</a>
						</div>
						<div className="linkbtn divlink">
							<Link className="divlink" to={`/rpg_stat?username=${profile.username}`}></Link>
							<b data-lkey="mypage.rpgggames">RPG Gameplays <a className="count">{"(" + profile.counts[8] + ")"}</a></b> 
						</div>

						<div className="linkbtn divlink">
							<Link className="divlink" to={`/marble_stat?username=${profile.username}`}></Link>
							<b data-lkey="mypage.marblegames">Marble Gameplays <a className="count">{"(" + profile.counts[7] + ")"}</a></b> 
						</div>
						<div className="linkbtn divlink">
							<Link className="divlink" to={`/stockgame/user/${profile.id}`}></Link>
							<b data-lkey="mypage.marblegames">MockStock Profile </b> 
						</div>
						{profile.isadmin && <button onClick={() => golink("/admin")}>Admin page</button>}
					</div>
				</div>
			</div>
			{modal && (
				<div className="shadow divlink">
					<Link className="divlink" to={`/user/${name}`} replace={true}></Link>
				</div>
			)}
			{modal && (
				<div className={"profile-modal "+ (modal==="setting"?"wide":"")} >
					<div className="modal-toolbar">
						<b>
							{modal === "friend" && "Friends"}
							{modal === "follower" && "Follower"}
							{modal === "following" && "Following"}
							{modal === "setting" && "Setting"}
						</b>
						<div className="divlink modal-close">
							<Link className="divlink" to={`/user/${name}`} replace={true}>
								<RiCloseFill />
							</Link>
						</div>
					</div>
					<div className="modal-content">
						{modal === "friend" && <FriendList username={name as string | undefined}></FriendList>}
						{modal === "follower" && <FollowList username={name as string | undefined} type="follower"></FollowList>}
						{modal === "following" && <FollowList username={name as string | undefined} type="following"></FollowList>}
						{modal === "setting" && isMyPage && <ProfileSetting hasImg={!!profile.profile} username={name as string | undefined} />}
					</div>
				</div>
			)}
		</div>
	)
}
