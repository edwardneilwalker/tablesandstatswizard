#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function pass(message) {
  console.log(`✅ ${message}`);
}

const source = fs.readFileSync('script.js', 'utf8');

const sandbox = {
  console,
  document: {
    readyState: 'loading',
    addEventListener: () => {},
    getElementById: () => null
  }
};

vm.createContext(sandbox);
vm.runInContext(`${source}\nthis.__steps = steps; this.__resolve = (typeof resolveStepKey === 'function') ? resolveStepKey : (k)=>k; this.__getExamplePdfPath = (typeof getExamplePdfPath === 'function') ? getExamplePdfPath : null;`, sandbox);

const steps = sandbox.__steps;
const resolve = sandbox.__resolve;
const getExamplePdfPath = sandbox.__getExamplePdfPath;

if (!steps || typeof steps !== 'object') {
  fail('Could not load decision tree steps from script.js');
}

// 1) Structural integrity: every button target must exist (or resolve to one that exists)
const missing = [];
for (const [stepKey, step] of Object.entries(steps)) {
  if (!step.buttons) continue;
  for (const button of step.buttons) {
    const rawNext = button.next;
    const resolvedNext = resolve(rawNext);
    if (!steps[resolvedNext]) {
      missing.push(`${stepKey} -> ${rawNext} (resolved: ${resolvedNext})`);
    }
  }
}

if (missing.length) {
  fail(`Found broken route(s):\n${missing.join('\n')}`);
}
pass('All button routes point to valid steps');

function walkPath(startKey, labels) {
  let currentKey = startKey;

  for (const label of labels) {
    const step = steps[currentKey];
    if (!step || !step.buttons) {
      fail(`Path failed at "${label}" because step "${currentKey}" has no buttons`);
    }

    const button = step.buttons.find((b) => b.label === label);
    if (!button) {
      fail(`Path failed: button "${label}" not found on step "${currentKey}"`);
    }

    currentKey = resolve(button.next);
  }

  return steps[currentKey];
}

// 2) Business-critical route checks
const checks = [
  {
    name: 'Groups Non-Clin: Yes -> Groups down side -> GRA304',
    labels: ['Summary/Comparison Data for Groups (Non Clin Ob)', 'Yes', 'Groups down side'],
    expectContains: 'GRA304'
  },
  {
    name: 'Groups Non-Clin: Yes -> Groups across top -> GRA305',
    labels: ['Summary/Comparison Data for Groups (Non Clin Ob)', 'Yes', 'Groups across top'],
    expectContains: 'GRA305'
  },
  {
    name: 'Groups Non-Clin: No -> Fixed Time Point -> Groups down side -> GRA306',
    labels: ['Summary/Comparison Data for Groups (Non Clin Ob)', 'No', 'Fixed Time Point', 'Groups down side'],
    expectContains: 'GRA306'
  },
  {
    name: 'Groups Non-Clin: No -> Multiple Measures over Time -> Groups across top -> GRA309',
    labels: ['Summary/Comparison Data for Groups (Non Clin Ob)', 'No', 'Multiple Measures over Time', 'Groups across top'],
    expectContains: 'GRA309'
  },
  {
    name: 'Clinical: Individual Data -> No days -> COA301',
    labels: ['Clinical Observation Data', 'Individual Data', 'No'],
    expectContains: 'COA301'
  },
  {
    name: 'Clinical: Group Summary Data -> Yes over time -> COA312',
    labels: ['Clinical Observation Data', 'Group Summary Data', 'Yes'],
    expectContains: 'COA312'
  },
  {
    name: 'Cages: Group Summary -> Groups across top -> GRA342',
    labels: ['Summary/Comparison Data for Cages (Food or Water only)', 'Group Summary', 'Groups across top'],
    expectContains: 'GRA342'
  },
  {
    name: 'Individual Animal: More than one -> Fixed time -> GRA302',
    labels: ['Individual Animal Data (Non Clin Ob)', 'More than one measurement', 'At a specific time point'],
    expectContains: 'GRA302'
  }
];

for (const check of checks) {
  const result = walkPath('q_dataType', check.labels);
  if (!result || !result.text || !result.text.includes(check.expectContains)) {
    fail(`${check.name} failed. Got: ${result && result.text ? result.text : 'no result text'}`);
  }
  pass(check.name);
}

// 3) Verify example PDF path resolution for all report endpoints
if (typeof getExamplePdfPath !== 'function') {
  fail('getExamplePdfPath(step) is not available');
}

const reportSteps = Object.entries(steps)
  .filter(([, step]) => !step.buttons && step.text)
  .filter(([, step]) => /\b(?:GRA|COA)\d{3}\b/.test(step.text));

for (const [key, step] of reportSteps) {
  const path = getExamplePdfPath(step);
  if (!path || !/^example-reports\/(?:GRA|COA)_\d{3}\.pdf$/.test(path)) {
    fail(`Endpoint ${key} does not resolve to expected PDF path format. Got: ${path}`);
  }
}
pass('All report endpoints resolve to expected example PDF path format');

console.log('\n🎉 Route test complete: all checks passed.');
