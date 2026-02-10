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
vm.runInContext(`${source}\nthis.__steps = steps; this.__resolve = (typeof resolveStepKey === 'function') ? resolveStepKey : (k)=>k;`, sandbox);

const steps = sandbox.__steps;
const resolve = sandbox.__resolve;

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

// 2) Expected business-critical paths from the PDF thread
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
  }
];

for (const check of checks) {
  const result = walkPath('q_dataType', check.labels);
  if (!result || !result.text || !result.text.includes(check.expectContains)) {
    fail(`${check.name} failed. Got: ${result && result.text ? result.text : 'no result text'}`);
  }
  pass(check.name);
}

console.log('\n🎉 Route test complete: all checks passed.');
