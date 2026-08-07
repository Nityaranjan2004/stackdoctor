import express from 'express';
import {
  createProject,
  listProjects,
  getProjectDetails,
  rescanProject,
  updateEnvironmentSnapshot,
  getSystemToolsController,
  preCloneInspectController,
  generateAiFix,
  openTerminalController,
  openFolderController,
  pickFolderController
} from '../controllers/scan.controller.js';
import { chatController } from '../controllers/chat.controller.js';

const router = express.Router();

router.get('/system-tools', getSystemToolsController);
router.post('/pre-clone-inspect', preCloneInspectController);
router.post('/', createProject);
router.post('/environment', updateEnvironmentSnapshot);
router.post('/fix', generateAiFix);
router.post('/chat', chatController);
router.post('/open-terminal', openTerminalController);
router.post('/open-folder', openFolderController);
router.post('/pick-folder', pickFolderController);
router.get('/', listProjects);
router.get('/:id', getProjectDetails);
router.post('/:id/re-run', rescanProject);

export default router;

