import {
  Button,
  createStyles,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  makeStyles,
  OutlinedInput,
  Typography,
} from "@material-ui/core";
import { inject, observer } from "mobx-react";
import CancelIcon from "@material-ui/icons/Cancel";
import React, { ReactElement, useEffect, useState } from "react";
import { Subject } from "rxjs";
import { isElectron, sendMessageToParent } from "../common/appUtil";
import ErrorMessage from "../common/ErrorMessage";
import SuccessMessage from "../common/SuccessMessage";
import { ElectronStore, ELECTRON_STORE } from "../stores/electronStore";
import ActionButtons from "./ActionButtons";
import { ConnectionType } from "../enums";

type BackupDirectoryProps = {
  onCompleteSubject?: Subject<boolean>;
  electronStore?: ElectronStore;
};

const useStyles = makeStyles(() =>
  createStyles({
    input: {
      minWidth: 270,
    },
    messageContainer: {
      minHeight: 50,
    },
  })
);

const BackupDirectory = inject(ELECTRON_STORE)(
  observer(
    (props: BackupDirectoryProps): ReactElement => {
      const classes = useStyles();
      const { onCompleteSubject, electronStore } = props;
      const [error, setError] = useState("");
      const [queryInProgress, setQueryInProgress] = useState(false);
      const [backupDirectory, setBackupDirectory] = useState("");
      const [initialBackupDirectory, setInitialBackupDirectory] = useState(""); // TODO
      const [success, setSuccess] = useState(false);

      const saveBackupDir = (): void => {
        setError("");
        setSuccess(false);
        setQueryInProgress(true);
        onCompleteSubject?.next(true);
        // TODO: add api call
      };

      useEffect(() => {
        const messageListenerHandler = (event: MessageEvent) => {
          if (event.data.startsWith("chooseDirectory")) {
            setBackupDirectory(event.data.substr(event.data.indexOf(":") + 2));
          }
        };
        window.addEventListener("message", messageListenerHandler);
        return () =>
          window.removeEventListener("message", messageListenerHandler);
      }, []);

      const isLocalConnection =
        isElectron() && electronStore!.connectionType === ConnectionType.LOCAL;

      return (
        <>
          <Grid item container alignItems="center" justify="center">
            <Typography variant="body1" align="center">
              {isLocalConnection ? "Choose" : "Insert"} a backup directory to
              store files, which can be used alongside the mnemonic words to
              recover your XUD node
            </Typography>
          </Grid>
          <Grid item container alignItems="center" justify="center">
            {isLocalConnection ? (
              !backupDirectory ? (
                <Button
                  disableElevation
                  color="secondary"
                  variant="outlined"
                  onClick={() => sendMessageToParent("chooseDirectory")}
                >
                  Choose
                </Button>
              ) : (
                <Grid
                  item
                  container
                  justify="center"
                  alignItems="center"
                  spacing={1}
                  wrap="nowrap"
                >
                  <Grid item>
                    <Typography>{backupDirectory}</Typography>
                  </Grid>
                  <Grid item>
                    <IconButton onClick={() => setBackupDirectory("")}>
                      <CancelIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              )
            ) : (
              <FormControl variant="outlined">
                <OutlinedInput
                  className={classes.input}
                  id="backup-input"
                  value={backupDirectory || ""}
                  onChange={(event) => {
                    setBackupDirectory(event.target.value);
                  }}
                  endAdornment={
                    !!backupDirectory && (
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          onClick={() => setBackupDirectory("")}
                        >
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                />
              </FormControl>
            )}
          </Grid>
          <Grid
            item
            container
            justify="center"
            className={classes.messageContainer}
          >
            {!!error && (
              <ErrorMessage
                mainMessage="Failed to set the backup directory"
                details={error}
              />
            )}
            {success && <SuccessMessage message="Backup directory updated" />}
          </Grid>
          <ActionButtons
            primaryButtonOnClick={saveBackupDir}
            primaryButtonDisabled={!backupDirectory || queryInProgress}
            primaryButtonLoading={queryInProgress}
            secondaryButtonOnClick={() =>
              setBackupDirectory(initialBackupDirectory)
            }
            secondaryButtonDisabled={queryInProgress}
            hideSecondaryButton={!initialBackupDirectory}
          />
        </>
      );
    }
  )
);

export default BackupDirectory;
