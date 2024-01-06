import { useParams } from "react-router-dom";
import FriendList from "../profile/FriendList";
import FollowList from "../profile/FollowList";

export default function RelationPage(){
    const {username} = useParams()
    return(<>
    <h2>friend</h2>
    <FriendList username={username}></FriendList>
    <h2>following</h2>
    <FollowList username={username} type="following"></FollowList>
    <h2>followers</h2>
    <FollowList username={username} type="follower"></FollowList>
    </>)
}