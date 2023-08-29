import { test as base } from '@playwright/test';

export const test = base.extend({
    page: async ({ page }, use) => {
        page.on('console', msg => {
            const text = msg.text();
            const log = `[Browser] ${msg.text()}`
            const type = msg.type();
            if (
                text.startsWith('[HMR]') || 
                text.includes('[Report Only]') ||
                text.includes('Download the React DevTools')
            ) {
                return; // Ignore noisy, uninformative log messages
            }
            if (type === 'startGroup') {
                console.group(log)
            } else if (type === 'startGroupCollapsed') {
                console.groupCollapsed(log)
            } else if (type === 'endGroup') {
                console.groupEnd()
            } else if (['warning', 'profile', 'profileEnd', 'timeEnd', 'clear'].includes(type)) {
                // no-ops: 
                // Warns are often noise
                // Profile & time are Inspector-only
                // clear would be bad, we don't want to lose logs
            } else {
                // For all other log types, Playwright's exposed event names
                // are identical to those provided by the Node runtime.  We
                // can use the message type to dynamically call the right method
                console[type](log);
            }
        })
        await use(page);
    },
});
