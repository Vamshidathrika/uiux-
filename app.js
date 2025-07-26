document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    // A central object to hold the application's current state.
    const appState = {
        currentModule: 'module1',
        selectedSkill: null,
        userProgress: {}, // Stores scores for each module, e.g., { module1: 85, module2: 0 }
        isContentLoaded: false
    };

    // --- API & DATA ---
    const API_KEY = "AIzaSyDucHm7Pl65UQB3u9c_LHLTSYm-GY01KHMv"; // <-- IMPORTANT: Paste your Google AI API key here

    // This prompt defines the AI's personality and rules for the general Q&A Co-Pilot.
    const aiSystemPrompt = `You are a world-class UI/UX Design Lead and expert Mentor. Your knowledge is strictly limited to UI design, UX research, user psychology, design systems, accessibility, and related fields. Your rules are: 1. Strictly UI/UX: If a user asks a question outside of your domain, you MUST politely decline. 2. Concise & Clear: Your answers must be concise, clear, and easy to understand. Use bullet points and bold text. 3. Be a Mentor: Provide expert-level, accurate, and insightful information.`;

    // This object contains all the content for the learning hub.
    const modulesData = {
        module1: { name: "Foundations of UX Design", learningTime: "Approx. 40 hours", minScoreToUnlock: 70 },
        module2: { name: "Empathize, Define, & Ideate", learningTime: "Approx. 20 hours", minScoreToUnlock: 70 },
        module3: { name: "Wireframing & Prototyping", learningTime: "Approx. 25 hours", minScoreToUnlock: 70 },
        module4: { name: "UX Research & Usability", learningTime: "Approx. 21 hours", minScoreToUnlock: 70 },
        module5: { name: "High-Fidelity Design", learningTime: "Approx. 33 hours", minScoreToUnlock: 70 },
        module6: { name: "Responsive Design", learningTime: "Approx. 41 hours", minScoreToUnlock: 70 },
        module7: { name: "Capstone & Portfolio", learningTime: "Approx. 44 hours", minScoreToUnlock: 101 }, // Score > 100 means it's the final module
    };

    // --- DOM SELECTORS ---
    const mainContent = document.getElementById('main-content');
    const moduleProgressionContainer = document.getElementById('module-progression');
    const assignmentSection = document.getElementById('assignment-section');
    const aiQuestionInput = document.getElementById('ai-question-input');
    const askAiBtn = document.getElementById('ask-ai-btn');
    const aiResponseArea = document.getElementById('ai-response-area');
    
    let progressChart = null;

    // --- GEMINI API FUNCTIONS ---
    async function getAITextResponse(prompt) { return await callGeminiAPI(prompt, "text/plain"); }
    async function getAIAssessment(prompt) { const schema = { type: "OBJECT", properties: { feedback: { type: "STRING" }, score: { type: "NUMBER" } }, required: ["feedback", "score"] }; return await callGeminiAPI(prompt, "application/json", schema); }
    async function callGeminiAPI(prompt, mimeType, schema = null) { if (!API_KEY) { throw new Error("API_KEY is not set."); } const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`; const generationConfig = { response_mime_type: mimeType, ...(schema && { response_schema: schema }) }; const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig }; try { const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); if (!response.ok) { const errorBody = await response.json(); throw new Error(`API request failed: ${errorBody.error.message}`); } const result = await response.json(); if (result.candidates && result.candidates[0]?.content.parts[0]) { const responseText = result.candidates[0].content.parts[0].text; return mimeType === "application/json" ? JSON.parse(responseText) : responseText; } else { throw new Error("Could not get a valid response from the AI."); } } catch (error) { console.error("Error calling Gemini API:", error); throw error; } }

    // --- RENDER FUNCTIONS ---
    
    const renderModuleCards = () => {
        moduleProgressionContainer.innerHTML = '';
        Object.keys(modulesData).forEach(key => {
            const module = modulesData[key];
            const moduleNum = parseInt(key.replace('module', ''));
            const card = document.createElement('div');
            card.dataset.module = key;

            let isLocked = false;
            let unlockMessage = '';
            
            if (moduleNum > 1) {
                const prevModuleKey = `module${moduleNum - 1}`;
                const prevModule = modulesData[prevModuleKey];
                const prevModuleScore = appState.userProgress[prevModuleKey] || 0;
                const scoreNeeded = prevModule.minScoreToUnlock;
                if (prevModuleScore < scoreNeeded) {
                    isLocked = true;
                    unlockMessage = `Complete '${prevModule.name}' with a score of ${scoreNeeded}% or higher to unlock.`;
                }
            }
            
            card.className = `module-card ${appState.currentModule === key ? 'active' : ''} ${isLocked ? 'locked' : ''}`;
            card.setAttribute('title', isLocked ? unlockMessage : `Select ${module.name}`);

            const score = appState.userProgress[key] || 0;
            const isCompleted = score >= module.minScoreToUnlock;

            card.innerHTML = `
                <div class="relative w-full h-full module-content">
                    <div class="flex justify-between items-center mb-4">
                        <span class="text-sm font-bold text-blue-400">MODULE ${moduleNum}</span>
                        ${isCompleted ? '<span class="text-xs font-bold text-green-400 bg-green-900/50 px-2 py-1 rounded-full">✓ COMPLETED</span>' : ''}
                    </div>
                    <h3 class="text-lg font-bold text-white">${module.name}</h3>
                    <p class="text-sm text-gray-400 mt-2">Score: ${score}/100</p>
                </div>
                ${isLocked ? `
                <div class="lock-overlay">
                    <svg class="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    <p class="text-sm font-semibold text-white">Locked</p>
                    <p class="text-xs text-gray-400">${unlockMessage}</p>
                </div>
                ` : ''}
            `;
            moduleProgressionContainer.appendChild(card);
        });
    };

    const renderAssignment = () => {
        const module = modulesData[appState.currentModule];
        assignmentSection.innerHTML = '';
        if (!module || !module.assignment) {
            assignmentSection.innerHTML = `<div class="text-center text-gray-500">No assignment for this module.</div>`;
            return;
        }
        const { title, description } = module.assignment;
        const score = appState.userProgress[appState.currentModule] || 0;
        
        assignmentSection.innerHTML = `
            <h2 class="text-3xl font-bold text-center mb-2 text-white">${title}</h2>
            <p class="text-center text-gray-500 mb-6">Estimated Time: ${module.learningTime}</p>
            <div class="max-w-4xl mx-auto">
                <div class="text-gray-400 mb-6 leading-relaxed">${description}</div>
                <textarea id="assignment-submission" class="w-full p-3 bg-gray-800 border border-gray-600 rounded-md mb-4 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 text-white" rows="8" placeholder="Complete your assignment here..."></textarea>
                <div class="flex items-center justify-center gap-4 mb-6">
                    <button id="submit-assignment-btn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md transition-colors duration-200">Submit for AI Review</button>
                </div>
                <div id="feedback-area" class="bg-gray-900 p-4 rounded-md border border-gray-700 text-gray-300 min-h-[100px]">
                    <p class="text-gray-500">Your AI-generated score and feedback will appear here.</p>
                </div>
                <div class="chart-container mt-8">
                    <canvas id="progressChart"></canvas>
                </div>
            </div>
        `;
        initializeChart(score);
        document.getElementById('submit-assignment-btn').addEventListener('click', handleMissionDebrief);
    };

    // --- UPDATE & HELPER FUNCTIONS ---

    const handleMissionDebrief = async () => {
        const feedbackArea = document.getElementById('feedback-area');
        const submissionText = document.getElementById('assignment-submission').value.trim();
        const submitBtn = document.getElementById('submit-assignment-btn');
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
            renderModuleCards(); 

            const scoreThreshold = modulesData[appState.currentModule].minScoreToUnlock;
            let resultHTML = score >= scoreThreshold ?
                `<p class="font-bold text-green-400">Mission Passed! AI Score: ${score}/100.</p><p>You have unlocked the next module!</p>` :
                `<p class="font-bold text-yellow-400">Mission Incomplete. AI Score: ${score}/100.</p><p>Please review the feedback, improve your submission, and try again.</p>`;
            resultHTML += `<div class="mt-4 p-3 bg-gray-800 rounded-md border border-gray-700 text-left"><h4 class="font-bold text-blue-400">AI Mentor's Feedback:</h4><div class="text-gray-300 whitespace-pre-wrap mt-2">${feedback}</div></div>`;
            feedbackArea.innerHTML = resultHTML;

        } catch (error) {
            feedbackArea.innerHTML = `<p class="text-red-400">An error occurred during AI review: ${error.message}</p>`;
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `Submit for AI Review`;
        }
    };

    // --- EVENT LISTENERS ---
    askAiBtn.addEventListener('click', async () => { const question = aiQuestionInput.value.trim(); if (!question) { aiResponseArea.innerHTML = '<p class="text-red-400">Please enter a question.</p>'; return; } askAiBtn.disabled = true; askAiBtn.innerHTML = `<span class="loader"></span><span class="ml-2">Thinking...</span>`; aiResponseArea.innerHTML = `<p class="text-gray-400">Processing...</p>`; try { const finalPrompt = `${aiSystemPrompt}\n\nUser's question: "${question}"`; const responseText = await getAITextResponse(finalPrompt); aiResponseArea.innerHTML = `<div class="content-fade-in whitespace-pre-wrap text-left">${responseText}</div>`; } catch (error) { aiResponseArea.innerHTML = `<p class="text-red-400">Error: ${error.message}</p>`; } finally { askAiBtn.disabled = false; askAiBtn.innerHTML = `<span>Ask AI Co-Pilot</span>`; } });
    moduleProgressionContainer.addEventListener('click', (e) => { const card = e.target.closest('.module-card'); if (card && !card.classList.contains('locked')) { changeModule(card.dataset.module); } });
    
    // --- OTHER FUNCTIONS ---
    const loadProgress = () => { const savedProgress = JSON.parse(localStorage.getItem('userProgress') || '{}'); appState.userProgress = savedProgress; Object.keys(modulesData).forEach(key => { if (typeof appState.userProgress[key] !== 'number') { appState.userProgress[key] = 0; } }); };
    const saveProgress = () => { localStorage.setItem('userProgress', JSON.stringify(appState.userProgress)); };
    const changeModule = (newModuleKey) => { if (newModuleKey === appState.currentModule) return; appState.currentModule = newModuleKey; appState.selectedSkill = null; mainContent.style.opacity = 0; setTimeout(() => { renderModuleCards(); renderContent(); mainContent.style.opacity = 1; }, 300); };
    const initializeChart = (score) => { const ctx = document.getElementById('progressChart')?.getContext('2d'); if (!ctx) return; if (progressChart) progressChart.destroy(); Chart.defaults.color = '#9ca3af'; Chart.defaults.borderColor = '#4b5563'; progressChart = new Chart(ctx, { type: 'bar', data: { labels: ['Mastery Level'], datasets: [{ label: 'Score', data: [score], backgroundColor: score >= 70 ? 'rgba(52, 211, 153, 0.5)' : 'rgba(99, 102, 241, 0.5)', borderColor: score >= 70 ? '#34d399' : '#6366f1', borderWidth: 2, borderRadius: 5, }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100, grid: { color: '#374151' }, ticks: { color: '#9ca3af' }, title: { display: true, text: 'Score (%)', color: '#9ca3af' } }, x: { grid: { display: false } } }, plugins: { legend: { display: false } } } }); };
    const updateProgressChart = (score) => { if (!progressChart) { initializeChart(score); return; } progressChart.data.datasets[0].data[0] = score; progressChart.data.datasets[0].backgroundColor = score >= 70 ? 'rgba(52, 211, 153, 0.5)' : 'rgba(99, 102, 241, 0.5)'; progressChart.data.datasets[0].borderColor = score >= 70 ? '#34d399' : '#6366f1'; progressChart.update(); };
    
    function renderContent() {
        const learningsContent = document.getElementById('learnings-content');
        const skillGrid = document.getElementById('skill-grid');
        const module = modulesData[appState.currentModule];
        learningsContent.innerHTML = '';
        if (module.learnings) module.learnings.forEach((learning, index) => { const card = document.createElement('div'); card.className = 'bg-gray-900/50 border border-gray-700 p-6 rounded-lg content-slide-up'; card.style.animationDelay = `${index * 100}ms`; card.innerHTML = `<h3 class="text-xl font-semibold mb-2 text-blue-400">${learning.title}</h3><p class="text-gray-400">${learning.description}</p>`; learningsContent.appendChild(card); });
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
        skillDetails.innerHTML = `<div class="content-fade-in w-full text-left"><h3 class="text-2xl font-bold mb-4 text-blue-400 flex items-center">${skill.icon} <span class="ml-3">${skill.title}</span></h3><div class="space-y-4"><div><h4 class="font-bold text-lg text-white">Meaning</h4><p class="text-gray-400 mt-1">${skill.meaning}</p></div><div><h4 class="font-bold text-lg text-white">Use Cases</h4><p class="text-gray-400 mt-1">${skill.useCases}</p></div></div></div>`;
        const materials = modulesData[appState.currentModule]?.studyMaterials?.[appState.selectedSkill];
        const container = studyMaterialsContent.parentElement;
        if (!materials || materials.length === 0) { container.classList.add('hidden'); return; }
        container.classList.remove('hidden');
        let linksHTML = `<h3 class="text-2xl font-bold text-center mb-6 text-white">Deep Dive Resources: ${skill.title}</h3><div class="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">`;
        materials.forEach(material => { linksHTML += `<a href="${material.url}" target="_blank" rel="noopener noreferrer" class="block bg-gray-800 hover:bg-gray-700 p-4 rounded-lg transition-colors duration-200 text-blue-400 font-medium hover:text-blue-300 text-left flex items-center space-x-3 border border-gray-700"><svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg><span>${material.title}</span></a>`; });
        linksHTML += `</div>`;
        studyMaterialsContent.innerHTML = linksHTML;
    }
    
    document.getElementById('skill-grid').addEventListener('click', (e) => { const card = e.target.closest('.skill-card'); if(card && card.dataset.skillKey !== appState.selectedSkill) { appState.selectedSkill = card.dataset.skillKey; document.querySelectorAll('.skill-card').forEach(c => c.classList.remove('active')); card.classList.add('active'); renderSkillDetailsAndMaterials(); } });

    // --- FULL MODULE DATA & INITIALIZATION ---
    Object.assign(modulesData.module1, { learnings: [ { title: "Intro to UX Design", description: "Understand the basics of UX design and the product development lifecycle." }, { title: "Core UX Concepts", description: "Familiarize yourself with essential UX terminology and frameworks like user-centered design." }], skills: { ux: { title: "User Experience (UX)", icon: "🎨", meaning: "The overall experience of a person using a product, especially in terms of how easy or pleasing it is to use.", useCases: "Applied to create intuitive apps, websites, and services." } }, studyMaterials: { ux: [{ title: "What is UX Design?", url: "#" }] }, assignment: { title: "Mission 1: The Usability Detective", description: "Choose a common object or app screen. Identify 3 specific usability issues. For each, propose a clear design improvement and explain your reasoning." } });
    Object.assign(modulesData.module2, { learnings: [ { title: "Empathizing with Users", description: "Learn techniques to deeply understand user needs and motivations." }, { title: "Creating User Personas", description: "Develop fictional characters based on research to represent your target users." }], skills: { personas: { title: "User Personas", icon: "👤", meaning: "Fictional characters created to represent user types.", useCases: "Helps the team focus on a manageable cast of characters, instead of trying to design for everyone." } }, studyMaterials: { personas: [{ title: "Creating User Personas", url: "#" }] }, assignment: { title: "Mission 2: The Empathy Engine", description: "Create a user persona and an empathy map for a new language-learning app based on provided research notes." } });
    Object.assign(modulesData.module3, { learnings: [ { title: "Wireframing", description: "Learn to create basic structural blueprints for your designs." }, { title: "Prototyping", description: "Build interactive, low-fidelity versions of your designs for early testing." }], skills: { wireframing: { title: "Wireframing", icon: "📝", meaning: "A basic visual guide that represents the skeletal framework of a website or app.", useCases: "Used early in design to lay out ideas and define page structure." } }, studyMaterials: { wireframing: [{ title: "Wireframing for Beginners", url: "#" }] }, assignment: { title: "Mission 3: The Architect", description: "Create a 3-screen wireframe for a new mobile weather app." } });
    Object.assign(modulesData.module4, { learnings: [ { title: "Usability Studies", description: "Learn how to plan and conduct effective usability tests." }, { title: "Synthesizing Research", description: "Analyze research data to find actionable insights." }], skills: { usability: { title: "Usability Testing", icon: "🧪", meaning: "Evaluating a product by testing it on representative users.", useCases: "Crucial for validating design decisions and identifying confusing elements." } }, studyMaterials: { usability: [{ title: "Usability Testing 101", url: "#" }] }, assignment: { title: "Mission 4: The User Whisperer", description: "Write a research plan for a usability study of a new e-commerce website." } });
    Object.assign(modulesData.module5, { learnings: [ { title: "Visual Design Principles", description: "Understand hierarchy, balance, and contrast." }, { title: "Design Systems", description: "Learn how to create and use a consistent set of design components." }], skills: { designSystems: { title: "Design Systems", icon: "📚", meaning: "A set of standards, components, and guidelines that ensure design consistency.", useCases: "Used to maintain brand consistency and accelerate design and development workflows." } }, studyMaterials: { designSystems: [{ title: "What is a Design System?", url: "#" }] }, assignment: { title: "Mission 5: The Visual Virtuoso", description: "Design a high-fidelity mockup for the home screen of a new music streaming app." } });
    Object.assign(modulesData.module6, { learnings: [ { title: "Responsive Grids", description: "Learn how to design layouts that adapt to different screen sizes." }, { title: "Mobile-First Design", description: "Understand the strategy of designing for mobile before designing for desktop." }], skills: { responsive: { title: "Responsive Design", icon: "📱", meaning: "Designing web pages that look good on all devices.", useCases: "Crucial for modern web development to ensure optimal user experience across devices." } }, studyMaterials: { responsive: [{ title: "Responsive Design Explained", url: "#" }] }, assignment: { title: "Mission 6: The Adaptable Architect", description: "Create a responsive design (mobile and desktop views) for a blog article page." } });
    Object.assign(modulesData.module7, { learnings: [ { title: "Building a Case Study", description: "Learn how to tell a compelling story about your design process." }, { title: "Portfolio Presentation", description: "Prepare to present your work effectively in interviews." }], skills: { portfolio: { title: "UX Portfolio", icon: "💼", meaning: "A curated collection of a UX designer's best work.", useCases: "Essential for job applications, allowing designers to demonstrate their abilities to potential employers." } }, studyMaterials: { portfolio: [{ title: "How to Create a UX Portfolio", url: "#" }] }, assignment: { title: "Mission 7: The Capstone", description: "Create a complete case study for one of the previous projects you completed in this course, ready to be added to your portfolio." } });

    const init = () => { loadProgress(); renderModuleCards(); renderContent(); setTimeout(() => { mainContent.style.opacity = 1; }, 100); };
    
    init();
});
