/**
 * FINAL COMPLETE TEST - All selectors confirmed
 * 
 * Tests the complete Abacus.ai integration with all confirmed selectors:
 * - URL: https://apps.abacus.ai/chatllm/?appId=63707faca (auto-selects GPT-5 Pro)
 * - Input: textarea[placeholder="Write something..."]
 * - Send: button[data-id="send"]
 * - Response: [data-message-role="BOT"] p
 */

import { launchChrome, connectToChrome } from '../src/browser/chromeLifecycle.js';
import { resolveBrowserConfig } from '../src/browser/config.js';
import path from 'path';
import os from 'os';

const CHROME_PATH = '/Users/manik/Library/Caches/ms-playwright/chromium-1194/chrome-mac/Chromium.app/Contents/MacOS/Chromium';
const ABACUS_URL = 'https://apps.abacus.ai/chatllm/?appId=63707faca'; // Auto-selects GPT-5 Pro
const INPUT_SELECTOR = 'textarea[placeholder="Write something..."]';
const SEND_SELECTOR = 'button[data-id="send"]';
const ANSWER_SELECTOR = '[data-message-role="BOT"] p';

async function finalCompleteTest() {
  const logger = (msg) => console.log(`[Test] ${msg}`);
  const userDataDir = path.join(os.homedir(), '.oracle', 'browser-profile-abacus');
  
  const config = resolveBrowserConfig({
    headless: false,
    keepBrowser: true,
    chromePath: CHROME_PATH,
    url: ABACUS_URL,
    manualLogin: true,
    manualLoginProfileDir: userDataDir
  });

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🎯 ABACUS.AI INTEGRATION - FINAL COMPLETE TEST');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`URL: ${ABACUS_URL}`);
  console.log(`Input: ${INPUT_SELECTOR}`);
  console.log(`Send: ${SEND_SELECTOR}`);
  console.log(`Answer: ${ANSWER_SELECTOR}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('🚀 Launching Chrome...');
  const chrome = await launchChrome(config, userDataDir, logger);
  
  const client = await connectToChrome(chrome.port, logger);
  const { Runtime, Page, Input } = client;
  await Promise.all([Runtime.enable(), Page.enable()]);

  console.log(`\n📍 Navigating to Abacus.ai...`);
  await Page.navigate({ url: ABACUS_URL });
  
  console.log('⏳ Waiting 8 seconds for page load...');
  await new Promise(r => setTimeout(r, 8000));

  console.log('\n🔍 Step 1: Verify all elements...');
  const verifyResult = await Runtime.evaluate({
    expression: `(() => {
      const modelSelector = document.querySelector('[aria-haspopup="dialog"]');
      const textarea = document.querySelector('${INPUT_SELECTOR}');
      const sendBtn = document.querySelector('${SEND_SELECTOR}');
      
      return {
        url: window.location.href,
        model: modelSelector?.textContent?.trim() || 'not found',
        hasTextarea: textarea !== null,
        hasSendButton: sendBtn !== null,
        sendButtonDisabled: sendBtn?.disabled || false
      };
    })()`,
    returnByValue: true
  });
  
  const verify = verifyResult.result?.value;
  console.log(`   URL: ${verify?.url}`);
  console.log(`   Model: ${verify?.model} ${verify?.model.includes('GPT-5') ? '✅' : '⚠️'}`);
  console.log(`   Textarea: ${verify?.hasTextarea ? '✅' : '❌'}`);
  console.log(`   Send button: ${verify?.hasSendButton ? '✅' : '❌'} ${verify?.sendButtonDisabled ? '(disabled)' : '(enabled)'}`);

  if (!verify?.hasTextarea || !verify?.hasSendButton) {
    console.log('\n❌ Required elements not found. Aborting.');
    process.exit(1);
  }

  console.log('\n🎯 Step 2: Send test message...\n');

  // Setup navigation tracking
  let convoId = '';
  Page.frameNavigated((params) => {
    if (params.frame.url && params.frame.url.includes('convoId=')) {
      const match = params.frame.url.match(/convoId=([^&]+)/);
      if (match) {
        convoId = match[1];
        console.log(`   ✅ Navigated to conversation: ${convoId}`);
      }
    }
  });

  // Get coordinates
  const coordsResult = await Runtime.evaluate({
    expression: `(() => {
      const textarea = document.querySelector('${INPUT_SELECTOR}');
      const sendBtn = document.querySelector('${SEND_SELECTOR}');
      
      const taRect = textarea.getBoundingClientRect();
      const btnRect = sendBtn.getBoundingClientRect();
      
      return {
        textarea: { x: taRect.left + 50, y: taRect.top + taRect.height / 2 },
        sendButton: { x: btnRect.left + btnRect.width / 2, y: btnRect.top + btnRect.height / 2 }
      };
    })()`,
    returnByValue: true
  });

  const coords = coordsResult.result?.value;

  // Click textarea
  console.log('   Clicking textarea...');
  await Input.dispatchMouseEvent({ type: 'mouseMoved', x: coords.textarea.x, y: coords.textarea.y });
  await new Promise(r => setTimeout(r, 100));
  await Input.dispatchMouseEvent({ type: 'mousePressed', x: coords.textarea.x, y: coords.textarea.y, button: 'left', clickCount: 1 });
  await Input.dispatchMouseEvent({ type: 'mouseReleased', x: coords.textarea.x, y: coords.textarea.y, button: 'left', clickCount: 1 });
  await new Promise(r => setTimeout(r, 500));

  // Type message
  console.log('   Typing message...');
  const message = 'What is 5+3? Answer with just the number.';
  
  for (const char of message) {
    await Input.insertText({ text: char });
    await new Promise(r => setTimeout(r, 35));
  }
  
  console.log(`   ✅ Typed: "${message}"`);
  await new Promise(r => setTimeout(r, 1500));

  // Click send
  console.log('   Clicking send button...');
  await Input.dispatchMouseEvent({ type: 'mouseMoved', x: coords.sendButton.x, y: coords.sendButton.y });
  await new Promise(r => setTimeout(r, 200));
  await Input.dispatchMouseEvent({ type: 'mousePressed', x: coords.sendButton.x, y: coords.sendButton.y, button: 'left', clickCount: 1 });
  await new Promise(r => setTimeout(r, 150));
  await Input.dispatchMouseEvent({ type: 'mouseReleased', x: coords.sendButton.x, y: coords.sendButton.y, button: 'left', clickCount: 1 });
  console.log('   ✅ Sent!');

  console.log('\n⏳ Step 3: Waiting for navigation and response...');
  
  // Wait for navigation
  for (let i = 0; i < 20; i++) {
    if (convoId) break;
    
    // Fallback: check URL manually
    const urlCheck = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
    const currentUrl = urlCheck.result?.value || '';
    const match = currentUrl.match(/convoId=([^&]+)/);
    if (match) {
      convoId = match[1];
      console.log(`   ✅ Navigation confirmed: ${convoId}`);
      break;
    }
    
    await new Promise(r => setTimeout(r, 500));
  }

  if (!convoId) {
    console.log('   ⚠️  No navigation detected, checking for response anyway...');
  }

  // Wait a bit more for response to render
  await new Promise(r => setTimeout(r, 5000));

  console.log('\n🔍 Step 4: Capturing response...\n');

  const responseResult = await Runtime.evaluate({
    expression: `(() => {
      const responseElements = document.querySelectorAll('${ANSWER_SELECTOR}');
      const responses = [];
      
      for (const el of responseElements) {
        const text = el.textContent?.trim();
        if (text && text.length > 0) {
          responses.push({
            text: text,
            html: el.innerHTML,
            parent: {
              tagName: el.parentElement?.tagName,
              className: el.parentElement?.className.substring(0, 80),
              dataRole: el.parentElement?.closest('[data-message-role]')?.getAttribute('data-message-role')
            }
          });
        }
      }
      
      return {
        count: responses.length,
        responses: responses,
        lastResponse: responses.length > 0 ? responses[responses.length - 1] : null
      };
    })()`,
    returnByValue: true
  });

  const result = responseResult.result?.value;

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 RESULTS');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`ConvoId: ${convoId || 'N/A'}`);
  console.log(`Response paragraphs found: ${result?.count || 0}\n`);

  if (result?.lastResponse) {
    console.log('✅ LATEST RESPONSE CAPTURED:\n');
    console.log(`   Text: "${result.lastResponse.text}"`);
    console.log(`   HTML: ${result.lastResponse.html}`);
    console.log(`   Parent: ${result.lastResponse.parent.tagName}`);
    console.log(`   Data-role: ${result.lastResponse.parent.dataRole}`);
    
    if (result.responses.length > 1) {
      console.log(`\n📋 All ${result.responses.length} response paragraphs:`);
      result.responses.forEach((r, idx) => {
        console.log(`   [${idx}] "${r.text.substring(0, 100)}${r.text.length > 100 ? '...' : ''}"`);
      });
    }
    
    console.log('\n✅ SUCCESS! Response successfully captured!');
  } else {
    console.log('❌ No response captured yet.');
    console.log('   The response may still be loading or the selector may need adjustment.');
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ INTEGRATION TEST COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Chrome port: ${chrome.port}`);
  console.log(`ConvoId: ${convoId}`);
  console.log('\n📋 CONFIRMED SELECTORS:');
  console.log(`   ORACLE_BROWSER_URL='${ABACUS_URL}'`);
  console.log(`   ORACLE_BROWSER_INPUT_SELECTOR='${INPUT_SELECTOR}'`);
  console.log(`   ORACLE_BROWSER_SEND_BUTTON_SELECTOR='${SEND_SELECTOR}'`);
  console.log(`   ORACLE_BROWSER_ANSWER_SELECTOR='${ANSWER_SELECTOR}'`);
  console.log(`   ORACLE_BROWSER_MODEL=null`);
  console.log('\n🔍 Browser will stay open for inspection.');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Keep browser open
  await new Promise(() => {});
}

finalCompleteTest().catch(console.error);
