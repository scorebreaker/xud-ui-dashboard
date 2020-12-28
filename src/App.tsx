import CssBaseline from "@material-ui/core/CssBaseline";
import { createMuiTheme, Theme, withStyles } from "@material-ui/core/styles";
import { ThemeProvider } from "@material-ui/styles";
import React, { ReactElement, useEffect } from "react";
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  Switch,
} from "react-router-dom";
import ConnectionFailed from "./common/ConnectionFailed";
import NotFound from "./common/NotFound";
import Dashboard from "./dashboard/Dashboard";
import { Path } from "./router/Path";
import { useElectronStore } from "./stores/electronStore";
import { Provider } from "mobx-react";
import { isElectron, sendMessageToParent } from "./common/appUtil";

const darkTheme = createMuiTheme({
  palette: {
    type: "dark",
  },
});

const GlobalCss = withStyles((theme: Theme) => {
  return {
    "@global": {
      "::-webkit-scrollbar": {
        width: 8,
      },
      "::-webkit-scrollbar-track": {
        background: theme.palette.background.default,
      },
      "::-webkit-scrollbar-thumb": {
        borderRadius: "4px",
        background: theme.palette.background.paper,
      },
      "::-webkit-scrollbar-thumb:hover": {
        background: theme.palette.grey[700],
      },
      "::-webkit-scrollbar-corner": {
        backgroundColor: "transparent",
      },
    },
  };
})(() => null);

const electronStore = useElectronStore({});

function App(): ReactElement {
  useEffect(() => {
    if (!isElectron()) {
      return;
    }
    sendMessageToParent("getConnectionType");
    const messageListenerHandler = (event: MessageEvent) => {
      if (event.data.startsWith("connectionType")) {
        electronStore.setConnectionType(
          event.data.substr(event.data.indexOf(":") + 2)
        );
      }
    };
    window.addEventListener("message", messageListenerHandler);
    return () => window.removeEventListener("message", messageListenerHandler);
  }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <GlobalCss />
      <Provider electronStore={electronStore}>
        <Router>
          <Switch>
            <Route path={Path.CONNECTION_FAILED}>
              <ConnectionFailed />
            </Route>
            <Route path={Path.DASHBOARD}>
              <Dashboard />
            </Route>
            <Route exact path={Path.HOME}>
              <Redirect to={Path.DASHBOARD} />
            </Route>
            <Route>
              <NotFound />
            </Route>
          </Switch>
        </Router>
      </Provider>
    </ThemeProvider>
  );
}

export default App;
