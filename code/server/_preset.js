// 

if (process.env.ENV === 'TEST' || process.env.ENV === 'PROD') {


    console.log('environment: ', process.env.ENV);
    console.log('Logs disabled!');
    // NOTE this will disable standard logging in production, console.error will still show.
    console.log = () => { };
    console.warn = () => { };
} 