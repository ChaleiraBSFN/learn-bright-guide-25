/// <reference types="bun" />
import { describe, test, expect } from 'bun:test';
import { quizScore, missedQuestions, recordAnswer, reviewCardIndexes, materialText } from './buddyPractice';
const questions = [{ question: '2 + 2?', options: ['3', '4'], correctIndex: 1 }, { question: '3 + 3?', options: ['6', '5'], correctIndex: 0 }];
describe('Buddy practice', () => {
  test('counts correct first answers without counting unanswered questions', () => { expect(quizScore(questions, {0: 1})).toBe(1); });
  test('mistake review includes only answered incorrect questions', () => { expect(missedQuestions(questions, {0: 0})).toEqual([questions[0]]); });
  test('does not allow replacing an answer after the correction', () => { expect(recordAnswer({0: 0}, 0, 1)).toEqual({0: 0}); });
  test('review hides mastered cards', () => { expect(reviewCardIndexes([{front:'a',back:'b'},{front:'c',back:'d'}], {0:true}, true)).toEqual([1]); });
  test('export retains questions and correct answer', () => { expect(materialText('Math', {questions})).toContain('✓ 4'); });
});