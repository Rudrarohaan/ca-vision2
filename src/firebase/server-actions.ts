import { setDoc, DocumentReference, SetOptions } from 'firebase/firestore';

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
