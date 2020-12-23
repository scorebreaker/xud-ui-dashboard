import { createStyles, WithStyles } from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import { withStyles } from "@material-ui/core/styles";
import React, { ReactElement } from "react";
import { RouteComponentProps, withRouter } from "react-router-dom";
import PageCircularProgress from "../../common/PageCircularProgress";
import DashboardContent, { DashboardContentState } from "../DashboardContent";
import ViewDisabled from "../ViewDisabled";

type PropsType = RouteComponentProps<{ param1: string }> &
  WithStyles<typeof styles>;

type StateType = DashboardContentState & {
  pairs: any | undefined;
};

const styles = () => {
  return createStyles({
    itemsContainer: {
      paddingBottom: "45px",
    },
  });
};

class Trade extends DashboardContent<PropsType, StateType> {
  constructor(props: PropsType) {
    super(props);
    this.state = { pairs: undefined };
  }

  render(): ReactElement {
    const pairs = this.state.pairs;
    // const { classes } = this.props;

    return (
      <>
        {this.state.xudLocked || this.state.xudNotReady ? (
          <ViewDisabled
            xudLocked={this.state.xudLocked}
            xudStatus={this.state.xudStatus}
          />
        ) : (
          <Grid container>
            {pairs ? (
              <div>content</div>
            ) : this.state.initialLoadCompleted ? (
              <Grid item container justify="center">
                No trading pairs found
              </Grid>
            ) : (
              <PageCircularProgress />
            )}
          </Grid>
        )}
      </>
    );
  }
}

export default withRouter(withStyles(styles, { withTheme: true })(Trade));
