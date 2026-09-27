/* ==========================================================================
   1. INIZIALIZZAZIONE E HACK PER iOS
   ========================================================================== */
// Questo abilita la pseudo-classe CSS :active su Safari (iPhone/iPad)
document.body.addEventListener('touchstart', function() {}, {passive: true});

/* ==========================================================================
   2. STATO GLOBALE DELL'APP (Le variabili di sessione)
   ========================================================================== */

let currentLevel = null; //ES: A1
let currentQuestion =  []; //Json caricati in memoria
let currentQuestionIndex = 0; //Cambierà con Randomizer
let isAnswered = false; //Evita doppi click durante le animazioni
let currentQuestionObj = null;
let answeredIDs = [];

/* ==========================================================================
   3. NAVIGAZIONE (Single Page Application)
   ========================================================================== */
// Riferimenti agli elementi HTML principali

const homeScreen = document.getElementById('home-screen');
const trainingScreen = document.getElementById('training-screen');
const currentLevelDisplay = document.getElementById('current-level-display');

/**
 * Funzione chiamata dai bottoni nella Home (es: startLevel('A1'))
 */
/**
 * Funzione chiamata dai bottoni nella Home
 */
// [MODIFICA 1: Rendi la funzione asincrona (async) per poter "aspettare" (await) il file JSON]
async function startLevel(levelId) {
    console.log(`Richiesto avvio livello: ${levelId}`);
    currentLevel = levelId;
    currentLevelDisplay.textContent = `Livello ${levelId}`;
    
    switchScreen(trainingScreen, homeScreen);
    
    document.getElementById('question-text').textContent = "Caricamento database...";
    document.getElementById('options-container').innerHTML = ''; 

    // --- NUOVO: CARICA IL SALVATAGGIO DAL TELEFONO ---
    const savedData = localStorage.getItem(`lingo_answered_${currentLevel}`);
    if (savedData) {
        answeredIDs = JSON.parse(savedData);
    } else {
        answeredIDs = []; // Se non hai mai giocato, parti da zero
    }
    console.log(`Domande già fatte caricate: ${answeredIDs.length}`);
    // ---------------------------------------------------

    const success = await fetchLevelData(levelId);
    
    if (success) {
        loadNextQuestion();
    } else {
        document.getElementById('question-text').textContent = "Errore: Dati non trovati. Connettiti a internet.";
    }
}

/**
 * [NUOVA FUNZIONE]: Il Lazy Loading
 * Scarica il file JSON corrispondente al livello scelto.
 */
async function fetchLevelData(levelId) {
    try {
        // La Fetch API del browser va a cercare il file locale
        const response = await fetch(`./data/data_${levelId}.json`);
        
        if (!response.ok) {
            throw new Error(`Impossibile caricare il file ${levelId}`);
        }
        
        // Salviamo l'intero array JSON nella variabile globale
        currentQuestions = await response.json();
        console.log(`Caricate ${currentQuestions.length} domande per il livello ${levelId}`);
        return true;
        
    } catch (error) {
        console.error("Errore di caricamento:", error);
        return false;
    }
}

/**
 * Funzione chiamata dal tasto "X" in alto a sinistra
 */

function returnToHome(){
    console.log("Ritorno alla Home");
    currentLevel = null;
    currentQuestion = [];
    isAnswered = false;
    hideFeedbackBanner();
    document.getElementById('options-container').innerHTML = ''; // Pulisce le opzioni
    switchScreen(homeScreen,trainingScreen);
}

/**
 * Utility per nascondere/mostrare i div principali
 */
function switchScreen(screenToShow, screenToHide) {
    screenToHide.classList.remove('active-screen');
    screenToHide.classList.add('hidden-screen');
    
    screenToShow.classList.remove('hidden-screen');
    screenToShow.classList.add('active-screen');
}

/* ==========================================================================
   4. TEST TEMPORANEO DELL'INTERFACCIA (Render Domanda)
   ========================================================================== */
/*   
function renderMockQuestion() {
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    
    // Domanda finta per testare la UI
    questionText.textContent = "I ___ a student.";
    
    // Ripuliamo eventuali bottoni precedenti
    optionsContainer.innerHTML = '';
    
    // Creiamo i bottoni finti
    const options = ["am", "is", "are", "be"];
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = opt;
        
        // Assegniamo l'evento click
        btn.onclick = () => handleAnswerMock(btn, opt);
        
        optionsContainer.appendChild(btn);
    });
}
*/

