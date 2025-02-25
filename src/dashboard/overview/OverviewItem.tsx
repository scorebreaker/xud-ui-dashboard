import {
  Button,
  createStyles,
  Divider,
  Icon,
  IconButton,
  makeStyles,
  Snackbar,
  SnackbarContent,
  Theme,
  Tooltip,
} from "@material-ui/core";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import CloseIcon from "@material-ui/icons/Close";
import GetAppOutlinedIcon from "@material-ui/icons/GetAppOutlined";
import React, { ReactElement, useState } from "react";
import api from "../../api";
import { formatDateTimeForFilename } from "../../common/dateUtil";
import { isServiceReady } from "../../common/serviceUtil";
import { SERVICES_WITH_ADDITIONAL_INFO } from "../../constants";
import { Status } from "../../models/Status";
import ServiceDetails from "./ServiceDetails";

export type OverviewItemProps = {
  status: Status;
  xudLocked?: boolean;
  xudNotReady?: boolean;
};

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    cardHeader: {
      padding: theme.spacing(3),
    },
    cardContent: {
      padding: 0,
      "&:last-child": {
        paddingBottom: 0,
      },
    },
    cardCell: {
      padding: theme.spacing(4),
      textAlign: "center",
    },
    statusDot: {
      height: 10,
      width: 10,
      borderRadius: "50%",
      display: "inline-block",
      marginRight: 10,
    },
    active: {
      backgroundColor: theme.palette.success.light,
    },
    inactive: {
      backgroundColor: theme.palette.error.light,
    },
    snackbar: {
      bottom: theme.spacing(3) * 2,
      right: theme.spacing(3) * 2,
    },
    snackbarMessage: {
      backgroundColor: theme.palette.error.main,
      color: theme.palette.error.contrastText,
    },
  })
);

const downloadLogs = (serviceName: string, handleError: () => void): void => {
  api.logs$(serviceName).subscribe({
    next: (resp: string) => {
      const blob = new Blob([resp]);
      const url = URL.createObjectURL(blob);
      const anchor = Object.assign(document.createElement("a"), {
        href: url,
        download: `${serviceName}_${formatDateTimeForFilename(new Date())}.log`,
        style: { display: "none" },
      });
      anchor.click();
    },
    error: handleError,
  });
};

const OverviewItem = (props: OverviewItemProps): ReactElement => {
  const { status, xudLocked, xudNotReady } = props;
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [errorMsgOpen, setErrorMsgOpen] = useState(false);
  const classes = useStyles();

  const statusDotClass = `${classes.statusDot} ${
    isServiceReady(status) ? classes.active : classes.inactive
  }`;

  const isDetailsIconVisible = (status: Status): boolean => {
    return (
      !xudLocked &&
      !xudNotReady &&
      SERVICES_WITH_ADDITIONAL_INFO.includes(status.service) &&
      isServiceReady(status)
    );
  };

  const isDownloadLogsEnabled = (status: Status): boolean => {
    return (
      !status.status.includes("light mode") && status.status !== "Disabled"
    );
  };

  return (
    <Grid item xs={12} md={6} xl={4}>
      <Card>
        <Grid
          container
          justify="space-between"
          alignItems="center"
          wrap="nowrap"
          className={classes.cardHeader}
        >
          <Grid container item>
            {isDetailsIconVisible(status) && (
              <Tooltip title="details">
                <IconButton size="small" onClick={() => setDetailsOpen(true)}>
                  <Icon fontSize="small">open_in_full</Icon>
                </IconButton>
              </Tooltip>
            )}
          </Grid>
          <Grid
            container
            item
            alignItems="center"
            justify="center"
            wrap="nowrap"
          >
            <span className={statusDotClass}></span>
            <Typography component="span" variant="body1" noWrap>
              {props.status.service} info
            </Typography>
          </Grid>
          <Grid container item justify="flex-end">
            {isDownloadLogsEnabled(status) && (
              <Tooltip title="Download logs">
                <Button
                  size="small"
                  startIcon={<GetAppOutlinedIcon fontSize="small" />}
                  onClick={() =>
                    downloadLogs(status.service, () => setErrorMsgOpen(true))
                  }
                >
                  Logs
                </Button>
              </Tooltip>
            )}
          </Grid>
        </Grid>
        <Divider />
        <CardContent className={classes.cardContent}>
          <Grid container item>
            <Grid item xs={4} className={classes.cardCell}>
              Status
            </Grid>
            <Divider orientation="vertical" flexItem />
            <Grid item xs={7} className={classes.cardCell}>
              {props.status.status}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {detailsOpen && (
        <ServiceDetails
          status={status}
          handleClose={() => setDetailsOpen(false)}
        />
      )}

      <Snackbar
        className={classes.snackbar}
        open={errorMsgOpen}
        autoHideDuration={10000}
        onClose={() => setErrorMsgOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <SnackbarContent
          className={classes.snackbarMessage}
          message={`Could not download the logs for ${status.service}`}
          action={
            <IconButton onClick={() => setErrorMsgOpen(false)}>
              <CloseIcon />
            </IconButton>
          }
        />
      </Snackbar>
    </Grid>
  );
};

export default OverviewItem;
