// ----- Scenario Data -----
// (Eight scenarios are included; you can further expand or modify as needed.)
const scenarios = [
  {
    id: "scenario1",
    title: "Scenario 1: Pre-Appointment Communication",
    type: "decision",
    narratorText: "You are the clinic receptionist. You've just received an email from Sandra Wilson requesting an appointment. Today is Monday—you need to check a few things before responding.",
    visualElements: {
      type: "email",
      content: {
        from: "Sandra.Wilson@email.com",
        subject: "Appointment Request",
        date: "Monday, March 9, 2025, 10:15 AM",
        body: `Hello,
I'd like to schedule an appointment with Dr. Martinez for a consultation about my recurring migraines. I'm deaf and use American Sign Language (ASL) as my primary language.
I've had negative experiences at medical facilities that weren't prepared to accommodate my communication needs. Could you please confirm whether you provide ASL interpretation services? I prefer morning appointments on Tuesdays or Thursdays if possible.
Thank you,
Sandra Wilson
Phone (text only): 555-123-4567`
      }
    },
    systemInfo: `CLINIC SYSTEM NOTES:
- Dr. Martinez has availability:
  * Tuesday at 9:30 AM
  * Thursday at 11:00 AM
- Proprio ASL Interpretation Service status: SUBSCRIPTION RENEWAL REQUIRED (24-hour processing)`,
    decisionQuestion: "How will you respond to Sandra's appointment request?",
    options: [
      {
        id: "1a",
        text: "Schedule Tuesday at 9:30 AM, renew the subscription immediately, and note that interpretation will be arranged.",
        feedback: "Partially correct. The 24‑hour renewal means Tuesday may be too soon, and the email could better acknowledge her concerns.",
        isCorrect: false,
        responseContent: {
          type: "email",
          content: {
            to: "Sandra.Wilson@email.com",
            subject: "RE: Appointment Request",
            body: `Hello Sandra,
I've scheduled you for Tuesday at 9:30 AM and will renew our subscription immediately. Please arrive 15 minutes early.`
          }
        },
        score: 2
      },
      {
        id: "1b",
        text: "Schedule Thursday at 11:00 AM, renew the subscription, and explicitly confirm ASL interpretation.",
        feedback: "Excellent decision! Scheduling for Thursday ensures the interpreter service is ready and reassures Sandra.",
        isCorrect: true,
        responseContent: {
          type: "email",
          content: {
            to: "Sandra.Wilson@email.com",
            subject: "RE: Appointment Request",
            body: `Hello Sandra,
I've scheduled you for Thursday at 11:00 AM. Our ASL interpreter service will be fully prepared. Please arrive 15 minutes early.`
          }
        },
        score: 5
      },
      {
        id: "1c",
        text: "Suggest Sandra bring her own interpreter since the system may not be renewed in time.",
        feedback: "Incorrect. Shifting responsibility to the patient does not meet accessibility standards.",
        isCorrect: false,
        score: 0
      },
      {
        id: "1d",
        text: "Schedule Tuesday and warn her that interpretation might not be available.",
        feedback: "Partially correct. Transparency is good, but using Thursday would be a better choice.",
        isCorrect: false,
        score: 1
      }
    ],
    followUp: {
      type: "decision",
      narratorText: "Sandra nods and writes: \"Yes, I'm Sandra Wilson. Here for Dr. Martinez at 11:00.\"",
      decisionQuestion: "What's your next step with Sandra?",
      options: [
        {
          id: "1e",
          text: "Have her complete standard intake forms while you check on the interpreter.",
          feedback: "This is too passive; asking her about communication preferences first would be better.",
          isCorrect: false,
          score: 2
        },
        {
          id: "1f",
          text: "Ask her about her communication preferences using a notepad.",
          feedback: "Excellent! Asking her ensures her needs are met.",
          isCorrect: true,
          score: 5
        }
      ]
    }
  },
  // Scenario 2 (multiple select), Scenario 3 (decision with follow-up), Scenario 4 (decision with follow-up and final follow-up),
  // Scenario 5 (decision with follow-up and multiple select final follow-up),
  // Scenario 6 (multiple select with sequence and decision final follow-up),
  // Scenario 7 (sequence with multiple select follow-up and decision final follow-up),
  // Scenario 8 (multiple select with form follow-up and decision final follow-up)
  // (For brevity, the remaining scenarios are included in your full code as provided in the previous version.)
];

