import multer from 'multer'
const storage = multer.memoryStorage()
const fileFilter = (req, file, callback) => callback(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype))
export const uploadImages = multer({ storage, fileFilter, limits: { files: 6, fileSize: 5 * 1024 * 1024 } }).array('images', 6)
