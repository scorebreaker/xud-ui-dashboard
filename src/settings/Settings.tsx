import {
  createStyles,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  makeStyles,
  Theme,
} from "@material-ui/core";
import React, { ReactElement, useState } from "react";
import {
  NavLink,
  Redirect,
  Route,
  Switch,
  useLocation,
  useRouteMatch,
} from "react-router-dom";
import { Path } from "../router/Path";
import BackupDirectory from "./BackupDirectory";
import ChangePassword from "./ChangePassword";
import Setup from "./Setup";

type MenuItem = {
  text: string;
  path: Path;
  component: ReactElement;
  isDisabled?: boolean;
};

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    wrapper: {
      height: "100%",
      width: "100%",
    },
    content: {
      height: "60%",
      width: "80%",
      maxHeight: "900px",
      maxWidth: "1500px",
      minHeight: "350px",
      minWidth: "600px",
    },
    menu: {
      width: "100%",
    },
    divider: {
      marginRight: theme.spacing(2),
    },
  })
);

const Settings = (): ReactElement => {
  const classes = useStyles();
  const { path, url } = useRouteMatch();
  const { pathname } = useLocation();
  const [initialSetupFinished, setInitialSetupFinished] = useState(true); // TODO

  const menuItems: MenuItem[] = [
    {
      text: "Initial Setup",
      path: Path.INITIAL_SETUP,
      component: <Setup />,
      isDisabled: initialSetupFinished,
    },
    {
      text: "Backup",
      path: Path.BACKUP,
      component: <BackupDirectory />,
      isDisabled: !initialSetupFinished,
    },
    {
      text: "Change Password",
      path: Path.CHANGE_PASSWORD,
      component: <ChangePassword />,
      isDisabled: !initialSetupFinished,
    },
  ];

  return (
    <Grid
      container
      alignItems="center"
      justify="center"
      className={classes.wrapper}
    >
      <Grid item container className={classes.content}>
        <Grid
          item
          container
          direction="column"
          justify="center"
          alignItems="center"
          xs={4}
          lg={3}
        >
          <List className={classes.menu}>
            {menuItems
              .filter((item) => !item.isDisabled)
              .map((item) => {
                const navigateTo = `${url}${item.path}`;
                return (
                  <ListItem
                    key={item.text}
                    button
                    component={NavLink}
                    to={navigateTo}
                    selected={navigateTo === pathname}
                  >
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{ variant: "overline" }}
                    />
                  </ListItem>
                );
              })}
          </List>
        </Grid>
        <Divider orientation="vertical" flexItem className={classes.divider} />
        <Grid
          item
          container
          alignItems="center"
          justify="space-between"
          xs={7}
          lg={8}
        >
          <Switch>
            {menuItems
              .filter((item) => !item.isDisabled)
              .map((item) => {
                return (
                  <Route exact path={`${path}${item.path}`} key={item.text}>
                    {item.component}
                  </Route>
                );
              })}
            <Route exact path={path}>
              <Redirect
                to={`${path}${
                  menuItems.find((item) => !item.isDisabled)?.path
                }`}
              />
            </Route>
          </Switch>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Settings;
