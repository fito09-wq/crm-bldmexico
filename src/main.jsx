import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import PasscodeGate from "./components/PasscodeGate.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PasscodeGate>
      <App />
    </PasscodeGate>
  </React.StrictMode>
);
