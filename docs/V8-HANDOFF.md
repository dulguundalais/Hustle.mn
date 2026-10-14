# V8 — Neural marketplace redesign

Owner rejected V7 styling and supplied image(4).png palette. Pixel samples: gray #94A3B7, dark #111729, blue #2664EC. Rebuilt marketplace CSS instead of stacking overrides. Centered search-first hero, category navigation, original code-rendered concept previews (not real customer work), responsive cards, navigation and dark/light theme. Existing service URLs, data and workspace remain.

Auth blocker: owner account exists, enabled admin membership; email remains unconfirmed at last SQL check. Logs showed invalid/expired verification tokens and later user reported email send rate limit. Resend UI exists. Added localized rate-limit explanation and request pause. This does not resolve provider delivery. Supabase connector lacks auth config management. Opened URL configuration dashboard through browser; signed-out page shown. Need secure dashboard sign-in to inspect Site URL, exact preview redirect allowlist, confirmation template and SMTP settings. Do not disable email verification or manually mark users verified as a workaround. Do not claim end-to-end login verified.

No production, DNS or paid service changes. Draft PR remains #3; feature/interactive-functional-v6.
