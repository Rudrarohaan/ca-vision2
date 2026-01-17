import { setDoc, updateDoc, increment, DocumentReference, SetOptions, UpdateData } from 'firebase/firestore';

/**
 * A server-safe wrapper around the `setDoc` function from the Firebase SDK.
 * This function can be called from Server Actions or other server-side code.
 * @param docRef The DocumentReference to write to.
 * @param data The data to write.
 * @param options The SetOptions for the write operation.
 */
export async function setDocServer(docRef: DocumentReference, data: any, options: SetOptions) {
  try {
    await setDoc(docRef, data, options);
  } catch (error) {
    console.error("Firestore 'setDoc' error from server action:", error);
    // Re-throw the error to be caught by the action's error handler
    throw error;
  }
}

/**
 * A server-safe wrapper around the `updateDoc` function from the Firebase SDK.
 * This function can be called from Server Actions.
 * @param docRef The DocumentReference to update.
 * @param data The data to update.
 */
export async function updateDocServer(docRef: DocumentReference, data: UpdateData<any>) {
  try {
    await updateDoc(docRef, data);
  } catch (error) {
    console.error("Firestore 'updateDoc' error from server action:", error);
    throw error;
  }
}

/**
 * A server-safe export of the `increment` function.
 */
export const incrementServer = increment;

    