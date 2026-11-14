# Advertisement campaign operation

## Current campaign
- Public applications use a server-owned `AD_FREE_TRIAL_ENABLED` switch (enabled unless explicitly `false`).
- Free trial: one account, one owned public post, seven days after manual approval. No automatic approval, extension or automatic billing.
- The server forces `week`; normal admin approval cannot change a free trial to a month. Re-approving an already active/ended row does not restart the period.
- Existing `ads.creative` JSON stores the server-owned `freeTrial` marker. Existing `hero_ads.memo` stores a `[FREE7:postId]` prefix, decoded before displaying the memo. No new DB migration is required for this release; existing creative support (0007) is required.
- Requests and manual approvals check both ad types. Concurrent duplicate applications may be received, but only the earliest existing trial is eligible for approval.
- Rejecting/stopping a free application retains its row as ended. Paid rows retain existing deletion behavior.

## Limits of the existing-schema phase
This is not a database uniqueness guarantee. Direct DB deletion, deleting a post whose normal ads cascade, queries exceeding the datastore result limits, or external tools modifying records can remove eligibility evidence. Administrators should review the user/post history before approving. A strict permanent ledger with transactional uniqueness is a separate schema change. `docs/proposals/free-ad-trial-strict-schema.sql` is a draft only, not a migration to execute or deploy automatically; its column-based API needs a coordinated code migration first.

## Returning to paid applications
Before ending the promotion, reconfirm the existing published price table and payment instructions. An authorized operator may set server variable `AD_FREE_TRIAL_ENABLED=false`, then verify the home placeholders, advertisement form, submitted plan, payment instructions and admin row. Do not change prices or enable paid mode without the owner’s instruction.
- Stored free markers remain free after the switch, including seven-day/no-extension terms.
- New paid applications use the pre-existing price tables, period selection and deposit/manual-approval flow.
- No existing trial is automatically charged or converted.
- No production payment was performed during this change.

## Hero slots
- Total maximum: 10, including the optional one Infl09 slide.
- Original seven default slides plus the new orange advertisement-application slide: eight defaults.
- With Infl09, one customer ad fits without removing defaults. Additional customer ads replace defaults one at a time. Maximum customer ads: nine with Infl09, ten without.
- Expired ads are removed on the next server page render; default slides fill available space again. The frontend clamps the rendered total even if external records exceed the approval limit.
- Approval still requires human review; the read/check/update capacity check is not a transactional database capacity lock in this phase.

## Verification
TypeScript, affected-file ESLint, React SSR free/paid form tests, hero capacity/expiration tests, production webpack build. Browser pixel verification is blocked in the current cloud execution sandbox (`socket() Operation not permitted`). No test submitted a production ad.
