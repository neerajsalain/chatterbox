import { auth } from '@/lib/auth'
import cloudinary from '@/lib/cloudinary'
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '@/utils/constants'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let formData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: 'Invalid form data' }, { status: 400 })
  }
  const file = formData.get('file')

  if (!file || typeof file === 'string') {
    return Response.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return Response.json({ error: 'File type not allowed' }, { status: 415 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: 'File exceeds 5 MB limit' }, { status: 413 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'chatterbox', resource_type: 'auto' },
        (err, res) => (err ? reject(err) : resolve(res))
      ).end(buffer)
    })

    return Response.json({ url: result.secure_url, publicId: result.public_id })
  } catch (err) {
    console.error('Cloudinary upload error:', err.message)
    return Response.json({ error: 'Upload failed' }, { status: 500 })
  }
}
