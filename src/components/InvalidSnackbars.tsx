import { forwardRef } from "react";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert, { AlertProps } from "@mui/material/Alert";

const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

interface InvalidSnackbarProps {
  message: string;
  open: boolean;
  close: () => void;
}

export default function InvalidSnackbar({
  message,
  open,
  close,
}: InvalidSnackbarProps) {
  return (
    <>
      <Snackbar open={open} autoHideDuration={2000} onClose={(_) => close()}>
        <Alert onClose={(_) => close()} severity="error" sx={{ width: "100%" }}>
          {message}
        </Alert>
      </Snackbar>
    </>
  );
}
