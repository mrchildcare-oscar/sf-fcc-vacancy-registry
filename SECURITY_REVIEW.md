# Security Review Report

**Date:** 2026-02-04
**Scope:** Recent changes including random ordering, vacancy stats, eligibility screener, parent inquiry form
**Reviewer:** Automated Security Analysis

---

## Executive Summary

The reviewed code is a **childcare vacancy registry application** for San Francisco family childcare providers. The recent changes focus on:
- User-specific daily random ordering of listings
- Vacancy statistics display
- ELFA eligibility screening
- Parent inquiry form functionality

**Overall Assessment:** Low to Moderate Risk
No critical vulnerabilities identified. Several low-severity items noted for awareness.

---

## Findings

### 1. LocalStorage for Anonymous User ID

**File:** `src/lib/randomOrder.ts:9-17`
**Severity:** Low
**Confidence:** 9/10

**Description:**
The `getAnonymousUserId()` function stores a UUID in localStorage to provide consistent daily ordering for users.

```typescript
function getAnonymousUserId(): string {
  const key = 'fcc_user_id';
  let userId = localStorage.getItem(key);
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem(key, userId);
  }
  return userId;
}
```

**Risk Assessment:**
- This is **not sensitive data** - it's only used for shuffling listings
- Uses `crypto.randomUUID()` which is cryptographically secure
- No PII is stored, just a random identifier
- If cleared, user simply gets a new random order

**Recommendation:** No action needed. This is an appropriate use of localStorage for non-sensitive state.

---

### 2. Parent Info Stored in LocalStorage

**File:** `src/components/registry/ParentInquiryForm.tsx:16-28`
**Severity:** Low
**Confidence:** 8/10

**Description:**
Parent contact information (name, email, phone) is cached in localStorage for form auto-fill convenience.

```typescript
function saveParentInfo(info: SavedParentInfo) {
  try {
    localStorage.setItem(PARENT_INFO_KEY, JSON.stringify(info));
  } catch {}
}
```

**Risk Assessment:**
- PII is stored in localStorage (name, email, optional phone)
- Data persists until manually cleared
- Accessible to any JavaScript on the same origin
- Standard practice for form convenience features

**Recommendation:** Consider adding a UI option for users to clear saved data. Document in privacy policy.

---

### 3. Honeypot Anti-Bot Implementation

**File:** `src/components/registry/ParentInquiryForm.tsx:48, 104-108, 287-296`
**Severity:** Informational
**Confidence:** 10/10

**Description:**
The inquiry form uses a honeypot field to catch bots. If filled, the form silently "succeeds" without submitting.

```typescript
// Honeypot check - if filled, silently "succeed" (bot trap)
if (honeypot) {
  setSubmitted(true);
  return;
}
```

**Assessment:** This is a **good security practice** that helps prevent spam without impacting legitimate users. The implementation is correct:
- Hidden with CSS positioning (not display:none which bots detect)
- Has generic name "website" that bots tend to fill
- Uses `aria-hidden="true"` for accessibility
- Silently accepts to avoid revealing the trap

---

### 4. URL Blocking in Message Field

**File:** `src/components/registry/ParentInquiryForm.tsx:95-98, 124-127`
**Severity:** Informational
**Confidence:** 10/10

**Description:**
Messages are checked for URLs before submission to prevent spam/phishing links.

```typescript
function containsUrl(text: string): boolean {
  const urlPattern = /https?:\/\/|www\.|\.com|\.org|\.net|\.io|\.co\//i;
  return urlPattern.test(text);
}
```

**Assessment:** Good spam prevention measure. Pattern catches common URL forms. May occasionally block legitimate mentions like "I found you on google.com" but this is acceptable tradeoff for spam prevention.

---

### 5. JSON Parsing of Languages Array

**File:** `src/components/registry/PublicListings.tsx:78-81, 98-101`
**Severity:** Low
**Confidence:** 7/10

**Description:**
The code handles languages as either an array or a JSON string:

```typescript
const langs = Array.isArray(listing.languages)
  ? listing.languages
  : JSON.parse(listing.languages as unknown as string);
```

**Risk Assessment:**
- `JSON.parse` can throw if the string is malformed
- Data comes from database, not user input, so risk is minimal
- If this throws, it would crash the filter loop

**Recommendation:** Consider wrapping in try-catch or validating before parse:
```typescript
try {
  const langs = Array.isArray(listing.languages)
    ? listing.languages
    : JSON.parse(listing.languages as string);
} catch {
  return true; // Or handle gracefully
}
```

---

### 6. External Website Link Handling

