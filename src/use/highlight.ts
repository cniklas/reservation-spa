import { watch, nextTick, type Ref } from 'vue'

export const useHighlight = (selector: string, key: string, searchRef: Ref<string>) => {
	// https://codepen.io/jensimmons/pen/vYbvrjq
	const highlight = async (search: string) => {
		if (!CSS.highlights) return

		await nextTick()
		CSS.highlights.clear()
		if (search.length < 3) return

		const nodeList = document.querySelectorAll(selector) ?? []
		const textNodes: Node[] = []
		nodeList.forEach(el => {
			const treeWalker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
			let currentNode = treeWalker.nextNode()
			while (currentNode) {
				textNodes.push(currentNode)
				currentNode = treeWalker.nextNode()
			}
		})

		search = search.toLowerCase()

		// iterate over all text nodes and find matches
		const ranges = textNodes
			.map(el => ({ el, text: el.textContent?.toLowerCase() ?? '' }))
			.map(({ text, el }) => {
				const indices = []
				let startPos = 0
				while (startPos < text.length) {
					const index = text.indexOf(search, startPos)
					if (index === -1) break
					indices.push(index)
					startPos = index + search.length
				}

				// create a range object for each instance of `search` we found in the text node
				return indices.map(index => {
					const range = new Range()
					range.setStart(el, index)
					range.setEnd(el, index + search.length)
					return range
				})
			})

		// create a Highlight object for the ranges
		const searchResults = new Highlight(...ranges.flat())

		// register the Highlight object in the registry
		CSS.highlights.set(key, searchResults)
	}

	watch(searchRef, highlight)
}
