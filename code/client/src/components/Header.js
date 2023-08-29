import React from "react";
import EcoNav from "./EcoNavigation";

const Header = ({ selected }) => {
  const home = selected === "home";
  const lessons = selected === "lessons";

  return (
    <div className="header">
      <EcoNav
        links={[
          { name: "Home", url: "/", selected: home },
          { name: "Lessons Courses", url: "/lessons", selected: lessons },
        ]}
      />
    </div>
  );
};

export default Header;
