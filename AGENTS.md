# Documentation rules

After every code change:
- Check whether existing documentation needs updating before completing the task.
- Update affected docs when behavior, APIs, auth, configuration, database,
  storage, or setup changes. Keep documentation consistent with the final code.
- Reuse existing documentation; avoid duplicate documents and unnecessary edits.
- Clearly separate implemented and planned features.
- Never include secrets, tokens, or real credentials.
- Verify links and commands in updated documentation. Report any commands that
  could not be verified; do not claim they were tested.
- In the final response, mention which docs changed. If documentation needs no
  changes, briefly explain why.

Start with README.md for the documentation index. Update the relevant existing
guide in docs/ and update the index if documentation is added or moved.

# Frontend maintenance rules

- Before editing an existing feature, read its relevant docs and inspect nearby
  code and shared components. Preserve working behavior and API contracts. When
  docs disagree with verified code, correct the docs as part of the change.
- Put new or changed user-facing labels, placeholders, validation messages and
  accessibility text in src/appDefaults/localStrings.ts. Use getStrings() on
  the server or useStrings() in client components. Reuse existing keys where the
  meaning matches. Keys must be unique across groups because the resolver
  flattens them. Keep dynamic user content and API status identifiers separate
  from translated display text.
- Put shared product settings and UI feature switches in
  src/appDefaults/localAppSettings.ts. Read them through getAppSettings() or
  useAppSettings(), rather than importing defaults directly into feature code.
  Reuse an existing setting instead of adding a duplicate. Keep deployment
  values in environment configuration and secrets on the server. UI limits and
  flags are not substitutes for backend authorization or usage enforcement.
- Reuse src/components/ui/ and existing dashboard/shell visual conventions.
  Check component variants before duplicating button, card, input or select
  styles. Extend a shared variant when needed without changing other consumers
  unexpectedly. Keep feature layout classes local; put genuinely shared styles
  in the existing global stylesheet or Tailwind theme. Do not create a second
  theme/config system or assume an admin theme integration already exists.
- When changing existing code, replace relevant hardcoded copy/settings and
  duplicated shared styling in the affected code using the patterns above.
  Migrate only the requested page's affected code when that page is changed;
  do not proactively migrate other pages. Shared files may be updated as needed
  to support that page, while preserving other consumers. Avoid unrelated
  whole-project migrations. Report remaining relevant gaps.
- Reuse the API clients in src/app/api/, shared error handling and existing auth
  refresh flow. Do not scatter backend URLs or token handling in components.
- Preserve loading, empty, error, disabled and success states, accessible labels,
  keyboard focus and mobile/desktop layout. Preserve the existing scroll owner
  in bounded editors. Verify with checks appropriate to the actual change.

See docs/frontend-guide.md for current implementation details and known gaps.

# Responsive UI requirement

- Every new or changed UI must work on mobile as well as desktop. Check a narrow
  phone viewport (around 360–393px), tablet and desktop widths before completion.
- Prevent page-level horizontal overflow, clipped text/actions and overlapping
  controls. Stack or wrap layouts and make forms, navigation and dialogs usable
  by touch and keyboard. Wide data tables may scroll within their own container.
- Keep intentional editor scroll ownership; do not hide overflow to conceal
  inaccessible content. Report any viewport checks that could not be performed.
