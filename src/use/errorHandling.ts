import { ref, unref, type Ref } from 'vue'

const errorCode: Ref<number | null> = ref(null)
const errorMessage: Ref<string> = ref('')
const isSubmitLocked: Ref<boolean> = ref(false)
const resetErrorState = (): void => {
	errorCode.value = null
	errorMessage.value = ''
	isSubmitLocked.value = false
}

const isEmpty = (...args: any[]): boolean => args.some(val => !unref(val).length)

const beforeSubmit = (): void => {
	isSubmitLocked.value = true
	// errorCode.value = null
}

const handleSubmitError = (error: any): void => {
	// TODO error handling
	console.log(error)
	isSubmitLocked.value = false
}

export const useErrorHandling = () => ({
	errorCode,
	errorMessage,
	isSubmitLocked,
	isEmpty,
	beforeSubmit,
	handleSubmitError,
	resetErrorState,
})
