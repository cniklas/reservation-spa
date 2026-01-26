import { ref, readonly } from 'vue'

type Toast = {
	id: number
	message: string
}

let tid = 0
const toasts = ref<Toast[]>([])

const addToast = (message: string) => {
	toasts.value.push({
		id: ++tid,
		message,
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
