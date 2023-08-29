import React, { Suspense } from "react";
import { Router } from "@reach/router";

import Home from "../pages/Home";
import Lessons from "../pages/Lessons";
import AccountUpdate from "../pages/AccountUpdate";

import "../css/normalize.scss";
import "../css/eco-nav.scss";

const App = () => {
  return (
    <React.StrictMode>
      <Suspense fallback="loading">
        {
          // Routes for principal UI sections.
          // Concert Tickets Challenge: /concert
          // Online Video Purchase: /video
          // Online Lessons: /lessons
        }
        <Router>
          <Home path="/" />
          <Lessons path="/lessons" />
          <AccountUpdate path="/account-update/:id" />
        </Router>
      </Suspense>
    </React.StrictMode>
  );
};

export default App;
