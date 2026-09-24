# Enterprise Deployment and Administration Plan

This document outlines the strategy for enterprise-grade administration and enforcement of the SecureGPT browser extension. The goal is to allow administrators to force-install the extension across the organization's fleet and restrict configuration adjustments solely to authorized administrators, making the extension tamper-proof for end users.

---

## 1. Force Installation (ExtensionInstallForcelist)

To prevent users from disabling or uninstalling the extension, it must be deployed via Enterprise Policies. Chrome, Edge, and other Chromium-based browsers support force-installing extensions using policy templates.

### A. Deployment Methods

#### 1. Windows (Group Policy Objects - GPO)
Administrators use Active Directory Group Policy Objects to enforce the installation:
* **Policy Name**: `ExtensionInstallForcelist` (Configure the list of force-installed apps and extensions)
* **Registry Path**: `Software\Policies\Google\Chrome\ExtensionInstallForcelist`
* **Value Format**: `<extension_id>;<update_url>`
  * *Example (if hosted on Chrome Web Store)*: `abcdefghijklmnopqrstuvwxyzabcdef;https://clients2.google.com/service/update2/crx`
  * *Example (if self-hosted)*: `abcdefghijklmnopqrstuvwxyzabcdef;https://corp.yourdomain.com/secure-gpt/updates.xml`

#### 2. macOS (Mobile Device Management - MDM / PLIST)
For macOS fleets (deployed via Jamf, Kandji, Intune, etc.), administrators push a configuration profile containing the following property list (plist) entry:
```xml
<key>ExtensionInstallForcelist</key>
<array>
    <string>abcdefghijklmnopqrstuvwxyzabcdef;https://clients2.google.com/service/update2/crx</string>
</array>
```

#### 3. Linux (Managed Policy Files)
For Linux devices, a policy JSON file is placed in `/etc/opt/chrome/policies/managed/secure_gpt.json`:
```json
{
  "ExtensionInstallForcelist": [
    "abcdefghijklmnopqrstuvwxyzabcdef;https://clients2.google.com/service/update2/crx"
  ]
}
```

#### 4. Cloud Management (Google Admin Console)
If the organization uses **Chrome Browser Cloud Management (CBCM)** or **Google Workspace**:
1. Navigate to **Devices > Chrome > Apps & extensions > Users & browsers**.
2. Select the organizational unit (OU) to target.
3. Add SecureGPT (from Chrome Web Store or via custom URL).
4. Set the **Installation policy** to **Force install**.

---

## 2. Administrator-Controlled Configuration (`chrome.storage.managed`)

To prevent users from changing policy configurations (e.g., custom regexes, backend URLs, detection sensitivity, bypass permissions), the extension must read its configuration from Chrome's **Managed Storage**.

Managed storage values are:
* **Read-only** for the extension runtime and the end user.
* **Settable only** by the enterprise administrator via GPO, plist, or Google Admin Console.

### Step 1: Define the Managed Schema
A schema definition file (e.g., `managed-schema.json`) must be registered in the extension's `manifest.json`.

**`packages/extension/manifest.json` addition:**
```json
{
  "permissions": [
    "storage"
  ],
  "storage": {
    "managed_schema": "managed-schema.json"
  }
}
```

**`packages/extension/managed-schema.json` example:**
```json
{
  "$schema": "http://json-schema.org/draft-03/schema#",
  "type": "object",
  "properties": {
    "BackendUrl": {
      "title": "SecureGPT Backend API URL",
      "description": "The enterprise endpoint where audited metadata is securely transmitted.",
      "type": "string"
    },
    "AllowedDomains": {
      "title": "Bypass Domains",
      "description": "List of domains where SecureGPT DLP intercept is bypassed.",
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "DlpStrictness": {
      "title": "DLP Strictness Level",
      "description": "Level of DLP enforcement (low, medium, high).",
      "type": "string",
      "enum": ["low", "medium", "high"]
    }
  }
}
```

### Step 2: Access Policies in Code
In the extension background service worker or content scripts, read configuration from the managed storage namespace. If managed settings exist, they override local or sync settings.

```typescript
// Read enterprise configuration
chrome.storage.managed.get(['BackendUrl', 'AllowedDomains', 'DlpStrictness'], (policy) => {
  if (chrome.runtime.lastError) {
    console.warn("No enterprise policies found. Using default/local configurations.");
    loadLocalSettings();
  } else {
    applyEnterprisePolicies(policy);
  }
});
```

### Step 3: Pushing Managed Configurations
Administrators configure these settings on host systems using the same GPO/plist mechanisms:
* **Windows Registry**: Under `Software\Policies\Google\Chrome\3rdparty\extensions\abcdefghijklmnopqrstuvwxyzabcdef\policy\`
* **macOS plist**: Prefixed with `3rdparty.extensions.abcdefghijklmnopqrstuvwxyzabcdef`
* **Google Admin Console**: The Admin Console automatically generates a configuration UI based on the `managed-schema.json` when the extension is uploaded, allowing settings to be set directly via textboxes and dropdowns.

---

## 3. UI/UX Changes: Locking the User Interface

When settings are managed by an enterprise policy, the Extension Settings/Popup UI must reflect that they are read-only:

1. **Disable Inputs**: Form inputs, checkboxes, and text areas corresponding to managed settings must be set to `disabled`.
2. **Visual Indicators**: Display a lock icon next to managed options.
3. **Banner Message**: Show a prominent message (e.g., *"These settings are managed by your organization's IT department."*) at the top of the configurations page if `chrome.storage.managed` values are active.

---

## 4. Summary of Implementation Checklist

To implement this design fully in future phases, the following tasks will be needed:
1. [ ] Add `"storage"` permission to `packages/extension/manifest.json`.
2. [ ] Define the `managed_schema` in the manifest and create `managed-schema.json`.
3. [ ] Update the settings state manager inside the extension to load, merge, and prioritize `chrome.storage.managed` over `chrome.storage.local`.
4. [ ] Build the locked UI states in settings panels (React components) indicating administrative control.
5. [ ] Author a guide or template files (e.g., ADMX/ADML templates, Registry `.reg` examples, and macOS `.plist` examples) for client IT administrators.
