import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";

interface ProfileRemoveDialog {
  open: boolean;
  close: () => void;
  profileName: string;
  delProfile: (name: string) => void;
}

function ProfileRemoveDialog({
  open,
  close,
  profileName,
  delProfile,
}: ProfileRemoveDialog) {
  return (
    <Dialog open={open}>
      <DialogTitle>Do you really want to delete {profileName}?</DialogTitle>
      <DialogActions>
        <Button onClick={() => delProfile(profileName)}>Yes</Button>
        <Button onClick={() => close()}>No</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ProfileRemoveDialog;
