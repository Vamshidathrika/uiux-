document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    const appState = {
        currentModule: 'module1',
        selectedSkill: null,
        userProgress: {},
    };

    // --- API & DATA ---
    const API_KEY = "AIzaSyDucHm7Pl65UQB3u9c_LHLTSYm-GY01KHM"; // Your API Key is here.
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
    const mainContent = document.getElementById('main-content');
    const moduleNavigationContainer = document.getElementById('module-navigation');
    
    let progressChart = null;

    // --- GEMINI API FUNCTIONS ---
    async function getAITextResponse(prompt) { return await callGeminiAPI(prompt, "text/plain"); }
    async function getAIAssessment(prompt) { const schema = { type: "OBJECT", properties: { feedback: { type: "STRING" }, score: { type: "NUMBER" } }, required: ["feedback", "score"] }; return await callGeminiAPI(prompt, "application/json", schema); }
    async function callGeminiAPI(prompt, mimeType, schema = null) { if (!API_KEY) { throw new Error("API_KEY is not set."); } const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`; const generationConfig = { response_mime_type: mimeType, ...(schema && { response_schema: schema }) }; const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig }; try { const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); if (!response.ok) { const errorBody = await response.json(); throw new Error(`API request failed: ${errorBody.error.message}`); } const result = await response.json(); if (result.candidates && result.candidates[0]?.content.parts[0]) { const responseText = result.candidates[0].content.parts[0].text; return mimeType === "application/json" ? JSON.parse(responseText) : responseText; } else { throw new Error("Could not get a valid response from the AI."); } } catch (error) { console.error("Error calling Gemini API:", error); throw error; } }

    // --- RENDER FUNCTIONS ---
    
    const renderModuleNavigation = () => {
        moduleNavigationContainer.innerHTML = '';
        const moduleKeys = Object.keys(modulesData);
        
        moduleKeys.forEach((key, index) => {
            const module = modulesData[key];
            const moduleNum = index + 1;
            const card = document.createElement('div');
            card.dataset.module = key;

            let isLocked = false;
            let unlockMessage = '';
            
            if (moduleNum > 1) {
                const prevModuleKey = `module${moduleNum - 1}`;
                const prevModule = modulesData[prevModuleKey];
                const prevModuleScore = appState.userProgress[prevModuleKey] || 0;
                if (prevModuleScore < prevModule.minScoreToUnlock) {
                    isLocked = true;
                    unlockMessage = `Complete '${prevModule.name}' to unlock.`;
                }
            }
            
            card.className = `module-card ${isLocked ? 'locked' : ''}`;
            card.setAttribute('title', isLocked ? unlockMessage : `Select ${module.name}`);
            
            const yOffset = index * 20;
            const xOffset = index * 15;
            card.style.transform = `translateY(${yOffset}px) translateX(${xOffset}px) translateZ(-${index * 20}px)`;
            
            const score = appState.userProgress[key] || 0;
            const isCompleted = score >= module.minScoreToUnlock;

            card.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <span class="text-sm font-bold text-accent-blue">MODULE ${moduleNum}</span>
                    ${isCompleted ? '<span class="text-xs font-bold text-green-400 bg-green-900/50 px-2 py-1 rounded-full">✓ COMPLETED</span>' : ''}
                </div>
                <h3 class="text-lg font-bold text-white">${module.name}</h3>
                <p class="text-sm text-gray-400 mt-auto pt-4">Score: ${score}/100</p>
            `;
            moduleNavigationContainer.appendChild(card);
        });
    };

    const renderMainContent = () => {
        const module = modulesData[appState.currentModule];
        mainContent.innerHTML = `
            <header class="mb-12">
                <h2 class="text-3xl font-bold text-white">${module.name}</h2>
                <p class="text-md text-gray-400">Estimated Time: ${module.learningTime}</p>
            </header>
            <section id="module-content-section" class="mb-12"></section>
            <section id="study-materials-section" class="mb-12"><div id="study-materials-content" class="text-center"></div></section>
            <section id="assignment-section" class="mb-12 bg-secondary-dark border border-border-color p-6 md:p-8 rounded-lg"></section>
            <section id="ai-co-pilot-section" class="bg-secondary-dark border border-border-color text-white p-6 md:p-8 rounded-lg">
                <h2 class="text-2xl font-bold text-center mb-6 text-white">AI Co-Pilot</h2>
                <div class="max-w-3xl mx-auto">
                    <p class="text-gray-400 text-center mb-4">Your instant mentor for UI/UX questions.</p>
                    <textarea id="ai-question-input" class="w-full p-3 bg-primary-dark border border-border-color rounded-md mb-4 focus:ring-2 focus:ring-accent-blue focus:border-accent-blue placeholder-gray-500 text-white" rows="4" placeholder="e.g., 'Explain Hick's Law in simple terms.'"></textarea>
                    <button id="ask-ai-btn" class="w-full bg-accent-blue hover:bg-accent-blue-hover text-white font-bold py-3 px-4 rounded-md transition-all duration-300 flex items-center justify-center space-x-2 button-glow"><span>Ask AI Co-Pilot</span></button>
                    <div id="ai-response-area" class="bg-primary-dark p-4 rounded-md border border-border-color min-h-[100px] mt-4"><p class="text-gray-500 text-center">AI response will appear here.</p></div>
                </div>
            </section>
        `;
        renderSubtopicsAndSkills();
        renderAssignment();
        document.getElementById('ask-ai-btn').addEventListener('click', handleAskAI);
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
            renderModuleNavigation(); 

            const scoreThreshold = modulesData[appState.currentModule].minScoreToUnlock;
            let resultHTML = score >= scoreThreshold ?
                `<p class="font-bold text-green-400">Mission Passed! AI Score: ${score}/100.</p><p>You have unlocked the next module!</p>` :
                `<p class="font-bold text-yellow-400">Mission Incomplete. AI Score: ${score}/100.</p><p>Please review the feedback, improve your submission, and try again.</p>`;
            resultHTML += `<div class="mt-4 p-3 bg-secondary-dark rounded-md border border-border-color text-left"><h4 class="font-bold text-accent-blue">AI Mentor's Feedback:</h4><div class="text-gray-300 whitespace-pre-wrap mt-2">${feedback}</div></div>`;
            feedbackArea.innerHTML = resultHTML;

        } catch (error) {
            feedbackArea.innerHTML = `<p class="text-red-400">An error occurred during AI review: ${error.message}</p>`;
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `Submit for AI Review`;
        }
    };
    
    // --- EVENT LISTENERS ---
    const handleAskAI = async () => {
        const aiQuestionInput = document.getElementById('ai-question-input');
        const askAiBtn = document.getElementById('ask-ai-btn');
        const aiResponseArea = document.getElementById('ai-response-area');
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
            aiResponseArea.innerHTML = `<p class="text-red-400 font-bold">Error: ${error.message}</p>`;
        } finally {
            askAiBtn.disabled = false;
            askAiBtn.innerHTML = `<span>Ask AI Co-Pilot</span>`;
        }
    };
    moduleNavigationContainer.addEventListener('click', (e) => { const card = e.target.closest('.module-card'); if (card && !card.classList.contains('locked')) { changeModule(card.dataset.module); } });
    
    // --- OTHER FUNCTIONS ---
    const loadProgress = () => { const savedProgress = JSON.parse(localStorage.getItem('userProgress') || '{}'); appState.userProgress = savedProgress; Object.keys(modulesData).forEach(key => { if (typeof appState.userProgress[key] !== 'number') { appState.userProgress[key] = 0; } }); };
    const saveProgress = () => { localStorage.setItem('userProgress', JSON.stringify(appState.userProgress)); };
    const changeModule = (newModuleKey) => { if (newModuleKey === appState.currentModule) return; appState.currentModule = newModuleKey; appState.selectedSkill = null; mainContent.style.opacity = 0; setTimeout(() => { renderModuleNavigation(); renderMainContent(); mainContent.style.opacity = 1; }, 300); };
    const initializeChart = (score) => { const ctx = document.getElementById('progressChart')?.getContext('2d'); if (!ctx) return; if (progressChart) progressChart.destroy(); Chart.defaults.color = '#D1D5DB'; Chart.defaults.borderColor = '#374151'; progressChart = new Chart(ctx, { type: 'bar', data: { labels: ['Mastery Level'], datasets: [{ label: 'Score', data: [score], backgroundColor: score >= 70 ? 'rgba(59, 130, 246, 0.5)' : 'rgba(209, 213, 219, 0.2)', borderColor: score >= 70 ? '#3B82F6' : '#D1D5DB', borderWidth: 2, borderRadius: 5, }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100, grid: { color: '#374151' }, ticks: { color: '#D1D5DB' }, title: { display: true, text: 'Score (%)', color: '#D1D5DB' } }, x: { grid: { display: false } } }, plugins: { legend: { display: false } } } }); };
    const updateProgressChart = (score) => { if (!progressChart) { initializeChart(score); return; } progressChart.data.datasets[0].data[0] = score; progressChart.data.datasets[0].backgroundColor = score >= 70 ? 'rgba(59, 130, 246, 0.5)' : 'rgba(209, 213, 219, 0.2)'; progressChart.data.datasets[0].borderColor = score >= 70 ? '#3B82F6' : '#D1D5DB'; progressChart.update(); };
    
    function renderSubtopicsAndSkills() {
        const moduleContentSection = document.getElementById('module-content-section');
        const module = modulesData[appState.currentModule];
        moduleContentSection.innerHTML = '';

        if (module.subtopics) {
            module.subtopics.forEach((subtopic, index) => {
                const subtopicCard = document.createElement('div');
                subtopicCard.className = 'subtopic-card mb-8';
                subtopicCard.style.animationDelay = `${index * 100}ms`;

                let skillsHTML = '<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">';
                if (subtopic.skills) {
                    Object.keys(subtopic.skills).forEach(key => {
                        const skill = subtopic.skills[key];
                        skillsHTML += `
                            <div class="skill-card" data-skill-key="${key}">
                                <span class="text-2xl">${skill.icon}</span>
                                <span class="font-semibold text-white">${skill.title}</span>
                            </div>
                        `;
                    });
                }
                skillsHTML += '</div>';

                subtopicCard.innerHTML = `
                    <h3 class="text-2xl font-bold text-white mb-4">${subtopic.title}</h3>
                    <p class="text-gray-400 mb-4">${subtopic.description}</p>
                    ${skillsHTML}
                `;
                moduleContentSection.appendChild(subtopicCard);
            });
        }
        
        const firstSkillKey = module.subtopics?.[0]?.skills ? Object.keys(module.subtopics[0].skills)[0] : null;
        appState.selectedSkill = firstSkillKey;
        
        document.querySelector(`.skill-card[data-skill-key="${appState.selectedSkill}"]`)?.classList.add('active');
        
        renderStudyMaterials();

        document.querySelectorAll('.skill-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const clickedCard = e.currentTarget;
                appState.selectedSkill = clickedCard.dataset.skillKey;
                document.querySelectorAll('.skill-card').forEach(c => c.classList.remove('active'));
                clickedCard.classList.add('active');
                renderStudyMaterials();
            });
        });
    }

    function renderStudyMaterials() {
        const studyMaterialsContent = document.getElementById('study-materials-content');
        studyMaterialsContent.innerHTML = '';
        const container = studyMaterialsContent.parentElement;
        container.classList.add('hidden');

        if (!appState.selectedSkill) return;

        let materials = null;
        let skillTitle = '';

        modulesData[appState.currentModule].subtopics?.forEach(subtopic => {
            if (subtopic.skills && subtopic.skills[appState.selectedSkill]) {
                const skill = subtopic.skills[appState.selectedSkill];
                materials = skill.studyMaterials;
                skillTitle = skill.title;
            }
        });

        if (!materials || materials.length === 0) return;
        
        container.classList.remove('hidden');
        let linksHTML = `<h2 class="text-2xl font-bold text-white mb-6">Deep Dive Resources: ${skillTitle}</h2><div class="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">`;
        materials.forEach(material => { linksHTML += `<a href="${material.url}" target="_blank" rel="noopener noreferrer" class="block bg-secondary-dark hover:bg-gray-800/50 p-4 rounded-lg transition-colors duration-200 text-accent-blue font-medium hover:text-blue-300 text-left flex items-center space-x-3 border border-border-color"><svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg><span>${material.title}</span></a>`; });
        linksHTML += `</div>`;
        studyMaterialsContent.innerHTML = linksHTML;
    }
    
    // --- FULL MODULE DATA & INITIALIZATION ---
    Object.assign(modulesData.module1, {
        subtopics: [
            { title: "Core Principles", description: "Understand the fundamental concepts that drive all great user experiences.", skills: { ux: { title: "User Experience (UX)", icon: "🎨", studyMaterials: [{ title: "Google's UX Design Course (Full)", url: "https://www.youtube.com/watch?v=c9Wg6Cb_YlU" }] } } },
            { title: "User-Centric Thinking", description: "Learn to put the user at the center of your design process.", skills: { ucd: { title: "User-Centered Design", icon: "👥", studyMaterials: [{ title: "User Centered Design by NNGroup", url: "https://www.youtube.com/watch?v=s-yv0LethsU" }] } } }
        ],
        assignment: { title: "Mission 1: The Usability Detective", description: "Choose a common app on your phone. Identify 3 specific usability issues. For each, propose a clear design improvement and explain your reasoning." }
    });
    Object.assign(modulesData.module2, {
        subtopics: [
            { title: "Understanding the User", description: "Master techniques for deeply understanding user needs and motivations.", skills: { personas: { title: "User Personas", icon: "👤", studyMaterials: [{ title: "How To Create User Personas", url: "https://www.youtube.com/watch?v=s-yv0LethsU" }] } } },
            { title: "Defining the Problem", description: "Learn to formulate clear problem statements that will guide your design solutions.", skills: { problemStatements: { title: "Problem Statements", icon: "❓", studyMaterials: [{ title: "How to Write a Problem Statement", url: "https://www.youtube.com/watch?v=1g71Q13cM00" }] } } }
        ],
        assignment: { title: "Mission 2: The Empathy Engine", description: "Create a user persona and an empathy map for a new language-learning app based on provided research notes." }
    });
    Object.assign(modulesData.module3, { subtopics: [ { title: "Structuring Content", description: "Learn to create basic structural blueprints for your designs.", skills: { wireframing: { title: "Wireframing", icon: "📝", studyMaterials: [{ title: "Figma Wireframing Tutorial", url: "https://www.youtube.com/watch?v=Z5-4-vMa_1E" }] } } } ], assignment: { title: "Mission 3: The Architect", description: "Create a 3-screen wireframe for a new mobile weather app." } });
    Object.assign(modulesData.module4, { subtopics: [ { title: "Gathering Feedback", description: "Learn how to plan and conduct effective usability tests.", skills: { usability: { title: "Usability Testing", icon: "🧪", studyMaterials: [{ title: "Usability Testing Explained", url: "https://www.youtube.com/watch?v=g6i3q4g-sV4" }] } } } ], assignment: { title: "Mission 4: The User Whisperer", description: "Write a research plan for a usability study of a new e-commerce website." } });
    Object.assign(modulesData.module5, { subtopics: [ { title: "Visual Polish", description: "Understand hierarchy, balance, and contrast to create beautiful interfaces.", skills: { designSystems: { title: "Design Systems", icon: "📚", studyMaterials: [{ title: "Design Systems 101", url: "https://www.youtube.com/watch?v=6DD-G8O-78U" }] } } } ], assignment: { title: "Mission 5: The Visual Virtuoso", description: "Design a high-fidelity mockup for the home screen of a new music streaming app." } });
    Object.assign(modulesData.module6, { subtopics: [ { title: "Designing for All Screens", description: "Learn how to design layouts that adapt to different screen sizes.", skills: { responsive: { title: "Responsive Design", icon: "📱", studyMaterials: [{ title: "Responsive Design Tutorial", url: "https://www.youtube.com/watch?v=srvUrAS2_so" }] } } } ], assignment: { title: "Mission 6: The Adaptable Architect", description: "Create a responsive design (mobile and desktop views) for a blog article page." } });
    Object.assign(modulesData.module7, { subtopics: [ { title: "Showcasing Your Work", description: "Learn how to tell a compelling story about your design process in a case study.", skills: { portfolio: { title: "UX Portfolio", icon: "💼", studyMaterials: [{ title: "How to Build a Powerful UX Portfolio", url: "https://www.youtube.com/watch?v=Z_M0_b1h_sQ" }] } } } ], assignment: { title: "Mission 7: The Capstone", description: "Create a complete case study for one of the previous projects you completed in this course, ready to be added to your portfolio." } });

    const init = () => { loadProgress(); renderModuleNavigation(); renderMainContent(); setTimeout(() => { mainContent.style.opacity = 1; }, 100); };
    
    init();
});
