import { z } from 'zod';
import prisma from '../db.js';
import { executeScan } from '../services/scan.service.js';

const scanRequestSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  path: z.string().min(1, 'Project path or Git URL is required'),
});

export async function createProject(req, res, next) {
  try {
    const validatedData = scanRequestSchema.parse(req.body);

    const project = await prisma.project.create({
      data: {
        name: validatedData.name,
        path: validatedData.path,
        status: 'idle'
      }
    });

    // Run scanning in background
    executeScan(project.id).catch(err => console.error('Scan execution error:', err));

    res.status(201).json(project);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: err.errors });
    }
    next(err);
  }
}

export async function listProjects(req, res, next) {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(projects);
  } catch (err) {
    next(err);
  }
}

export async function getProjectDetails(req, res, next) {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        stacks: true,
        dependencies: true,
        diagnostics: true
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (err) {
    next(err);
  }
}

export async function rescanProject(req, res, next) {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({ where: { id } });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    executeScan(project.id).catch(err => console.error('Rescan execution error:', err));

    res.json({ message: 'Scan triggered successfully', status: 'scanning' });
  } catch (err) {
    next(err);
  }
}
