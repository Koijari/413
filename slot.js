// Slot Machine

// Constants
const SIGN_HEIGHT = 170
const SIGN_PCS = 10
const SIGN_TIME = 20
const SPINNER_COUNT = 4
const WINNINGS = {
    'king': 10,
    'martian': 6,
    '3king': 5,
    'ship': 5,
    'planet': 4,
    'star': 3
}
const SIGNS = ['star', 'ship', 'planet', 'martian', 'star', 
                'ship', 'king', 'star', 'martian', 'planet']

const getElId = (id) => document.getElementById(id)

const playSounds = {
    start: new Audio('sounds/spinStart.mp3'),
    roll: new Audio('sounds/rollTime.mp3'),
    win: new Audio('sounds/win.mp3')
}

// Game state
const gameState = {
    balance: Number(getElId('balance').innerHTML),
    stake: Number(getElId('stake').innerHTML),
    locks: Array(SPINNER_COUNT).fill(false),
    winLine: Array(SPINNER_COUNT).fill(null),
    lockedLine: Array(SPINNER_COUNT).fill(null),
    disableLocksNextRound: false, // lock disabler
    lockUsedThisRound: false // if locks are used this round, prevent locks (flag)
}

// Button listeners
getElId('play').addEventListener('mousedown', gameOn)
getElId('bet').addEventListener('mousedown', betUp)
for (let i = 0; i < SPINNER_COUNT; i++) {
    getElId(`lock${i}`).addEventListener('mousedown', () => toggleLock(i))
}

// Disable lock buttons on page load
window.onload = () => {
    disableLockButtons(true)
}

// Toggle lock function
function toggleLock(ind) {
    if (gameState.disableLocksNextRound) return // prevent locking if they should be disabled
    gameState.locks[ind] = !gameState.locks[ind]
    const lockBtn = getElId(`lock${ind}`)
    //Set lock
    if (gameState.locks[ind]) {
        getElId(`lock${ind}`).style.backgroundColor = 'red'
        getElId(`lock${ind}`).style.color = 'gold'
        lockBtn.classList.add('locked')
        lockBtn.classList.remove('unlocked')
        gameState.lockedLine[ind] = gameState.winLine[ind]
        gameState.lockUsedThisRound = true // set flag if any lock is used
    //Set unlock
    } else {
        getElId(`lock${ind}`).style.backgroundColor = 'darkred'
        getElId(`lock${ind}`).style.color = 'black'
        lockBtn.classList.add('unlocked')
        lockBtn.classList.remove('locked')
        gameState.lockedLine[ind] = null
        gameState.lockUsedThisRound = false
    }
}

// Game on function
function gameOn() {
    //Balance check & stake charge
    if (gameState.balance >= gameState.stake && gameState.balance > 0) {
        playSounds.start.play() //annoying sound effects =)
        playSounds.roll.play()
        gameState.balance -= gameState.stake
        getElId('balance').innerHTML = gameState.balance

        gameState.winLine = Array(SPINNER_COUNT).fill(null) //to wipe winLine arr

        for (let i = 0; i < SPINNER_COUNT; i++) {
            if (!gameState.locks[i]) { //check unlocked lines
                spinReel(getElId(`spin${i}`), i)
            } else {
                gameState.winLine[i] = gameState.lockedLine[i]
            }
        }

        disableButtons(true) //disable all buttons when spinners roll
        setTimeout(() => {
            checkWin()
            disableButtons(false)
            if (gameState.disableLocksNextRound || gameState.lockUsedThisRound) {
                disableLockButtons(true)
                gameState.disableLocksNextRound = false
                gameState.lockUsedThisRound = false // reset flag after use
            } else {
                disableLockButtons(false)
            }
            resetLocks()
        }, 4100)

        if (gameState.balance < gameState.stake) { //balance check
            getElId('stake').style.color = 'red'
        }
    }
}

// Spin function
function spinReel(spin, index) {
    disableLockButtons(true) //disable LOCK buttons when rolling
    const spinTime = (index + 2) * SIGN_PCS + randomizer(SIGN_PCS)
    const style = getComputedStyle(spin)
    const backgroundPositionY = parseFloat(style.backgroundPositionY)

    //New spin positions & spin style
    spin.style.transition = `background-position-y ${3 * spinTime * SIGN_TIME}ms 
        cubic-bezier(.98,-0.05,.44,1.06)`
    spin.style.backgroundPositionY = `${backgroundPositionY + spinTime * SIGN_HEIGHT}px`

    //WinLine sign positions after spin
    setTimeout(() => {
        const pos = Math.floor(((backgroundPositionY + spinTime * SIGN_HEIGHT) % (SIGN_HEIGHT * SIGN_PCS)) / SIGN_HEIGHT)
        gameState.winLine[index] = SIGNS[pos]
        //console.log(gameState.winLine)
    }, 4000)
}

// Check win function
function checkWin() {
    const signCount = {}
    gameState.winLine.forEach(sign => {
        if (sign) {
            signCount[sign] = (signCount[sign] || 0) + 1
        }
    })

    for (let sign in signCount) {
        if (signCount[sign] >= SPINNER_COUNT || (sign === 'king' && signCount['king'] === 3)) {
            const winAmount = gameState.stake * (sign === 'king' && signCount['king'] === 3 ? WINNINGS['3king'] : WINNINGS[sign])
            gameState.balance += winAmount
            getElId('balance').innerHTML = gameState.balance
            winWin(sign)
            gameState.disableLocksNextRound = true // disable locks for the next round after a win
            break
        }
    }
}

// Bet up function
function betUp() {
    if (gameState.stake < 3 && gameState.balance >= gameState.stake + 1) {
        gameState.stake += 1
    } else {
        gameState.stake = 1
    }
    getElId('stake').innerHTML = gameState.stake
}

// Disable PLAY/BET buttons function
function disableButtons(disable) {
    getElId('play').disabled = disable //to prevent use when spinners roll
    getElId('bet').disabled = disable
    getElId('play').classList.toggle('disabled', disable)
    getElId('bet').classList.toggle('disabled', disable)
}

// Disable lock buttons function
function disableLockButtons(disable) {
    for (let i = 0; i < SPINNER_COUNT; i++) {        
        getElId(`lock${i}`).disabled = disable
        getElId(`lock${i}`).classList.toggle('disabled', disable)
    }
}

// Reset locks function
function resetLocks() {
    gameState.locks.fill(false) //release LOCK buttons in use
    gameState.lockedLine.fill(null)
    for (let i = 0; i < SPINNER_COUNT; i++) {
        const lockBtn = getElId(`lock${i}`)
        lockBtn.classList.add('unlocked')
        getElId(`lock${i}`).style.backgroundColor = 'darkred'
        getElId(`lock${i}`).style.color = 'black'
        lockBtn.classList.remove('locked')
    }
}

//Some decor when win
function winWin(sign) {
    playSounds.win.play()
    getElId('winWin').style.backgroundColor = '#ffd70090'
    getElId('winWin').style.backgroundImage = `url('pics/${sign}.png')`
    getElId('winWin').innerHTML =`YOU WON!`
    setTimeout(() => {
        getElId('winWin').style.backgroundImage = 'none'
        getElId('winWin').innerHTML =``
    }, 3500)
}

// Utility function (some random behavior for spinners)
const randomizer = (input) => Math.floor(Math.random() * input)
