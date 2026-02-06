import { GenAIEngine } from './src/genai_engine.js';

const engine = new GenAIEngine();

// --- DOM ELEMENTS ---
const analyzeBtn = document.getElementById('analyzeBtn');
const btnText = analyzeBtn.querySelector('.btn-text');
const userInput = document.getElementById('userInput');
const outputArea = document.getElementById('outputArea');
const moodTag = document.getElementById('moodTag');
const rewriteToggle = document.getElementById('rewriteToggle');

// Settings Toggles
const levelToggle = document.getElementById('levelToggle');
const interviewToggle = document.getElementById('interviewToggle');
const chaosToggle = document.getElementById('chaosToggle');

// --- ON LOAD: CHECK FOR BACKTRACK ---
window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const chatId = urlParams.get('chatId');

  if (chatId) {
    const history = JSON.parse(localStorage.getItem('happie_chaos_history')) || [];
    const archivedChat = history.find(item => item.id == chatId);

    if (archivedChat) {
      userInput.value = archivedChat.input;
      renderResult(archivedChat.result);
      // Optional: Smoothly clear the URL so refreshing doesn't keep reloading the old chat
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }
});

// --- CORE ANALYSIS ---
analyzeBtn.addEventListener('click', async () => {
  const text = userInput.value.trim();
  if (!text) return;

  setLoading(true);
  const userData = JSON.parse(localStorage.getItem('happie_user')) || { name: "Explorer", level: "beginner", interest: "coding" };

  const settings = {
    isPro: levelToggle.checked,
    isInterview: interviewToggle.checked,
    isChaos: chaosToggle.checked,
    isRewrite: rewriteToggle.checked,
    user: userData
  };

  try {
    const result = await engine.analyze(text, settings);
    saveToHistory(text, result);
    renderResult(result);
  } catch (error) {
    console.error("Analysis failed:", error);
  } finally {
    setLoading(false);
  }
});

function setLoading(isLoading) {
  analyzeBtn.disabled = isLoading;
  btnText.textContent = isLoading ? "Syncing..." : "Analyze Logic";
}

function saveToHistory(input, result) {
  let history = JSON.parse(localStorage.getItem('happie_chaos_history')) || [];
  const userData = JSON.parse(localStorage.getItem('happie_user')) || { name: "Explorer" };

  const item = {
    id: Date.now(), // Unique ID for backtracking
    timestamp: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    title: `${userData.name}'s ${result.title}`,
    mood: result.moodTag,
    input: input,        // Save input to reload in textarea
    result: result       // Save full AI object to re-render UI
  };

  history.unshift(item);
  if (history.length > 20) history.pop();
  localStorage.setItem('happie_chaos_history', JSON.stringify(history));
}

function renderResult(data) {
  moodTag.textContent = data.moodTag;
  moodTag.classList.remove('hidden');

  const rewriteSection = data.rewrittenCode && data.rewrittenCode !== "null" ? `
        <div style="margin-top:2rem;">
            <h4 style="color:var(--accent-secondary); font-size:0.8rem; text-transform:uppercase;">🚀 Optimized Rewrite</h4>
            <div class="code-block" style="border-left-color: var(--accent-secondary);">${data.rewrittenCode}</div>
        </div>` : '';

  outputArea.innerHTML = `
        <div class="glass-panel output-card">
            <h2 class="text-gradient">${data.title}</h2>
            <p style="margin: 1.5rem 0; color: #cbd5e1;">${data.analysis}</p>
            <div class="code-block">${data.suggestion}</div>
            ${rewriteSection}
        </div>`;
  outputArea.classList.remove('hidden');
  outputArea.scrollIntoView({ behavior: 'smooth' });
}