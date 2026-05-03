import client from './client.js'

export async function uploadFile(userId, file, onProgress) {
  const formData = new FormData()
  formData.append('user_id', userId)
  formData.append('file', file)

  const res = await client.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (event.total) {
        onProgress(Math.round((event.loaded * 100) / event.total))
      }
    },
  })
  return res.data
}