/*
function handleAnswerMock(clickedBtn, selectedValue) {
    if (isAnswered) return; // Impedisce doppi click
    isAnswered = true;
    
    const isCorrect = (selectedValue === "am");
    const banner = document.getElementById('feedback-banner');
    const title = document.getElementById('feedback-title');
    
    // Resettiamo classi del banner
    banner.className = 'feedback-banner';
    
    if (isCorrect) {
        clickedBtn.classList.add('correct');
        title.textContent = "Corretto!";
        banner.classList.add('is-correct');
    } else {
        clickedBtn.classList.add('wrong');
        title.textContent = "Sbagliato!";
        banner.classList.add('is-wrong');
    }
    
    // Mostriamo il banner (rimuovendo hidden)
    banner.classList.remove('hidden');
}
*/

function hideFeedbackBanner() {
    const banner = document.getElementById('feedback-banner');
    banner.className = 'feedback-banner hidden'; // Riapplica l'hidden che lo spinge giù
    
    // Azzera i testi in modo "silenzioso" mentre il banner è giù
    document.getElementById('feedback-explanation').textContent = "";
    document.getElementById('feedback-correct-if-wrong').textContent = "";
}

function loadNextQuestion() {
    isAnswered = false;
    hideFeedbackBanner();
    
    if (!currentQuestions || currentQuestions.length === 0) {
        console.error("Nessuna domanda disponibile.");
        return;
    }

    let availableQuestions = currentQuestions.filter(q => !answeredIDs.includes(q.id));

    // [MODIFICA]: Se l'array è vuoto, mostriamo il modale INVECE di rimescolare di nascosto
    if (availableQuestions.length === 0) {
        console.log("Domande esaurite. Mostro il modale di rimescolamento.");
        document.getElementById('completion-modal').classList.remove('hidden');
        return; // Ci fermiamo qui. Il gioco resta in pausa finché l'utente non clicca.
    }

    // Se ci sono domande, procediamo normalmente
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    currentQuestionObj = availableQuestions[randomIndex];
    
    if (currentQuestionObj) {
        renderQuestion(currentQuestionObj);
    }
}

/**
 * [NUOVA FUNZIONE]: Chiamata dal bottone nel modale
 * Azzera la memoria e riavvia il flusso
 */
function executeReshuffle() {
    // Nascondiamo il modale
    document.getElementById('completion-modal').classList.add('hidden');
    
    // Eseguiamo il rimescolamento dei dati
    answeredIDs = [];
    localStorage.removeItem(`lingo_answered_${currentLevel}`);
    
    // Riprendiamo a giocare (ora l'array sarà di nuovo pieno)
    loadNextQuestion();
}
/**
 * [NUOVA FUNZIONE]: Il Renderizzatore (Crea l'HTML in base al JSON)
 */
/**
 * Il Renderizzatore (Crea l'HTML in base al JSON)
 */

