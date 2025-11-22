
/**
 * Live test for Abacus.ai integration with Oracle
 * 
 * This test uses the confirmed working selectors to test Oracle's browser automation
 * with the Abacus.ai chat interface.
 */

import { runBrowserMode } from '../src/browser/index.js';

// Confirmed working selectors
const ABACUS_URL = 'https://apps.abacus.ai/chatllm/?appId=63707faca';
const INPUT_SELECTOR = 'textarea[placeholder="Write something..."]';
const SEND_SELECTOR = 'button[data-id="send"]';
const ANSWER_SELECTOR = 'p[class*="first:mt-1.5"]';

async function run() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🎯 Oracle + Abacus.ai Live Test');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`URL: ${ABACUS_URL}`);
  console.log(`Input: ${INPUT_SELECTOR}`);
  console.log(`Send: ${SEND_SELECTOR}`);
  console.log(`Answer: ${ANSWER_SELECTOR}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Set environment variables for Oracle
  process.env.ORACLE_BROWSER_URL = ABACUS_URL;
  process.env.ORACLE_BROWSER_INPUT_SELECTOR = INPUT_SELECTOR;
  process.env.ORACLE_BROWSER_SEND_BUTTON_SELECTOR = SEND_SELECTOR;
  process.env.ORACLE_BROWSER_ANSWER_SELECTOR = ANSWER_SELECTOR;
  process.env.ORACLE_BROWSER_MODEL = 'null'; // Skip model selection - URL auto-selects GPT-5 Pro

  console.log('🚀 Starting Oracle browser mode...\n');

  try {
    const result = await runBrowserMode({
      prompt: 'What is 10 + 7? Answer with just the number.',
      config: {
        url: ABACUS_URL,
        headless: false,
        keepBrowser: true,
        desiredModel: null // Skip model selection
      },
      log: (msg) => console.log(`[Oracle] ${msg}`)
    });
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ Oracle Run Complete!');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('Result:', JSON.stringify(result, null, 2));
    console.log('\n');
  } catch (e) {
    console.error('\n═══════════════════════════════════════════════════════════════');
    console.error('❌ Oracle Run Failed');
    console.error('═══════════════════════════════════════════════════════════════');
    console.error(e);
    process.exit(1);
  }
}

run().catch(console.error);
