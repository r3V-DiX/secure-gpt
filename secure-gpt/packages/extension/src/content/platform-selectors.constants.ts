// packages/extension/src/content/platform-selectors.constants.ts
// Platform-specific input selectors targeting 20+ AI platforms

export const INPUT_SELECTORS = [
  // ChatGPT
  '#prompt-textarea',
  'div[contenteditable="true"][data-id="root"]',
  'div[contenteditable="true"].ProseMirror',
  'div[contenteditable="true"]',
  // Gemini
  'div.ql-editor[contenteditable="true"]',
  'rich-textarea div[contenteditable="true"]',
  // Claude
  'div[contenteditable="true"].ProseMirror',
  // Copilot
  'textarea#searchbox',
  'div[contenteditable="true"]#searchbox',
  // Perplexity
  'textarea[placeholder*="Ask"]',
  'textarea[placeholder*="anything"]',
  // Meta AI
  'div[contenteditable="true"][role="textbox"]',
  // Mistral Le Chat
  'textarea[placeholder*="Ask"]',
  'textarea[data-testid="chat-input"]',
  // Poe
  'textarea[placeholder*="Talk to"]',
  'div[class*="ChatMessageInputContainer"] textarea',
  // DeepSeek
  'textarea#chat-input',
  'textarea[placeholder*="DeepSeek"]',
  'div[contenteditable="true"]#chat-input',
  // v0.dev
  'textarea[placeholder*="Ask v0"]',
  'textarea[placeholder*="What can I help you build"]',
  // Replit
  'div[class*="replit-ui"] textarea',
  'textarea[placeholder*="Reply to agent"]',
  // HuggingChat
  'textarea[placeholder*="Ask anything"]',
  'textarea[enterkeyhint="send"]',
  // Phind
  'textarea[placeholder*="Ask Phind"]',
  'textarea[aria-label="Search"]',
  // Notion AI
  'div[placeholder*="Ask AI"]',
  'div[class*="notion-ai-prompt-input"]',
  // Jasper AI
  'textarea[placeholder*="Ask Jasper"]',
  'div[contenteditable="true"][data-slate-editor="true"]',
  // Copy.ai
  'textarea[placeholder*="Enter prompt"]',
  'textarea[data-testid="chat-textarea"]',
  // Cursor Web
  'textarea[placeholder*="Plan, code"]',
]

export const EXCLUDE_INPUT_SELECTORS = [
  'input[type="password"]',
  'input[type="hidden"]',
  'input[type="checkbox"]',
  'input[type="radio"]',
  'input[type="file"]',
]