function renderQuestion(questionData) {
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    
    questionText.textContent = questionData.questionText;
    optionsContainer.innerHTML = '';
    
    // Rimuoviamo eventuali classi di stile vecchie
    optionsContainer.className = 'options-grid';
    
    // --- ADATTAMENTO STILE IN BASE AL TIPO ---
    if (questionData.type === 'true_false') {
        // Se è Vero/Falso, cambiamo la griglia per farli belli larghi
        optionsContainer.style.gridTemplateColumns = '1fr'; 
    } else {
        // Altrimenti (Scelta Multipla), torniamo a 2 colonne
        optionsContainer.style.gridTemplateColumns = '1fr 1fr'; 
    }
    
    const randomizedOptions = shuffleArray(questionData.options);
    
    randomizedOptions.forEach(optText => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = optText;
        
        btn.onclick = () => handleAnswerReal(btn, optText);
        
        optionsContainer.appendChild(btn);
    });
}
function handleAnswerReal(clickedBtn, selectedValue) {
    if (isAnswered) return;
    isAnswered = true;
    answeredIDs.push(currentQuestionObj.id);
    // Salviamo l'aggiornamento fisicamente nel telefono
    localStorage.setItem(`lingo_answered_${currentLevel}`, JSON.stringify(answeredIDs));
    // -----------------------------------------
    const isCorrect = (selectedValue === currentQuestionObj.correctAnswer);
    
    const banner = document.getElementById('feedback-banner');
    const title = document.getElementById('feedback-title');
    const explanation = document.getElementById('feedback-explanation');
    const correctIfWrong = document.getElementById('feedback-correct-if-wrong'); 


    // Reset rigoroso delle classi (togliamo is-correct e is-wrong)
    banner.className = 'feedback-banner';
    
    if (isCorrect) {
        clickedBtn.classList.add('correct');
        title.textContent = "Corretto!";
        banner.classList.add('is-correct');
        
        // Pulizia assoluta in caso di risposta corretta (non devono rimanere rimasugli in memoria)
        correctIfWrong.textContent = "";
        explanation.textContent = "";
        correctIfWrong.classList.add('hidden');
        explanation.classList.add('hidden');
        
    } else {
        clickedBtn.classList.add('wrong');
        title.textContent = "Sbagliato!";
        banner.classList.add('is-wrong');
        
        // Inserimento dei nuovi valori (si sovrascrivono sempre)
        correctIfWrong.textContent = `Risposta esatta: ${currentQuestionObj.correctAnswer}`;
        correctIfWrong.classList.remove('hidden');
        
        // Gestione di sicurezza: la spiegazione è opzionale nel JSON?
        if (currentQuestionObj.explanation && currentQuestionObj.explanation !== "") {
            explanation.textContent = currentQuestionObj.explanation;
            explanation.classList.remove('hidden');
        } else {
            // Se nel JSON la spiegazione non c'è, assicuriamoci di nasconderla
            explanation.textContent = "";
            explanation.classList.add('hidden');
        }
    }
    
    // Alza il banner
    banner.classList.remove('hidden');
}

/* ==========================================================================
   UTILITY (Funzioni d'aiuto generiche)
   ========================================================================== */

/**
 * Mescola gli elementi di un array (Fisher-Yates Shuffle).
 * Restituisce un NUOVO array mescolato, senza toccare l'originale.
 */
function shuffleArray(array) {
    // Creiamo una copia per non modificare il JSON originale in memoria
    let shuffled = [...array]; 
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Scambio
    }
    return shuffled;
}

/* ==========================================================================
   5. GESTIONE BACKUP (Export / Import)
   ========================================================================== */

function openBackupModal() {
    document.getElementById('backup-modal').classList.remove('hidden');
}

function closeBackupModal() {
    document.getElementById('backup-modal').classList.add('hidden');
}

/**
 * Legge il localStorage, crea un file JSON e lo fa scaricare
 */
function exportData() {
    // 1. Raccogliamo tutti i dati relativi a Lingo
    const backupData = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('lingo_answered_')) {
            backupData[key] = JSON.parse(localStorage.getItem(key));
        }
    }
    
    // Se non c'è nulla da salvare
    if (Object.keys(backupData).length === 0) {
        alert("Non ci sono ancora progressi da salvare.");
        return;
    }

    // 2. Creiamo il "file" in memoria (Blob)
    const dataStr = JSON.stringify(backupData, null, 2); // Il 2 formatta il JSON per essere leggibile
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    // 3. Creiamo un link temporaneo e forziamo il click (il download)
    const a = document.createElement('a');
    a.href = url;
    
    // Creiamo un nome file con la data odierna per riconoscerlo
    const date = new Date().toISOString().split('T')[0];
    a.download = `Lingo_Backup_${date}.json`;
    
    document.body.appendChild(a);
    a.click();
    
    // Pulizia
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    closeBackupModal();
}

/**
 * Riceve il file dall'utente, lo legge e sovrascrive il localStorage
 */
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    
    // Quando il browser ha finito di leggere il file fisico:
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Validazione base di sicurezza
            if (typeof importedData !== 'object' || importedData === null) {
                throw new Error("Formato file non valido.");
            }
            
            // Scriviamo i nuovi dati nel localStorage
            for (const key in importedData) {
                if (key.startsWith('lingo_answered_')) {
                    localStorage.setItem(key, JSON.stringify(importedData[key]));
                }
            }
            
            alert("Salvataggio ripristinato con successo!");
            closeBackupModal();
            
        } catch (error) {
            console.error("Errore durante l'importazione:", error);
            alert("Errore: Il file selezionato non è un backup valido di Lingo.");
        }
        
        // Resettiamo l'input nel caso si voglia ricaricare lo stesso file
        event.target.value = '';
    };
    
    // Avviamo la lettura del file come stringa di testo
    reader.readAsText(file);
}