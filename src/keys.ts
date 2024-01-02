import type { InjectionKey, Ref } from 'vue'
import type { DocumentData } from 'firebase/firestore'
import type { TableDoc } from '@/types/TableDoc.type'

export const PROVIDE_TABLES: InjectionKey<Ref<TableDoc[] | undefined>> = Symbol('tables')
export const PROVIDE_UPDATE_DOCUMENT: InjectionKey<(id: string, data: DocumentData) => Promise<void>> =
	Symbol('updateDocument')
