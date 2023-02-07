import { ref, unref, type Ref } from 'vue'
import { compareTwoStrings } from 'string-similarity'
import type { Reservation } from '@/types/Reservation.type'

const SIMILARITY_LIMIT = 0.64

export const useErrorHandling = () => {
	const errorCode: Ref<number | null> = ref(null)
	const errorMessage = ref('')
	const isSubmitLocked = ref(false)
	const unlockSubmit = () => {
		isSubmitLocked.value = false
	}
	// const resetErrorState = () => {
	// 	errorCode.value = null
	// 	errorMessage.value = ''
	// 	unlockSubmit()
	// }

	const isEmpty = (...args: any[]) => args.some(val => !unref(val).length)

	const beforeSubmit = () => {
		isSubmitLocked.value = true
		// errorCode.value = null
	}

	const handleSubmitError = (error: any) => {
		// TODO error handling
		console.log(error)
		unlockSubmit()
	}

	const validationErrors: Ref<Map<string, string | string[]>> = ref(new Map())
	// const addError = (key: string, message: string) => {
	// 	validationErrors.set(key, message)
	// }
	// const removeError = (key: string, element: HTMLInputElement | null) => {
	// 	if (validationErrors.has(key) && (element?.checkValidity() ?? true)) {
	// 		validationErrors.delete(key)
	// 	}
	// }
	// const resetValidation = () => {
	// 	validationErrors.clear()
	// }

	const validateName = (key: string, name: string, reservations: Reservation[]) => {
		if (!name.length) {
			validationErrors.value.delete(key)
			return
		}

		// there must be at least one space character
		if (name.match(/ /g) === null) {
			validationErrors.value.set(key, 'Bitte trage Vor- und Nachnamen ein')
			return
		}

		validationErrors.value.delete(key)

		reservations.forEach(entry => {
			const similarity: number = compareTwoStrings(name.toLowerCase(), entry.name.toLowerCase())
			// console.log(`${name} vs. ${entry.name}:\n${similarity}`)
			if (similarity >= SIMILARITY_LIMIT) {
				validationErrors.value.set(key, [
					...(validationErrors.value.get(key) ?? []),
					`${entry.name} an Tisch ${entry.table}`,
				])
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