**File:** `src/components/registry/PublicListings.tsx:547-557, 719-730`
**Severity:** Low
**Confidence:** 9/10

**Description:**
External website links are properly handled with security attributes:

```typescript
<a
  href={listing.website.startsWith('http') ? listing.website : `https://${listing.website}`}
  target="_blank"
  rel="noopener noreferrer"
  ...
>
```

**Assessment:** Correct implementation:
- `target="_blank"` opens in new tab
- `rel="noopener noreferrer"` prevents tab-nabbing attacks
- Automatically adds `https://` if not present

---

### 7. Admin Password in Code

**File:** `src/lib/supabase.ts:239`
**Severity:** Moderate
**Confidence:** 10/10

**Description:**
A hardcoded password is used for the admin ELFA refresh function:

```typescript
const { data, error } = await supabase.functions.invoke('refresh-elfa', {
  body: { admin_password: 'fccasf2024' },
});
```

**Risk Assessment:**
- Password is visible in client-side code
- Anyone can see this by viewing page source
- However, the edge function should verify admin status server-side as well
- This appears to be an additional check, not the only authentication

**Recommendation:** Remove hardcoded password. Use Supabase auth session to verify admin status in the edge function instead. If the edge function requires additional authentication, implement it using environment variables or JWT claims.

---

### 8. Input Validation on Inquiry Form

**File:** `src/components/registry/ParentInquiryForm.tsx:110-127`
**Severity:** Informational
**Confidence:** 10/10

**Description:**
Client-side validation is present but basic:

```typescript
if (!formData.parent_name.trim()) { ... }
if (!formData.parent_email.trim() || !formData.parent_email.includes('@')) { ... }
if (!formData.message.trim()) { ... }
```

**Assessment:**
- Email validation is minimal (just checks for @)
- Server-side validation should also be implemented
- The RPC function `submit_parent_inquiry` should validate inputs

**Recommendation:** Ensure server-side (Supabase RPC function) also validates:
- Email format
- Input length limits
- Sanitization for SQL/XSS

---

### 9. Seeded Random Algorithm

**File:** `src/lib/randomOrder.ts:35-56`
**Severity:** Informational
**Confidence:** 10/10

**Description:**
Uses mulberry32 PRNG with Fisher-Yates shuffle for deterministic ordering.

**Assessment:** This is an appropriate algorithm choice:
- mulberry32 is fast and provides good distribution
- Fisher-Yates shuffle is the standard unbiased shuffle
- Seed from user ID + date provides daily rotation with user-specific ordering
- This is NOT used for any security-sensitive purpose (just display order)

---

### 10. Rate Limiting via Database Function

**File:** `src/lib/supabase.ts:401-418`
**Severity:** Informational
**Confidence:** 10/10

**Description:**
The inquiry submission uses a database RPC function that includes rate limiting:

```typescript
const { data: result, error: rpcError } = await supabase.rpc('submit_parent_inquiry', {...});

if (result?.error === 'rate_limited') {
  return { error: 'You have already sent an inquiry to this provider recently...' };
}
```

**Assessment:** Good practice - rate limiting is implemented server-side where it cannot be bypassed. The 24-hour limit per provider prevents spam abuse.

---

## Summary Table

| Finding | Severity | Action Required |
|---------|----------|-----------------|
| 1. Anonymous user ID in localStorage | Low | None |
| 2. Parent info in localStorage | Low | Consider clear option |
| 3. Honeypot implementation | Info | None (good practice) |
| 4. URL blocking in messages | Info | None (good practice) |
| 5. JSON.parse without try-catch | Low | Add error handling |
| 6. External link handling | Low | None (correct impl) |
| 7. Hardcoded admin password | Moderate | Remove/refactor |
| 8. Basic email validation | Info | Verify server-side |
| 9. Seeded random algorithm | Info | None (appropriate) |
| 10. Rate limiting | Info | None (good practice) |

---

## Recommendations Priority

1. **High Priority:** Remove hardcoded admin password from client code
2. **Medium Priority:** Add try-catch around JSON.parse for languages
3. **Low Priority:** Add UI option to clear saved parent info
4. **Low Priority:** Document localStorage usage in privacy policy

---

## Not Vulnerabilities (False Positives Filtered)

The following were considered but determined to NOT be security issues:

- **localStorage usage for random seed**: Not sensitive, no PII, appropriate use
- **Displaying provider phone numbers**: These are intentionally public contact info
- **License numbers in URLs/embeds**: Public information for childcare verification
- **Date-based seed rotation**: Not security-relevant, just UX feature

---

*Report generated by security review analysis*
