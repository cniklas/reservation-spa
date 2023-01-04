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

// eslint-disable-next-line no-unused-vars
const handleAuthError = (error: any): void => {
	// TODO error handling
	isSubmitLocked.value = false
}

export const useErrorHandling = () => ({
	errorCode,
	errorMessage,
	isSubmitLocked,
	isEmpty,
	beforeSubmit,
	handleAuthError,
	resetErrorState,
})
