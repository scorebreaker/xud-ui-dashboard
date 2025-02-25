import { Button, Grid, Tooltip, Typography } from "@material-ui/core";
import Box from "@material-ui/core/Box";
import Drawer from "@material-ui/core/Drawer";
import List from "@material-ui/core/List";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import AccountBalanceWalletOutlinedIcon from "@material-ui/icons/AccountBalanceWalletOutlined";
import CachedIcon from "@material-ui/icons/Cached";
import HistoryIcon from "@material-ui/icons/History";
import RemoveRedEyeOutlinedIcon from "@material-ui/icons/RemoveRedEyeOutlined";
import SportsEsportsIcon from "@material-ui/icons/SportsEsports";
import React, { ReactElement, useEffect, useState } from "react";
import {
  Redirect,
  Route,
  Switch,
  useHistory,
  useRouteMatch,
} from "react-router-dom";
import { interval } from "rxjs";
import { filter, map, mergeMap, takeUntil } from "rxjs/operators";
import api from "../api";
import { isElectron, sendMessageToParent } from "../common/appUtil";
import NotFound from "../common/NotFound";
import { SetupStatusResponse } from "../models/SetupStatusResponse";
import { Status } from "../models/Status";
import { Path } from "../router/Path";
import Console from "./console/Console";
import MenuItem, { MenuItemProps } from "./menu/MenuItem";
import Overview from "./overview/Overview";
import Tradehistory from "./tradehistory/Tradehistory";
import Wallets from "./wallet/Wallets";

export const drawerWidth = 200;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    drawerPaper: {
      width: drawerWidth,
      justifyContent: "space-between",
    },
    menuContainer: {
      width: "100%",
    },
    header: {
      padding: "16px",
    },
    drawerButton: {
      margin: theme.spacing(2),
    },
    content: {
      marginLeft: drawerWidth,
      backgroundColor: theme.palette.background.default,
      padding: theme.spacing(3),
      height: "100vh",
    },
  })
);

const Dashboard = (): ReactElement => {
  const classes = useStyles();
  const history = useHistory();
  const { path } = useRouteMatch();
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [menuItemTooltipMsg, setMenuItemTooltipMsg] = useState<string[]>([]);

  const menuItems: MenuItemProps[] = [
    {
      path: Path.OVERVIEW,
      text: "Overview",
      component: Overview,
      icon: RemoveRedEyeOutlinedIcon,
      isFallback: true,
    },
    {
      path: Path.WALLETS,
      text: "Wallets",
      component: Wallets,
      icon: AccountBalanceWalletOutlinedIcon,
    },
    {
      path: Path.TRADEHISTORY,
      text: "Tradehistory",
      component: Tradehistory,
      icon: HistoryIcon,
    },
    {
      path: Path.CONSOLE,
      text: "Console",
      component: Console,
      icon: SportsEsportsIcon,
    },
  ];

  const disconnect = (): void => {
    sendMessageToParent("disconnect");
  };

  useEffect(() => {
    const lndsReady$ = interval(5000).pipe(
      mergeMap(() => api.status$()),
      map((statuses: Status[]) => {
        const lndbtc = statuses
          .filter((status: Status) => status.service === "lndbtc")
          .map((status: Status) => status.status)[0];
        const lndltc = statuses
          .filter((status: Status) => status.service === "lndltc")
          .map((status: Status) => status.status)[0];
        return { lndbtc, lndltc };
      }),
      filter(({ lndbtc, lndltc }) => {
        return lndbtc.includes("Ready") && lndltc.includes("Ready");
      })
    );
    const setupStatusSubscription = api
      .setupStatus$()
      .pipe(takeUntil(lndsReady$))
      .subscribe({
        next: (status: SetupStatusResponse | null) => {
          if (status && status.status === "Syncing light clients") {
            setSyncInProgress(true);
            setMenuItemTooltipMsg([
              "Waiting for initial sync...",
              `Bitcoin: ${status.details["lndbtc"]}`,
              `Litecoin: ${status.details["lndltc"]}`,
            ]);
          }
        },
        error: () => {
          history.push(Path.CONNECTION_FAILED);
        },
        complete: () => {
          setSyncInProgress(false);
          setMenuItemTooltipMsg([]);
        },
      });
    return () => setupStatusSubscription.unsubscribe();
  }, [history]);

  return (
    <Box>
      <Drawer
        variant="permanent"
        classes={{
          paper: classes.drawerPaper,
        }}
        anchor="left"
      >
        <Grid container item>
          <Typography
            className={classes.header}
            variant="overline"
            component="p"
            color="textSecondary"
          >
            XUD UI
          </Typography>
          <List className={classes.menuContainer}>
            {menuItems.map((item) => (
              <MenuItem
                path={item.path}
                text={item.text}
                component={item.component}
                key={item.text}
                icon={item.icon}
                isFallback={item.isFallback}
                isDisabled={item.path !== Path.OVERVIEW && syncInProgress}
                tooltipTextRows={menuItemTooltipMsg}
              />
            ))}
          </List>
        </Grid>
        {isElectron() && (
          <Tooltip title="Disconnect from xud-docker">
            <Button
              size="small"
              startIcon={<CachedIcon />}
              variant="outlined"
              className={classes.drawerButton}
              onClick={disconnect}
            >
              Disconnect
            </Button>
          </Tooltip>
        )}
      </Drawer>
      <main className={classes.content}>
        <Switch>
          {menuItems.map((item) => (
            <Route exact path={`${path}${item.path}`} key={item.text}>
              {item.component}
            </Route>
          ))}
          <Route exact path={path}>
            <Redirect to={`${path}${Path.OVERVIEW}`} />
          </Route>
          <Route>
            <NotFound />
          </Route>
        </Switch>
      </main>
    </Box>
  );
};

export default Dashboard;
