import asyncHandler from 'express-async-handler'

import { prisma } from '../prisma.js'

// @desc    Get supportMeasures
// @route   GET /api/supportMeasures
// @access  Public
export const getSupportMeasures = asyncHandler(async (req, res) => {
	const { range, sort, filter } = req.query

	const sortField = sort ? JSON.parse(sort)[0] : 'createdAt'
	const sortOrder = sort ? JSON.parse(sort)[1].toLowerCase() : 'desc' // Приводим к нижнему регистру для Prisma

	const rangeStart = range ? JSON.parse(range)[0] : 0
	const rangeEnd = range ? JSON.parse(range)[1] : 9

	const totalSupportMeasures = await prisma.supportMeasures.count()

	const supportMeasures = await prisma.supportMeasures.findMany({
		skip: rangeStart,
		take: rangeEnd - rangeStart + 1, // количество записей для пагинации
		orderBy: {
			[sortField]: sortOrder // Используем переменные для поля и направления сортировки
		}
	})

	res.set(
		'Content-Range',
		`news ${rangeStart}-${rangeEnd}/${totalSupportMeasures}`
	)
	res.json(supportMeasures)
})

// @desc    Get supportMeasure
// @route   GET /api/supportMeasures/:id
// @access  Public
export const getSupportMeasure = asyncHandler(async (req, res) => {
	const supportMeasure = await prisma.supportMeasures.findUnique({
		where: { id: +req.params.id }
	})

	if (!supportMeasure) {
		res.status(404)
		throw new Error('SupportMeasure not found!')
	}

	res.json({ ...supportMeasure })
})

// @desc    Create new supportMeasure
// @route 	POST /api/supportMeasures
// @access  Private
export const createNewSupportMeasure = asyncHandler(async (req, res) => {
	const { header, title, type, text, images } = req.body

	const imagePaths = images.map(image =>
		typeof image === 'object' ? `/uploads/${image.rawFile.path}` : image
	)

	const supportMeasure = await prisma.supportMeasures.create({
		data: { header, title, type, text, images: imagePaths }
	})

	res.json(supportMeasure)
})

// @desc    Update supportMeasure
// @route 	PUT /api/supportMeasures/:id
// @access  Private
export const updateSupportMeasure = asyncHandler(async (req, res) => {
	const { header, title, type, text, images } = req.body

	try {
		const supportMeasure = await prisma.supportMeasures.update({
			where: {
				id: +req.params.id
			},
			data: { header, title, type, text, images }
		})

		res.json(supportMeasure)
	} catch (error) {
		res.status(404)
		throw new Error('SupportMeasure not found!')
	}
})

// @desc    Delete supportMeasure
// @route 	DELETE /api/supportMeasures/:id
// @access  Private
export const deleteSupportMeasure = asyncHandler(async (req, res) => {
	try {
		const supportMeasure = await prisma.supportMeasures.delete({
			where: {
				id: +req.params.id
			}
		})

		res.json({ message: 'SupportMeasure deleted!' })
	} catch (error) {
		res.status(404)
		throw new Error('SupportMeasure not found!')
	}
})
