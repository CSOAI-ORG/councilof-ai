import {describe,it,expect} from 'vitest';
import {normalizeQuiz,scoreQuiz,transitionQuiz,initialQuizState,passingThreshold} from './quizSession';
import {getModuleQuiz} from '@/data/quizzes/index';
const input=(n=2)=>Array.from({length:n},(_,i)=>({id:i+1,question:'Synthetic question '+i,options:['Correct','Wrong'],correctAnswer:0,explanation:'Synthetic fixture; not factual training content.'}));
function answerAll(n:number,correct:number){const bank=normalizeQuiz(input(n));let state=initialQuizState();for(let i=0;i<n;i++){state=transitionQuiz(state,{type:'select',index:i<correct?0:1},bank);state=transitionQuiz(state,{type:'submit'},bank);state=transitionQuiz(state,{type:'next'},bank);}return {bank,state};}
describe('one answer per question',()=>{
 it('single correct question finishes at100 percent, not200',()=>{const {state}=answerAll(1,1);expect(state.result?.score).toBe(1);expect(state.result?.percentage).toBe(100);expect(state.answers).toHaveLength(1);});
 it('single wrong question does not pass',()=>{const {state}=answerAll(1,0);expect(state.result?.score).toBe(0);expect(state.result?.passed).toBe(false);});
 it('duplicate submit and next actions cannot award extra points',()=>{const b=normalizeQuiz(input(1));let s=transitionQuiz(initialQuizState(),{type:'select',index:0},b);s=transitionQuiz(s,{type:'submit'},b);expect(transitionQuiz(s,{type:'submit'},b)).toBe(s);s=transitionQuiz(s,{type:'next'},b);expect(transitionQuiz(s,{type:'next'},b)).toBe(s);expect(s.result?.answers).toHaveLength(1);});
 it('cannot advance before answer submission',()=>{const b=normalizeQuiz(input()),s=initialQuizState();expect(transitionQuiz(s,{type:'next'},b)).toBe(s);expect(transitionQuiz(s,{type:'submit'},b)).toBe(s);});
 it('cannot change an answer after feedback',()=>{const b=normalizeQuiz(input());let s=transitionQuiz(initialQuizState(),{type:'select',index:1},b);s=transitionQuiz(s,{type:'submit'},b);expect(transitionQuiz(s,{type:'select',index:0},b)).toBe(s);expect(s.answers[0].isCorrect).toBe(false);});
 it('invalid choice has no state effect',()=>{const b=normalizeQuiz(input()),s=initialQuizState();for(const i of [-1,2,NaN,.5])expect(transitionQuiz(s,{type:'select',index:i},b)).toBe(s);});
 it('retry resets every answer and completion field',()=>{const {state,bank}=answerAll(2,1);expect(transitionQuiz(state,{type:'reset'},bank)).toEqual(initialQuizState());});
 it('does not mutate previous state',()=>{const b=normalizeQuiz(input()),s=initialQuizState(),before=JSON.stringify(s);transitionQuiz(s,{type:'select',index:0},b);expect(JSON.stringify(s)).toBe(before);});
 it('recomputes correctness rather than trusting supplied flags',()=>{const b=normalizeQuiz(input(1));const r=scoreQuiz(b,[{questionId:1,selectedAnswer:1,correctAnswer:1,isCorrect:true}]);expect(r.passed).toBe(false);expect(r.answers[0].correctAnswer).toBe(0);});
 it('requires complete denominator and matching IDs',()=>{const b=normalizeQuiz(input(1));expect(()=>scoreQuiz(b,[])).toThrow('complete');expect(()=>scoreQuiz(b,[{questionId:'wrong',selectedAnswer:0,correctAnswer:0,isCorrect:true}])).toThrow('scope');});
 it('checks exact percentage before display rounding',()=>{const {bank,state}=answerAll(23,16);const r=scoreQuiz(bank,state.answers,70);expect(r.percentage).toBe(69.57);expect(r.passed).toBe(false);});
 it('honours an explicit passing threshold',()=>{const {bank,state}=answerAll(4,3);expect(scoreQuiz(bank,state.answers,75).passed).toBe(true);expect(scoreQuiz(bank,state.answers,80).passed).toBe(false);});
 it('all result scores stay within their denominators',()=>{for(let n=1;n<=10;n++)for(let c=0;c<=n;c++){const r=answerAll(n,c).state.result!;expect(r.score).toBe(c);expect(r.answers).toHaveLength(n);expect(r.percentage).toBeLessThanOrEqual(100);}});
});
describe('question normalization',()=>{
 it('accepts both existing text spellings and preserves originals',()=>{const a=input(1)[0],b={...a,questionText:a.question};delete (b as {question?:string}).question;const original=JSON.stringify([a,b]);expect(normalizeQuiz([a])[0].question).toBe(normalizeQuiz([b])[0].question);expect(JSON.stringify([a,b])).toBe(original);});
 it('rejects contradictory text fields',()=>expect(()=>normalizeQuiz([{...input(1)[0],questionText:'different'}])).toThrow('disagree'));
 it.each([null,[],{},'missing'])('missing data never yields a completion: %s',value=>expect(()=>normalizeQuiz(value)).toThrow());
 it('missing correct answer is ungradable, not a failed learner',()=>{const q={...input(1)[0],correctAnswer:undefined};expect(()=>normalizeQuiz([q])).toThrow('answer key');});
 it.each([-1,2,.5,NaN])('rejects invalid answer index %s',correctAnswer=>expect(()=>normalizeQuiz([{...input(1)[0],correctAnswer}])).toThrow());
 it('rejects duplicate/ambiguous IDs',()=>expect(()=>normalizeQuiz([input(1)[0],{...input(1)[0],id:'1'}])).toThrow('Duplicate'));
 it('does not silently grade unsupported multi-select as single choice',()=>expect(()=>normalizeQuiz([{...input(1)[0],type:'multi_select'}])).toThrow('unsupported'));
 it('requires real options',()=>expect(()=>normalizeQuiz([{...input(1)[0],options:['']}])).toThrow('options'));
 it.each([-1,101,NaN,Infinity])('rejects invalid threshold %s',threshold=>expect(()=>passingThreshold(threshold)).toThrow());
});
describe('actual retained course quiz data — structural, not factual validation',()=>{
 it('all49 existing module banks have valid and unique local scoring inputs',()=>{let banks=0,questions=0;for(let course=100001;course<=100007;course++)for(let module=0;module<7;module++){const source=getModuleQuiz(course,module),before=JSON.stringify(source),normalized=normalizeQuiz(source);expect(normalized.length).toBeGreaterThan(0);expect(JSON.stringify(source)).toBe(before);banks++;questions+=normalized.length;}expect(banks).toBe(49);expect(questions).toBeGreaterThan(0);});
});