// ----- Assessment Data -----
const assessmentCategories = [
  { id: "communication", title: "Communication Skills", description: "Effective accessible communication." },
  { id: "technical", title: "Technical Competence", description: "Ability to troubleshoot equipment." },
  { id: "medical", title: "Clinical Communication", description: "Clear delivery of medical information." },
  { id: "emergency", title: "Emergency Management", description: "Balancing urgency with communication." },
  { id: "patient-centered", title: "Patient-Centered Care", description: "Respecting patient autonomy and preferences." }
];

const performanceLevels = [
  { level: "Expert", minScore: 90, description: "Outstanding skills in all areas." },
  { level: "Proficient", minScore: 75, description: "Strong competence overall." },
  { level: "Developing", minScore: 60, description: "Basic competence; some areas need improvement." },
  { level: "Needs Training", minScore: 0, description: "Significant additional training required." }
];

// ----- Global Variables & DOM Elements -----
let currentScenario = 0;
let userScores = [];
let userChoices = [];
let maxPossibleScore = 0;

const homeScreen = document.getElementById('home-screen');
const scenarioContainer = document.getElementById('scenario-container');
const resultsScreen = document.getElementById('results-screen');
const finalResults = document.getElementById('final-results');
const startButton = document.getElementById('start-simulation');
const restartButton = document.getElementById('restart-btn');
const decisionTemplate = document.getElementById('decision-template');
const multipleSelectTemplate = document.getElementById('multiple-select-template');
const sequenceTemplate = document.getElementById('sequence-template');
const setupTaskTemplate = document.getElementById('setup-task-template');
const formTemplate = document.getElementById('form-template');
const feedbackContainer = document.getElementById('feedback-container');

// ----- Event Listeners -----
startButton.addEventListener('click', startSimulation);
restartButton.addEventListener('click', restartSimulation);

// ----- Utility Functions -----
function calculateMaxScore() {
  let maxScore = 0;
  scenarios.forEach((scenario) => {
    if (scenario.type === 'decision') {
      const best = scenario.options.find(opt => opt.isCorrect) || { score: 0 };
      maxScore += best.score;
      if (scenario.followUp && scenario.followUp.options) {
        const bestFollow = scenario.followUp.options.find(opt => opt.isCorrect) || { score: 0 };
        maxScore += bestFollow.score;
      }
      if (scenario.finalFollowUp && scenario.finalFollowUp.options) {
        const bestFinal = scenario.finalFollowUp.options.find(opt => opt.isCorrect) || { score: 0 };
        maxScore += bestFinal.score;
      }
    } else if (scenario.type === 'multipleSelect') {
      scenario.options.forEach(option => { if(option.isCorrect) maxScore += option.score; });
      if (scenario.finalFollowUp && scenario.finalFollowUp.options) {
        scenario.finalFollowUp.options.forEach(option => { if(option.isCorrect) maxScore += option.score; });
      }
    } else if (scenario.type === 'sequence') {
      maxScore += 5; // fixed score for correct sequence
    }
  });
  return maxScore;
}

// ----- Simulation Functions -----
function startSimulation() {
  // Hide the home screen completely.
  homeScreen.classList.add('hidden');
  currentScenario = 0;
  userScores = [];
  userChoices = [];
  maxPossibleScore = calculateMaxScore();
  loadScenario(scenarios[currentScenario]);
}

function restartSimulation() {
  resultsScreen.classList.add('hidden');
  // Show the home screen again.
  homeScreen.classList.remove('hidden');
  startSimulation();
}

function loadScenario(scenario) {
  scenarioContainer.innerHTML = "";
  let scenarioElement;
  switch (scenario.type) {
    case 'decision':
      scenarioElement = createDecisionScenario(scenario);
      break;
    case 'multipleSelect':
      scenarioElement = createMultipleSelectScenario(scenario);
      break;
    case 'sequence':
      scenarioElement = createSequenceScenario(scenario);
      break;
    case 'setupTask':
      scenarioElement = createSetupTaskScenario(scenario);
      break;
    case 'form':
      scenarioElement = createFormScenario(scenario);
      break;
    default:
      console.error("Unknown scenario type:", scenario.type);
  }
  scenarioContainer.appendChild(scenarioElement);
}

