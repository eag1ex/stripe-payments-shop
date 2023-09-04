import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Home from "../pages/Home";
import Lessons from "../pages/Lessons";
import AccountUpdate from "../pages/AccountUpdate";
import Layout from "./Layout";
import "../css/normalize.scss";
import "../css/eco-nav.scss";
import { createBrowserHistory } from 'history';


const App = () => {
  const history = createBrowserHistory();

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
          <Routes>
          <Route path="/" element={<Layout history={history} />}>
              <Route path="" element={<Home path="/" />} />
            <Route path="lessons" element={<Lessons path="/lessons" />} />
              <Route exact path="account-update/:id" element={<AccountUpdate path="/lessons" />} />
            </Route>
         

          </Routes>
        </Router>
      </Suspense>
    </React.StrictMode>
  );
};

export default App;
