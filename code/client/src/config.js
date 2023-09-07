// 

if (process.env.REACT_APP_ENV === 'TEST' || process.env.REACT_APP_ENV === 'PROD' ) {

    console.log('%c----------', 'color:blue');
    console.log('%c-------', 'color:blue');
    console.log('%c-----', 'color:blue');
    console.log('%c---', 'color:blue');
    console.log('environment: ', process.env.REACT_APP_ENV);
    console.log('Logs disabled!');
    // NOTE this will disable standard logging in production, console.error will still show.
    console.log = () => { };
    console.warn = () => { };
} 