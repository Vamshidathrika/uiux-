document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    const appState = {
        currentModule: 'module1',
        selectedSkill: null,
        userProgress: {},
    };

    // --- API & DATA ---
    const API_KEY = "AIzaSyDucHm7Pl65UQB3u9c_LHLTSYm-GY01KHM"; // <-- IMPORTANT: Paste your Google AI API key here
    const aiSystemPrompt = `You are a world-class UI/UX Design Lead and expert Mentor. Your knowledge is strictly limited to UI design, UX research, user psychology, design systems, accessibility, and related fields. Your rules are: 1. Strictly UI/UX: If a user asks a question outside of your domain, you MUST politely decline. 2. Concise & Clear: Your answers must be concise, clear, and easy to understand. Use bullet points and bold text. 3. Be a Mentor: Provide expert-level, accurate, and insightful information.`;
    const modulesData = {
        module1: { name: "Foundations of UX Design", learningTime: "Approx. 40 hours", minScoreToUnlock: 70 },
        module2: { name: "Empathize, Define, & Ideate", learningTime: "Approx. 20 hours", minScoreToUnlock: 70 },
        module3: { name: "Wireframing & Prototyping", learningTime: "Approx. 25 hours", minScoreToUnlock: 70 },
        module4: { name: "UX Research & Usability", learningTime: "Approx. 21 hours", minScoreToUnlock: 70 },
        module5: { name: "High-Fidelity Design", learningTime: "Approx. 33 hours", minScoreToUnlock: 70 },
        module6: { name: "Responsive Design", learningTime: "Approx. 41 hours", minScoreToUnlock: 70 },
        module7: { name: "Capstone & Portfolio", learningTime: "Approx. 44 hours", minScoreToUnlock: 101 },
    };

    // --- DOM SELECTORS ---
    const activeModuleContainer = document.getElementById('active-module-container');
    const upcomingModulesList = document.getElementById('upcoming-modules-list');
    const unlockModal = document.getElementById('unlock-modal');
    const unlockModalContent = document.getElementById('unlock-modal-content');
    
    let progressChart = null;

    // --- GEMINI API FUNCTIONS ---
    async function getAITextResponse(prompt) { return await callGeminiAPI(prompt, "text/plain"); }
    async function getAIAssessment(prompt) { const schema = { type: "OBJECT", properties: { feedback: { type: "STRING" }, score: { type: "NUMBER" } }, required: ["feedback", "score"] }; return await callGeminiAPI(prompt, "application/json", schema); }
    async function callGeminiAPI(prompt, mimeType, schema = null) { if (!API_KEY) { throw new Error("API_KEY is not set."); } const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`; const generationConfig = { response_mime_type: mimeType, ...(schema && { response_schema: schema }) }; const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig }; try { const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); if (!response.ok) { const errorBody = await response.json(); throw new Error(`API request failed: ${errorBody.error.message}`); } const result = await response.json(); if (result.candidates && result.candidates[0]?.content.parts[0]) { const responseText = result.candidates[0].content.parts[0].text; return mimeType === "application/json" ? JSON.parse(responseText) : responseText; } else { throw new Error("Could not get a valid response from the AI."); } } catch (error) { console.error("Error calling Gemini API:", error); throw error; } }

    // --- RENDER FUNCTIONS ---
    
    const renderUpcomingModules = () => {
        upcomingModulesList.innerHTML = '';
        const moduleKeys = Object.keys(modulesData);
        const currentIndex = moduleKeys.indexOf(appState.currentModule);

        let nextLockedModuleKey = null;
        for (let i = currentIndex + 1; i < moduleKeys.length; i++) {
            const key = moduleKeys[i];
            const moduleNum = i + 1;
            const prevModuleKey = `module${moduleNum - 1}`;
            const prevModuleScore = appState.userProgress[prevModuleKey] || 0;
            const scoreNeeded = modulesData[prevModuleKey].minScoreToUnlock;
            if (prevModuleScore < scoreNeeded) {
                nextLockedModuleKey = key;
                break;
            }
        }
        
        if (nextLockedModuleKey) {
            const module = modulesData[nextLockedModuleKey];
            const moduleNum = parseInt(nextLockedModuleKey.replace('module', ''));
            const card = document.createElement('div');
            card.className = 'upcoming-card';
            card.dataset.module = nextLockedModuleKey;
            card.innerHTML = `
                <div class="unlock-prompt">Click to see how to unlock</div>
                <svg class="w-8 h-8 text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                <h4 class="text-sm font-bold text-gray-400">Module ${moduleNum}</h4>
                <p class="text-xs text-gray-500">${module.name}</p>
            `;
            upcomingModulesList.appendChild(card);
        }
    };

    const renderActiveModule = () => {
        const module = modulesData[appState.currentModule];
        activeModuleContainer.innerHTML = `
            <div id="main-content" class="transition-opacity duration-500 opacity-0">
                <header class="mb-12">
                     <h2 class="text-3xl font-bold text-white">${module.name}</h2>
                     <p class="text-md text-gray-400">Estimated Time: ${module.learningTime}</p>
                </header>
                <section id="learnings-section" class="mb-12"> <h2 class="text-2xl font-bold text-white mb-6">Mission Objectives</h2> <div id="learnings-content" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6"></div> </section>
                <section id="skills-explorer" class="mb-12"> <h2 class="text-2xl font-bold text-white mb-6">Interactive Skill Explorer</h2> <div class="lg:grid lg:grid-cols-12 lg:gap-8"> <div id="skill-grid" class="lg:col-span-4 grid grid-cols-2 gap-4"></div> <div class="lg:col-span-8 mt-6 lg:mt-0"> <div id="skill-details" class="bg-secondary-dark border border-border-color p-6 rounded-lg min-h-[200px] flex items-center justify-center"></div> </div> </div> </section>
                <section id="study-materials-section" class="mb-12"> <div id="study-materials-content" class="text-center"></div> </section>
                <section id="assignment-section" class="mb-12 bg-secondary-dark border border-border-color p-6 md:p-8 rounded-lg"></section>
                <section id="ai-co-pilot-section" class="bg-secondary-dark border border-border-color text-white p-6 md:p-8 rounded-lg"> <h2 class="text-2xl font-bold text-center mb-6 text-white">AI Co-Pilot</h2> <div class="max-w-3xl mx-auto"> <p class="text-gray-400 text-center mb-4">Your instant mentor for UI/UX questions.</p> <textarea id="ai-question-input" class="w-full p-3 bg-primary-dark border border-border-color rounded-md mb-4 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-500 text-white" rows="4" placeholder="e.g., 'Explain Hick's Law in simple terms.'"></textarea> <button id="ask-ai-btn" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-md transition-all duration-300 flex items-center justify-center space-x-2 button-glow"><span>Ask AI Co-Pilot</span></button> <div id="ai-response-area" class="bg-primary-dark p-4 rounded-md border border-border-color min-h-[100px] mt-4"><p class="text-gray-500 text-center">AI response will appear here.</p></div> </div> </section>
            </div>
        `;
        // Re-bind events for the new content
        document.getElementById('ask-ai-btn').addEventListener('click', handleAskAI);
        document.getElementById('skill-grid').addEventListener('click', handleSkillClick);
        
        // Render the inner content of the active module
        renderContent();
    };
    
    // --- UPDATE & HELPER FUNCTIONS ---

    const handleMissionDebrief = async () => {
        const feedbackArea = document.querySelector('#assignment-section #feedback-area');
        const submissionText = document.querySelector('#assignment-section #assignment-submission').value.trim();
        const submitBtn = document.querySelector('#assignment-section #submit-assignment-btn');
        if (!submissionText) { feedbackArea.innerHTML = '<p class="text-red-400 font-bold">Please enter your assignment submission.</p>'; return; }

        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="loader"></span><span class="ml-2">AI is Reviewing...</span>`;
        feedbackArea.innerHTML = `<p class="text-gray-500">Your submission is being analyzed...</p>`;

        try {
            const assignment = modulesData[appState.currentModule].assignment;
            const assessmentPrompt = `You are a strict but fair UI/UX Professor. Evaluate the following assignment submission.
            Assignment: "${assignment.title} - ${assignment.description}"
            Submission: "${submissionText}"
            Actions:
            1. Critique the submission with clear, actionable feedback.
            2. Assign a numerical score between 0 and 100.
            3. Return the result as a JSON object with "feedback" (string) and "score" (number) keys.`;

            const assessment = await getAIAssessment(assessmentPrompt);
            const { feedback, score } = assessment;

            appState.userProgress[appState.currentModule] = score;
            saveProgress();
            updateProgressChart(score);
            renderUpcomingModules(); 

            const scoreThreshold = modulesData[appState.currentModule].minScoreToUnlock;
            let resultHTML = score >= scoreThreshold ?
                `<p class="font-bold text-green-400">Mission Passed! AI Score: ${score}/100.</p><p>You have unlocked the next module!</p>` :
                `<p class="font-bold text-yellow-400">Mission Incomplete. AI Score: ${score}/100.</p><p>Please review the feedback, improve your submission, and try again.</p>`;
            resultHTML += `<div class="mt-4 p-3 bg-secondary-dark rounded-md border border-border-color text-left"><h4 class="font-bold text-purple-400">AI Mentor's Feedback:</h4><div class="text-gray-300 whitespace-pre-wrap mt-2">${feedback}</div></div>`;
            feedbackArea.innerHTML = resultHTML;

        } catch (error) {
            feedbackArea.innerHTML = `<p class="text-red-400">An error occurred during AI review: ${error.message}</p>`;
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `Submit for AI Review`;
        }
    };

    const showUnlockModal = (moduleKey) => {
        const moduleNum = parseInt(moduleKey.replace('module', ''));
        const prevModuleKey = `module${moduleNum - 1}`;
        const prevModule = modulesData[prevModuleKey];
        const scoreNeeded = prevModule.minScoreToUnlock;
        const currentScore = appState.userProgress[prevModuleKey] || 0;

        unlockModalContent.innerHTML = `
            <h3 class="text-2xl font-bold text-white mb-2">Module ${moduleNum} Locked</h3>
            <p class="text-gray-400 mb-6">You need to pass the previous module to unlock this one.</p>
            <div class="text-left mb-4">
                <p class="font-bold text-white">Requirement:</p>
                <p class="text-gray-400">Score at least ${scoreNeeded}% on '${prevModule.name}'.</p>
            </div>
            <div class="text-left mb-6">
                <p class="font-bold text-white">Your Current Score:</p>
                <div class="w-full bg-gray-700 rounded-full h-4 mt-2">
                    <div class="bg-purple-600 h-4 rounded-full" style="width: ${currentScore}%"></div>
                </div>
                <p class="text-right text-lg font-bold text-white mt-1">${currentScore}%</p>
            </div>
            <button id="close-modal-btn" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md">Got it</button>
        `;
        unlockModal.classList.add('visible');
        document.getElementById('close-modal-btn').addEventListener('click', () => unlockModal.classList.remove('visible'));
    };

    // --- EVENT LISTENERS ---
    const handleAskAI = async () => { /* ... unchanged ... */ };
    const handleSkillClick = (e) => { const card = e.target.closest('.skill-card'); if(card && card.dataset.skillKey !== appState.selectedSkill) { appState.selectedSkill = card.dataset.skillKey; document.querySelectorAll('#skill-grid .skill-card').forEach(c => c.classList.remove('active')); card.classList.add('active'); renderSkillDetailsAndMaterials(); } };
    upcomingModulesList.addEventListener('click', (e) => { const card = e.target.closest('.upcoming-card'); if (card) { showUnlockModal(card.dataset.module); } });
    unlockModal.addEventListener('click', (e) => { if (e.target === unlockModal) { unlockModal.classList.remove('visible'); } });

    // --- OTHER FUNCTIONS ---
    const loadProgress = () => { const savedProgress = JSON.parse(localStorage.getItem('userProgress') || '{}'); appState.userProgress = savedProgress; Object.keys(modulesData).forEach(key => { if (typeof appState.userProgress[key] !== 'number') { appState.userProgress[key] = 0; } }); };
    const saveProgress = () => { localStorage.setItem('userProgress', JSON.stringify(appState.userProgress)); };
    const changeModule = (newModuleKey) => { if (newModuleKey === appState.currentModule) return; appState.currentModule = newModuleKey; appState.selectedSkill = null; renderActiveModule(); renderUpcomingModules(); };
    const initializeChart = (score) => { const ctx = document.getElementById('progressChart')?.getContext('2d'); if (!ctx) return; if (progressChart) progressChart.destroy(); Chart.defaults.color = '#D1D5DB'; Chart.defaults.borderColor = '#374151'; progressChart = new Chart(ctx, { type: 'bar', data: { labels: ['Mastery Level'], datasets: [{ label: 'Score', data: [score], backgroundColor: score >= 70 ? 'rgba(167, 85, 247, 0.5)' : 'rgba(209, 213, 219, 0.2)', borderColor: score >= 70 ? '#A755F7' : '#D1D5DB', borderWidth: 2, borderRadius: 5, }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100, grid: { color: '#374151' }, ticks: { color: '#D1D5DB' }, title: { display: true, text: 'Score (%)', color: '#D1D5DB' } }, x: { grid: { display: false } } }, plugins: { legend: { display: false } } } }); };
    const updateProgressChart = (score) => { if (!progressChart) { initializeChart(score); return; } progressChart.data.datasets[0].data[0] = score; progressChart.data.datasets[0].backgroundColor = score >= 70 ? 'rgba(167, 85, 247, 0.5)' : 'rgba(209, 213, 219, 0.2)'; progressChart.data.datasets[0].borderColor = score >= 70 ? '#A755F7' : '#D1D5DB'; progressChart.update(); };
    
    function renderContent() {
        document.getElementById('main-content').style.opacity = 1;
        const learningsContent = document.getElementById('learnings-content');
        const skillGrid = document.getElementById('skill-grid');
        const module = modulesData[appState.currentModule];
        learningsContent.innerHTML = '';
        if (module.learnings) module.learnings.forEach((learning, index) => { const card = document.createElement('div'); card.className = 'learning-card'; card.style.animationDelay = `${index * 100}ms`; card.innerHTML = `<h3 class="text-xl font-semibold mb-2 text-purple-400">${learning.title}</h3><p class="text-gray-400">${learning.description}</p>`; learningsContent.appendChild(card); });
        skillGrid.innerHTML = '';
        if(module.skills) Object.keys(module.skills).forEach((key, index) => { const card = document.createElement('div'); card.className = 'skill-card content-slide-up'; card.dataset.skillKey = key; card.style.animationDelay = `${index * 100}ms`; card.innerHTML = `<div class="text-4xl">${module.skills[key].icon}</div><h4 class="mt-2 font-semibold text-white">${module.skills[key].title}</h4>`; skillGrid.appendChild(card); });
        const firstSkillKey = module.skills ? Object.keys(module.skills)[0] : null;
        appState.selectedSkill = firstSkillKey;
        document.querySelector(`#skill-grid [data-skill-key="${appState.selectedSkill}"]`)?.classList.add('active');
        renderSkillDetailsAndMaterials();
        renderAssignment();
    }

    function renderSkillDetailsAndMaterials() {
        const skillDetails = document.getElementById('skill-details');
        const studyMaterialsContent = document.getElementById('study-materials-content');
        const skill = modulesData[appState.currentModule]?.skills?.[appState.selectedSkill];
        if (!skill) { skillDetails.innerHTML = `<p class="text-gray-500 text-center">Select a skill.</p>`; studyMaterialsContent.parentElement.classList.add('hidden'); return; }
        skillDetails.innerHTML = `<div class="content-fade-in w-full text-left"><h3 class="text-2xl font-bold mb-4 text-purple-400 flex items-center">${skill.icon} <span class="ml-3">${skill.title}</span></h3><div class="space-y-4"><div><h4 class="font-bold text-lg text-white">Meaning</h4><p class="text-gray-400 mt-1">${skill.meaning}</p></div><div><h4 class="font-bold text-lg text-white">Use Cases</h4><p class="text-gray-400 mt-1">${skill.useCases}</p></div></div></div>`;
        const materials = modulesData[appState.currentModule]?.studyMaterials?.[appState.selectedSkill];
        const container = studyMaterialsContent.parentElement;
        if (!materials || materials.length === 0) { container.classList.add('hidden'); return; }
        container.classList.remove('hidden');
        let linksHTML = `<h2 class="text-2xl font-bold text-white mb-6">Deep Dive Resources: ${skill.title}</h2><div class="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">`;
        materials.forEach(material => { linksHTML += `<a href="${material.url}" target="_blank" rel="noopener noreferrer" class="block bg-secondary-dark hover:bg-gray-800/50 p-4 rounded-lg transition-colors duration-200 text-purple-400 font-medium hover:text-purple-300 text-left flex items-center space-x-3 border border-border-color"><svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg><span>${material.title}</span></a>`; });
        linksHTML += `</div>`;
        studyMaterialsContent.innerHTML = linksHTML;
    }
    
    // --- FULL MODULE DATA & INITIALIZATION ---
    Object.assign(modulesData.module1, { learnings: [ { title: "Intro to UX Design", description: "Understand the basics of UX design and the product development lifecycle." }, { title: "Core UX Concepts", description: "Familiarize yourself with essential UX terminology and frameworks like user-centered design." }], skills: { ux: { title: "User Experience (UX)", icon: "🎨", meaning: "The overall experience of a person using a product, especially in terms of how easy or pleasing it is to use.", useCases: "Applied to create intuitive apps, websites, and services." } }, studyMaterials: { ux: [{ title: "What is UX Design?", url: "#" }] }, assignment: { title: "Mission 1: The Usability Detective", description: "Choose a common object or app screen. Identify 3 specific usability issues. For each, propose a clear design improvement and explain your reasoning." } });
    Object.assign(modulesData.module2, { learnings: [ { title: "Empathizing with Users", description: "Learn techniques to deeply understand user needs and motivations." }, { title: "Creating User Personas", description: "Develop fictional characters based on research to represent your target users." }], skills: { personas: { title: "User Personas", icon: "👤", meaning: "Fictional characters created to represent user types.", useCases: "Helps the team focus on a manageable cast of characters, instead of trying to design for everyone." } }, studyMaterials: { personas: [{ title: "Creating User Personas", url: "#" }] }, assignment: { title: "Mission 2: The Empathy Engine", description: "Create a user persona and an empathy map for a new language-learning app based on provided research notes." } });
    // ... Add full data for modules 3-7 here
    
    const init = () => { loadProgress(); renderActiveModule(); renderUpcomingModules(); };
    
    init();
});
