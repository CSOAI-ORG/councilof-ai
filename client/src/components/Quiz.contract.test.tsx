import React from 'react';import {describe,it,expect,vi} from 'vitest';import {renderToStaticMarkup} from 'react-dom/server';import {Quiz} from './Quiz';import {Quiz as LegacyQuiz} from '../pages/Quiz';
const question={id:1,questionText:'Synthetic practice question',options:['First','Second'],correctAnswer:0};
describe('single quiz user contract',()=>{
 it('legacy entry point is the canonical component',()=>expect(LegacyQuiz).toBe(Quiz));
 it('renders either historical question shape and supplied title',()=>{const h=renderToStaticMarkup(<Quiz questions={[question]} title="Fixture assessment" passingScore={80} onComplete={()=>{}}/>);expect(h).toContain('Synthetic practice question');expect(h).toContain('Fixture assessment');expect(h).toContain('aria-pressed="false"');});
 it('empty data has explicit unavailable state and no completion callback',()=>{const cb=vi.fn(),h=renderToStaticMarkup(<Quiz questions={[]} onComplete={cb}/>);expect(h).toContain('Quiz unavailable');expect(h).toContain('role="alert"');expect(h).not.toContain('NaN');expect(cb).not.toHaveBeenCalled();});
 it('invalid answer keys cannot receive a passing UI',()=>{const h=renderToStaticMarkup(<Quiz questions={[{...question,correctAnswer:undefined}]} onComplete={()=>{}}/>);expect(h).toContain('No score or completion');expect(h).not.toContain('Practice quiz completed');});
});
