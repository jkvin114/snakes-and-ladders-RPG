import { range } from "../../util"

type Props = {
	items: number[]
}
export default function RPGItem({ items }: Props) {
	const size = items.length - 1
	return (
		<>
			{range(size).map((i) => {
				if (items[i] === -1) {
					return (
						<div className="toast_itemimg scalable" key={i}>
							<img alt="empty" src="/res/img/store/emptyslot.png"></img>{" "}
						</div>
					)
				} else
					return (
						<div className="toast_itemimg" key={i}>
							<img src="/res/img/store/items.png" style={{ marginLeft: -1 * items[i] * 100 + "px" }}></img>{" "}
						</div>
					)
			})}
		</>
	)
}