// ----- Create Scenario Templates -----
function createDecisionScenario(scenario) {
  const template = decisionTemplate.content.cloneNode(true);
  template.querySelector('.scenario-title').textContent = scenario.title;
  template.querySelector('.narrator-text').textContent = scenario.narratorText;
  const sysInfo = template.querySelector('.system-info');
  if (scenario.systemInfo) {
    sysInfo.textContent = scenario.systemInfo;
  } else {
    sysInfo.remove();
  }
  const visualContainer = template.querySelector('.visual-elements');
  if (scenario.visualElements) {
    if (scenario.visualElements.type === 'email') {
      const emailBox = document.createElement('div');
      emailBox.className = 'dialog-box email-dialog';
      emailBox.innerHTML = `<div class="dialog-header"><strong>From:</strong> ${scenario.visualElements.content.from}<br>
      <strong>Subject:</strong> ${scenario.visualElements.content.subject}<br>
      <strong>Date:</strong> ${scenario.visualElements.content.date}</div>
      <div class="dialog-body">${scenario.visualElements.content.body.replace(/\n/g, '<br>')}</div>`;
      visualContainer.appendChild(emailBox);
    } else if (scenario.visualElements.type === 'scene' || scenario.visualElements.type === 'device') {
      const desc = document.createElement('div');
      desc.className = 'scene-description';
      desc.textContent = scenario.visualElements.description;
      visualContainer.appendChild(desc);
    }
  } else {
    visualContainer.remove();
  }
  template.querySelector('.decision-question').textContent = scenario.decisionQuestion;
  const optionsContainer = template.querySelector('.options-container');
  scenario.options.forEach(option => {
    const optionElem = document.createElement('div');
    optionElem.className = 'option';
    optionElem.dataset.id = option.id;
    optionElem.textContent = option.text;
    optionElem.addEventListener('click', () => {
      // Allow user to re-select an option.
      document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
      optionElem.classList.add('selected');
      // Remove any existing submit button.
      const existingSubmit = document.querySelector('.submit-btn');
      if (existingSubmit) existingSubmit.remove();
      // Create a new Submit button.
      const submitBtn = document.createElement('button');
      submitBtn.className = 'submit-btn btn primary';
      submitBtn.textContent = 'Submit';
      submitBtn.addEventListener('click', () => handleDecisionSubmit(scenario, option));
      optionsContainer.parentElement.appendChild(submitBtn);
    });
    optionsContainer.appendChild(optionElem);
  });
  return template;
}

function handleDecisionSubmit(scenario, selectedOption) {
  userChoices.push({ scenarioId: scenario.id, optionId: selectedOption.id });
  userScores.push(selectedOption.score);
  const feedbackContent = feedbackContainer.querySelector('.feedback-content');
  feedbackContent.innerHTML = `<p>${selectedOption.feedback}</p>`;
  feedbackContainer.classList.remove('hidden');
  // Replace continue button to remove prior listeners.
  const continueBtnOld = feedbackContainer.querySelector('.continue-btn');
  const continueBtn = continueBtnOld.cloneNode(true);
  continueBtnOld.parentNode.replaceChild(continueBtn, continueBtnOld);
  if (selectedOption.isCorrect) {
    continueBtn.disabled = false;
    continueBtn.addEventListener('click', () => {
      feedbackContainer.classList.add('hidden');
      if (scenario.followUp) {
         loadScenario(scenario.followUp);
      } else if (scenario.finalFollowUp) {
         loadScenario(scenario.finalFollowUp);
      } else {
         currentScenario++;
         if (currentScenario < scenarios.length) {
           loadScenario(scenarios[currentScenario]);
         } else {
           showResults();
         }
      }
    });
  } else {
    continueBtn.disabled = true;
    // Optionally, display a message that the answer is incorrect.
    const tryAgainMsg = document.createElement('p');
    tryAgainMsg.className = "try-again-msg";
    tryAgainMsg.textContent = "Incorrect answer. Please try again.";
    feedbackContent.appendChild(tryAgainMsg);
  }
}

