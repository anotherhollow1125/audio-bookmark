import "@/App.css";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import All from "@/components/All";
import ProfileTab from "@/components/ProfileTab";
import useAllAudioInfo from "@/all_audio_info_hook";
import useProfileBook from "@/profiles_hook";
import { useTheme, ZIndex } from "@mui/material/styles";

function Main() {
  const allAudioInfo = useAllAudioInfo();
  const [
    profileBook,
    { newProfile, modProfile, delProfile, activateProfile, renameProfile },
  ] = useProfileBook();
  const themeRaw = useTheme();
  const theme = { ...themeRaw, zIndex: 0 };

  const onSelect = (index: number) => {
    const plus_index = profileBook ? profileBook.profiles.length + 1 : 1;
    if (index == plus_index) {
      newProfile();
    } else if (index == 0) {
      activateProfile(null);
    } else {
      const ind = index - 1;
      const profile = profileBook?.profiles[ind] ?? null;
      activateProfile(profile?.name ?? null);
    }
  };

  const rawSelectedIndex = profileBook
    ? profileBook.profiles.findIndex(
        (p) => p.name == profileBook.activated_profile
      )
    : -1;
  const selectedIndex = rawSelectedIndex == -1 ? 0 : rawSelectedIndex + 1;

  return allAudioInfo == null || profileBook == null ? (
    <>Loading...</>
  ) : (
    <>
      {/*<>Activated: {profileBook?.activated_profile ?? "All Audios"}</>*/}
      <Tabs selectedIndex={selectedIndex} onSelect={onSelect}>
        <TabList>
          <Tab style={theme} key="/__ALL/">
            All Audios
          </Tab>
          {(profileBook?.profiles ?? []).map((profile) => {
            return (
              <Tab style={theme} key={profile.name}>
                {profile.name}
              </Tab>
            );
          })}
          <Tab style={theme} key="/__NEW/">
            +
          </Tab>
        </TabList>

        <TabPanel key="/__ALL/">
          <All allAudioInfo={allAudioInfo}></All>
        </TabPanel>
        {(profileBook?.profiles ?? []).map((profile) => {
          return (
            <TabPanel key={profile.name}>
              <ProfileTab
                profile={profile}
                allAudioInfo={allAudioInfo}
                modProfile={modProfile}
                delProfile={delProfile}
                renameProfile={renameProfile}
              />
            </TabPanel>
          );
        })}
        <TabPanel key="/__NEW/"></TabPanel>
      </Tabs>
    </>
  );
}

export default Main;
