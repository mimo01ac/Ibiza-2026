# Deploy Skill
1. Run `npm run build` and verify zero errors
2. Run `npm run lint` if configured
3. Check that all environment variables are correctly prefixed (NEXT_PUBLIC_ for Next.js client-side, VITE_ for Vite)
4. Verify no relative imports cross serverless function boundaries
5. Git add, commit with descriptive message, and push
6. Confirm Vercel deployment succeeds