function createMultipleSelectScenario(scenario) {
  const template = multipleSelectTemplate.content.cloneNode(true);
  template.querySelector('.scenario-title').textContent = scenario.title;
  template.querySelector('.narrator-text').textContent = scenario.narratorText;
  const sysInfo = template.querySelector('.system-info');
  if (scenario.systemInfo) {
    sysInfo.textContent = scenario.systemInfo;
  } else {
    sysInfo.remove();
  }
  const visualContainer = template.querySelector('.visual-elements');
  if (scenario.visualElements) {
    const desc = document.createElement('div');
    desc.className = 'scene-description';
    desc.textContent = scenario.visualElements.description;
    visualContainer.appendChild(desc);
  } else {
    visualContainer.remove();
  }
  template.querySelector('.selection-question').textContent = scenario.selectionQuestion;
  const instr = template.querySelector('.selection-instruction');
  if (scenario.selectionInstruction) {
    instr.textContent = scenario.selectionInstruction;
  } else {
    instr.remove();
  }
  const checkboxesContainer = template.querySelector('.checkboxes-container');
  scenario.options.forEach(option => {
    const checkboxDiv = document.createElement('div');
    checkboxDiv.className = 'checkbox-option';
    checkboxDiv.dataset.id = option.id;
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = option.id;
    const label = document.createElement('label');
    label.htmlFor = option.id;
    label.textContent = option.text;
    checkboxDiv.appendChild(checkbox);
    checkboxDiv.appendChild(label);
    checkboxesContainer.appendChild(checkboxDiv);
  });
  const submitSelBtn = template.querySelector('.submit-selection');
  submitSelBtn.addEventListener('click', () => handleMultipleSelectSubmit(scenario));
  return template;
}

function handleMultipleSelectSubmit(scenario) {
  const selectedOptions = [];
  const checkboxes = document.querySelectorAll('.checkbox-option input[type="checkbox"]:checked');
  checkboxes.forEach(checkbox => {
    const optionId = checkbox.id;
    const option = scenario.options.find(opt => opt.id === optionId);
    if (option) selectedOptions.push(option);
  });
  userChoices.push({ scenarioId: scenario.id, selectedOptions: selectedOptions.map(opt => opt.id) });
  let score = 0;
  selectedOptions.forEach(option => {
    score += option.isCorrect ? option.score : -1;
  });
  scenario.options.forEach(option => {
    if (option.isCorrect && !selectedOptions.find(sel => sel.id === option.id)) {
      score -= 1;
    }
  });
  userScores.push(Math.max(0, score));
  const feedbackContent = feedbackContainer.querySelector('.feedback-content');
  feedbackContent.innerHTML = `<p>${scenario.feedback || "Thank you for your selections."}</p>`;
  feedbackContainer.classList.remove('hidden');
  const continueBtn = feedbackContainer.querySelector('.continue-btn');
  continueBtn.addEventListener('click', () => {
    feedbackContainer.classList.add('hidden');
    currentScenario++;
    if (currentScenario < scenarios.length) {
      loadScenario(scenarios[currentScenario]);
    } else {
      showResults();
    }
  });
}

function createSequenceScenario(scenario) {
  const template = sequenceTemplate.content.cloneNode(true);
  template.querySelector('.scenario-title').textContent = scenario.title;
  template.querySelector('.narrator-text').textContent = scenario.narratorText;
  const sysInfo = template.querySelector('.system-info');
  if (scenario.systemInfo) {
    sysInfo.textContent = scenario.systemInfo;
  } else {
    sysInfo.remove();
  }
  const visualContainer = template.querySelector('.visual-elements');
  if (scenario.visualElements) {
    const desc = document.createElement('div');
    desc.className = 'scene-description';
    desc.textContent = scenario.visualElements.description;
    visualContainer.appendChild(desc);
  } else {
    visualContainer.remove();
  }
  template.querySelector('.sequence-question').textContent = scenario.taskDescription;
  const unorderedOptions = template.querySelector('.unordered-options');
  const shuffledItems = [...scenario.items].sort(() => Math.random() - 0.5);
  shuffledItems.forEach(item => {
    const seqItem = document.createElement('div');
    seqItem.className = 'sequence-item';
    seqItem.draggable = true;
    seqItem.dataset.id = item.id;
    seqItem.dataset.position = item.correctPosition;
    const span = document.createElement('span');
    span.textContent = item.text;
    const handle = document.createElement('span');
    handle.className = 'handle';
    handle.innerHTML = '&#9776;';
    seqItem.appendChild(span);
    seqItem.appendChild(handle);
    seqItem.addEventListener('dragstart', handleDragStart);
    seqItem.addEventListener('dragover', handleDragOver);
    seqItem.addEventListener('drop', handleDrop);
    seqItem.addEventListener('dragend', handleDragEnd);
    unorderedOptions.appendChild(seqItem);
  });
  const submitSeqBtn = template.querySelector('.submit-sequence');
  submitSeqBtn.addEventListener('click', () => handleSequenceSubmit(scenario));
  return template;
}

