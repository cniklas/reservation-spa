import { ref, unref, reactive, type Ref } from 'vue'
import { compareTwoStrings } from 'string-similarity'
import type { Reservation } from '@/types/Reservation.type'

const SIMILARITY_LIMIT = 0.64

export const useErrorHandling = () => {
	const errorCode: Ref<number | null> = ref(null)
	const errorMessage: Ref<string> = ref('')
	const isSubmitLocked: Ref<boolean> = ref(false)
	const unlockSubmit = (): void => {
		isSubmitLocked.value = false
	}
	// const resetErrorState = (): void => {
	// 	errorCode.value = null
	// 	errorMessage.value = ''
	// 	unlockSubmit()
	// }

	const isEmpty = (...args: any[]): boolean => args.some(val => !unref(val).length)

	const beforeSubmit = (): void => {
		isSubmitLocked.value = true
		// errorCode.value = null
	}

	const handleSubmitError = (error: any): void => {
		// TODO error handling
		console.log(error)
		unlockSubmit()
	}

	const validationErrors: Map<string, string | string[]> = reactive(new Map())
	// const addError = (key: string, message: string): void => {
	// 	validationErrors.set(key, message)
	// }
	// const removeError = (key: string, element: HTMLInputElement | null): void => {
	// 	if (validationErrors.has(key) && (element?.checkValidity() ?? true)) {
	// 		validationErrors.delete(key)
	// 	}
	// }
	// const resetValidation = (): void => {
	// 	validationErrors.clear()
	// }

	const validateName = (key: string, name: string, reservations: Reservation[]): void => {
		if (!name.length) {
			validationErrors.delete(key)
			return
		}

		// there must be at least one space character
		if (name.match(/ /g) === null) {
			validationErrors.set(key, 'Bitte trage Vor- und Nachnamen ein')
			return
		}

		validationErrors.delete(key)

		reservations.forEach((entry: Reservation) => {
			const similarity: number = compareTwoStrings(name.toLowerCase(), entry.name.toLowerCase())
			if (similarity >= SIMILARITY_LIMIT) {
				// console.log(`${name} vs. ${entry.name}:\n${similarity}`)
				validationErrors.set(key, [...(validationErrors.get(key) ?? []), `${entry.name} an ${entry.table}`])
			}
		})
	}

	return {
		errorCode,
		errorMessage,
		isSubmitLocked,
		unlockSubmit,
		isEmpty,
		beforeSubmit,
		handleSubmitError,
		// resetErrorState,
		validationErrors,
		validateName,
		// resetValidation,
	}
}
