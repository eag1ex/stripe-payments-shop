import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import RegistrationForm from "../components/RegistrationForm";
import "../css/lessons.scss";
import DocumentTitle from "../components/DocumentTitle";
import { formatSession } from "src/utils";
// import { createBrowserHistory } from 'history';



//Lessons main component

// https://stackoverflow.com/questions/1634748/how-can-i-delete-a-query-string-parameter-in-javascript

const Lessons = (props) => {
  DocumentTitle("Lessons Courses");

  const [sessions, setSessions] = useState([]); //info about available sessions
  const [selected, setSelected] = useState(-1); //index of selected session
  const [details, setDetails] = useState(""); //details about selected session

  //toggle selected session
  const toggleItem = (index) => {
    let items = sessions;
    if (selected !== -1) {
      items[selected].selected = "";
    }
    items[index].selected = "selected";
    setSelected(index);
    setSessions(...[items]);
    setDetails(
      `You have requested a lesson for ${items[index].title} \n Please complete this form to reserve your lesson.`
    );

    console.log('selected is ??', sessions)
  };
  //Load sessions info.
  useEffect(() => {
    let items = [];
    let session = new Date(); 

    /**
     * Refer to {formatSession()} method for setting moment.js timestamp's
     */

    session.setDate(session.getDate());
    items.push(formatSession(0, "zero", session, "9:00 a.m."));

    session.setDate(session.getDate() + 1);
    items.push(formatSession(1, "one", session, "1:00 p.m."));

    session.setDate(session.getDate() + 1);
    items.push(formatSession(2, "two", session, "4:00 p.m."));
    
    session.setDate(session.getDate() + 3);
    items.push(formatSession(3, "three", session, "3:00 p.m."));


    session.setDate(session.getDate() + 9);
    items.push(formatSession(4, "four", session, "3:00 p.m."));

    session.setDate(session.getDate() + 5);
    items.push(formatSession(5, "five", session, "4:00 p.m."));

    session.setDate(session.getDate() + 7);
    items.push(formatSession(6, "six", session, "5:00 p.m."));



    setSessions((prev) => [...prev, ...items]);
  }, []);

  return (
    <main className="main-lessons">
      <Header selected="lessons" />
      {
        //Component to process user info for registration.
      }
      <RegistrationForm
        history={props.history}
        selected={selected}
        details={details}
        session={sessions[selected]}
        onUpdate={(status, data) => {
          if (status === "registration") {
            toggleItem(data.index);
          }
        }}
      />
      <div className="lesson-title" id="title">
        <h2>Guitar lessons</h2>
      </div>
      <div className="lesson-instruction">
        Choose from one of our available lessons to get started.
      </div>
      <div className="lessons-container">
        <div className="lessons-img">
          <img src="/assets/img/lessons.png" alt="" />
        </div>
        <div id="sr-items" className="lessons-cards">
          {sessions.map((session,inx) => (
            <div
              className={`lesson-card ${session.selected}`}
              key={`${session.index +inx}`}
            >
              <div className="lesson-info">
                <h2 className="lesson-date">{session.date}</h2>
                <h4 className="lesson-time">{session.time}</h4>
              </div>
              <button
                className="lesson-book"
                id={session.id}
                onClick={() => toggleItem(session.index)}
              >
                Book now!
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default Lessons;
