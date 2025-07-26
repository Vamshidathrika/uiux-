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

    // --- NEW: AI SYSTEM PROMPT ---
    // This is the core instruction that makes the AI smarter and more focused.
    const aiSystemPrompt = `You are a world-class UI/UX Design Lead and expert Mentor. Your knowledge is strictly limited to UI design, UX research, user psychology, design systems, accessibility, and related fields. 
    
    Your rules are:
    1.  **Strictly UI/UX:** If a user asks a question outside of your domain (e.g., about history, general coding, or random facts), you MUST politely decline, stating that your expertise is focused on UI/UX design.
    2.  **Concise & Clear:** Your answers must be concise, clear, and easy to understand. Use bullet points, **bold text** for key terms, and simple language.
    3.  **Be a Mentor:** Provide expert-level, accurate, and insightful information. Your goal is to teach and guide.`;


    const modulesData = {
        module1: {
            name: "Foundations of UX Design: The First Quest",
            learningTime: "Approx. 40 hours",
            minScoreToUnlock: 0,
            learnings: [
                { title: "Introducing user experience design", description: "Understand the basics of UX design, its characteristics, and the product development lifecycle." },
                { title: "Common terms, tools, and frameworks", description: "Familiarize yourself with essential UX terminology and design frameworks like user-centered design." },
                { title: "Joining design sprints", description: "Learn about the phases of a design sprint and how to plan and participate in one." },
                { title: "Building a professional presence", description: "Explore the job responsibilities of entry-level UX designers and how to build your professional profile." }
            ],
            skills: {
                userExperienceDesign: { title: "User Experience (UX) Design", icon: "🎨", meaning: "The process of enhancing user satisfaction by improving the usability, accessibility, and pleasure provided in the interaction between the user and a product.", useCases: "Involves information architecture, interaction design, visual design, and usability to create intuitive apps and websites." },
                userCenteredDesign: { title: "User-Centered Design", icon: "👥", meaning: "An approach that prioritizes the user's needs, behaviors, and motivations throughout the entire design process.", useCases: "Applied in every stage of product development, from conducting user interviews to using A/B testing, ensuring the final product truly solves user problems." },
                designThinking: { title: "Design Thinking", icon: "💡", meaning: "A non-linear, iterative process to understand users, challenge assumptions, redefine problems, and create innovative solutions.", useCases: "Applied to tackle complex problems by encouraging creative, human-centered solutions through its five phases: Empathize, Define, Ideate, Prototype, and Test." },
                designSprints: { title: "Design Sprints", icon: "⏱️", meaning: "A time-boxed, five-phase framework for answering critical business questions through design, prototyping, and testing ideas with users.", useCases: "Used to rapidly validate ideas, solve complex design challenges, and reduce risk before committing significant resources to full development." }
            },
            studyMaterials: {
                userExperienceDesign: [ { title: "What is UX Design? (Google)", url: "https://www.youtube.com/watch?v=f2K9hX2_0-Q" }, { title: "UX Design in 100 Seconds", url: "https://www.youtube.com/watch?v=Ovj4hFxko7c" } ],
                userCenteredDesign: [ { title: "User-Centered Design Explained", url: "https://www.youtube.com/watch?v=9gL57_yP610" }, { title: "Nielsen Norman Group on UCD", url: "https://www.nngroup.com/articles/user-centered-design/" } ],
                designThinking: [ { title: "What is Design Thinking? (IDEO)", url: "https://www.youtube.com/watch?v=aG0Kqf2tB8I" }, { title: "Design Thinking in 5 Minutes", url: "https://www.youtube.com/watch?v=j30s_D4j248" } ],
                designSprints: [ { title: "Intro to Design Sprints (Google)", url: "https://www.youtube.com/watch?v=Z5rL54_d9-0" }, { title: "The 5 Phases of a Design Sprint", url: "https://www.youtube.com/watch?v=Y0b2D6_yM_0" } ]
            },
            assignment: {
                title: "Mission 1: The Usability Detective",
                description: `<strong>Your First Mission:</strong> Every great UI/UX developer starts by seeing the world through a user's eyes. Your task is to identify hidden frustrations in everyday objects.<br><br><strong>The Challenge:</strong> Choose a common object (e.g., a remote control, a public sign, a coffee maker) or a simple app screen. Identify 3 specific usability issues. For each, propose a clear, simple design improvement and explain *why* it's an issue from a user's perspective.`
            }
        },
        // Add all other modules (2 through 7) here in the same format...
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

    // --- GEMINI API FUNCTION ---
    async function getGeminiResponse(prompt) {
        if (!API_KEY) {
            throw new Error("API_KEY is not set. Please add your Google AI API key to app.js.");
        }
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorBody = await response.json();
                console.error("API Error Response:", errorBody);
                throw new Error(`API request failed: ${errorBody.error.message}`);
            }
            const result = await response.json();
            if (result.candidates && result.candidates[0]?.content.parts[0]) {
                return result.candidates[0].content.parts[0].text;
            } else {
                console.error("Invalid response structure from API:", result);
                throw new Error("Could not get a valid response from the AI.");
            }
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            throw error;
        }
    }

    // --- RENDER FUNCTIONS (No changes here) ---
    const renderTabs = () => {
        moduleTabsContainer.innerHTML = '';
        Object.keys(modulesData).forEach(key => {
            const moduleNum = parseInt(key.replace('module', ''));
            const button = document.createElement('button');
            button.className = 'tab-button';
            button.setAttribute('role', 'tab');
            button.dataset.module = key;
            const isLocked = false; 
            button.disabled = isLocked;
            button.innerHTML = `Module ${moduleNum} ${isLocked ? '<span class="lock-icon" aria-label="locked">🔒</span>' : ''}`;
            if (appState.currentModule === key) {
                button.classList.add('active');
                button.setAttribute('aria-selected', 'true');
            } else {
                button.setAttribute('aria-selected', 'false');
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
        const firstSkillKey = Object.keys(module.skills)[0];
        if (firstSkillKey) {
            appState.selectedSkill = firstSkillKey;
            updateActiveSkillCard();
            renderSkillDetails();
            renderStudyMaterials();
        } else {
            skillDetails.innerHTML = `<p class="text-gray-500 text-center">No skills defined for this module.</p>`;
            studyMaterialsContent.parentElement.classList.add('hidden');
        }
    };
    
    const createSkillCard = (key, skill) => {
        const card = document.createElement('div');
        card.className = 'skill-card content-slide-up';
        card.dataset.skillKey = key;
        card.innerHTML = `
            <div class="text-4xl">${skill.icon}</div>
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
        const container = studyMaterialsContent.parentElement;
        studyMaterialsContent.innerHTML = '';
        if (!materials || materials.length === 0) {
            container.classList.add('hidden');
            return;
        }
        container.classList.remove('hidden');
        const skillTitle = modulesData[appState.currentModule].skills[appState.selectedSkill].title;
        let linksHTML = `<h3 class="text-2xl font-bold text-center mb-6 text-gray-900">Deep Dive Resources: ${skillTitle}</h3>
                         <div class="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">`;
        materials.forEach(material => {
            linksHTML += `
                <a href="${material.url}" target="_blank" rel="noopener noreferrer" class="block bg-indigo-50 hover:bg-indigo-100 p-4 rounded-lg transition-colors duration-200 text-indigo-800 font-medium hover:text-indigo-900 text-left flex items-center space-x-3">
                   <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                   <span>${material.title}</span>
                </a>`;
        });
        linksHTML += `</div>`;
        studyMaterialsContent.innerHTML = linksHTML;
    };

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
                <textarea id="assignment-submission" class="w-full p-3 border border-gray-300 rounded-md mb-4 focus:ring-indigo-500 focus:border-indigo-500" rows="8" placeholder="Type your assignment submission here..."></textarea>
                <div class="flex flex-wrap items-center justify-center gap-4 mb-6">
                    <label for="score-input" class="font-semibold text-gray-800">Your Score (0-100):</label>
                    <input type="number" id="score-input" min="0" max="100" class="w-24 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" value="${score}">
                    <button id="check-progress-btn" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-md transition-colors duration-200">Debrief Mission</button>
                </div>
                <div id="feedback-area" class="bg-gray-100 p-4 rounded-md border border-gray-200 text-gray-700 min-h-[100px]">
                    <p class="text-gray-500">Submit your score to receive AI-powered feedback!</p>
                </div>
                <div class="chart-container mt-8">
                    <canvas id="progressChart"></canvas>
                </div>
            </div>
        `;
        initializeChart(score);
        document.getElementById('check-progress-btn').addEventListener('click', handleMissionDebrief);
    };

    // --- UPDATE & HELPER FUNCTIONS ---

    const handleMissionDebrief = async () => {
        const scoreInput = document.getElementById('score-input');
        const feedbackArea = document.getElementById('feedback-area');
        const submissionText = document.getElementById('assignment-submission').value.trim();
        const score = parseInt(scoreInput.value, 10);
        const debriefBtn = document.getElementById('check-progress-btn');

        if (isNaN(score) || score < 0 || score > 100) {
            feedbackArea.innerHTML = '<p class="text-red-600 font-bold">Please enter a valid score between 0 and 100.</p>';
            return;
        }

        debriefBtn.disabled = true;
        debriefBtn.textContent = 'Analyzing...';
        
        appState.userProgress[appState.currentModule] = score;
        saveProgress();
        updateProgressChart(score);
        renderTabs();

        let aiFeedbackHTML = '';
        if (submissionText) {
            feedbackArea.innerHTML = '<p class="text-gray-500">Generating AI feedback...</p>';
            try {
                const assignmentTitle = modulesData[appState.currentModule].assignment.title;
                // MODIFIED: The prompt for assignment feedback now includes the system prompt rules.
                const prompt = `${aiSystemPrompt}\n\nYour task is to provide constructive feedback on a user's assignment submission.
                
                Assignment Title: "${assignmentTitle}"
                User's Self-Assessed Score: ${score}/100
                
                Submission Text: "${submissionText}"
                
                Please provide concise, expert feedback based on this submission.`;

                const aiResponse = await getGeminiResponse(prompt);
                aiFeedbackHTML = `<div class="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200 text-left">
                                      <h4 class="font-bold text-blue-800">AI Co-Pilot's Feedback:</h4>
                                      <div class="text-blue-700 whitespace-pre-wrap mt-2">${aiResponse}</div>
                                  </div>`;
            } catch (error) {
                aiFeedbackHTML = `<p class="text-red-500 mt-4">Could not get AI feedback: ${error.message}</p>`;
            }
        }
        
        const scoreFeedback = score >= 70 ? 
            `<p class="font-bold text-green-700">Mission Accomplished! Score: ${score}/100. Great work!</p>` :
            `<p class="font-bold text-orange-600">Needs Refinement. Score: ${score}/100. Review the materials and try again!</p>`;
        
        feedbackArea.innerHTML = scoreFeedback + aiFeedbackHTML;
        debriefBtn.disabled = false;
        debriefBtn.textContent = 'Debrief Mission';
    };
    
    const updateActiveSkillCard = () => {
        document.querySelectorAll('.skill-card').forEach(c => c.classList.remove('active'));
        if (appState.selectedSkill) {
            const activeCard = skillGrid.querySelector(`[data-skill-key="${appState.selectedSkill}"]`);
            if (activeCard) activeCard.classList.add('active');
        }
    };
    
    const changeModule = (newModuleKey) => {
        if (newModuleKey === appState.currentModule) return;
        appState.currentModule = newModuleKey;
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
        Object.keys(modulesData).forEach(key => {
            if (typeof appState.userProgress[key] !== 'number') {
                appState.userProgress[key] = 0;
            }
        });
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
                labels: ['Your Mastery Level'],
                datasets: [{
                    label: 'Progress Score',
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
                scales: { y: { beginAtZero: true, max: 100, title: { display: true, text: 'Score (%)' } } },
                plugins: { legend: { display: false } }
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
        if (button && !button.disabled) {
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
        aiResponseArea.innerHTML = `<p class="text-gray-400">AI Co-Pilot is processing your request...</p>`;

        try {
            // MODIFIED: We combine the system prompt with the user's question.
            const finalPrompt = `${aiSystemPrompt}\n\nHere is the user's question:\n"${question}"`;
            const responseText = await getGeminiResponse(finalPrompt);
            aiResponseArea.innerHTML = `<div class="content-fade-in whitespace-pre-wrap text-left">${responseText}</div>`;
        } catch (error) {
            aiResponseArea.innerHTML = `<p class="text-red-400">Error: ${error.message}</p>`;
        } finally {
            askAiBtn.disabled = false;
            askAiBtn.innerHTML = `<span>Ask AI Co-Pilot</span>`;
        }
    });

    // --- INITIALIZATION ---
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
