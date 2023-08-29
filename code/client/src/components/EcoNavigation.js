import React from "react";
import { Link } from "@reach/router";
//Show Nav Menu
const EcoNav = ({ links }) => {
  return (
    <nav>
      <div className="logo">
        <img src="/assets/img/logo_only.svg" alt="Ipsum Music Store" />
      </div>
      <ul className={`eco-navigation`}>
        {links.map((link) => (
          <li key={link.name.replace(" ", "")}>
            {link.selected ? (
              <Link to={link.url} className="current">
                {link.name}
              </Link>
            ) : (
              <Link to={link.url}>{link.name}</Link>
            )}
          </li>
        ))}
      </ul>
        <div className="logo-title">
        <img src="/assets/img/logo_name.svg" alt="Ipsum Music Store" />
        </div>
    </nav>
  );
};

export default EcoNav;
