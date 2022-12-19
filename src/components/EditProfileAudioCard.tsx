import { getNeatID } from "@/util";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListItem from "@mui/material/ListItem";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

interface EditAudioProps {
  is_member: boolean;
  cardClick: () => void;
  id: string;
  real_name: string;
  nick_name: string;
}

function EditProfileAudioCard(props: EditAudioProps) {
  const sub_name =
    props.real_name == props.nick_name ? (
      <></>
    ) : (
      <>
        {props.real_name}
        <br />
      </>
    );

  return (
    <ListItem>
      <ListItemButton onClick={props.cardClick}>
        <ListItemIcon>
          {props.is_member ? (
            <RemoveCircleOutlineIcon />
          ) : (
            <AddCircleOutlineIcon />
          )}
        </ListItemIcon>
        <ListItemText
          primary={props.nick_name}
          secondary={
            <>
              {sub_name}
              {getNeatID(props.id)}
            </>
          }
        />
      </ListItemButton>
    </ListItem>
  );
}

export default EditProfileAudioCard;
