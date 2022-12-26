import { ref, unref } from 'vue'

const errorCode = ref(null)
const errorMessage = ref('')
const isSubmitLocked = ref(false)
const resetErrorState = () => {
	errorCode.value = null
	errorMessage.value = ''
	isSubmitLocked.value = false
}

const isEmpty = (...args) => args.some(val => !unref(val).length)

const beforeSubmit = () => {
	isSubmitLocked.value = true
	// errorCode.value = null
}

// eslint-disable-next-line no-unused-vars
const handleAuthError = error => {
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
