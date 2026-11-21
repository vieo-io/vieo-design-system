/** Answers every media query as `matches`, since jsdom has no `matchMedia`. */
export function stubMedia(matches: boolean): void {
	window.matchMedia = (media: string) =>
		({
			matches,
			media,
			onchange: null,
			addEventListener: () => {},
			removeEventListener: () => {},
			addListener: () => {},
			removeListener: () => {},
			dispatchEvent: () => false,
		}) as MediaQueryList
}
