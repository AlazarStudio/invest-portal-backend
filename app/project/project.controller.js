import asyncHandler from 'express-async-handler'

import { prisma } from '../prisma.js'

// @desc    Get projects
// @route   GET /api/projects
// @access  Public
export const getProjects = asyncHandler(async (req, res) => {
	const { range, sort, filter, all } = req.query

	  if (all === 'true') {
    // отдаём _все_ записи, игнорируем range
    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    return res.json(projects);
  }

	const sortField = sort ? JSON.parse(sort)[0] : 'createdAt'
	const sortOrder = sort ? JSON.parse(sort)[1].toLowerCase() : 'desc' // Приводим к нижнему регистру для Prisma

	const rangeStart = range ? JSON.parse(range)[0] : 0
	const rangeEnd = range ? JSON.parse(range)[1] : 9

	const totalProjects = await prisma.project.count()

	const projects = await prisma.project.findMany({
		skip: rangeStart,
		take: rangeEnd - rangeStart + 1, // количество записей для пагинации
		orderBy: {
			[sortField]: sortOrder // Используем переменные для поля и направления сортировки
		}
	})

	res.set('Content-Range', `projects ${rangeStart}-${rangeEnd}/${totalProjects}`)
	res.json(projects)
})

// @desc    Get project
// @route   GET /api/projects/:id
// @access  Public
export const getProject = asyncHandler(async (req, res) => {
	const project = await prisma.project.findUnique({
		where: { id: +req.params.id }
	})

	if (!project) {
		res.status(404)
		throw new Error('Project not found!')
	}

	res.json({ ...project })
})

// @desc    Create new project
// @route 	POST /api/projects
// @access  Private
export const createNewProject = asyncHandler(async (req, res) => {
	const { title, type, text, images } = req.body

	const imagePaths = images.map(image =>
		typeof image === 'object' ? `/uploads/${image.rawFile.path}` : image
	)

	const project = await prisma.project.create({
		data: { title, type, text, images: imagePaths }
	})

	res.json(project)
})

// @desc    Update project
// @route 	PUT /api/projects/:id
// @access  Private
export const updateProject = asyncHandler(async (req, res) => {
	const { title, type, text, images } = req.body

	try {
		const project = await prisma.project.update({
			where: {
				id: +req.params.id
			},
			data: { title, type, text, images }
		})

		res.json(project)
	} catch (error) {
		res.status(404)
		throw new Error('Project not found!')
	}
})

// @desc    Delete project
// @route 	DELETE /api/projects/:id
// @access  Private
export const deleteProject = asyncHandler(async (req, res) => {
	try {
		const project = await prisma.project.delete({
			where: {
				id: +req.params.id
			}
		})

		res.json({ message: 'Project deleted!' })
	} catch (error) {
		res.status(404)
		throw new Error('Project not found!')
	}
})
