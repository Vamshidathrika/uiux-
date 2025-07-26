document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    const appState = {
        currentModule: 'module1',
        selectedSkill: null,
        userProgress: {},
        isContentLoaded: false
    };

    // --- API & DATA ---
    const API_KEY = "AIzaSyDucHm7Pl65UQB3u9c_LHLTSYm-GY01KHM"; // <-- Make sure your API key is pasted here

    const aiSystemPrompt = `You are a world-class UI/UX Design Lead and expert Mentor. Your knowledge is strictly limited to UI design, UX research, user psychology, design systems, accessibility, and related fields. Your rules are: 1. Strictly UI/UX: If a user asks a question outside of your domain, you MUST politely decline. 2. Concise & Clear: Your answers must be concise, clear, and easy to understand. Use bullet points and bold text. 3. Be a Mentor: Provide expert-level, accurate, and insightful information.`;

    const modulesData = {
        module1: {
            name: "Foundations of UX Design: The First Quest",
            learningTime: "Approx. 40 hours",
            minScoreToUnlock: 70, // This is the score needed to unlock module 2
            learnings: [
                { title: "Introducing user experience design", description: "Understand the basics of UX design, its characteristics, and the product development lifecycle." },
                { title: "Common terms, tools, and frameworks", description: "Familiarize yourself with essential UX terminology and design frameworks like user-centered design." },
            ],
            skills: {
                userExperienceDesign: { title: "User Experience (UX) Design", icon: "🎨", meaning: "The process of enhancing user satisfaction by improving the usability, accessibility, and pleasure provided in the interaction between the user and a product.", useCases: "Involves information architecture, interaction design, visual design, and usability to create intuitive apps and websites." },
                userCenteredDesign: { title: "User-Centered Design", icon: "👥", meaning: "An approach that prioritizes the user's needs, behaviors, and motivations throughout the entire design process.", useCases: "Applied in every stage of product development, from conducting user interviews to using A/B testing, ensuring the final product truly solves user problems." },
            },
            studyMaterials: {
                userExperienceDesign: [ { title: "What is UX Design? (Google)", url: "https://www.youtube.com/watch?v=f2K9hX2_0-Q" }, { title: "UX Design in 100 Seconds", url: "https://www.youtube.com/watch?v=Ovj4hFxko7c" } ],
                userCenteredDesign: [ { title: "User-Centered Design Explained", url: "https://www.youtube.com/watch?v=9gL57_yP610" }, { title: "Nielsen Norman Group on UCD", url: "https://www.nngroup.com/articles/user-centered-design/" } ],
            },
            assignment: {
                title: "Mission 1: The Usability Detective",
                description: `<strong>Your First Mission:</strong> Every great UI/UX developer starts by seeing the world through a user's eyes. Your task is to identify hidden frustrations in everyday objects.<br><br><strong>The Challenge:</strong> Choose a common object (e.g., a remote control, a public sign, a coffee maker) or a simple app screen. Identify 3 specific usability issues. For each, propose a clear, simple design improvement and explain *why* it's an issue from a user's perspective.`
            }
        },
        module2: {
            name: "Start the UX Design Process: Empathize, Define, and Ideate",
            learningTime: "Approx. 20 hours",
            minScoreToUnlock: 70, // Score needed to unlock module 3
            learnings: [/* ... module 2 learnings ... */],
            skills: {/* ... module 2 skills ... */},
            studyMaterials: {/* ... module 2 materials ... */},
            assignment: {
                title: "Mission 2: The Empathy Engine",
                description: "Your mission is to create a user persona and an empathy map for a new mobile app that helps people learn a new language. Base your work on provided research notes."
            }
        },
        // Add all other modules here...
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

    /**
     * Gets a standard text response from the AI.
     */
    async function getAITextResponse(prompt) {
        // This function is for general Q&A
        return await callGeminiAPI(prompt, "text/plain");
    }

    /**
     * Gets a structured JSON assessment (feedback and score) from the AI.
     */
    async function getAIAssessment(prompt) {
        const schema = {
            type: "OBJECT",
            properties: {
                feedback: { type: "STRING" },
                score: { type: "NUMBER" }
            },
            required: ["feedback", "score"]
        };
        return await callGeminiAPI(prompt, "application/json", schema);
    }

    /**
     * The core function for calling the Gemini API with specific configurations.
     */
    async function callGeminiAPI(prompt, mimeType, schema = null) {
        if (!API_KEY) {
            throw new Error("API_KEY is not set. Please add your Google AI API key to app.js.");
        }
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
        
        const generationConfig = {
            response_mime_type: mimeType,
            ...(schema && { response_schema: schema }) // Add schema only if it exists
        };

        const payload = {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig
        };

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(`API request failed: ${errorBody.error.message}`);
            }
            const result = await response.json();
            if (result.candidates && result.candidates[0]?.content.parts[0]) {
                const responseText = result.candidates[0].content.parts[0].text;
                // If we expect JSON, parse it. Otherwise, return plain text.
                return mimeType === "application/json" ? JSON.parse(responseText) : responseText;
            } else {
                throw new Error("Could not get a valid response from the AI.");
            }
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            throw error;
        }
    }


    // --- RENDER FUNCTIONS ---
    
    /**
     * Renders the module tabs, disabling locked modules.
     */
    const renderTabs = () => {
        moduleTabsContainer.innerHTML = '';
        Object.keys(modulesData).forEach(key => {
            const moduleNum = parseInt(key.replace('module', ''));
            const button = document.createElement('button');
            button.className = 'tab-button';
            button.setAttribute('role', 'tab');
            button.dataset.module = key;
            
            let isLocked = false;
            if (moduleNum > 1) {
                const prevModuleKey = `module${moduleNum - 1}`;
                const prevModuleScore = appState.userProgress[prevModuleKey] || 0;
                const scoreNeeded = modulesData[prevModuleKey].minScoreToUnlock;
                if (prevModuleScore < scoreNeeded) {
                    isLocked = true;
                }
            }
            
            button.disabled = isLocked;
            button.innerHTML = `Module ${moduleNum} ${isLocked ? '<span class="lock-icon" aria-label="locked">🔒</span>' : ''}`;
            
            if (appState.currentModule === key) {
                button.classList.add('active');
                button.setAttribute('aria-selected', 'true');
            }
            moduleTabsContainer.appendChild(button);
        });
    };

    /**
     * Renders the assignment section, now without the manual score input.
     */
    const renderAssignment = () => {
        const module = modulesData[appState.currentModule];
        assignmentSection.innerHTML = '';
        if (!module || !module.assignment) return;
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

    /**
     * Handles the entire AI review process.
     */
    const handleMissionDebrief = async () => {
        const feedbackArea = document.getElementById('feedback-area');
        const submissionText = document.getElementById('assignment-submission').value.trim();
        const submitBtn = document.getElementById('submit-assignment-btn');

        if (!submissionText) {
            feedbackArea.innerHTML = '<p class="text-red-600 font-bold">Please enter your assignment submission before requesting a review.</p>';
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="loader"></span><span class="ml-2">AI is Reviewing...</span>`;
        feedbackArea.innerHTML = `<p class="text-gray-500">Your submission is being analyzed by the AI Mentor. This may take a moment...</p>`;

        try {
            const assignment = modulesData[appState.currentModule].assignment;
            const assessmentPrompt = `You are a strict but fair UI/UX Professor. Your task is to evaluate a student's assignment submission and provide a score.
            
            Assignment: "${assignment.title} - ${assignment.description}"
            
            Student's Submission: "${submissionText}"
            
            Please perform the following actions:
            1.  **Critique the submission:** Analyze the student's work based on the assignment requirements. Provide clear, concise, and actionable feedback.
            2.  **Assign a score:** Based on your critique, provide a numerical score between 0 and 100. Be realistic. A perfect submission is rare.
            3.  **Return the result in JSON format:** The output MUST be a valid JSON object with two keys: "feedback" (a string containing your critique) and "score" (a number).`;

            const assessment = await getAIAssessment(assessmentPrompt);
            const { feedback, score } = assessment;

            // Update state and UI
            appState.userProgress[appState.currentModule] = score;
            saveProgress();
            updateProgressChart(score);
            renderTabs(); // Re-render tabs to check for unlocks

            // Display feedback
            const scoreThreshold = modulesData[appState.currentModule].minScoreToUnlock;
            let resultHTML = '';
            if (score >= scoreThreshold) {
                resultHTML = `<p class="font-bold text-green-700">Mission Passed! AI Score: ${score}/100.</p><p>You have unlocked the next module!</p>`;
            } else {
                resultHTML = `<p class="font-bold text-orange-600">Mission Incomplete. AI Score: ${score}/100.</p><p>Please review the feedback, improve your submission, and try again.</p>`;
            }

            resultHTML += `<div class="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200 text-left">
                               <h4 class="font-bold text-blue-800">AI Mentor's Feedback:</h4>
                               <div class="text-blue-700 whitespace-pre-wrap mt-2">${feedback}</div>
                           </div>`;
            
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
        if (!question) {
            aiResponseArea.innerHTML = '<p class="text-red-400">Please enter a question.</p>';
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
            aiResponseArea.innerHTML = `<p class="text-red-400">Error: ${error.message}</p>`;
        } finally {
            askAiBtn.disabled = false;
            askAiBtn.innerHTML = `<span>Ask AI Co-Pilot</span>`;
        }
    });

    // --- OTHER FUNCTIONS (UNCHANGED) ---
    // (loadProgress, saveProgress, changeModule, updateActiveSkillCard, etc.)
    const loadProgress = () => {
        const savedProgress = JSON.parse(localStorage.getItem('userProgress') || '{}');
        appState.userProgress = savedProgress;
        Object.keys(modulesData).forEach(key => {
            if (typeof appState.userProgress[key] !== 'number') {
                appState.userProgress[key] = 0;
            }
        });
    };
    const saveProgress = () => { localStorage.setItem('userProgress', JSON.stringify(appState.userProgress)); };
    const changeModule = (newModuleKey) => { if (newModuleKey === appState.currentModule) return; appState.currentModule = newModuleKey; appState.selectedSkill = null; mainContent.style.opacity = 0; setTimeout(() => { renderTabs(); renderLearnings(); renderSkills(); renderAssignment(); mainContent.style.opacity = 1; }, 300); };
    const updateActiveSkillCard = () => { document.querySelectorAll('.skill-card').forEach(c => c.classList.remove('active')); if (appState.selectedSkill) { const activeCard = skillGrid.querySelector(`[data-skill-key="${appState.selectedSkill}"]`); if (activeCard) activeCard.classList.add('active'); } };
    const initializeChart = (score) => { const ctx = document.getElementById('progressChart')?.getContext('2d'); if (!ctx) return; if (progressChart) progressChart.destroy(); progressChart = new Chart(ctx, { type: 'bar', data: { labels: ['Mastery Level'], datasets: [{ label: 'Score', data: [score], backgroundColor: score >= 70 ? 'rgba(16, 185, 129, 0.6)' : 'rgba(79, 70, 229, 0.6)', borderColor: score >= 70 ? '#10B981' : '#4F46E5', borderWidth: 2, borderRadius: 5, }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100, title: { display: true, text: 'Score (%)' } } }, plugins: { legend: { display: false } } } }); };
    const updateProgressChart = (score) => { if (!progressChart) { initializeChart(score); return; } progressChart.data.datasets[0].data[0] = score; progressChart.data.datasets[0].backgroundColor = score >= 70 ? 'rgba(16, 185, 129, 0.6)' : 'rgba(79, 70, 229, 0.6)'; progressChart.data.datasets[0].borderColor = score >= 70 ? '#10B981' : '#4F46E5'; progressChart.update(); };
    moduleTabsContainer.addEventListener('click', (e) => { const button = e.target.closest('.tab-button'); if (button && !button.disabled) { changeModule(button.dataset.module); } });
    skillGrid.addEventListener('click', (e) => { const card = e.target.closest('.skill-card'); if(card && card.dataset.skillKey !== appState.selectedSkill) { appState.selectedSkill = card.dataset.skillKey; updateActiveSkillCard(); renderSkillDetails(); renderStudyMaterials(); } });
    const init = () => { loadProgress(); renderTabs(); renderLearnings(); renderSkills(); renderAssignment(); setTimeout(() => { mainContent.style.opacity = 1; appState.isContentLoaded = true; }, 100); };
    // The renderLearnings, renderSkills, createSkillCard, renderSkillDetails, and renderStudyMaterials functions are unchanged and have been removed for brevity. You can copy them from the previous version.
    
    init();
});
