# TODO
- [x] Identify cause of deploy failure: pipeline expects `dist/client` but it doesn’t exist.
- [ ] Inspect actual build outputs created by `npm run build` / `vite build`.
- [ ] Fix config/build so `dist/client` is generated (or add step to copy the correct output into `dist/client`).
- [ ] Re-run build and verify `dist/client` exists.
- [ ] Confirm deploy pipeline succeeds.

