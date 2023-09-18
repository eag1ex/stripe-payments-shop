## ISSUES


## issue
to run Playwright locally we need to manually set `reuseExistingServer: true` 
when we commit code to remote we need to set it back to what it was!!!
https://ray.run/questions/how-do-i-configure-a-web-server-for-playwright-tests-in-an-nx-project


```ts
// before
 webServer: {
    port: 4242,
    reuseExistingServer: !process.env.CI,
    timeout: 5 * 1000,
    command: 'cd ../code/server; sh start.sh'
  },

  //after
  // before
 webServer: {
    port: 4242,
    reuseExistingServer: true,//!process.env.CI,
    timeout: 5 * 1000,
    command: 'cd ../code/server; sh start.sh'
  },
```
