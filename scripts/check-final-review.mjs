import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {checkContent,checkReview} from './final-review.mjs';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const dist=resolve(process.env.RESET_DIST||resolve(root,'dist'));
const content=await checkContent(root);
const review=process.argv.includes('--stable')?await checkReview(root,dist):'PENDING_INDEPENDENT_REVIEW';
console.log(JSON.stringify({status:'PASS',content,review},null,2));
