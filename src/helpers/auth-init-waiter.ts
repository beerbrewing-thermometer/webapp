import { auth } from "@/services/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

export const waitForUserAuthInit = (): Promise<User | null> =>
  new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
