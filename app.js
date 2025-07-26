document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    const appState = {
        currentModule: 'module1',
        selectedSkill: null,
        userProgress: {},
        isContentLoaded: false
    };

    // --- API & DATA ---
    const API_KEY = "AIzaSyDucHm7Pl65UQB3u9c_LHLTSYm-GY01KHM"; // Your API Key is here.
    
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
        module7: { name: "Capstone & Portfolio", learningTime: "Approx. 44 hours", minScoreToUnlock: 101 },
    };

    // --- DOM SELECTORS ---
    const mainContent = document.getElementById('main-content');
    const moduleTabsContainer = document.getElementById('module-tabs');
    const learningsContent = document.getElementById('learnings-content');
    const skillGrid = document.getElementById('skill-grid');
    const skillDetails = document.getElementById('skill-details');
    const studyMaterialsContent = document.getElementById('study-materials-content');
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

            const isLocked = moduleNum > 1 && (appState.userProgress[`module${moduleNum - 1}`] || 0) < modulesData[`module${moduleNum - 1}`].minScoreToUnlock;
            
            button.disabled = isLocked;
            button.innerHTML = `Module ${moduleNum}${isLocked ? '<span class="lock-icon">🔒</span>' : ''}`;
            
            if (appState.currentModule === key) {
                button.classList.add('active');
            }
            moduleTabsContainer.appendChild(button);
        });
    };

    const renderLearnings = () => {
        const module = modulesData[appState.currentModule];
        learningsContent.innerHTML = '';
        if (!module || !module.learnings) return;
        
        module.learnings.forEach((learning, index) => {
            const card = document.createElement('div');
            card.className = 'bg-white p-6 rounded-lg shadow-md border border-gray-200 content-slide-up';
            card.style.animationDelay = `${index * 100}ms`;
            card.innerHTML = `
                <h3 class="text-xl font-semibold mb-2 text-indigo-700">${learning.title}</h3>
                <p class="text-gray-600">${learning.description}</p>
            `;
            learningsContent.appendChild(card);
        });
    };
    
    const renderSkills = () => {
        const module = modulesData[appState.currentModule];
        skillGrid.innerHTML = '';
        if (!module || !module.skills) return;
    
        Object.keys(module.skills).forEach((key, index) => {
            const card = createSkillCard(key, module.skills[key]);
            card.style.animationDelay = `${index * 100}ms`;
            skillGrid.appendChild(card);
        });
    
        const firstSkillKey = module.skills ? Object.keys(module.skills)[0] : null;
        if (firstSkillKey) {
            appState.selectedSkill = firstSkillKey;
            updateActiveSkillCard();
            renderSkillDetails();
            renderStudyMaterials();
        } else {
            skillDetails.innerHTML = `<p class="text-gray-500 text-center">No skills defined for this module.</p>`;
            studyMaterialsContent.innerHTML = '';
        }
    };
    
    const createSkillCard = (key, skill) => {
        const card = document.createElement('div');
        card.className = 'skill-card content-slide-up';
        card.dataset.skillKey = key;
        card.innerHTML = `
            <div class="text-3xl">${skill.icon}</div>
            <h4 class="mt-2 font-semibold text-gray-700">${skill.title}</h4>
        `;
        return card;
    };
    
    const renderSkillDetails = () => {
        const skill = modulesData[appState.currentModule]?.skills?.[appState.selectedSkill];
        if (!skill) {
             skillDetails.innerHTML = `<p class="text-gray-500 text-center">Select a skill to see its details.</p>`;
             return;
        };

        skillDetails.innerHTML = `
            <div class="content-fade-in w-full text-left">
                <h3 class="text-2xl font-bold mb-4 text-indigo-700 flex items-center">${skill.icon} <span class="ml-3">${skill.title}</span></h3>
                <div class="space-y-4">
                    <div>
                        <h4 class="font-bold text-lg text-gray-800">Meaning</h4>
                        <p class="text-gray-600 mt-1">${skill.meaning}</p>
                    </div>
                    <div>
                        <h4 class="font-bold text-lg text-gray-800">Use Cases</h4>
                        <p class="text-gray-600 mt-1">${skill.useCases}</p>
                    </div>
                </div>
            </div>`;
    };

    const renderStudyMaterials = () => {
        const materials = modulesData[appState.currentModule]?.studyMaterials?.[appState.selectedSkill];
        studyMaterialsContent.innerHTML = '';

        if (!materials || materials.length === 0) {
            studyMaterialsContent.innerHTML = `<p class="text-gray-500">No study materials for this skill yet.</p>`;
            return;
        }

        const skillTitle = modulesData[appState.currentModule].skills[appState.selectedSkill].title;
        let linksHTML = `<h3 class="text-2xl font-bold mb-6 text-gray-900">Deep Dive Resources: ${skillTitle}</h3>
                         <div class="grid md:grid-cols-2 gap-4">`;
        
        materials.forEach(material => {
            linksHTML += `
                <a href="${material.url}" target="_blank" rel="noopener noreferrer" class="block bg-indigo-50 hover:bg-indigo-100 p-4 rounded-lg transition-colors duration-200 text-indigo-700 font-medium hover:text-indigo-900">
                   🔗 ${material.title}
                </a>`;
        });

        linksHTML += `</div>`;
        studyMaterialsContent.innerHTML = linksHTML;
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
                <div class="text-gray-700 mb-6 leading-relaxed">${description}</div>
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
                `<p class="font-bold text-yellow-600">Mission Incomplete. AI Score: ${score}/100.</p><p>Please review the feedback, improve your submission, and try again.</p>`;
            resultHTML += `<div class="mt-4 p-3 bg-indigo-50 rounded-md border border-indigo-200 text-left"><h4 class="font-bold text-indigo-800">AI Mentor's Feedback:</h4><div class="text-indigo-700 whitespace-pre-wrap mt-2">${feedback}</div></div>`;
            feedbackArea.innerHTML = resultHTML;

        } catch (error) {
            feedbackArea.innerHTML = `<p class="text-red-600 font-bold">An error occurred during AI review: ${error.message}</p>`;
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `Submit for AI Review`;
        }
    };

    const updateActiveSkillCard = () => {
        document.querySelectorAll('.skill-card').forEach(c => c.classList.remove('active'));
        if (appState.selectedSkill) {
            const activeCard = skillGrid.querySelector(`[data-skill-key="${appState.selectedSkill}"]`);
            if (activeCard) activeCard.classList.add('active');
        }
    };
    
    const changeModule = (newModule) => {
        appState.currentModule = newModule;
        appState.selectedSkill = null;
        
        mainContent.style.opacity = 0;
        
        setTimeout(() => {
            renderTabs();
            renderLearnings();
            renderSkills();
            renderAssignment();
            mainContent.style.opacity = 1;
        }, 300);
    };

    const loadProgress = () => {
        const savedProgress = JSON.parse(localStorage.getItem('userProgress') || '{}');
        appState.userProgress = savedProgress;
        for (let i = 1; i <= 7; i++) {
            const moduleKey = `module${i}`;
            if (typeof appState.userProgress[moduleKey] !== 'number') {
                appState.userProgress[moduleKey] = 0;
            }
        }
    };

    const saveProgress = () => {
        localStorage.setItem('userProgress', JSON.stringify(appState.userProgress));
    };

    const initializeChart = (score) => {
        const ctx = document.getElementById('progressChart')?.getContext('2d');
        if (!ctx) return;
        if (progressChart) progressChart.destroy();
        progressChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Mastery Level'],
                datasets: [{
                    label: 'Score',
                    data: [score],
                    backgroundColor: score >= 70 ? 'rgba(16, 185, 129, 0.6)' : 'rgba(79, 70, 229, 0.6)',
                    borderColor: score >= 70 ? '#10B981' : '#4F46E5',
                    borderWidth: 2,
                    borderRadius: 5,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, max: 100, title: { display: true, text: 'Score (%)' } }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    };

    const updateProgressChart = (score) => {
        if (!progressChart) {
            initializeChart(score);
            return;
        }
        progressChart.data.datasets[0].data[0] = score;
        progressChart.data.datasets[0].backgroundColor = score >= 70 ? 'rgba(16, 185, 129, 0.6)' : 'rgba(79, 70, 229, 0.6)';
        progressChart.data.datasets[0].borderColor = score >= 70 ? '#10B981' : '#4F46E5';
        progressChart.update();
    };


    // --- EVENT LISTENERS ---

    moduleTabsContainer.addEventListener('click', (e) => {
        const button = e.target.closest('.tab-button');
        if (button && !button.disabled && button.dataset.module !== appState.currentModule) {
            changeModule(button.dataset.module);
        }
    });

    skillGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.skill-card');
        if(card && card.dataset.skillKey !== appState.selectedSkill) {
            appState.selectedSkill = card.dataset.skillKey;
            updateActiveSkillCard();
            renderSkillDetails();
            renderStudyMaterials();
        }
    });

    askAiBtn.addEventListener('click', async () => {
        const question = aiQuestionInput.value.trim();
        if (!question) {
            aiResponseArea.innerHTML = '<p class="text-red-400">Please enter a question for the AI Co-Pilot.</p>';
            return;
        }

        askAiBtn.disabled = true;
        askAiBtn.innerHTML = `<span class="loader"></span><span class="ml-2">Thinking...</span>`;
        aiResponseArea.innerHTML = `<p class="text-gray-400">Processing...</p>`;

        try {
            const finalPrompt = `${aiSystemPrompt}\n\nUser's question: "${question}"`;
            const responseText = await getAITextResponse(finalPrompt);
            aiResponseArea.innerHTML = `<div class="content-fade-in whitespace-pre-wrap text-left">${responseText}</div>`;
        } catch (error) {
            aiResponseArea.innerHTML = `<p class="text-red-500 font-bold">Error: ${error.message}</p>`;
        } finally {
            askAiBtn.disabled = false;
            askAiBtn.innerHTML = `<span>Ask AI Co-Pilot</span>`;
        }
    });

    // --- FULL MODULE DATA & INITIALIZATION ---
    Object.assign(modulesData.module1, { learnings: [ { title: "Intro to UX Design", description: "Understand the basics of UX design and the product development lifecycle." }, { title: "Core UX Concepts", description: "Familiarize yourself with essential UX terminology and frameworks like user-centered design." }], skills: { ux: { title: "User Experience (UX)", icon: "🎨", meaning: "The overall experience of a person using a product, especially in terms of how easy or pleasing it is to use.", useCases: "Applied to create intuitive apps, websites, and services." } }, studyMaterials: { ux: [{ title: "What is UX Design?", url: "#" }] }, assignment: { title: "Mission 1: The Usability Detective", description: "Choose a common object or app screen. Identify 3 specific usability issues. For each, propose a clear design improvement and explain your reasoning." } });
    Object.assign(modulesData.module2, { learnings: [ { title: "Empathizing with Users", description: "Learn techniques to deeply understand user needs and motivations." }, { title: "Creating User Personas", description: "Develop fictional characters based on research to represent your target users." }], skills: { personas: { title: "User Personas", icon: "👤", meaning: "Fictional characters created to represent user types.", useCases: "Helps the team focus on a manageable cast of characters, instead of trying to design for everyone." } }, studyMaterials: { personas: [{ title: "Creating User Personas", url: "#" }] }, assignment: { title: "Mission 2: The Empathy Engine", description: "Create a user persona and an empathy map for a new language-learning app based on provided research notes." } });
    Object.assign(modulesData.module3, { learnings: [ { title: "Wireframing", description: "Learn to create basic structural blueprints for your designs." }, { title: "Prototyping", description: "Build interactive, low-fidelity versions of your designs for early testing." }], skills: { wireframing: { title: "Wireframing", icon: "📝", meaning: "A basic visual guide that represents the skeletal framework of a website or app.", useCases: "Used early in design to lay out ideas and define page structure." } }, studyMaterials: { wireframing: [{ title: "Wireframing for Beginners", url: "#" }] }, assignment: { title: "Mission 3: The Architect", description: "Create a 3-screen wireframe for a new mobile weather app." } });
    Object.assign(modulesData.module4, { learnings: [ { title: "Usability Studies", description: "Learn how to plan and conduct effective usability tests." }, { title: "Synthesizing Research", description: "Analyze research data to find actionable insights." }], skills: { usability: { title: "Usability Testing", icon: "🧪", meaning: "Evaluating a product by testing it on representative users.", useCases: "Crucial for validating design decisions and identifying confusing elements." } }, studyMaterials: { usability: [{ title: "Usability Testing 101", url: "#" }] }, assignment: { title: "Mission 4: The User Whisperer", description: "Write a research plan for a usability study of a new e-commerce website." } });
    Object.assign(modulesData.module5, { learnings: [ { title: "Visual Design Principles", description: "Understand hierarchy, balance, and contrast." }, { title: "Design Systems", description: "Learn how to create and use a consistent set of design components." }], skills: { designSystems: { title: "Design Systems", icon: "📚", meaning: "A set of standards, components, and guidelines that ensure design consistency.", useCases: "Used to maintain brand consistency and accelerate design and development workflows." } }, studyMaterials: { designSystems: [{ title: "What is a Design System?", url: "#" }] }, assignment: { title: "Mission 5: The Visual Virtuoso", description: "Design a high-fidelity mockup for the home screen of a new music streaming app." } });
    Object.assign(modulesData.module6, { learnings: [ { title: "Responsive Grids", description: "Learn how to design layouts that adapt to different screen sizes." }, { title: "Mobile-First Design", description: "Understand the strategy of designing for mobile before designing for desktop." }], skills: { responsive: { title: "Responsive Design", icon: "📱", meaning: "Designing web pages that look good on all devices.", useCases: "Crucial for modern web development to ensure optimal user experience across devices." } }, studyMaterials: { responsive: [{ title: "Responsive Design Explained", url: "#" }] }, assignment: { title: "Mission 6: The Adaptable Architect", description: "Create a responsive design (mobile and desktop views) for a blog article page." } });
    Object.assign(modulesData.module7, { learnings: [ { title: "Building a Case Study", description: "Learn how to tell a compelling story about your design process." }, { title: "Portfolio Presentation", description: "Prepare to present your work effectively in interviews." }], skills: { portfolio: { title: "UX Portfolio", icon: "💼", meaning: "A curated collection of a UX designer's best work.", useCases: "Essential for job applications, allowing designers to demonstrate their abilities to potential employers." } }, studyMaterials: { portfolio: [{ title: "How to Create a UX Portfolio", url: "#" }] }, assignment: { title: "Mission 7: The Capstone", description: "Create a complete case study for one of the previous projects you completed in this course, ready to be added to your portfolio." } });

    const init = () => {
        loadProgress();
        renderTabs();
        renderLearnings();
        renderSkills();
        renderAssignment();
        
        setTimeout(() => {
            mainContent.style.opacity = 1;
            appState.isContentLoaded = true;
        }, 100);
    };

    init();
});
