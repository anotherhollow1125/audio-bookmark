import { useState, useEffect, useRef, Dispatch, SetStateAction } from "react";
import { CustomAudioInfo } from "@/audio_type";
import {
  readTextFile,
  writeTextFile,
  exists,
  createDir,
  BaseDirectory,
} from "@tauri-apps/api/fs";
// import { configDir } from '@tauri-apps/api/path';

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
      await writeTextFile("profiles.json", JSON.stringify(profileBook), {
        dir: BaseDirectory.AppConfig,
      });
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
    setProfileBook({ ...profileBook });

    return true;
  };

  return [
    profileBook,
    { newProfile, modProfile, delProfile, activateProfile, renameProfile },
  ];
};

export default useProfileBook;
