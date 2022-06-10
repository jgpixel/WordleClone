import dictionairy from "./dictionairy.js";
import targetWords from "./targetWords.js";

const letterBoxes = [
    document.querySelectorAll("[data-grid-row-1] .letter-box"),
    document.querySelectorAll("[data-grid-row-2] .letter-box"),
    document.querySelectorAll("[data-grid-row-3] .letter-box"),
    document.querySelectorAll("[data-grid-row-4] .letter-box"),
    document.querySelectorAll("[data-grid-row-5] .letter-box"),
    document.querySelectorAll("[data-grid-row-6] .letter-box"),
];

const ANIMATION_DURATION = 250;

let animationRunning = false;

const alertsContainer = document.getElementById("alerts-container");

let rowPos = 0;
let colPos = 0;

const startYear = Math.floor(new Date().getFullYear() / 6) * 6;
const startDate = new Date(startYear, 0, 1);
const currentDate = new Date();
const daysDifference = Math.ceil(Math.abs(currentDate - startDate) / (86_400_000));
const targetWord = targetWords[daysDifference].split("");
// console.log("Target Word: ", targetWord.join("")); // UNCOMMENT THIS LINE TO LOG THE ANSWER!

const modalBg = document.getElementById("modal-bg");
const modal = document.getElementById("modal");

let gameOver = false;

const winningWordFromLocalStorage = JSON.parse(localStorage.getItem("winningWord"));
const gameInProgressFromLocalStorage = JSON.parse(localStorage.getItem("gameInProgress"));

if (gameInProgressFromLocalStorage === null) {
    localStorage.setItem("gameInProgress", JSON.stringify(true));
}

if (targetWord.join("") !== winningWordFromLocalStorage && !gameInProgressFromLocalStorage) {
    localStorage.setItem("board", JSON.stringify({
        0: "",
        1: "",
        2: "",
        3: "",
        4: "",
        5: ""
    }));
}

if (gameInProgressFromLocalStorage || winningWordFromLocalStorage === targetWord.join("")) {
    setTimeout(setBoard, 50);
}

let isDarkThemeFromLocalStorage = JSON.parse(localStorage.getItem("isDarkTheme"));
let isDarkTheme = isDarkThemeFromLocalStorage ?? true;

const keys = document.querySelectorAll("[data-key]");
const deleteBtn = document.getElementById("delete-btn");
const enterBtn = document.getElementById("enter-btn");

const keypressRegex = /[A-Za-z]{1}/;

document.addEventListener("keypress", e => {
    addLetter(e.key, letterBoxes[rowPos][colPos]);
});

document.addEventListener("keyup", e => {
    if (animationRunning || gameOver) return;

    switch (e.key) {
        case "Enter":
            enterGuess();
            break;
        case "Backspace":
            removeLetter(letterBoxes[rowPos][colPos - 1]);
            break;
    }
});

keys.forEach(key => {
    key.addEventListener("click", () => {
        addLetter(key.textContent.toLowerCase(), letterBoxes[rowPos][colPos]);
        key.blur();
    });
});

enterBtn.addEventListener("click", () => {
    enterGuess();
    enterBtn.blur();
});

deleteBtn.addEventListener("click", () => {
    removeLetter(letterBoxes[rowPos][colPos - 1]);
    deleteBtn.blur();
});

function enterGuess() {
    if (animationRunning || gameOver) return;
    else if (colPos < 5) {
        jitterLetterBoxes();
        sendAlert("Not enough letters");
        return;
    }

    let guessedWord = "";

    for (let i = 0; i < 5; i++) {
        guessedWord += letterBoxes[rowPos][i].textContent.toLowerCase();
    }

    if (dictionairy.includes(guessedWord)) {
        animationRunning = true;

        highlightLetterBoxes(guessedWord);

        saveBoardToLocalStorage(guessedWord);

        if (guessedWord === targetWord.join("")) {
            gameOver = true;

            localStorage.setItem("winningWord", JSON.stringify(targetWord.join("")));
            localStorage.setItem("gameInProgress", JSON.stringify(false));

            setTimeout(() => {
                jumpLetterBoxes();
                sendAlert(getWinMessage());
            }, ANIMATION_DURATION * 5 + 300);

            setTimeout(() => {
                showModal();
            }, ANIMATION_DURATION * 5 + 1400);
        } else if (rowPos >= 5) {
            gameOver = true;
            setTimeout(() => {
                sendAlert(targetWord.join("").toUpperCase(), true);
            }, ANIMATION_DURATION * 5 + 300);
        }
    } else {
        jitterLetterBoxes();
        sendAlert("Not in word list");
    }
}

