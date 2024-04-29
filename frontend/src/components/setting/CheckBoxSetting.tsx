import type { ChangeEvent, ChangeEventHandler } from "react"
import Text from "../Text"

type Props = {
	namekey: string
	desckey?: string
	onChange: (e: ChangeEvent<HTMLInputElement>, id: string) => void
	id: string
	checked: boolean
} 

export default function CheckBoxSetting({ namekey: name, desckey: desc, onChange, id, checked }: Props) {
	return (
		<div className="onesetting">
			<label className="setting-name">
				<Text lkey={name}></Text>
			</label>
			{desc && <div className="setting-desc"><Text lkey={desc}></Text></div>}

			<label className="switch">
				<input type="checkbox" onChange={(e) => onChange(e, id)} checked={checked}></input>
				<span className="switchslider"></span>
			</label>
		</div>
	)
}
