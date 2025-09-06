const deathScreen = document.getElementById("death_overlay")
const deathTimer = document.getElementById("unban_timer")

let isDead = false
let deadTimer = 0
let remainingTimer = 9999
let serverSentDeathTimer = false

function Kill() {
    remainingTimer = 9999
    isDead = true
    deadTimer = 0
    serverSentDeathTimer = false

    deathScreen.style.backdropFilter = "grayscale(1)"
    deathScreen.style.visibility = "visible"
}

function UpdateDeath(dt) {
    deadTimer += dt
    remainingTimer -= dt

    if (remainingTimer <= 0) {
        isDead = false
    }
}

function ServerDeath(timer) {
    if (!isDead) {
        Kill()
    }
    serverSentDeathTimer = true
    remainingTimer = timer
}

function RenderDeath(ctx) {
    if (!isDead) {
        deathScreen.style.visibility = "hidden"
        deathScreen.style.backdropFilter = "grayscale(0)"
        return;
    }

    if (!serverSentDeathTimer) {
        deathTimer.innerText = `server hasn t yet`
        return
    }
    deathTimer.innerText = `u ban unban in: ${Math.round(remainingTimer)} sceonds`
}