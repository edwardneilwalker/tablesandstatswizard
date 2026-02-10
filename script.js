
// =============================
// Tables & Stats Wizard logic
// =============================

const steps = {
  // Start
  start:{
    title:"Tables and Stats Reporting Wizard",
    text:"Follow the prompts to find the correct report type.",
    buttons:[ {label:"Begin", next:"q_dataType"} ]
  },

  // Q1
  q_dataType:{
    title:"What kind of data are you interested in evaluating?",
    buttons:[
      {label:"Individual Animal Data (Non Clin Ob)", next:"q_ind_measureCount"},
      {label:"Clinical Observation Data", next:"q_clin_ind_or_summary"},
      {label:"Summary/Comparison Data for Groups (Non Clin Ob)", next:"q_grp_parameter_over_time"},
      {label:"Summary/Comparison Data for Cages (Food or Water only)", next:"q_cages_ind_or_summary"}
    ]
  },

  // ----- Individual -----
  q_ind_measureCount:{
    title:"How many measurements do you want to examine?",
    buttons:[
      {label:"One Measurement", next:"ind_out_oneMeasurement"},
      {label:"More than one measurement", next:"q_ind_more_measurements"}
    ]
  },
  ind_out_oneMeasurement:{ title:"Recommended Report", text:"GRA301 — Animals by Time (Fixed Parameter)" },
  q_ind_more_measurements:{
    title:"Choose the type:",
    buttons:[
      {label:"Over time", next:"ind_out_overTime"},
      {label:"At a specific time point", next:"ind_out_fixedTime"},
      {label:"Over multiple time periods or points", next:"ind_out_multipleTime"}
    ]
  },
  ind_out_overTime:{   title:"Recommended Report", text:"GRA303 — Animals by Mixed Parameter/Time" },
  ind_out_fixedTime:{  title:"Recommended Report", text:"GRA302 — Animals by Parameter (Fixed Time)" },
  ind_out_multipleTime:{ title:"Recommended Report", text:"GRA317 — Animals/Time by Parameter" },

  // ----- Clinical -----
  q_clin_ind_or_summary:{
    title:"Do you want individual or group summary data?",
    buttons:[
      {label:"Individual Data", next:"q_clin_breakdownDays"},
      {label:"Group Summary Data", next:"q_clin_breakdownOverTime"}
    ]
  },
  q_clin_breakdownDays:{
    title:"Do you want a break down by days?",
    buttons:[ {label:"Yes", next:"clin_out_byAnimalTime"}, {label:"No", next:"clin_out_byAnimal"} ]
  },
  clin_out_byAnimalTime:{ title:"Recommended Report", text:"COA302 — Clinical Observations — Animals by Time" },
  clin_out_byAnimal:{ title:"Recommended Report", text:"COA301 — Clinical Observations by Animal" },
  q_clin_breakdownOverTime:{
    title:"Do you want a break down over time?",
    buttons:[ {label:"Yes", next:"clin_out_intergroup_overTime"}, {label:"No", next:"clin_out_intergroup"} ]
  },
  clin_out_intergroup_overTime:{ title:"Recommended Report", text:"COA312 — Intergroup Comparison of Clinical Observations Across Time (Groups down side)" },
  clin_out_intergroup:{        title:"Recommended Report", text:"COA311 — Intergroup Comparison of Clinical Observations (Groups across top)" },

  // ----- Group Summary -----
  q_grp_parameter_over_time:{
    title:"Do you want one parameter over time?",
    buttons:[ {label:"Yes", next:"q_grp_time_group_orientation"}, {label:"No", next:"q_grp_fixed_or_multi"} ]
  },
  // Backward-compatible alias for older links/bookmarks
  q_grp_ind_or_summary:{
    title:"Do you want one parameter over time?",
    buttons:[ {label:"Yes", next:"q_grp_time_group_orientation"}, {label:"No", next:"q_grp_fixed_or_multi"} ]
  },
  q_grp_time_group_orientation:{
    title:"Do you want the groups down the side or across the top?",
    buttons:[ {label:"Groups down side", next:"grp_out_time_down"}, {label:"Groups across top", next:"grp_out_time_across"} ]
  },
  grp_out_time_down:{ title:"Recommended Report", text:"GRA304 — Group Summary by Time — Fixed Parameter (Groups Down Side)" },
  grp_out_time_across:{ title:"Recommended Report", text:"GRA305 — Group Summary by Time — Fixed Parameter (Groups Across Top)" },
  q_grp_fixed_or_multi:{
    title:"Do you want a fixed timepoint or multiple measurements over time?",
    buttons:[ {label:"Fixed Time Point", next:"q_grp_fixed_groupOrientation"}, {label:"Multiple Measures over Time", next:"q_grp_multi_groupOrientation"} ]
  },
  q_grp_fixed_groupOrientation:{
    title:"Do you want the groups down the side or across the top?",
    buttons:[ {label:"Groups down side", next:"grp_out_fixed_down"}, {label:"Groups across top", next:"grp_out_fixed_across"} ]
  },
  grp_out_fixed_down:{   title:"Recommended Report", text:"GRA306 — Group Summary by Parameter — Fixed Time (Groups Down Side)" },
  grp_out_fixed_across:{ title:"Recommended Report", text:"GRA307 — Group Summary by Parameter — Fixed Time (Groups Across Top)" },
  q_grp_multi_groupOrientation:{
    title:"Do you want the groups down the side or across the top?",
    buttons:[ {label:"Groups down side", next:"grp_out_multi_down"}, {label:"Groups across top", next:"grp_out_multi_across"} ]
  },
  grp_out_multi_down:{   title:"Recommended Report", text:"GRA308 — Group Summary by Mixed Parameter/Time (Groups Down Side)" },
  grp_out_multi_across:{ title:"Recommended Report", text:"GRA309 — Group Summary by Mixed Parameter/Time (Groups Across Top)" },

  // ----- Cages -----
  q_cages_ind_or_summary:{
    title:"Do you want to see individual or group summary data?",
    buttons:[ {label:"Individual", next:"cage_out_individual"}, {label:"Group Summary", next:"q_cage_group_orientation"} ]
  },
  cage_out_individual:{ title:"Recommended Report", text:"GRA331 — Individual Cages Report" },
  q_cage_group_orientation:{
    title:"Do you want the groups down the side or across the top?",
    buttons:[ {label:"Groups down side", next:"cage_out_GRA341"}, {label:"Groups across top", next:"cage_out_GRA342"} ]
  },
  cage_out_GRA341:{ title:"Recommended Report", text:"GRA341 — Cage Group Summary by Time — Fixed Parameter (Groups Down Side)" },
  cage_out_GRA342:{ title:"Recommended Report", text:"GRA342 — Cage Group Summary by Time — Fixed Parameter (Groups Across Top)" }
};

