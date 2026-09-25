# Security and privacy

Please report security issues privately through the repository owner's GitHub security contact rather than a public issue.

OneBoard Privacy Guard intentionally has no telemetry or crash-upload integration. The production Content Security Policy denies arbitrary network connections and permits only the pinned model hosts required by DocCloak.Core. Sensitive session content is held in memory and is not written to application logs or persistent storage by the application.

Clearing a session removes current application references to input, output, detections, OCR data, temporary file data, and mappings. It does not claim cryptographic erasure from RAM or operating-system-managed memory.