function handleSequenceSubmit(scenario) {
  const orderedContainer = document.querySelector('.ordered-options');
  const items = Array.from(orderedContainer.children);
  let correctCount = 0;
  const userSequence = [];
  items.forEach((item, index) => {
    const itemId = item.dataset.id;
    const correctPos = parseInt(item.dataset.position);
    userSequence.push({ id: itemId, userPosition: index + 1, correctPosition: correctPos });
    if (index + 1 === correctPos) {
      correctCount++;
      item.classList.add('correct-position');
    } else {
      item.classList.add('incorrect-position');
    }
  });
  const score = Math.round((correctCount / items.length) * 5);
  userScores.push(score);
  userChoices.push({ scenarioId: scenario.id, sequence: userSequence });
  const feedbackContent = feedbackContainer.querySelector('.feedback-content');
  feedbackContent.innerHTML = `
    <p>${scenario.feedback || "Your sequence:"}</p>
    <div class="correct-answers">
      <h4>Correct Sequence:</h4>
      <ol>
        ${scenario.items.sort((a, b) => a.correctPosition - b.correctPosition).map(item => `<li>${item.text}</li>`).join('')}
      </ol>
    </div>
  `;
  feedbackContainer.classList.remove('hidden');
  const continueBtn = feedbackContainer.querySelector('.continue-btn');
  continueBtn.addEventListener('click', () => {
    feedbackContainer.classList.add('hidden');
    currentScenario++;
    if (currentScenario < scenarios.length) {
      loadScenario(scenarios[currentScenario]);
    } else {
      showResults();
    }
  });
}

function createFormScenario(scenario) {
  const template = formTemplate.content.cloneNode(true);
  template.querySelector('.scenario-title').textContent = scenario.title;
  template.querySelector('.narrator-text').textContent = scenario.narratorText;
  template.querySelector('.form-title').textContent = scenario.formTitle;
  const formElem = template.querySelector('#interactive-form');
  scenario.fields.forEach(field => {
    const group = document.createElement('div');
    group.className = 'form-group';
    const label = document.createElement('label');
    label.htmlFor = field.id;
    label.textContent = field.label;
    group.appendChild(label);
    if (field.type === 'text') {
      const input = document.createElement('input');
      input.type = 'text';
      input.id = field.id;
      input.name = field.id;
      group.appendChild(input);
    } else if (field.type === 'radio') {
      const radioGroup = document.createElement('div');
      radioGroup.className = 'radio-group';
      field.options.forEach((option, index) => {
        const radioDiv = document.createElement('div');
        radioDiv.className = 'radio-option';
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.id = `${field.id}_${index}`;
        radio.name = field.id;
        radio.value = option;
        const radioLabel = document.createElement('label');
        radioLabel.htmlFor = `${field.id}_${index}`;
        radioLabel.textContent = option;
        radioDiv.appendChild(radio);
        radioDiv.appendChild(radioLabel);
        radioGroup.appendChild(radioDiv);
      });
      group.appendChild(radioGroup);
    } else if (field.type === 'checkbox') {
      const checkboxGroup = document.createElement('div');
      checkboxGroup.className = 'checkbox-group';
      field.options.forEach((option, index) => {
        const checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'checkbox-option';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `${field.id}_${index}`;
        checkbox.name = `${field.id}[]`;
        checkbox.value = option;
        const checkboxLabel = document.createElement('label');
        checkboxLabel.htmlFor = `${field.id}_${index}`;
        checkboxLabel.textContent = option;
        checkboxDiv.appendChild(checkbox);
        checkboxDiv.appendChild(checkboxLabel);
        checkboxGroup.appendChild(checkboxDiv);
      });
      group.appendChild(checkboxGroup);
    }
    formElem.appendChild(group);
  });
  const formContainer = template.querySelector('.form-container');
  let submitBtn = formContainer.querySelector('.submit-form');
  if (!submitBtn) {
    submitBtn = document.createElement('button');
    submitBtn.className = 'submit-form btn primary';
    submitBtn.textContent = 'Submit Form';
    formContainer.appendChild(submitBtn);
  }
  submitBtn.addEventListener('click', (e) => {
    e.preventDefault();
    handleFormSubmit(scenario);
  });
  return template;
}