// -----------------------------
// Engine + Animation replay
// -----------------------------
let historyStack = ["start"];

function replayAnimation(){
  const el = document.getElementById("wizard");
  if(!el) return;
  el.classList.remove("animate");
  void el.offsetWidth; // restart CSS animation
  el.classList.add("animate");
}

function render(key){
  const step = steps[key];
  const el = document.getElementById("wizard");
  if(!el) return;

  if(!step){
    el.innerHTML = `
      <h1>Something went wrong</h1>
      <div class="outcome">The selected path could not be found (${key}). Please restart the wizard.</div>
      <div class="nav"><button onclick="restart()">Restart</button></div>
    `;
    return;
  }

  let html = `
    <h1>${step.title}</h1>
    ${step.text && step.buttons ? `<p class="subtitle">${step.text}</p>` : ""}
    <div class="buttons">
  `;

  if(step.buttons){
    step.buttons.forEach(b=>{
      html += `<div class="btn" onclick="goTo('${b.next}')">${b.label}</div>`;
    });
    html += `</div>`;
  } else {
    html += `</div>`;
    if(step.text){ html += `<div class="outcome">${step.text}</div>`; }
  }

  html += `
    <div class="nav">
      ${historyStack.length>1 ? `<button onclick="goBack()">← Back</button>` : ""}
      <button onclick="restart()">Restart</button>
    </div>
  `;

  el.innerHTML = html;
  replayAnimation();
}

function goTo(next){ historyStack.push(next); render(next); }
function goBack(){ historyStack.pop(); render(historyStack[historyStack.length-1]); }
function restart(){ historyStack=["start"]; render("start"); }

function validateSteps(){
  const missing = [];
  Object.entries(steps).forEach(([key, step])=>{
    if(!step.buttons) return;
    step.buttons.forEach(({next})=>{
      if(!steps[next]) missing.push(`${key} -> ${next}`);
    });
  });

  if(missing.length){
    console.error("Wizard configuration has missing routes:", missing);
  }
}

// Ensure DOM is ready before first render
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', ()=>{ validateSteps(); render('start'); });
} else {
  validateSteps();
  render('start');
}
