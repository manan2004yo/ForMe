import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage'
import { v4 as uuidv4 } from 'uuid'
import { storage } from './config'

export async function uploadProgressPhoto(
  uid: string, 
  file: File, 
  onProgress?: (progress: number) => void
): Promise<string> {
  if (!storage) throw new Error("Firebase Storage is not initialized")
  
  // Path: users/{uid}/progressPhotos/{uuid}.jpg
  const extension = file.name.split('.').pop() || 'jpg'
  const filename = `${uuidv4()}.${extension}`
  const storageRef = ref(storage, `users/${uid}/progressPhotos/${filename}`)

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file)

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        if (onProgress) onProgress(progress)
      }, 
      (error) => {
        console.error("Storage upload error:", error)
        reject(error)
      }, 
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
          resolve(downloadURL)
        } catch (err) {
          reject(err)
        }
      }
    )
  })
}
