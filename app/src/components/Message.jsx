import React from "react";
import "../styles/components/Message.scss";
import { Avatar } from "./Avatar.jsx";
export class Message extends React.Component {
  render() {
    console.log(this.props.me);
    return (
      <div
        className={
          this.props.me === true
            ? "message-container seft"
            : "message-container mine"
        }
      >
        {this.props.lastMessage === true ? (
          <Avatar lastMessage={this.props.lastMessage} />
        ) : (
          <Avatar />
        )}
        <div className="message">
          <span className="text">
            author: {this.props.message.author} - {this.props.message.text}
          </span>
        </div>
      </div>
    );
  }
}
