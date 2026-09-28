# Extension releases dataset

EXTENSION_RELEASES = [
    {
        "component": "extension",
        "version": "1.2.3",
        "release_date": "September 24, 2026",
        "status": "Production Stable",
        "tag": "Design System Harmonization & Vector In-Page Modals",
        "commit_hash": "prod-v1.2.3-ext",
        "summary": "Synchronized design tokens with dashboard, replaced OS emojis with clean vector SVGs across all in-page modals, automated dark host detection, and enhanced touch targets and accessibility.",
        "info": "SecureGPT Chrome Extension v1.2.3 delivers complete visual and design system parity with the SecureGPT Web Dashboard, featuring unified Plus Jakarta Sans typography, WCAG AA/AAA compliant color tokens, vector iconography, and improved responsive touch ergonomics.",
        "whats_new": [
            "Harmonized design tokens: full alignment of color palette, focus rings, and Plus Jakarta Sans typography with main web application.",
            "Vector iconography overhaul: replaced OS emojis with crisp, lightweight vector SVGs across Shield Modal, Warning Banners, Radial Gauges, and Site Indicators.",
            "Automatic host dark mode detection dynamically applied to in-page Shadow DOM host overlays.",
            "Touch target ergonomics: guaranteed minimum 24px interactive boundaries across all action badges, buttons, and switches."
        ],
        "changed_functionality": [
            "Standardized core UI components (Button, Card, Badge, Toggle, StatusIndicator) using unified cn() utility.",
            "Added explicit aria-label attributes to dev mode inputs and pause protection buttons for screen reader compliance."
        ],
        "improvements": [
            "Zero host style leakage with tightened Shadow DOM styles and CSS variable scoping.",
            "Accessible high-contrast stat text across all card states in popup interface.",
            "Smooth transition animations honoring user prefers-reduced-motion preferences."
        ],
        "problems_solved": [
            "Fixed visual fragmentation between extension popup and web dashboard UI components.",
            "Resolved low-contrast text visibility on warning and block badges in dark-themed web LLM platforms."
        ],
        "order_index": 1,
    },
    {
        "component": "extension",
        "version": "1.2.2",
        "release_date": "September 17, 2026",
        "status": "Production Stable",
        "tag": "Real-time Telemetry Mirroring & Instant Policy Enforcement",
        "commit_hash": "ext-v1.2.2",
        "summary": "Bi-directional telemetry synchronization with the dashboard, instant policy update listener without page refresh, and enhanced WASM redaction pipeline.",
        "info": "SecureGPT Chrome Extension v1.2.2 delivers lightning-fast DLP inspection across ChatGPT, Claude, Gemini, Copilot, and 13 other LLM platforms with zero perceptible latency.",
        "whats_new": [
            "Live cloud telemetry sync: popup extension badge and statistics mirror dashboard analytics in real time.",
            "Instant policy hot-reloading: changes made in the dashboard policy manager apply immediately without reloading tabs.",
            "Expanded platform coverage to 17 major LLM tools including Cursor Web, DeepSeek, v0.dev, and Replit."
        ],
        "changed_functionality": [
            "Updated content script DOM interceptors to handle React 19 fiber nodes on chatgpt.com."
        ],
        "improvements": [
            "Sub-5ms regex and token matching latency using compiled WebAssembly scanner.",
            "Zero cloud data egress: all redaction and masking execution happens 100% locally in browser memory."
        ],
        "problems_solved": [
            "Fixed race condition where rapidly submitted prompts could bypass DOM inspection on slow connections."
        ],
        "order_index": 2,
    },
    {
        "component": "extension",
        "version": "1.2.1",
        "release_date": "September 11, 2026",
        "status": "Released",
        "tag": "Streamlined Radial Risk Gauge",
        "commit_hash": "ext-v1.2.1",
        "summary": "Streamlined real-time DLP experience removing intrusive popover cards and tooltips, exclusively featuring the lightweight Shadow DOM radial risk gauge.",
        "info": "SecureGPT Extension v1.2.1 provides clean, non-intrusive prompt risk visualization with zero prompt occlusion and synchronous form-submission DLP protection.",
        "whats_new": [
            "Exclusive Shadow DOM radial risk percentage gauge with zero-friction visual threat cues.",
            "Completely removed floating live warning tooltip overlays and redundant popover action bars.",
            "Lightweight memory optimization with eliminated temporary tooltip DOM trees."
        ],
        "changed_functionality": [
            "Removed live-warning-tooltip component from extension content scripts.",
            "DLP actions (mask/block) enforce cleanly on submission while the radial gauge provides passive continuous risk scoring."
        ],
        "improvements": [
            "Unobstructed typing area across all 15+ monitored generative AI platforms.",
            "Even faster DOM evaluation cycle with zero layout disruption."
        ],
        "problems_solved": [
            "Fixed floating tooltip cards covering chat input boxes and platform-native dropdown menus.",
            "Eliminated click interception issues caused by transient popover elements."
        ],
        "order_index": 3,
    },
    {
        "component": "extension",
        "version": "1.2.0",
        "release_date": "September 11, 2026",
        "status": "Released",
        "tag": "Manifest V3 Production Build",
        "commit_hash": "ext-v1.2.0",
        "summary": "High-performance browser extension providing zero-latency DOM interception, WebAssembly document parsing, and client-side DLP scanning across 15+ AI platforms.",
        "info": "SecureGPT Chrome Extension operates entirely inside the user browser, scanning and redacting sensitive data locally before it ever reaches LLM servers.",
        "whats_new": [
            "Expanded LLM coverage across 15+ major platforms including ChatGPT, Claude, Gemini, Copilot, Perplexity, Cursor, Poe, and DeepSeek.",
            "Document & attachment scanning engine powered by WebAssembly (@firecrawl/anydoc-wasm) and PDF.js.",
            "Configurable DLP Action states: ALLOW, MASK (real-time redaction), WARN, and BLOCK modal.",
            "Extension shadow DOM overlay with isolated stylesheet to eliminate host site CSS bleed.",
        ],
        "changed_functionality": [
            "Optimized input listener pipeline to eliminate typing lag prior to form submission.",
            "Switched policy cache to chrome.storage.local with periodic background sync alarms.",
        ],
        "improvements": [
            "Reduced memory footprint to under 28MB even while processing multi-page PDF documents in-browser.",
            "Faster regex evaluation using segmented rule tiers (Secrets -> PII -> Custom Org Patterns).",
            "Smoother shadow DOM animations with zero main-thread layout thrashing.",
        ],
        "problems_solved": [
            "Fixed keystroke interception interfering with Claude.ai and Perplexity autocomplete dropdowns.",
            "Solved modal z-index conflicts where host application popups covered the DLP warning shield.",
            "Fixed offline fallback policy failure when browser is disconnected from enterprise server.",
        ],
        "order_index": 4,
    },
    {
        "component": "extension",
        "version": "1.1.3",
        "release_date": "August 11, 2026",
        "status": "Released",
        "tag": "Office & Document DLP Engine",
        "commit_hash": "ext-v1.1.3",
        "summary": "Complete client-side document inspection pipeline for Office documents, spreadsheets, slides, and tabular data.",
        "info": "Introduced local document dissection and redaction before upload to ChatGPT and Claude file handlers.",
        "whats_new": [
            "Added document parsing and redaction/masking for Office documents (.docx, .xlsx, .pptx, .odt, .csv).",
            "Client-side file drop-zone interceptor catching files dragged into web LLM chat windows.",
            "Visual file inspection progress dialog showing scanning progress and detected risk count.",
        ],
        "changed_functionality": [
            "Intercepts browser File/Blob drag-and-drop and input[type=file] change events prior to upload payload generation.",
            "Allows selective entity redaction inside structured documents without corrupting file headers or archives.",
        ],
        "improvements": [
            "Asynchronous ZIP archive decompression in Web Workers preventing UI freezing during large file parsing.",
            "Optimized memory buffer deallocation after document scanning completes.",
        ],
        "problems_solved": [
            "Resolved false-negative leaks where users attached sensitive spreadsheets and confidential presentations to LLM prompts.",
            "Fixed file corruption on re-serialized .docx files after replacing PII tokens.",
            "Prevented browser tab lockups on large CSV datasets over 10MB.",
        ],
        "order_index": 5,
    },
    {
        "component": "extension",
        "version": "1.1.2",
        "release_date": "July 26, 2026",
        "status": "Released",
        "tag": "OCR & Vision Upgrade",
        "commit_hash": "ext-v1.1.2",
        "summary": "Tier 3 client-side OCR Canvas Preprocessing and quantitative accuracy testing harness.",
        "info": "Upgraded detection subsystem with high-DPI rescaling, luminance grayscaling, and adaptive binarization for image screenshots.",
        "whats_new": [
            "Tier 3 client-side OCR image preprocessing with canvas-based 2x high-DPI scaling and adaptive thresholding.",
            "Automatic rotation orientation detection (90°, 180°, 270°) for mobile and portrait screenshots.",
            "Dual-pass OCR pipeline: First pass PSM.AUTO, secondary pass PSM.SPARSE_TEXT when PII is suspected.",
        ],
        "changed_functionality": [
            "Images dragged into chat are processed through client canvas before invoking Tesseract OCR runtime.",
            "Detection confidence threshold calibration aligned with gold-standard evaluation harness.",
        ],
        "improvements": [
            "94.2% recall rate on low-contrast screenshots, dark-mode terminal captures, and code snippets.",
            "Reduced OCR preprocessing latency by 35% through direct typed-array byte manipulation.",
        ],
        "problems_solved": [
            "Fixed OCR failures on low-contrast dark mode screenshots where white-on-dark text was dropped.",
            "Prevented memory exhaustion caused by uncollected canvas contexts during rapid sequential screenshot uploads.",
        ],
        "order_index": 6,
    },
    {
        "component": "extension",
        "version": "1.1.1",
        "release_date": "July 8, 2026",
        "status": "Released",
        "tag": "Initial Public Extension",
        "commit_hash": "ext-v1.1.1",
        "summary": "Initial public release of SecureGPT browser extension built on Chrome Manifest V3.",
        "info": "First official Chrome Web Store release providing real-time client-side prompt interception for ChatGPT, Claude, and Gemini.",
        "whats_new": [
            "Manifest V3 compliant background service worker with alarms-based policy synchronization.",
            "Real-time prompt text interception on Enter key and Submit button click.",
            "Core PII detection library: Names, Email addresses, Phone numbers, Physical addresses, and Social Security Numbers.",
            "Secrets detection: AWS keys, OpenAI keys, GitHub tokens, database connection URIs, and JWTs.",
            "Extension popup menu displaying active policy sync status and local violation count.",
        ],
        "changed_functionality": [
            "Replaced deprecated Manifest V2 background page architecture with modern declarative event-driven service workers.",
            "Offscreen document lifecycle management for CPU-intensive NER and regex tasks.",
        ],
        "improvements": [
            "Sub-5ms prompt scanning overhead with zero detectable input lag during normal typing.",
            "Zero external server dependency for text inspection — complete local execution.",
        ],
        "problems_solved": [
            "Prevented accidental corporate data leaks during employee interactions with generative AI tools.",
            "Fixed Service Worker termination mid-inspection by wrapping async DLP pipelines in keep-alive ports.",
        ],
        "order_index": 7,
    }
]
