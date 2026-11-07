/** Local learning-quiz state. Not model measurement, certification or a signed credential. */
import {PASSING_SCORE,type QuizQuestion,type QuizAnswer,type QuizResult} from '@/types/quiz';
export interface NormalizedQuestion {id:string|number;question:string;options:string[];correctAnswer:number;explanation?:string}
export function normalizeQuiz(value:unknown):NormalizedQuestion[]{
 if(!Array.isArray(value)||value.length===0)throw Error('No quiz questions are available.');
 const ids=new Set<string>();
 return value.map((raw,index)=>{
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error(`Question ${index+1} is not a valid record.`);
  const r=raw as Record<string,unknown>,id=r.id;
  if(!((typeof id==='string'&&id.trim())||(typeof id==='number'&&Number.isSafeInteger(id))))throw Error(`Question ${index+1} has no valid identifier.`);
  const key=String(id);if(ids.has(key))throw Error('Duplicate question identifiers are not allowed.');ids.add(key);
  const a=r.question,b=r.questionText;
  if(a!==undefined&&typeof a!=='string'||b!==undefined&&typeof b!=='string')throw Error('Question text must be a string.');
  if(typeof a==='string'&&typeof b==='string'&&a!==b)throw Error('Question text fields disagree.');
  const question=typeof a==='string'?a:typeof b==='string'?b:'';if(!question.trim())throw Error('A question is missing its text.');
  if(!Array.isArray(r.options)||r.options.length<2||!r.options.every(o=>typeof o==='string'&&o.trim()))throw Error('Question options are incomplete.');
  if(typeof r.correctAnswer!=='number'||!Number.isSafeInteger(r.correctAnswer)||r.correctAnswer<0||r.correctAnswer>=r.options.length)throw Error('A question has no valid answer key.');
  if(r.type!==undefined&&!['multiple_choice','true_false'].includes(String(r.type)))throw Error('This quiz requires an unsupported answer type.');
  if(r.explanation!==undefined&&typeof r.explanation!=='string')throw Error('Question explanation must be text.');
  return {id,question,options:[...r.options] as string[],correctAnswer:r.correctAnswer,...(typeof r.explanation==='string'?{explanation:r.explanation}:{})};
 });
}
export function passingThreshold(value:number=PASSING_SCORE):number {
 if(!Number.isFinite(value)||value<0||value>100)throw Error('Passing score must be between zero and 100.');return value;
}
export function scoreQuiz(questions:readonly NormalizedQuestion[],answers:readonly QuizAnswer[],threshold=PASSING_SCORE):QuizResult {
 const limit=passingThreshold(threshold);if(!questions.length||answers.length!==questions.length)throw Error('A complete one-answer-per-question result is required.');
 const evaluated=questions.map((q,i)=>{const a=answers[i];if(a.questionId!==q.id||!Number.isSafeInteger(a.selectedAnswer)||a.selectedAnswer<0||a.selectedAnswer>=q.options.length)throw Error('Answer does not match the question and option scope.');return {questionId:q.id,selectedAnswer:a.selectedAnswer,correctAnswer:q.correctAnswer,isCorrect:a.selectedAnswer===q.correctAnswer};});
 const score=evaluated.filter(a=>a.isCorrect).length,exact=score/questions.length*100;
 return {score,correctAnswers:score,totalQuestions:questions.length,percentage:Math.round(exact*100)/100,passed:exact>=limit,answers:evaluated};
}
export interface QuizState {phase:'answering'|'feedback'|'complete';position:number;selected:number|null;answers:QuizAnswer[];result:QuizResult|null}
export type QuizAction={type:'select';index:number}|{type:'submit'}|{type:'next'}|{type:'reset'};
export const initialQuizState=():QuizState=>({phase:'answering',position:0,selected:null,answers:[],result:null});
export function transitionQuiz(state:QuizState,action:QuizAction,questions:readonly NormalizedQuestion[],threshold=PASSING_SCORE):QuizState {
 if(action.type==='reset')return initialQuizState();
 const q=questions[state.position];if(!q||state.phase==='complete')return state;
 if(action.type==='select')return state.phase==='answering'&&Number.isSafeInteger(action.index)&&action.index>=0&&action.index<q.options.length?{...state,selected:action.index}:state;
 if(action.type==='submit'){
  if(state.phase!=='answering'||state.selected===null)return state;
  const answer:QuizAnswer={questionId:q.id,selectedAnswer:state.selected,correctAnswer:q.correctAnswer,isCorrect:state.selected===q.correctAnswer};
  return {...state,phase:'feedback',answers:[...state.answers,answer]};
 }
 if(action.type==='next'&&state.phase==='feedback'){
  if(state.position===questions.length-1)return {...state,phase:'complete',result:scoreQuiz(questions,state.answers,threshold)};
  return {...state,phase:'answering',position:state.position+1,selected:null};
 }
 return state;
}
