class BannedPacket {
    packetId = 6

    Received(view) {
        console.log('Received ban packet, buffer size:', view.byteLength)
        console.log('Buffer content:', new Uint8Array(view.buffer))
        
        if (view.byteLength >= 4) {
            let duration = view.getFloat32(0, false)
            
            if (view.byteLength >= 8) {
                let playerId = view.getInt32(4, false)
                
                if (playerId === clientPlayerId) {
                    ServerDeath(duration)
                }
                
                this.showBanToast(duration, playerId === clientPlayerId)
            } else {
                console.error('Ban packet missing player ID data')
                this.showBanToast(duration, false)
            }
        } else {
            console.error('Ban packet too small, expected at least 4 bytes')
        }
    }

    showBanToast(duration, isOwnDeath) {
        const toast = document.createElement('div')
        toast.className = 'toast'
        toast.textContent = isOwnDeath 
            ? `💥 BOOM! You were banned for ${Math.round(duration)} seconds`
            : `💥 BOOM! Another player hit a mine!`
        document.body.appendChild(toast)

        setTimeout(() => {
            toast.remove()
        }, 3000)
    }
}