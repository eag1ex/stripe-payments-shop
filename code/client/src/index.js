import React from "react";
import ReactDOM from "react-dom";
import App from "./components/App";
import "./i18n";
import * as serviceWorker from "./serviceWorker";
import ErrorBoundary from "./components/ErrorBoundary";


(async () => {
  ReactDOM.render(
    <ErrorBoundary>
        <App />
    </ErrorBoundary>,
    document.getElementById("root")
  );

  // If you want your app to work offline and load faster, you can change
  // unregister() to register() below. Note this comes with some pitfalls.
  // Learn more about service workers: https://bit.ly/CRA-PWA
  serviceWorker.unregister();
})();