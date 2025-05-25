import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import fs from 'fs'
import morgan from 'morgan'
import multer from 'multer'
import path from 'path'
import sharp from 'sharp'

import { errorHandler, notFound } from './app/middleware/error.middleware.js'

import authRoutes from './app/auth/auth.routes.js'
import documentRoutes from './app/docs/docs.routes.js'
import groupRoutes from './app/group/group.routes.js'
import newsRoutes from './app/news/news.routes.js'
import { prisma } from './app/prisma.js'
import projectRoutes from './app/project/project.routes.js'
import smRoutes from './app/sm/sm.routes.js'
import userRoutes from './app/user/user.routes.js'

dotenv.config()

const app = express()

const storage = multer.memoryStorage()

const upload = multer({
	storage: storage,
	limits: { fileSize: 1024 * 1024 * 48 }, // лимит размера файла 48MB
	fileFilter: (req, file, cb) => {
		const fileTypes = /webp|jpeg|jpg|png|gif/
		const extname = fileTypes.test(
			path.extname(file.originalname).toLowerCase()
		)
		const mimetype = fileTypes.test(file.mimetype)

		if (mimetype && extname) {
			return cb(null, true)
		} else {
			cb('Ошибка: недопустимый тип файла!')
		}
	}
})

// Функция загрузки документов с проверкой типов файлов
const uploadDocuments = multer({
	storage: storage,
	limits: { fileSize: 1024 * 1024 * 256 }, // лимит размера файла 256MB
	fileFilter: (req, file, cb) => {
		cb(null, true) // Временно пропускаем все файлы для тестирования
	}
})

app.use(
	cors({
		exposedHeaders: ['Content-Range']
	})
)

app.use('/uploads', express.static(path.join(path.resolve(), '/uploads/')))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

async function main() {
	if (process.env.NODE_ENV === 'development') app.use(morgan('dev'))

	app.use(express.json())

	app.post('/uploads', upload.array('images', 20), async (req, res) => {
		try {
			const files = req.files
			const filePaths = []

			for (const file of files) {
				// Определяем расширение файла
				const ext = path.extname(file.originalname).toLowerCase()

				// Проверяем, является ли файл GIF
				if (ext === '.gif') {
					// Сохраняем GIF без конвертации
					const gifFilename = `${Date.now()}-${file.originalname}`
					const gifFilePath = path.join('uploads', gifFilename)

					// Сохраняем GIF в папку 'uploads'
					fs.writeFileSync(gifFilePath, file.buffer)

					filePaths.push(`/uploads/${gifFilename}`)
				} else {
					// Если это не GIF, конвертируем в WebP
					const webpFilename = `${Date.now()}-${file.originalname.split('.')[0]}.webp`
					const webpFilePath = path.join('uploads', webpFilename)

					// Конвертация изображения в формат WebP с использованием sharp
					await sharp(file.buffer)
						.webp({ quality: 80 }) // Настройка качества WebP
						.toFile(webpFilePath)

					filePaths.push(`/uploads/${webpFilename}`)
				}
			}

			res.json({ filePaths })
		} catch (error) {
			console.error('Ошибка при конвертации изображений:', error)
			res
				.status(500)
				.json({ message: 'Ошибка при конвертации изображений', error })
		}
	})

	const transliterate = text => {
		const ru = {
			а: 'a',
			б: 'b',
			в: 'v',
			г: 'g',
			д: 'd',
			е: 'e',
			ё: 'e',
			ж: 'zh',
			з: 'z',
			и: 'i',
			й: 'y',
			к: 'k',
			л: 'l',
			м: 'm',
			н: 'n',
			о: 'o',
			п: 'p',
			р: 'r',
			с: 's',
			т: 't',
			у: 'u',
			ф: 'f',
			х: 'h',
			ц: 'ts',
			ч: 'ch',
			ш: 'sh',
			щ: 'sch',
			ъ: '',
			ы: 'y',
			ь: '',
			э: 'e',
			ю: 'yu',
			я: 'ya'
		}
		return text
			.split('')
			.map(char => {
				if (char === ' ') {
					return '_' // Заменяем пробелы на подчеркивание
				}
				return ru[char.toLowerCase()] || char // Транслитерируем или оставляем символ без изменений
			})
			.join('')
	}

	app.post(
		'/upload-doc',
		uploadDocuments.single('document'),
		async (req, res) => {
			try {
				const file = req.file

				if (!file) {
					return res.status(400).json({ message: 'Файл не был загружен' })
				}

				const originalName = Buffer.from(file.originalname, 'latin1').toString(
					'utf-8'
				)

				const name = path.basename(originalName, path.extname(originalName))
				const extension = path.extname(originalName)

				const transliteratedName = transliterate(name)

				const fileName = `${transliteratedName}${extension}`

				const filePath = path.join('uploads', fileName)

				fs.writeFileSync(filePath, file.buffer)

				res.json({ filePath: `/uploads/${fileName}` })
			} catch (error) {
				console.error('Ошибка при загрузке документа:', error)
				res
					.status(500)
					.json({ message: 'Ошибка при загрузке документа', error })
			}
		}
	)

	app.use('/api/auth', authRoutes)
	app.use('/api/users', userRoutes)
	app.use('/api/docs', documentRoutes)
	app.use('/api/group', groupRoutes)
	app.use('/api/projects', projectRoutes)
	app.use('/api/support-measures', smRoutes)
	app.use('/api/news', newsRoutes)

	app.use(notFound)
	app.use(errorHandler)

	const PORT = process.env.PORT || 4000

	app.listen(
		PORT,
		console.log(`Server running in ${process.env.NODE_ENV} on port ${PORT}`)
	)
}

main()
	.then(async () => {
		await prisma.$disconnect()
	})
	.catch(async e => {
		console.error(e)
		await prisma.$disconnect()
		process.exit(1)
	})
