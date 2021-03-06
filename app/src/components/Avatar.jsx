import React from "react";
import ReactDOM from "react-dom";

import "../styles/components/Avatar.scss";
import avatar from "../../public/assets/people.png";

export class Avatar extends React.Component {
  render() {
    return (
      <div className="avatar-container">
        <img
          className="avatar"
          src={this.props.urlAvatar || avatar}
          alt="avatar"
        />
      </div>
    );
  }
}
