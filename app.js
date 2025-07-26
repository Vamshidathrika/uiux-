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
    const aiSystemPrompt = `You are a world-class UI/UX Design Lead and expert Mentor. Your knowledge is strictly limited to UI design, UX research, user psychology, design systems, accessibility, and related fields. 
    
    Your rules are:
    1.  **Strictly UI/UX:** If a user asks a question outside of your domain (e.g., about history, general coding, or random facts), you MUST politely decline, stating that your expertise is focused on UI/UX design.
    2.  **Concise & Clear:** Your answers must be concise, clear, and easy to understand. Use bullet points, **bold text** for key terms, and simple language.
    3.  **Be a Mentor:** Provide expert-level, accurate, and insightful information. Your goal is to teach and guide.`;

    // This object contains all the content for the learning hub.
    const modulesData = {
        module1: {
            name: "Foundations of UX Design",
            learningTime: "Approx. 40 hours",
            minScoreToUnlock: 70, // Score needed to unlock module 2
            learnings: [
                { title: "Introducing User Experience Design", description: "Understand the basics of UX design, its characteristics, and the product development lifecycle." },
                { title: "Common Terms, Tools, & Frameworks", description: "Familiarize yourself with essential UX terminology and design frameworks like user-centered design." },
                { title: "Joining Design Sprints", description: "Learn about the phases of a design sprint and how to plan and participate in one." },
            ],
            skills: {
                userExperienceDesign: { title: "User Experience (UX) Design", icon: "🎨", meaning: "The process of enhancing user satisfaction by improving the usability, accessibility, and pleasure provided in the interaction between the user and a product.", useCases: "Involves information architecture, interaction design, visual design, and usability to create intuitive apps and websites." },
                userCenteredDesign: { title: "User-Centered Design", icon: "👥", meaning: "An approach that prioritizes the user's needs, behaviors, and motivations throughout the entire design process.", useCases: "Applied in every stage of product development, from conducting user interviews to using A/B testing, ensuring the final product truly solves user problems." },
                designThinking: { title: "Design Thinking", icon: "💡", meaning: "A non-linear, iterative process to understand users, challenge assumptions, redefine problems, and create innovative solutions.", useCases: "Applied to tackle complex problems by encouraging creative, human-centered solutions through its five phases: Empathize, Define, Ideate, Prototype, and Test." },
            },
            studyMaterials: {
                userExperienceDesign: [ { title: "What is UX Design? (Google)", url: "https://www.youtube.com/watch?v=f2K9hX2_0-Q" }, { title: "UX Design in 100 Seconds", url: "https://www.youtube.com/watch?v=Ovj4hFxko7c" } ],
                userCenteredDesign: [ { title: "User-Centered Design Explained", url: "https://www.youtube.com/watch?v=9gL57_yP610" }, { title: "Nielsen Norman Group on UCD", url: "https://www.nngroup.com/articles/user-centered-design/" } ],
                designThinking: [ { title: "What is Design Thinking? (IDEO)", url: "https://www.youtube.com/watch?v=aG0Kqf2tB8I" } ],
            },
            assignment: {
                title: "Mission 1: The Usability Detective",
                description: `<strong>Your First Mission:</strong> Every great UI/UX developer starts by seeing the world through a user's eyes. Your task is to identify hidden frustrations in everyday objects.<br><br><strong>The Challenge:</strong> Choose a common object (e.g., a remote control, a public sign, a coffee maker) or a simple app screen. Identify 3 specific usability issues. For each, propose a clear, simple design improvement and explain *why* it's an issue from a user's perspective.`
            }
        },
        module2: {
            name: "Empathize, Define, & Ideate",
            learningTime: "Approx. 20 hours",
            minScoreToUnlock: 70, // Score needed to unlock module 3
            learnings: [ 
                { title: "Empathizing with Users", description: "Learn techniques to deeply understand user needs, motivations, and frustrations." },
                { title: "Creating User Personas", description: "Develop fictional characters based on research to represent your target users." },
                { title: "Defining User Problems", description: "Formulate clear problem statements that will guide your design solutions." },
            ],
            skills: { 
                empathyMapping: { title: "Empathy Mapping", icon: "💖", meaning: "A collaborative visualization tool used to articulate what we know about a particular user type.", useCases: "Used to synthesize user research data and create a shared understanding of user needs." },
                personas: { title: "User Personas", icon: "👤", meaning: "Fictional characters created to represent the different user types that might use a site, brand, or product in a similar way.", useCases: "Helps the team to focus on a manageable and memorable cast of characters, instead of trying to design for everyone." },
                problemStatements: { title: "Problem Statements", icon: "❓", meaning: "A concise description of a user's need that a design aims to solve.", useCases: "Guides the ideation process by clearly defining the challenge, ensuring solutions are focused and relevant." },
            },
            studyMaterials: { 
                empathyMapping: [ { title: "What is an Empathy Map?", url: "https://www.youtube.com/watch?v=C_iX4A_uD90" } ],
                personas: [ { title: "Creating User Personas", url: "https://www.youtube.com/watch?v=L2G_bL-2Q6s" } ],
                problemStatements: [ { title: "How to Write a Problem Statement", url: "https://www.youtube.com/watch?v=1g71Q13cM00" } ],
            },
            assignment: {
                title: "Mission 2: The Empathy Engine",
                description: "Your mission is to create a user persona and an empathy map for a new mobile app that helps people learn a new language. You are given a set of research notes: 'Users are busy professionals, aged 25-40. They want to learn conversational skills for travel. They use apps during their commute. They feel intimidated by complex grammar rules.'"
            }
        },
        // Add more modules here following the same structure...
    };

    // --- DOM SELECTORS ---
    const mainContent = document.getElementById('main-content');
    const moduleTabsContainer = document.getElementById('module-tabs');
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
    
    const renderTabs = () => {
        moduleTabsContainer.innerHTML = '';
        Object.keys(modulesData).forEach(key => {
            const module = modulesData[key];
            const moduleNum = parseInt(key.replace('module', ''));
            const button = document.createElement('button');
            button.className = 'tab-button';
            button.setAttribute('role', 'tab');
            button.dataset.module = key;
            
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
            
            button.disabled = isLocked;
            if (isLocked) {
                button.setAttribute('title', unlockMessage);
            }
            
            button.innerHTML = `<span>${module.name} ${isLocked ? '<span class="lock-icon" aria-label="locked">🔒</span>' : ''}</span>`;
            
            if (appState.currentModule === key) {
                button.classList.add('active');
            }
            moduleTabsContainer.appendChild(button);
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
            <h2 class="text-3xl font-bold text-center mb-2 text-gray-900">${title}</h2>
            <p class="text-center text-gray-500 mb-6">Estimated Time: ${module.learningTime}</p>
            <div class="max-w-4xl mx-auto">
                <p class="text-gray-700 mb-6 leading-relaxed">${description}</p>
                <textarea id="assignment-submission" class="w-full p-3 border border-gray-300 rounded-md mb-4 focus:ring-indigo-500 focus:border-indigo-500" rows="8" placeholder="Complete your assignment here..."></textarea>
                <div class="flex items-center justify-center gap-4 mb-6">
                    <button id="submit-assignment-btn" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-md transition-colors duration-200">Submit for AI Review</button>
                </div>
                <div id="feedback-area" class="bg-gray-100 p-4 rounded-md border border-gray-200 text-gray-700 min-h-[100px]">
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
        if (!submissionText) { feedbackArea.innerHTML = '<p class="text-red-600 font-bold">Please enter your assignment submission.</p>'; return; }

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
            renderTabs(); 

            const scoreThreshold = modulesData[appState.currentModule].minScoreToUnlock;
            let resultHTML = score >= scoreThreshold ?
                `<p class="font-bold text-green-700">Mission Passed! AI Score: ${score}/100.</p><p>You have unlocked the next module!</p>` :
                `<p class="font-bold text-orange-600">Mission Incomplete. AI Score: ${score}/100.</p><p>Please review the feedback, improve your submission, and try again.</p>`;
            resultHTML += `<div class="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200 text-left"><h4 class="font-bold text-blue-800">AI Mentor's Feedback:</h4><div class="text-blue-700 whitespace-pre-wrap mt-2">${feedback}</div></div>`;
            feedbackArea.innerHTML = resultHTML;

        } catch (error) {
            feedbackArea.innerHTML = `<p class="text-red-500">An error occurred during AI review: ${error.message}</p>`;
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `Submit for AI Review`;
        }
    };

    // --- EVENT LISTENERS ---
    askAiBtn.addEventListener('click', async () => {
        const question = aiQuestionInput.value.trim();
        if (!question) { aiResponseArea.innerHTML = '<p class="text-red-400">Please enter a question.</p>'; return; }
        askAiBtn.disabled = true;
        askAiBtn.innerHTML = `<span class="loader"></span><span class="ml-2">Thinking...</span>`;
        aiResponseArea.innerHTML = `<p class="text-gray-400">Processing...</p>`;
        try {
            const finalPrompt = `${aiSystemPrompt}\n\nUser's question: "${question}"`;
            const responseText = await getAITextResponse(finalPrompt);
            aiResponseArea.innerHTML = `<div class="content-fade-in whitespace-pre-wrap text-left">${responseText}</div>`;
        } catch (error) {
            aiResponseArea.innerHTML = `<p class="text-red-400">Error: ${error.message}</p>`;
        } finally {
            askAiBtn.disabled = false;
            askAiBtn.innerHTML = `<span>Ask AI Co-Pilot</span>`;
        }
    });

    moduleTabsContainer.addEventListener('click', (e) => { const button = e.target.closest('.tab-button'); if (button && !button.disabled) { changeModule(button.dataset.module); } });
    
    // --- OTHER FUNCTIONS ---
    const loadProgress = () => { const savedProgress = JSON.parse(localStorage.getItem('userProgress') || '{}'); appState.userProgress = savedProgress; Object.keys(modulesData).forEach(key => { if (typeof appState.userProgress[key] !== 'number') { appState.userProgress[key] = 0; } }); };
    const saveProgress = () => { localStorage.setItem('userProgress', JSON.stringify(appState.userProgress)); };
    const changeModule = (newModuleKey) => { if (newModuleKey === appState.currentModule) return; appState.currentModule = newModuleKey; appState.selectedSkill = null; mainContent.style.opacity = 0; setTimeout(() => { renderTabs(); renderContent(); mainContent.style.opacity = 1; }, 300); };
    const updateActiveSkillCard = () => { document.querySelectorAll('.skill-card').forEach(c => c.classList.remove('active')); if (appState.selectedSkill) { const activeCard = document.querySelector(`#skill-grid [data-skill-key="${appState.selectedSkill}"]`); if (activeCard) activeCard.classList.add('active'); } };
    const initializeChart = (score) => { const ctx = document.getElementById('progressChart')?.getContext('2d'); if (!ctx) return; if (progressChart) progressChart.destroy(); progressChart = new Chart(ctx, { type: 'bar', data: { labels: ['Mastery Level'], datasets: [{ label: 'Score', data: [score], backgroundColor: score >= 70 ? 'rgba(16, 185, 129, 0.6)' : 'rgba(79, 70, 229, 0.6)', borderColor: score >= 70 ? '#10B981' : '#4F46E5', borderWidth: 2, borderRadius: 5, }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100, title: { display: true, text: 'Score (%)' } } }, plugins: { legend: { display: false } } } }); };
    const updateProgressChart = (score) => { if (!progressChart) { initializeChart(score); return; } progressChart.data.datasets[0].data[0] = score; progressChart.data.datasets[0].backgroundColor = score >= 70 ? 'rgba(16, 185, 129, 0.6)' : 'rgba(79, 70, 229, 0.6)'; progressChart.data.datasets[0].borderColor = score >= 70 ? '#10B981' : '#4F46E5'; progressChart.update(); };
    
    function renderContent() {
        const learningsContent = document.getElementById('learnings-content');
        const skillGrid = document.getElementById('skill-grid');
        const module = modulesData[appState.currentModule];
        learningsContent.innerHTML = '';
        if (module.learnings) module.learnings.forEach((learning, index) => { const card = document.createElement('div'); card.className = 'bg-white p-6 rounded-lg shadow-md border border-gray-200 content-slide-up'; card.style.animationDelay = `${index * 100}ms`; card.innerHTML = `<h3 class="text-xl font-semibold mb-2 text-indigo-700">${learning.title}</h3><p class="text-gray-600">${learning.description}</p>`; learningsContent.appendChild(card); });
        skillGrid.innerHTML = '';
        if(module.skills) Object.keys(module.skills).forEach((key, index) => { const card = document.createElement('div'); card.className = 'skill-card content-slide-up'; card.dataset.skillKey = key; card.style.animationDelay = `${index * 100}ms`; card.innerHTML = `<div class="text-4xl">${module.skills[key].icon}</div><h4 class="mt-2 font-semibold text-gray-700">${module.skills[key].title}</h4>`; skillGrid.appendChild(card); });
        const firstSkillKey = module.skills ? Object.keys(module.skills)[0] : null;
        appState.selectedSkill = firstSkillKey;
        updateActiveSkillCard();
        renderSkillDetailsAndMaterials();
        renderAssignment();
    }

    function renderSkillDetailsAndMaterials() {
        const skillDetails = document.getElementById('skill-details');
        const studyMaterialsContent = document.getElementById('study-materials-content');
        const skill = modulesData[appState.currentModule]?.skills?.[appState.selectedSkill];
        if (!skill) { skillDetails.innerHTML = `<p class="text-gray-500 text-center">Select a skill.</p>`; studyMaterialsContent.parentElement.classList.add('hidden'); return; }
        skillDetails.innerHTML = `<div class="content-fade-in w-full text-left"><h3 class="text-2xl font-bold mb-4 text-indigo-700 flex items-center">${skill.icon} <span class="ml-3">${skill.title}</span></h3><div class="space-y-4"><div><h4 class="font-bold text-lg text-gray-800">Meaning</h4><p class="text-gray-600 mt-1">${skill.meaning}</p></div><div><h4 class="font-bold text-lg text-gray-800">Use Cases</h4><p class="text-gray-600 mt-1">${skill.useCases}</p></div></div></div>`;
        const materials = modulesData[appState.currentModule]?.studyMaterials?.[appState.selectedSkill];
        const container = studyMaterialsContent.parentElement;
        if (!materials || materials.length === 0) { container.classList.add('hidden'); return; }
        container.classList.remove('hidden');
        let linksHTML = `<h3 class="text-2xl font-bold text-center mb-6 text-gray-900">Deep Dive Resources: ${skill.title}</h3><div class="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">`;
        materials.forEach(material => { linksHTML += `<a href="${material.url}" target="_blank" rel="noopener noreferrer" class="block bg-indigo-50 hover:bg-indigo-100 p-4 rounded-lg transition-colors duration-200 text-indigo-800 font-medium hover:text-indigo-900 text-left flex items-center space-x-3"><svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg><span>${material.title}</span></a>`; });
        linksHTML += `</div>`;
        studyMaterialsContent.innerHTML = linksHTML;
    }

    const skillGrid = document.getElementById('skill-grid');
    skillGrid.addEventListener('click', (e) => { const card = e.target.closest('.skill-card'); if(card && card.dataset.skillKey !== appState.selectedSkill) { appState.selectedSkill = card.dataset.skillKey; updateActiveSkillCard(); renderSkillDetailsAndMaterials(); } });

    const init = () => { loadProgress(); renderTabs(); renderContent(); setTimeout(() => { mainContent.style.opacity = 1; }, 100); };
    
    init();
});
