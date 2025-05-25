import express from 'express'

import { protect } from '../middleware/auth.middleware.js'

import {
	createNewSupportMeasure,
	deleteSupportMeasure,
	getSupportMeasure,
	getSupportMeasures,
	updateSupportMeasure
} from './sm.controller.js'

const router = express.Router()

router.route('/').post(protect, createNewSupportMeasure).get(getSupportMeasures)

router
	.route('/:id')
	.get(getSupportMeasure)
	.put(protect, updateSupportMeasure)
	.delete(protect, deleteSupportMeasure)

export default router
