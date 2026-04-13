import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  override render() {
    if (this.state.error) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            background: "hsl(222 13% 9%)",
            color: "hsl(210 17% 92%)",
            fontFamily: "ui-monospace, monospace",
            padding: "2rem",
            gap: "1rem",
          }}
        >
          <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>Something went wrong</div>
          <pre
            style={{
              fontSize: "0.75rem",
              color: "hsl(0 72% 65%)",
              background: "hsl(220 12% 11%)",
              padding: "1rem",
              borderRadius: "0.5rem",
              maxWidth: "600px",
              overflow: "auto",
              whiteSpace: "pre-wrap",
            }}
          >
            {this.state.error.message}
            {"\n"}
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
