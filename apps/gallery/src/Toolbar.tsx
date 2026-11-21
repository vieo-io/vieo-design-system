import { For } from '@solidjs/web'
import { DESIGNS, PALETTES } from '@vieo-io/tokens'
import { type Look, label } from './look'

type Props = { look: Look; onChange: (look: Look) => void }

const THEMES = ['system', 'light', 'dark']

export function Toolbar(props: Props) {
	const field = (key: keyof Look, title: string, names: readonly string[]) => (
		<label class='gallery-field'>
			<span>{title}</span>
			<select
				name={key}
				onChange={(event) =>
					props.onChange({ ...props.look, [key]: event.currentTarget.value })
				}
			>
				<For each={names}>
					{(name) => (
						<option value={name} selected={props.look[key] === name}>
							{label(name)}
						</option>
					)}
				</For>
			</select>
		</label>
	)
	return (
		<header class='gallery-toolbar'>
			<h1>Vieo components</h1>
			{field('design', 'Design', DESIGNS)}
			{field('palette', 'Palette', PALETTES)}
			{field('theme', 'Theme', THEMES)}
		</header>
	)
}
