import React from "react";
import Header from "../components/Header";
import SRECard from "../components/SRECard";
import "../css/global.scss";
//Show home page
const Home = () => {
  return (
    <main className="main-global">
      <Header selected="home" />

      <div className="home-body">
        <div className="about">
        <h2>Ipsum Music School is dedicated to providing high-quality music
        lessons to students of all ages and skill levels.</h2>
        <p>Our mission is to foster a love of music in our students and help them
        develop their talents to the fullest extent. </p>
        <p>We offer a wide range of
        music lessons, including piano, guitar, and vocal lessons, taught by
        experienced and passionate instructors. Our focus on personalized
        instruction and small class sizes ensures that each student receives
        the individualized attention they need to thrive in their musical
        journey. </p>
        <p>Whether you're a beginner looking to try out a new instrument
        or an experienced musician looking to improve your skills, Ipsum Music
        School has something to offer you.</p>
        </div>
        <div id="sr-items" className="items">
          <SRECard
            id="lessons"
            title="Music Lessons"
            desc="Build an off-session integration using the Setup Intents API and
        Stripe Elements"
            img="/assets/img/LessonsHome.png"
            route="/lessons"
          />
        </div>
      </div>
    </main>
  );
};

export default Home;
