import { ref, unref, reactive, type Ref } from 'vue'
import { compareTwoStrings } from 'string-similarity'
import type { Reservation } from '@/types/Reservation.type'

const SIMILARITY_LIMIT = 0.64

export const useErrorHandling = () => {
	const errorCode = ref<number | null>(null)
	const errorMessage = ref('')
	const isSubmitLocked = ref(false)
	const unlockSubmit = () => {
		isSubmitLocked.value = false
	}

	const isEmpty = (...args: (Ref<string> | string)[]) => args.some(val => !unref(val).length)

	const beforeSubmit = () => {
		isSubmitLocked.value = true
		// errorCode.value = null
	}

	const handleSubmitError = (error: unknown) => {
		// 🔺 TODO error handling
		console.log(error)
		unlockSubmit()
	}

	const validationErrors: Map<string, string | string[]> = reactive(new Map())

	const validateName = (key: string, name: string, reservations: Reservation[]) => {
		if (!name.length) {
			validationErrors.delete(key)
			return
		}

		// there must be at least one space character
		if (name.match(/ /g) === null) {
			validationErrors.set(key, 'Bitte trage Vor- und Nachnamen ein.')
			return
		}

		validationErrors.delete(key)

		reservations.forEach(entry => {
			const similarity = compareTwoStrings(name.toLowerCase(), entry.name.toLowerCase())
			if (similarity >= SIMILARITY_LIMIT) {
				validationErrors.set(key, [
					...(validationErrors.get(key) ?? []),
					`<span class="font-semibold">${entry.name}</span> an Tisch ${entry.table}`,
				])
			}
		})
	}

	const validateTableName = (name: string, tableNames: string[]) => {
		const found = tableNames.some(tableName => name.toLowerCase() === tableName.toLowerCase())
		if (found) {
			validationErrors.set('name', 'Bitte wähle einen anderen Namen')
		} else {
			validationErrors.delete('name')
		}
	}

	return {
		errorCode,
		errorMessage,
		isSubmitLocked,
		unlockSubmit,
		isEmpty,
		beforeSubmit,
		handleSubmitError,
		validationErrors,
		validateName,
		validateTableName,
	}
}
