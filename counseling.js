// MindCare Enterprise - Counseling Logic (Premium v2)
const API_BASE_URL = "/api";

// --- State Management ---
let state = {
    phase: 'onboarding', // onboarding, assessment, chat
    currentQuestion: 0,
    answers: [],
    userInfo: null,
    chatHistory: [],
    isTyping: false
};

// --- DASS-21 Questions (Scientifically Validated) ---
const dassQuestions = [
    "I found it hard to wind down.",
    "I was aware of dryness of my mouth.",
    "I couldn't seem to experience any positive feeling at all.",
    "I experienced breathing difficulty (e.g. excessively rapid breathing).",
    "I found it difficult to work up the initiative to do things.",
    "I tended to over-react to situations.",
    "I experienced trembling (e.g. in the hands).",
    "I felt that I was using a lot of nervous energy.",
    "I was worried about situations in which I might panic and make a fool of myself.",
    "I felt that I had nothing to look forward to.",
    "I found myself getting agitated.",
    "I found it difficult to relax.",
    "I felt down-hearted and blue.",
    "I was intolerant of anything that kept me from getting on with what I was doing.",
    "I felt I was close to panic.",
    "I was unable to become enthusiastic about anything.",
    "I felt I wasn't worth much as a person.",
    "I felt that I was rather touchy.",
    "I was aware of the action of my heart in the absence of physical exertion.",
    "I felt scared without any good reason.",
    "I felt that life was meaningless."
];

const options = [
    { text: "Did not apply to me at all", value: 0 },
    { text: "Applied to me to some degree", value: 1 },
    { text: "Applied to me to a considerable degree", value: 2 },
    { text: "Applied to me very much", value: 3 }
];

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initOnboarding();
    initChatListeners();
});

// --- Phase 1: Onboarding ---
function initOnboarding() {
    const form = document.getElementById('userInfoForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            state.userInfo = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                email: document.getElementById('email').value,
                department: document.getElementById('department').value,
                reportTo: document.getElementById('reportTo').value
            };
            transitionTo('assessment');
        });
    }
}

// --- Phase 2: Assessment ---
function startAssessment() {
    renderQuestion();
}

function renderQuestion() {
    const qText = document.getElementById('questionText');
    const qCounter = document.getElementById('questionCounter');
    const pBar = document.getElementById('progressBar');
    const optionsArea = document.getElementById('optionsArea');

    const progress = ((state.currentQuestion) / dassQuestions.length) * 100;
    pBar.style.width = `${progress}%`;
    qCounter.innerText = `${state.currentQuestion + 1} / ${dassQuestions.length}`;
    qText.innerText = dassQuestions[state.currentQuestion];

    optionsArea.innerHTML = '';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'btn-corp';
        btn.style.textAlign = 'left';
        btn.style.background = 'white';
        btn.innerText = opt.text;
        btn.onclick = () => handleAnswer(opt.value);
        optionsArea.appendChild(btn);
    });
}

function handleAnswer(value) {
    state.answers.push(value);
    if (state.currentQuestion < dassQuestions.length - 1) {
        state.currentQuestion++;
        renderQuestion();
    } else {
        submitAssessment();
    }
}

async function submitAssessment() {
    // Show loading state
    document.getElementById('questionArea').innerHTML = `
        <div style="text-align:center; padding: 3rem;">
            <i class="fas fa-circle-notch fa-spin" style="font-size: 3rem; color: var(--brand-blue);"></i>
            <p style="margin-top: 1rem; font-weight: 600;">Analyzing your results with MindCare AI...</p>
        </div>
    `;

    try {
        const response = await fetch(`${API_BASE_URL}/assessment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_info: state.userInfo,
                answers: state.answers
            })
        });
        const results = await response.json();
        state.assessmentResults = results;
        transitionTo('chat');
    } catch (error) {
        console.error("Assessment failed:", error);
        // Fallback to chat even if API fails for now (demo mode)
        transitionTo('chat');
    }
}

// --- Phase 3: AI Chat ---
function initChatListeners() {
    const sendBtn = document.getElementById('sendMessage');
    const input = document.getElementById('chatInput');
    const endBtn = document.getElementById('endSession');

    if (sendBtn && input) {
        sendBtn.onclick = handleSendMessage;
        input.onkeypress = (e) => { if (e.key === 'Enter') handleSendMessage(); };
    }

    if (endBtn) {
        endBtn.onclick = finalizeSession;
    }
}

async function handleSendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text || state.isTyping) return;

    appendMessage('user', text);
    input.value = '';
    state.isTyping = true;

    try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: text,
                history: state.chatHistory,
                assessment: state.assessmentResults
            })
        });
        const data = await response.json();
        appendMessage('ai', data.response);
        state.chatHistory.push({ role: 'user', content: text });
        state.chatHistory.push({ role: 'assistant', content: data.response });
    } catch (error) {
        appendMessage('ai', "I'm having trouble connecting to my neural core. Please try again in a moment.");
    } finally {
        state.isTyping = false;
    }
}

function appendMessage(role, text) {
    const container = document.getElementById('chatMessages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message message-${role}`;
    msgDiv.innerText = text;
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
}

async function finalizeSession() {
    if (confirm("Would you like to end the session and receive your professional report?")) {
        window.location.href = "index.html"; // Simple redirect for now
    }
}

// --- Utils ---
function transitionTo(phase) {
    document.getElementById('userInfoPhase').style.display = 'none';
    document.getElementById('assessmentPhase').style.display = 'none';
    document.getElementById('chatPhase').style.display = 'none';

    if (phase === 'assessment') {
        document.getElementById('assessmentPhase').style.display = 'block';
        startAssessment();
    } else if (phase === 'chat') {
        document.getElementById('chatPhase').style.display = 'block';
    }
    state.phase = phase;
}
