import assert from 'node:assert/strict';
import test from 'node:test';
import { CURRENT_STRUCTURE_OPTIONS, evaluateBuyStrategy, type StrategyInput } from '../src/utils/buyStrategyEngine.ts';

const base: StrategyInput = { marketBackground: 'STRONG_UP', currentStructure: 'SHALLOW_PULLBACK', riskState: 'NONE', entryType: 'H1' };
const evaluate = (changes: Partial<StrategyInput>) => evaluateBuyStrategy({ ...base, ...changes });

test('强势上升浅回调无风险可买 H1', () => {
  assert.deepEqual(evaluate({}), { decision: 'BUY', entryOptions: ['H1'], note: '强势上升浅回调，H1 可用。' });
});

test('强势上升浅回调过热降级为 H2', () => {
  const result = evaluate({ riskState: 'OVERHEATED' });
  assert.equal(result.decision, 'WATCH');
  assert.deepEqual(result.entryOptions, ['H2']);
});

test('强势上升 EMA21 回踩分歧只观察 H2', () => {
  const result = evaluate({ currentStructure: 'EMA21_PULLBACK', riskState: 'DIVERGENCE' });
  assert.equal(result.decision, 'WATCH');
  assert.deepEqual(result.entryOptions, ['H2']);
});

test('水平平台无风险等突破或突破回踩', () => {
  assert.deepEqual(evaluate({ currentStructure: 'HORIZONTAL_PLATFORM' }).entryOptions, ['PLATFORM_BREAKOUT', 'BREAKOUT_PULLBACK']);
});

test('普通上升所有有效组合都不提供 H1', () => {
  for (const structure of CURRENT_STRUCTURE_OPTIONS.NORMAL_UP) {
    for (const riskState of ['NONE', 'OVERHEATED', 'DIVERGENCE', 'INVALIDATED'] as const) {
      assert.equal(evaluate({ marketBackground: 'NORMAL_UP', currentStructure: structure.value, riskState }).entryOptions.includes('H1'), false);
    }
  }
});

test('普通上升 EMA21 回踩无风险可买 H2', () => {
  const result = evaluate({ marketBackground: 'NORMAL_UP', currentStructure: 'EMA21_PULLBACK' });
  assert.equal(result.decision, 'BUY');
  assert.deepEqual(result.entryOptions, ['H2']);
});

test('区间底部只等双底确认或假跌破收回', () => {
  const result = evaluate({ marketBackground: 'RANGE', currentStructure: 'RANGE_BOTTOM' });
  assert.equal(result.decision, 'WATCH');
  assert.deepEqual(result.entryOptions, ['DOUBLE_BOTTOM_CONFIRMATION', 'FAILED_BREAKDOWN_RECLAIM']);
});

test('区间中部任何常规风险都不买', () => {
  for (const riskState of ['NONE', 'OVERHEATED', 'DIVERGENCE'] as const) assert.equal(evaluate({ marketBackground: 'RANGE', currentStructure: 'RANGE_MIDDLE', riskState }).decision, 'DO_NOT_BUY');
});

test('区间顶部无风险只等有效突破或回踩', () => {
  assert.deepEqual(evaluate({ marketBackground: 'RANGE', currentStructure: 'RANGE_TOP' }).entryOptions, ['EFFECTIVE_BREAKOUT', 'BREAKOUT_PULLBACK']);
});

test('买点失效在所有可交易背景中都不买', () => {
  for (const marketBackground of ['STRONG_UP', 'NORMAL_UP', 'RANGE', 'DOWN'] as const) {
    const currentStructure = CURRENT_STRUCTURE_OPTIONS[marketBackground][0].value;
    assert.equal(evaluate({ marketBackground, currentStructure, riskState: 'INVALIDATED' }).decision, 'DO_NOT_BUY');
  }
});

test('下降背景只保留反转突破后回踩例外', () => {
  const exception = evaluate({ marketBackground: 'DOWN', currentStructure: 'REVERSAL_BREAKOUT_PULLBACK' });
  assert.equal(exception.decision, 'WATCH');
  assert.deepEqual(exception.entryOptions, ['REVERSAL_BREAKOUT_PULLBACK']);
  assert.equal(evaluate({ marketBackground: 'DOWN', currentStructure: 'NO_VALID_STRUCTURE' }).decision, 'PASS');
});

test('结构不清晰直接放弃', () => {
  assert.equal(evaluate({ marketBackground: 'UNCLEAR', currentStructure: 'NO_VALID_STRUCTURE' }).decision, 'PASS');
});
