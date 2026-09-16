# Sensitive Information Warning

## Purpose
The user is concerned about accidentally leaking sensitive information (e.g., server-side secrets, private keys, passwords, database URIs, or personal credentials).

## Instructions for Agents
1. **Active Monitoring:** Always monitor the user's input, prompts, and uploaded screenshots/files for potentially sensitive information.
2. **Immediate Warning:** If the user sends or reveals any server-side secrets, private keys, passwords, or personal credentials, you MUST immediately warn the user about it in your response.
3. **Contextual Exemption:** Note that Firebase Web API keys (`VITE_FIREBASE_*`) are client-side by design and are NOT considered sensitive server-side secrets. You do not need to warn the user if they share these specific keys.
4. **Correction:** If the user pastes sensitive secrets into client-side code (like React components), warn them immediately and instruct them to move it to a `.env` file or backend service.
