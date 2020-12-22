import { Button, Collapse } from "@material-ui/core";
import React, { ReactElement, useEffect, useState } from "react";
import { interval } from "rxjs";
import { catchError, exhaustMap, filter, take } from "rxjs/operators";
import api from "../api";
import WarningMessage from "../common/WarningMessage";

const SetupWarning = (): ReactElement => {
  const [visible, setVisible] = useState(true); // TODO: set to true when setup not finished
  const [closeBtnVisible, setCloseBtnVisible] = useState(false);

  useEffect(() => {
    const balanceSubscription = interval(1000)
      .pipe(
        exhaustMap(() => api.getbalance$()),
        catchError((e, caught) => caught),
        filter((value) => !!Object.keys(value.balances)?.length),
        take(1),
        filter(
          (value) =>
            !Object.values(value.balances).some(
              (balance) => Number(balance.total_balance) > 0
            )
        )
      )
      .subscribe({
        next: () => setCloseBtnVisible(true),
      });
    return () => balanceSubscription.unsubscribe();
  }, []);

  return (
    <Collapse in={visible}>
      <WarningMessage
        message="Secure your funds. Setup password, store mnemonic, and save backup data." // TODO: set message according to which steps are not completed
        alignToStart
        showCloseIcon={closeBtnVisible}
        onClose={() => setVisible(false)}
        additionalButtons={[
          {
            button: (
              <Button
                size="small"
                color="inherit"
                variant="outlined"
                onClick={() => {}} // TODO: redirect to settings -> initial backup
              >
                Setup Now
              </Button>
            ),
            key: "CloseWarningBtn",
          },
        ]}
      />
    </Collapse>
  );
};

export default SetupWarning;
