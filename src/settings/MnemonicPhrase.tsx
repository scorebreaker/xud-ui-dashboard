import {
  Checkbox,
  CircularProgress,
  createStyles,
  FormControlLabel,
  Grid,
  makeStyles,
  Theme,
  Typography,
} from "@material-ui/core";
import React, { ReactElement, useEffect, useState } from "react";
import { Subject } from "rxjs";
import api from "../api";
import { getErrorMsg } from "../common/errorUtil";
import ActionButtons from "./ActionButtons";

type MnemonicPhraseProps = {
  onCompleteSubject: Subject<boolean>;
};

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    mnemonicList: {
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      alignItems: "center",
      paddingLeft: theme.spacing(8),
    },
    mnemonicItem: {
      margin: theme.spacing(1),
      flexBasis: "21%",
    },
  })
);

const MnemonicPhrase = (props: MnemonicPhraseProps): ReactElement => {
  const { onCompleteSubject } = props;
  const classes = useStyles();
  const [error, setError] = useState("");
  const [checked, setChecked] = useState(false);
  const [mnemonic, setMnemonic] = useState<string[]>([]);

  useEffect(() => {
    api.getMnemonic$().subscribe({
      next: (resp) => setMnemonic(resp.seed_mnemonic),
      error: (err) => setError(getErrorMsg(err)),
    });
  }, []);

  return (
    <>
      {error ? (
        <Grid item container justify="center" alignItems="center">
          <Typography variant="body1" color="error" align="center">
            Failed to fetch the mnemonic phrase
          </Typography>
          <Typography variant="body2" color="textSecondary" align="center">
            {error}
          </Typography>
        </Grid>
      ) : mnemonic.length ? (
        <>
          <ol className={classes.mnemonicList}>
            {mnemonic.map((word, i) => (
              <li key={i} className={classes.mnemonicItem}>
                {word}
              </li>
            ))}
          </ol>
          <Grid item container justify="center">
            <FormControlLabel
              control={
                <Checkbox
                  checked={checked}
                  onChange={() =>
                    setChecked((previousChecked) => !previousChecked)
                  }
                  name="checked"
                />
              }
              label="I understand that I will not be able to recover my funds if I lose this data"
            />
          </Grid>

          <ActionButtons
            primaryButtonOnClick={() => onCompleteSubject.next(true)}
            primaryButtonText="Next"
            primaryButtonDisabled={!checked}
            hideSecondaryButton
          />
        </>
      ) : (
        <>
          <Grid item container justify="center" alignItems="center">
            <CircularProgress color="inherit" />
          </Grid>
          <Grid item container />
        </>
      )}
    </>
  );
};

export default MnemonicPhrase;
