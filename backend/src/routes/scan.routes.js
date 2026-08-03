import express from 'express';
import {
  createProject,
  listProjects,
  getProjectDetails,
  rescanProject
} from '../controllers/scan.controller.js';

const router = express.Router();

router.post('/', createProject);
router.get('/', listProjects);
router.get('/:id', getProjectDetails);
router.post('/:id/re-run', rescanProject);

export default router;
