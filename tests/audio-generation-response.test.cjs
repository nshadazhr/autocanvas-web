const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const ts = require('typescript');

const source = readFileSync(join(__dirname, '../src/app/api/audio-studio/audio-generation-response.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exported = {};
new Function('exports', compiled)(exported);
const { parseGenerationJobResponse: parse } = exported;
const job = { id: 1, storyId: 2, status: 'PARTIAL', totalScenes: 1, completedScenes: 0, failedScenes: 1 };

test('no latest job accepts JSON null and Nest empty response bodies', () => {
	for (const value of [null, undefined, '']) assert.equal(parse(value), null);
});

test('missing or non-array items reject the response before rendering', () => {
	for (const items of [undefined, null, {}, 'FAILED']) assert.throws(() => parse({ ...job, items }));
});

test('malformed job metadata and scene entries reject the response', () => {
	for (const value of [{}, 'invalid', { ...job, items: [null] }, { ...job, status: 'UNKNOWN', items: [] }])
		assert.throws(() => parse(value));
});

test('valid empty jobs and failed scene details are preserved', () => {
	for (const items of [[], [{ id: 3, sceneId: 4, status: 'FAILED', attempts: 1, error: 'Provider unavailable', audio: null }]]) {
		const value = { ...job, items };
		assert.equal(parse(value), value);
	}
});
