import { ref, readonly } from 'vue'

type Toast = {
	id: number
	message: string
	type: string
	duration: number | null
}

let tid = 0
const toasts = ref<Toast[]>([])

const addToast = (type: string, message: string, duration: number | null = null) => {
	toasts.value.push({
		id: ++tid,
		message,
		type,
		duration: duration !== null ? duration : type === 'success' ? 2400 : null,
	})
}

const removeToast = (id: number) => {
	const index = toasts.value.findIndex(item => item.id === id)
	if (index >= 0) toasts.value.splice(index, 1)
}

export const useToast = () => ({
	toasts: readonly(toasts.value),
	addToast,
	removeToast,
})