function addLetter(letter, letterBox) {
    if (colPos >= 5 || rowPos >= 6 || !keypressRegex.test(letter) || letter === "Enter" || animationRunning || gameOver) return;

    letterBox.classList.add("letter-added");
    letterBox.classList.add("letter-added-animation");
    letterBox.textContent = letter;

    letterBox.addEventListener("animationend", () => {
        letterBox.classList.remove("letter-added-animation");
    }, { once: true });

    localStorage.setItem("gameInProgress", JSON.stringify(true));

    colPos++;
}

function removeLetter(letterBox) {
    if (colPos < 1 || animationRunning || gameOver) return;

    letterBox.classList.remove("letter-added");
    letterBox.textContent = "";

    colPos--;
}

function sendAlert(message, permanentAlert = false, duration = 1200) {
    const alert = document.createElement("span");
    alert.classList.add("alert");
    alert.textContent = message;

    alertsContainer.prepend(alert);

    if (permanentAlert) return;

    setTimeout(() => {
        alert.classList.add("hide");
        alert.addEventListener("transitionend", () => {
            alert.remove();
        }, { once: true })
    }, duration);
}

function getWinMessage() {
    switch (rowPos) {
        case 0:
            return "Genius";
        case 1:
            return "Magnificent";
        case 2:
            return "Impressive";
        case 3:
            return "Splendid";
        case 4:
            return "Great";
        default:
            return "Phew";
    }
}

// ========== ANIMATIONS ==========

function highlightLetterBoxes(guessedWord, settingBoard = false) {
    const colorClasses = getColorClasses(guessedWord);

    flipLetterBoxes(colorClasses);

    if (settingBoard) {
        animationRunning = true;

        const guessedWordArr = guessedWord.split("");

        for (let i = 0; i < colorClasses.length; i++) {
            const key = document.querySelector(`[data-${guessedWordArr[i]}]`);

            if (key.classList.contains("present")) {
                key.classList.remove("present");
            }

            key.classList.add(colorClasses[i]);

            letterBoxes[rowPos][i].textContent = guessedWord.split("")[i];
            if (guessedWord === targetWord.join("")) {
                gameOver = true;
                setTimeout(() => {
                    showModal();
                }, ANIMATION_DURATION * 5 + 500)
            }
        }

        if (gameOver) return;

        rowPos++
        colPos = 0;
    } else {
        setTimeout(() => {
            const guessedWordArr = guessedWord.split("");

            for (let i = 0; i < colorClasses.length; i++) {
                const key = document.querySelector(`[data-${guessedWordArr[i]}]`);

                if (key.classList.contains("present")) {
                    key.classList.remove("present");
                }

                key.classList.add(colorClasses[i]);
            }

            if (gameOver) return;

            animationRunning = false;
            rowPos++
            colPos = 0;
        }, ANIMATION_DURATION * 5 + 300);
    }
}

function getColorClasses(guessedWord) {
    const colorClasses = new Array(5);

    const guessedWordArr = guessedWord.split("");

    let remainingLettersInWord = targetWord.join("");

    for (let i = 0; i < 5; i++) {
        if (guessedWordArr[i] === targetWord[i]) {
            colorClasses[i] = "correct";

            remainingLettersInWord = remainingLettersInWord.replace(guessedWordArr[i], "");
        } else {
            colorClasses[i] = "absent";
        }
    }

    for (let i = 0; i < 5; i++) {
        if (remainingLettersInWord.includes(guessedWordArr[i])) {
            colorClasses[i] = "present";

            remainingLettersInWord = remainingLettersInWord.replace(guessedWordArr[i], "");
        }
    }

    return colorClasses;
}

function jitterLetterBoxes() {
    for (let i = 0; i < 5; i++) {
        jitterLetterBox(letterBoxes[rowPos][i]);
    }
}

function jitterLetterBox(letterBox) {
    letterBox.classList.add("jitter");

    letterBox.addEventListener("animationend", () => {
        letterBox.classList.remove("jitter");
    }, { once: true });
}

function flipLetterBoxes(colorClasses, row = rowPos) {
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            flipLetterBox(letterBoxes[row][i], colorClasses[i])
        }, ANIMATION_DURATION * i);
    }
}

function flipLetterBox(letterBox, colorClass) {
    letterBox.classList.add("flip-box");

    letterBox.addEventListener("transitionend", () => {
        letterBox.classList.remove("flip-box");
        letterBox.classList.add(colorClass);
    });
}

function jumpLetterBoxes() {
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            jumpLetterBox(letterBoxes[rowPos][i])
        }, ANIMATION_DURATION / 2 * i);
    }
}

function jumpLetterBox(letterBox) {
    letterBox.classList.add("jump");

    letterBox.addEventListener("transitionend", () => {
        letterBox.classList.remove("jump");
    });
}

// ========== BOARD STATE IN LOCAL STORAGE ==========

