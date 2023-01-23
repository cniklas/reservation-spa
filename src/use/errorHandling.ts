import { ref, unref, reactive, type Ref } from 'vue'
import { compareTwoStrings } from 'string-similarity'

const SIMILARITY_LIMIT = 0.64

const errorCode: Ref<number | null> = ref(null)
const errorMessage: Ref<string> = ref('')
const isSubmitLocked: Ref<boolean> = ref(false)
const unlockSubmit = (): void => {
	isSubmitLocked.value = false
}
const resetErrorState = (): void => {
	errorCode.value = null
	errorMessage.value = ''
	unlockSubmit()
}

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

const errorsList: Map<string, string> = reactive(new Map())
// const addError = (key: string, message: string): void => {
// 	errorsList.set(key, message)
// }
// const removeError = (key: string, element: HTMLInputElement | null): void => {
// 	if (errorsList.has(key) && (element?.checkValidity() ?? true)) {
// 		errorsList.delete(key)
// 	}
// }
// const validateField = (key: string, element: HTMLInputElement | null): void => {
// 	if (!(element?.checkValidity() ?? true)) {
// 		let validationMessage = 'Der angegebene Wert ist ungültig'

// 		switch (true) {
// 			case ['cell_group_members', 'excused', 'unexcused'].includes(key):
// 				validationMessage = `Bitte trage eine Zahl zwischen ${element.min} und ${element.max} ein`
// 				break
// 			case ['visitors', 'guests', 'missionaries'].includes(key):
// 				validationMessage = `Der angegebene Wert darf nicht größer sein als ${element.max}`
// 				break
// 			case ['overall_impression', 'touched', 'vision'].includes(key):
// 				validationMessage = 'Bitte auswählen'
// 				break
// 		}

// 		errorsList.set(key, validationMessage)
// 	} else {
// 		errorsList.delete(key)
// 	}
// }
const validateName = (key: string, name: string, reservations: string[]): void => {
	if (!name.length) {
		errorsList.delete(key)
		return
	}

	// there must be at least one space character
	if (name.match(/ /g) === null) {
		errorsList.set(key, 'Bitte Vor- und Nachnamen eintragen')
		return
	} else {
		errorsList.delete(key)
	}

	// 🔺 TODO auf Doubletten prüfen
	reservations.forEach(entry => {
		const similarity: number = compareTwoStrings(name, entry)
		if (similarity >= SIMILARITY_LIMIT) {
			console.log(`${name} vs. ${entry}:\n${similarity}`)
		}
	})
}
const resetValidation = () => {
	errorsList.clear()
}

export const useErrorHandling = () => ({
	errorCode,
	errorMessage,
	isSubmitLocked,
	unlockSubmit,
	isEmpty,
	beforeSubmit,
	handleSubmitError,
	resetErrorState,
	errorsList,
	validateName,
	resetValidation,
})
