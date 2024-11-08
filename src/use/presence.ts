import { ref, readonly } from 'vue'
import { supabase } from '@/supabase'

const usersOnline = ref(0)

const channel = supabase.channel('tracking')
const subscribe = async () => {
	channel
		.on('presence', { event: 'sync' }, () => {
			usersOnline.value = Object.keys(channel.presenceState()).length
		})
		.subscribe(async status => {
			if (status === 'SUBSCRIBED') await channel.track({ online_at: new Date().toISOString() })
		})
}
const unsubscribe = async () => {
	channel.unsubscribe()
	usersOnline.value = 0
}

export const usePresence = () => ({
	usersOnline: readonly(usersOnline),
	subscribe,
	unsubscribe,
})