function setBoard() {
    const boardObjFromLocalStorage = JSON.parse(localStorage.getItem("board"));
    const boardObj = boardObjFromLocalStorage ?? {
        0: "",
        1: "",
        2: "",
        3: "",
        4: "",
        5: ""
    }

    for (const score in boardObj) {
        if (!boardObj[score]) break;

        highlightLetterBoxes(boardObj[score], true)
    }

    localStorage.setItem("board", JSON.stringify(boardObj));

    setTimeout(() => {
        animationRunning = false;
    }, ANIMATION_DURATION * 5 + 300);
}

function saveBoardToLocalStorage(guessedWord) {
    const boardObjFromLocalStorage = JSON.parse(localStorage.getItem("board"));
    const boardObj = boardObjFromLocalStorage ?? {
        0: "",
        1: "",
        2: "",
        3: "",
        4: "",
        5: ""
    };

    boardObj[rowPos] = guessedWord;

    localStorage.setItem("board", JSON.stringify(boardObj));
}

// ========== MODAL ==========

const closeModalBtn = document.getElementById("close-modal-btn");
const shareProjectBtn = document.getElementById("share-project-btn");

closeModalBtn.addEventListener("click", hideModal);

window.addEventListener("click", e => {
    if (e.target === modalBg) {
        hideModal();
    }
});

function hideModal() {
    modalBg.classList.add("hide-modal");
    modal.classList.add("hide-modal");


    modalBg.addEventListener("animationend", () => {
        modalBg.style.display = "none";
    });

    modal.addEventListener("animationend", () => {
        modal.classList.remove("hide-modal");
    });
}

function showModal() {
    modalBg.style.display = "block";

    modalBg.classList.add("show-modal");
    modal.classList.add("show-modal");

    modal.addEventListener("animationend", () => {
        modal.classList.remove("show-modal");
    });
}

shareProjectBtn.addEventListener("click", () => {
    navigator.clipboard.writeText("https://justinswordle.netlify.app/");

    hideModal();

    setTimeout(() => {
        sendAlert("Link to this project copied to clipboard", false, 3000);
    }, 200);
});

const countdownContainer = document.getElementById("countdown-container");

updateCountdown();

function updateCountdown() {
    const toDate = new Date();
    const tomorrow = new Date();

    tomorrow.setHours(24, 0, 0, 0);
    
    let diffMS = tomorrow.getTime() / 1000 - toDate.getTime() / 1000;
    let diffHr = Math.floor(diffMS / 3600);
    diffMS = diffMS - diffHr * 3600;
    let diffMi = Math.floor(diffMS / 60);
    diffMS = diffMS - diffMi * 60;

    let diffS = Math.floor(diffMS);
    let countdown = ((diffHr < 10) ? "0" + diffHr : diffHr);
    countdown += ":" + ((diffMi < 10) ? "0" + diffMi : diffMi);
    countdown += ":" + ((diffS < 10) ? "0" + diffS : diffS);

    countdownContainer.textContent = countdown;
}

setInterval(() => {
    updateCountdown();
}, 1000);

// ========== COLOR THEME ==========

const cssRoot = document.querySelector(":root");

const darkThemeColors = {
    "--bg": "#121213",
    "--text": "#FFFFFF",
    "--highlighted-letter": "#FFFFFF",
    "--default-border": "#3A3A3C",
    "--highlighted-border": "#565758",
    "--correct": "#538D4E",
    "--present": "#B59F3B",
    "--absent": "var(--default-border)",
    "--key-bg": "#818384"
}

const lightThemeColors = {
    "--bg": "#FFFFFF",
    "--text": "#121213",
    "--highlighted-letter": "#FFFFFF",
    "--default-border": "#D3D6DA",
    "--highlighted-border": "#878A8C",
    "--correct": "#6AAA64",
    "--present": "#C9B458",
    "--absent": "#787c7e",
    "--key-bg": "var(--default-border)"
}

const changeThemeBtn = document.getElementById("change-theme-btn");
const changeThemeIcon = document.getElementById("change-theme-icon");
const icons = document.querySelectorAll(".icon");

changeThemeBtn.addEventListener("click", () => {
    isDarkTheme = !isDarkTheme;
    changeThemeBtn.blur();
    setColorTheme();
});

function setColorTheme() {
    const currentTheme = isDarkTheme ? darkThemeColors : lightThemeColors;

    for (const variable in currentTheme) {
        cssRoot.style.setProperty(variable, currentTheme[variable]);
    }

    if (isDarkTheme) {
        icons.forEach(icon => {
            icon.classList.remove("light-theme");
        });
        changeThemeIcon.setAttribute("src", "src/icons/moon.svg");
    } else {
        icons.forEach(icon => {
            icon.classList.add("light-theme");
        });
        changeThemeIcon.setAttribute("src", "src/icons/sun.svg");
    }

    localStorage.setItem("isDarkTheme", JSON.stringify(isDarkTheme));
}

setColorTheme();