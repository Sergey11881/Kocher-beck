# Replit Expo runtime

The mobile Expo runtime must be started by the Replit project workflow.

Do not permanently run:

    pnpm exec expo start --port 8081

or:

    pnpm exec expo start --port 8082

from a detached Shell process.

The runtime must receive PORT from Replit.

The helper script is:

    scripts/replit-expo-start.sh

It starts Expo on:

    0.0.0.0:$PORT

and does not hard-code a LAN IP.
