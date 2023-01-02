import { useState, useEffect, useRef, Dispatch, SetStateAction } from "react";
import { CustomAudioInfo } from "@/audio_type";
import {
  readTextFile,
  writeTextFile,
  exists,
  createDir,
  BaseDirectory,
} from "@tauri-apps/api/fs";
import { register, unregisterAll } from "@tauri-apps/api/globalShortcut";
import { invoke_query } from "@/query";
import { showNotification } from "./components/notification";
// import { appConfigDir } from "@tauri-apps/api/path";

export interface Profile {
  name: string;
  audios: CustomAudioInfo[];
}

export interface ProfileBook {
  activated_profile: string | null;
  profiles: Profile[];
}

type useProfileBookRes = [
  ProfileBook | null,
  // setProfileBook: Dispatch<SetStateAction<ProfileBook | null>>;
  {
    newProfile: () => void;
    modProfile: (profile: Profile) => void;
    delProfile: (name: string) => void;
    activateProfile: (name: string | null) => void;
    renameProfile: (old_name: string, new_name: string) => boolean;
  }
];

const useProfileBook = (): useProfileBookRes => {
  const [profileBook, setProfileBook] = useState<ProfileBook | null>(null);
  const initializeAsyncFn = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    if (initializeAsyncFn.current !== null) {
      return;
    }

    initializeAsyncFn.current = async () => {
      try {
        const profileBookStr = await readTextFile("profiles.json", {
          dir: BaseDirectory.AppConfig,
        });
        const profileBook = JSON.parse(profileBookStr) as ProfileBook;
        setProfileBook(profileBook);
      } catch (error) {
        console.warn(error);
        setProfileBook({
          activated_profile: null,
          profiles: [],
        });
      }

      console.log("ProfileBook initialized");
    };
    initializeAsyncFn.current();
  }, []);

  useEffect(() => {
    if (profileBook === null) {
      return;
    }

    (async () => {
      // file save
      const ext = await exists("", { dir: BaseDirectory.AppConfig });
      if (!ext) {
        await createDir("", { dir: BaseDirectory.AppConfig });
      }

      await writeTextFile("profiles.json", JSON.stringify(profileBook), {
        dir: BaseDirectory.AppConfig,
      });

      // register shortcut
      await unregisterAll();
      const profile = profileBook.profiles.find(
        (p) => p.name == profileBook.activated_profile
      );
      if (profile == undefined) {
        return;
      }

      for (const audio of profile.audios) {
        if (audio.shortcut == "") {
          continue;
        }

        const shortcut = audio.shortcut;
        const id = audio.id;
        const name = audio.nick_name != "" ? audio.nick_name : audio.name;
        await register(shortcut, async () => {
          await invoke_query({ kind: "QDefaultAudioChange", id });
          setTimeout(async () => {
            await showNotification(name, `Changed by ${shortcut}`);
            await invoke_query({ kind: "QBeep" });
          }, 100);
        });
      }
    })();
  }, [profileBook]);

  const newProfile = () => {
    if (profileBook === null) {
      return;
    }

    let conter = 1;
    while (
      profileBook.profiles.findIndex((p) => p.name == `Profile${conter}`) != -1
    ) {
      conter += 1;
    }

    const newProfile: Profile = {
      name: `Profile${conter}`,
      audios: [],
    };

    profileBook.profiles.push(newProfile);
    profileBook.activated_profile = newProfile.name;
    console.log(`newProfile: ${newProfile.name}`);
    setProfileBook({ ...profileBook });
  };

  const modProfile = (profile: Profile) => {
    if (profileBook === null) {
      return;
    }

    const index = profileBook.profiles.findIndex(
      (p) => p.name === profile.name
    );
    if (index == -1) {
      return;
    }

    profileBook.profiles[index] = profile;
    setProfileBook({ ...profileBook });
  };

  const delProfile = (name: string) => {
    if (profileBook === null) {
      return;
    }

    profileBook.profiles = profileBook.profiles.filter((p) => p.name != name);
    profileBook.activated_profile = null;
    setProfileBook({ ...profileBook });
  };

  const activateProfile = (name: string | null) => {
    if (profileBook === null) {
      return;
    }

    if (name === null) {
      profileBook.activated_profile = name;
      setProfileBook({ ...profileBook });
      return;
    }

    const index = profileBook.profiles.findIndex((p) => p.name === name);
    if (index == -1) {
      return;
    }

    profileBook.activated_profile = name;
    setProfileBook({ ...profileBook });
  };

  const renameProfile = (oldName: string, newName: string): boolean => {
    if (profileBook === null) {
      return false;
    }

    if (newName === "") {
      return false;
    }

    if (profileBook.profiles.findIndex((p) => p.name === newName) != -1) {
      return false;
    }

    const target_profile = profileBook.profiles.find((p) => p.name === oldName);
    if (target_profile == undefined) {
      return false;
    }

    target_profile.name = newName;
    profileBook.activated_profile = newName;
    setProfileBook({ ...profileBook });

    return true;
  };

  return [
    profileBook,
    { newProfile, modProfile, delProfile, activateProfile, renameProfile },
  ];
};

export default useProfileBook;
