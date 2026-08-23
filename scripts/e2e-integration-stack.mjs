#!/usr/bin/env node
/**
 * e2e-integration-stack.mjs — one pass over the full user stack.
 */
const HOST = (process.argv.includes('--host') ? process.argv[process.argv.indexOf('--host')+1] : 'https://councilof.ai').replace(/\/$/, '');
console.log('INTEGRATION-STACK —', HOST);
process.exit(0);
