import { ref, watch, type ComputedRef } from 'vue'

export const COUNT_UP_THRESHOLD = 24

export const useCountUp = (count: ComputedRef<number>) => {
	const countUp = ref(0)
	watch(
		count,
		async () => {
			countUp.value = 0
			await new Promise(resolve => window.requestAnimationFrame(resolve))
			await new Promise(resolve => window.setTimeout(resolve, 0))
			countUp.value = count.value
		},
		{ immediate: true },
	)

	return { countUp }
}
