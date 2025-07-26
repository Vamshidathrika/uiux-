document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    const appState = {
        currentModule: 'module1',
        selectedSkill: null,
        userProgress: {},
        isContentLoaded: false
    };

    // --- API & DATA ---
    const API_KEY = "AIzaSyDucHm7Pl65UQB3u9c_LHLTSYm-GY01KHM"; // Canvas will provide this at runtime
    // NOTE: All your original module data is now cleanly stored here
    const modulesData = {
        module1: { name: "Foundations of UX Design: The First Quest", learningTime: "Approx. 40 hours", minScoreToUnlock: 0, /* ... all other data ... */ },
        module2: { name: "Start the UX Design Process: Empathize, Define, and Ideate", learningTime: "Approx. 20 hours", minScoreToUnlock: 70, /* ... all other data ... */ },
        module3: { name: "Build Wireframes and Low-Fidelity Prototypes", learningTime: "Approx. 20 hours", minScoreToUnlock: 70, /* ... all other data ... */ },
        module4: { name: "Conduct UX Research and Test Early Concepts", learningTime: "Approx. 21 hours", minScoreToUnlock: 70, /* ... all other data ... */ },
        module5: { name: "Create High-Fidelity Designs and Prototypes in Figma", learningTime: "Approx. 33 hours", minScoreToUnlock: 70, /* ... all other data ... */ },
        module6: { name: "Responsive Web Design in Adobe XD", learningTime: "Approx. 41 hours", minScoreToUnlock: 70, /* ... all other data ... */ },
        module7: { name: "Design for Social Good & Prepare for Jobs", learningTime: "Approx. 44 hours", minScoreToUnlock: 70, /* ... all other data ... */ },
    }; // Abridged for clarity, paste your full `modulesData` object here

    // --- DOM SELECTORS ---
    const mainContent = document.getElementById('main-content');
    const moduleTabsContainer = document.getElementById('module-tabs');
    const learningsContent = document.getElementById('learnings-content');
    const skillGrid = document.getElementById('skill-grid');
    const skillDetails = document.getElementById('skill-details');
    const studyMaterialsContent = document.getElementById('study-materials-content');
    const assignmentContent = document.getElementById('assignment-section');
    const aiQuestionInput = document.getElementById('ai-question-input');
    const askAiBtn = document.getElementById('ask-ai-btn');
    const aiResponseArea = document.getElementById('ai-response-area');
    
    let progressChart = null;

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
            
            // For testing purposes, all modules are unlocked
            button.disabled = false; // Overriding the lock
            button.innerHTML = `Module ${moduleNum}${button.disabled ? '<span class="lock-icon">🔒</span>' : ''}`;
            
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
        
        module.learnings.forEach(learning => {
            const card = document.createElement('div');
            card.className = 'bg-white p-6 rounded-lg shadow-md border border-gray-200 content-slide-up';
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
    
        Object.keys(module.skills).forEach(key => {
            const card = createSkillCard(key, module.skills[key]);
            skillGrid.appendChild(card);
        });
    
        // Select the first skill by default
        const firstSkillKey = Object.keys(module.skills)[0];
        if (firstSkillKey) {
            appState.selectedSkill = firstSkillKey;
            updateActiveSkillCard();
            renderSkillDetails();
            renderStudyMaterials();
        } else {
             // Handle case with no skills
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
            studyMaterialsContent.innerHTML = `<p class="text-gray-500">No study materials for this skill yet. Check back soon!</p>`;
            return;
        }

        const skillTitle = modulesData[appState.currentModule].skills[appState.selectedSkill].title;
        let linksHTML = `<h3 class="text-xl font-bold mb-4 text-gray-900 md:col-span-2">Deep Dive Resources for ${skillTitle}</h3>
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
        // ... (Abridged for clarity, paste your full renderAssignment logic here, but adapt it to use appState)
        // Make sure to call `updateProgressChart()` and `saveProgress()` within this function.
    };

    // --- UPDATE & HELPER FUNCTIONS ---
    
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
        }, 300); // Match animation duration
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

    askAiBtn.addEventListener('click', () => {
        const question = aiQuestionInput.value.trim();
        if (question) {
            // Your getGeminiResponse function
        } else {
            aiResponseArea.innerHTML = '<p class="text-red-400">Please enter a question for the AI Co-Pilot.</p>';
        }
    });

    // --- INITIALIZATION ---
    
    const init = () => {
        loadProgress();
        renderTabs();
        renderLearnings();
        renderSkills();
        renderAssignment();
        
        // Fade in the main content after initial render
        setTimeout(() => {
            mainContent.style.opacity = 1;
            appState.isContentLoaded = true;
        }, 100);
    };

    init();
});
