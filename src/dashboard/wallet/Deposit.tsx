import {
  createStyles,
  Grid,
  makeStyles,
  Theme,
  Typography,
} from "@material-ui/core";
import React, { ReactElement, useEffect, useState } from "react";
import { Observable, Subject } from "rxjs";
import api from "../../api";
import { satsToCoinsStr } from "../../common/currencyUtil";
import { getErrorMsg } from "../../common/errorUtil";
import Loader from "../../common/Loader";
import QrCode from "../../common/QrCode";
import { DepositResponse } from "../../models/DepositResponse";
import { Info } from "../../models/Info";
import Address from "./Address";
import BoltzFeeInfo from "./BoltzFeeInfo";
import CheckBoltzTransactionStatus from "./CheckBoltzTransactionStatus";
import ErrorMessage from "./ErrorMessage";
import WarningMessage from "./WarningMessage";

type DepositProps = {
  currency: string;
  refreshSubject: Subject<void>;
  getInfo$: Observable<Info>;
};

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    row: {
      paddingTop: theme.spacing(2),
    },
  })
);

const getAvgMinutesBetweenBlocks = (
  start: number,
  end: number,
  currency: string
): number | null => {
  const diff = end - start;
  if (currency === "BTC") {
    return diff * 10;
  }
  if (currency === "LTC") {
    return Math.round(diff * 2.5);
  }
  return null;
};

const getTimeString = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  const hoursStr = hours ? `${hours} hours` : "";
  const minutesStr = remainingMins ? `${remainingMins} minutes` : "";
  return [hoursStr, minutesStr].join(" ");
};

const Deposit = (props: DepositProps): ReactElement => {
  const { currency, refreshSubject, getInfo$ } = props;
  const classes = useStyles();

  const [depositData, setDepositData] = useState<DepositResponse | undefined>(
    undefined
  );
  const [currentBlockHeight, setCurrentBlockHeight] = useState<
    number | undefined
  >(undefined);
  const [error, setError] = useState("");
  const [qrOpen, setQrOpen] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [addressAutoUpdated, setAddressAutoUpdated] = useState(false);

  useEffect(() => {
    const fetchDepositData = (): void => {
      api.boltzDeposit$(currency).subscribe({
        next: (resp) => {
          setDepositData(resp);
          setFetchingData(false);
        },
        error: (err) => {
          setError(getErrorMsg(err));
          setFetchingData(false);
        },
      });
    };

    fetchDepositData();
    const subscription = refreshSubject.subscribe(() => fetchDepositData());

    return () => subscription.unsubscribe();
  }, [currency, refreshSubject]);

  useEffect(() => {
    const subscription = getInfo$.subscribe({
      next: (resp) => {
        const currentHeight = Number.parseInt(resp.lnd[currency].blockheight);
        setCurrentBlockHeight(currentHeight);
        if (depositData && currentHeight >= depositData.timeoutBlockHeight) {
          refreshSubject.next();
          setAddressAutoUpdated(true);
        }
      },
      error: (err) => setError(getErrorMsg(err)),
    });

    return () => subscription.unsubscribe();
  }, [getInfo$, currency, refreshSubject, depositData]);

  return (
    <>
      {!!error && <ErrorMessage details={error} />}
      {!!depositData && !!currentBlockHeight && (
        <>
          {addressAutoUpdated && (
            <WarningMessage message="Address updated due to timeout" />
          )}
          {!qrOpen ? (
            <Grid item>
              <Typography variant="body2" align="center">
                Deposit between {satsToCoinsStr(depositData.limits.minimal)} and{" "}
                {satsToCoinsStr(depositData.limits.maximal, currency)} in the
                following address in the next ~
                {getTimeString(
                  getAvgMinutesBetweenBlocks(
                    currentBlockHeight,
                    depositData.timeoutBlockHeight,
                    currency
                  )!
                )}{" "}
                (block height {depositData.timeoutBlockHeight}).
              </Typography>
              <Address
                address={depositData.address}
                openQr={() => setQrOpen(true)}
                readOnly={true}
              />
              <BoltzFeeInfo fees={depositData.fees} currency={currency} />
              <div className={classes.row}>
                <CheckBoltzTransactionStatus
                  currency={currency}
                  id={depositData.id}
                />
              </div>
            </Grid>
          ) : (
            <Grid item>
              <QrCode
                value={depositData.address}
                handleClose={() => setQrOpen(false)}
              />
            </Grid>
          )}
        </>
      )}
      {fetchingData && <Loader />}
    </>
  );
};

export default Deposit;
