import messages from "../components/playground/messages";
const messagesDefaultState = [...messages];

export default (state = messagesDefaultState, action) => {
  switch (action.type) {
    case "ADD_MESSAGE":
      return [...state, action.message];
    default:
      return state;
  }
};