import multer from 'multer'

const allowed = ['image/jpeg', 'image/png', 'image/webp']
export const optionalPaymentScreenshot = multer({
  storage: multer.memoryStorage(),
  limits: { files: 1, fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => callback(null, allowed.includes(file.mimetype)),
}).single('paymentScreenshot')
