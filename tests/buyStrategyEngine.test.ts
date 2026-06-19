import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateBuyStrategy, type StrategyInput } from '../src/utils/buyStrategyEngine.ts';

const base: StrategyInput = { marketStructure: 'UP', trendQuality: 'STRONG', priceLocation: 'TREND_PULLBACK', riskState: 'NONE' };
const evaluate = (changes: Partial<StrategyInput>) => evaluateBuyStrategy({ ...base, ...changes });

test('下降结构直接放弃', () => {
  assert.deepEqual(evaluate({ marketStructure: 'DOWN' }), { decision: 'PASS', entryTypes: ['NONE'], note: '下降结构不做多头买入。' });
});

test('结构不清直接放弃', () => {
  assert.equal(evaluate({ marketStructure: 'UNCLEAR' }).decision, 'PASS');
});

test('箱体边界无风险时观察三类确认', () => {
  const result = evaluate({ marketStructure: 'RANGE', trendQuality: 'NONE', priceLocation: 'RANGE_EDGE' });
  assert.equal(result.decision, 'WATCH');
  assert.deepEqual(result.entryTypes, ['DOUBLE_BOTTOM', 'FAILED_BREAKDOWN_RECLAIM', 'BREAKOUT']);
});

test('箱体无优势位不买', () => {
  assert.equal(evaluate({ marketStructure: 'RANGE', trendQuality: 'NONE', priceLocation: 'NO_EDGE' }).decision, 'DO_NOT_BUY');
});

test('强趋势回调无风险可买 H1', () => {
  const result = evaluate({});
  assert.equal(result.decision, 'BUY');
  assert.deepEqual(result.entryTypes, ['H1']);
});

test('强趋势过热时 H1 降级', () => {
  const result = evaluate({ riskState: 'OVERHEATED' });
  assert.equal(result.decision, 'WATCH');
  assert.deepEqual(result.entryTypes, ['H1', 'H2']);
});

test('强趋势出现分歧或破坏时不买', () => {
  assert.equal(evaluate({ riskState: 'DIVERGENCE' }).decision, 'DO_NOT_BUY');
  assert.equal(evaluate({ riskState: 'BROKEN' }).decision, 'DO_NOT_BUY');
});

test('强趋势过热突破不追，等回踩', () => {
  const result = evaluate({ priceLocation: 'BREAKOUT', riskState: 'OVERHEATED' });
  assert.equal(result.decision, 'WATCH');
  assert.deepEqual(result.entryTypes, ['PULLBACK_CONFIRMATION']);
});

test('普通趋势回调只等 H2', () => {
  const result = evaluate({ trendQuality: 'NORMAL' });
  assert.equal(result.decision, 'WATCH');
  assert.deepEqual(result.entryTypes, ['H2']);
});

test('普通趋势回踩位可等回踩确认或 H2', () => {
  const result = evaluate({ trendQuality: 'NORMAL', priceLocation: 'PULLBACK' });
  assert.equal(result.decision, 'BUY');
  assert.deepEqual(result.entryTypes, ['PULLBACK_CONFIRMATION', 'H2']);
});

test('上涨结构但无趋势时只看区间边界', () => {
  const result = evaluate({ trendQuality: 'NONE', priceLocation: 'RANGE_EDGE' });
  assert.equal(result.decision, 'WATCH');
  assert.deepEqual(result.entryTypes, ['DOUBLE_BOTTOM', 'FAILED_BREAKDOWN_RECLAIM']);
});