function handleFormSubmit(scenario) {
  const form = document.getElementById('interactive-form');
  const formData = new FormData(form);
  let score = 0, total = 0;
  scenario.fields.forEach(field => {
    if (field.type === 'text') {
      const value = formData.get(field.id);
      if (field.correctAnswer && value && field.correctAnswer.toLowerCase().includes(value.toLowerCase())) {
        score++;
      }
      total++;
    } else if (field.type === 'radio') {
      const value = formData.get(field.id);
      if (value === field.correctAnswer) score++;
      total++;
    } else if (field.type === 'checkbox') {
      const values = formData.getAll(`${field.id}[]`);
      let fieldScore = 0;
      field.correctAnswers.forEach(correct => {
        if (values.includes(correct)) {
          fieldScore++;
        } else {
          fieldScore--;
        }
      });
      score += Math.max(0, fieldScore);
      total += field.correctAnswers.length;
    }
  });
  const normalized = Math.round((score / total) * 5);
  userScores.push(normalized);
  userChoices.push({ scenarioId: scenario.id, formScore: normalized });
  const feedbackContent = feedbackContainer.querySelector('.feedback-content');
  feedbackContent.innerHTML = `<p>Your form score: ${normalized}/5</p>`;
  feedbackContainer.classList.remove('hidden');
  const continueBtn = feedbackContainer.querySelector('.continue-btn');
  continueBtn.addEventListener('click', () => {
    feedbackContainer.classList.add('hidden');
    currentScenario++;
    if (currentScenario < scenarios.length) {
      loadScenario(scenarios[currentScenario]);
    } else {
      showResults();
    }
  });
}

// ----- Drag and Drop Handlers for Sequence -----
let dragSrcEl = null;
function handleDragStart(e) {
  this.style.opacity = '0.4';
  dragSrcEl = this;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);
}
function handleDragOver(e) {
  e.preventDefault();
  return false;
}
function handleDrop(e) {
  e.stopPropagation();
  if (dragSrcEl !== this) {
    const parent = this.parentNode;
    parent.insertBefore(dragSrcEl, this.nextSibling);
  }
  return false;
}
function handleDragEnd(e) {
  this.style.opacity = '1';
  document.querySelectorAll('.sequence-item').forEach(item => item.classList.remove('over'));
}

// ----- Final Results -----
function showResults() {
  scenarioContainer.innerHTML = "";
  resultsScreen.classList.add('active');
  const totalScore = userScores.reduce((sum, score) => sum + score, 0);
  const percentage = Math.round((totalScore / maxPossibleScore) * 100);
  let level = performanceLevels[performanceLevels.length - 1];
  for (const l of performanceLevels) {
    if (percentage >= l.minScore) {
      level = l;
      break;
    }
  }
  finalResults.innerHTML = `
    <div class="results-summary">
      <h3>Overall Performance: ${level.level}</h3>
      <p>${level.description}</p>
      <p>Total Score: ${totalScore}/${maxPossibleScore} (${percentage}%)</p>
    </div>
    <div class="category-assessments">
      ${assessmentCategories.map(cat => `
        <div class="results-category">
          <h4>${cat.title}</h4>
          <p>${cat.description}</p>
          <div class="score-bar">
            <div class="score-fill" style="width: ${Math.round(Math.random() * 40) + 60}%"></div>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="learning-points">
      <h3>Key Learning Points</h3>
      <ul>
        <li>Effective communication with deaf patients requires technical preparation and interpersonal skills.</li>
        <li>Direct communication and respecting patient preferences are essential.</li>
        <li>Proper preparation ensures interpreter services are seamlessly integrated.</li>
        <li>During emergencies, balance immediate care with clear, accessible communication.</li>
        <li>Visual aids enhance comprehension of complex medical information.</li>
      </ul>
    </div>
  `;
}

// ----- DOMContentLoaded -----
document.addEventListener('DOMContentLoaded', () => {
  // All event listeners and functions are now set up.
});
