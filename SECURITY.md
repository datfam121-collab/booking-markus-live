# Security and known limitations

Credentials and actual operational rows/state were not retrieved. Credential filenames in source are references only. Stage folders, legacy ZIPs, history/cache/log directories, CGI and ACME infrastructure are excluded. hosting/ contains PHP dependencies and access rules only.

Configuration IDs, private paths and named email literals were sanitized only in the handoff copy; originals are identified by hash. cPanel get_file_content rewrote the HTML charset tag, so index.html was recovered exactly from the public Live HTTP response instead. Other public text assets were compared by hash.

This is source packaging and integrity validation, not a new full security audit. The four previous Planner findings concern a separate candidate and are NOT claimed fixed by this Live snapshot. Review legacy Sheet write authorization, viewer financial redaction, CSV/formula handling and account permissions before independent deployment.

Google OAuth settings and Sheet ownership are external configuration. External/Testing restricts users and may limit token lifetime. No collaborator invitations or public release were performed; repository owner must grant approved recipients access.

Embedded demo contacts/campaigns in app.js seedData were removed in the handoff copy; fresh starter arrays are empty. Live was not changed.
